import { Controller, Get, NotFoundException, Res, UnauthorizedException, Headers } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Response } from 'express';
import { timingSafeEqual } from 'crypto';
import { registry } from './metrics';

/** True when `header` is `Bearer <token>` with exactly this token (compared in constant time) */
export function hasValidBearer(header: string | undefined, token: string): boolean {
  const supplied = Buffer.from(header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : '');
  const expected = Buffer.from(token);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

/**
 * MetricsController - Prometheus scrape endpoint
 * Base path: /api/metrics
 *
 * Prometheus has no user session, so access is a static bearer token (METRICS_TOKEN).
 * Without that variable the endpoint does not exist (404): metrics expose internals and are closed by default.
 */
@ApiExcludeController()
@SkipThrottle()
@Controller('metrics')
export class MetricsController {
  /**
   * GET /api/metrics with `Authorization: Bearer <METRICS_TOKEN>`
   * @throws NotFoundException when METRICS_TOKEN is not set, UnauthorizedException for a wrong token
   */
  @Get()
  async scrape(@Headers('authorization') authorization: string | undefined, @Res({ passthrough: true }) res: Response) {
    const token = process.env.METRICS_TOKEN;
    if (!token) throw new NotFoundException();
    if (!hasValidBearer(authorization, token)) throw new UnauthorizedException();

    res.type(registry.contentType);
    return registry.metrics();
  }
}
