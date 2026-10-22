import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiProduces, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Role } from '@prisma/client';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CurrentUser, Roles } from '../common/decorators';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { JobStatusResponseDto } from './dto';
import { MAX_CSV_BYTES, XLSX_MIME } from './jobs.constants';
import { JobsService } from './jobs.service';

/**
 * JobsController - starts background jobs and reports their state
 * Base path: /api/jobs
 */
@ApiTags('jobs')
@ApiBearerAuth()
@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobsController {
  constructor(private jobsService: JobsService) {}

  /**
   * Queue the Excel export of a student's record book
   * POST /api/jobs/exports/students/:id
   */
  @Post('exports/students/:id')
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: "Start the export of a student's record book to Excel" })
  @ApiResponse({ status: 202, type: JobStatusResponseDto, description: 'Job accepted; poll GET /jobs/{id}' })
  @ApiResponse({ status: 403, description: "A student asked for someone else's record book" })
  @ApiResponse({ status: 503, description: 'Background jobs are not available (no Redis)' })
  exportStudent(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.jobsService.requestStudentExport(id, user);
  }

  /**
   * Queue the import of students from a CSV file (field `file`)
   * POST /api/jobs/imports/students
   */
  @Post('imports/students')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_CSV_BYTES, files: 1 } }))
  @ApiOperation({ summary: 'Start the import of students from a CSV file (ADMIN only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: { type: 'object', required: ['file'], properties: { file: { type: 'string', format: 'binary' } } },
  })
  @ApiResponse({ status: 202, type: JobStatusResponseDto, description: 'Job accepted; poll GET /jobs/{id}' })
  @ApiResponse({ status: 400, description: 'The file is empty, has wrong columns or too many rows' })
  @ApiResponse({ status: 503, description: 'Background jobs are not available (no Redis)' })
  importStudents(@UploadedFile() file: Express.Multer.File | undefined, @CurrentUser() user: AuthUser) {
    if (!file) throw new BadRequestException('Прикрепите CSV-файл в поле file');
    return this.jobsService.requestStudentImport(file.buffer.toString('utf8'), user);
  }

  /**
   * State of a job started by the current user
   * GET /api/jobs/:id
   */
  @Get(':id')
  @ApiOperation({ summary: 'State, progress and result of a job' })
  @ApiResponse({ status: 200, type: JobStatusResponseDto })
  @ApiResponse({ status: 404, description: 'No such job (or it belongs to another user)' })
  getStatus(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.jobsService.getStatus(id, user);
  }

  /**
   * File produced by a finished export job
   * GET /api/jobs/:id/file
   */
  @Get(':id/file')
  @ApiOperation({ summary: 'Download the file of a finished export job' })
  @ApiProduces(XLSX_MIME)
  @ApiResponse({ status: 200, description: 'The .xlsx file', schema: { type: 'string', format: 'binary' } })
  @ApiResponse({ status: 404, description: 'No such job, not finished, or the file has expired' })
  async getFile(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const { buffer, fileName } = await this.jobsService.getFile(id, user);
    return new StreamableFile(buffer, {
      type: XLSX_MIME,
      disposition: `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    });
  }
}
