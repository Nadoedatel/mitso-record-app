import { Injectable } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { decodeCursor, encodeCursor } from '../common/pagination';
import { PrismaService } from '../prisma/prisma.service';
import { QueryAuditDto } from './dto';
import { GradeSnapshot } from './audit.snapshot';

/** One change to write into the log */
export interface AuditEntry {
  action: AuditAction;
  /** Id of the changed row (kept even after the row is deleted) */
  entityId: number;
  studentId: number;
  subjectId: number;
  before: GradeSnapshot | null;
  after: GradeSnapshot | null;
}

/**
 * AuditService - the log of who changed which grade.
 * Records are written through the transaction client of the change itself, so the change and its record
 * are committed together or not at all. Nothing here updates or deletes records: the log is append-only.
 */
@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  /**
   * Append records to the log inside the caller's transaction.
   * The actor's email and role are copied: the record stays readable after the user is deleted.
   */
  async record(tx: Prisma.TransactionClient, actor: AuthUser, entries: AuditEntry[]): Promise<void> {
    if (entries.length === 0) return;
    await tx.auditLog.createMany({
      data: entries.map((entry) => ({
        actorId: actor.id,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: entry.action,
        entityId: entry.entityId,
        studentId: entry.studentId,
        subjectId: entry.subjectId,
        before: entry.before ?? Prisma.JsonNull,
        after: entry.after ?? Prisma.JsonNull,
      })),
    });
  }

  /**
   * List records, newest first, with filters, one page at a time by cursor.
   * `nextCursor` is null on the last page; pass it back as `cursor` to get the next one. A plain `to` date
   * ("2026-10-14") means the end of that day, so it includes the day.
   * @throws InvalidInputError for a cursor that is not one of ours
   */
  async findAll(query: QueryAuditDto) {
    const { studentId, subjectId, actorId, action, from, to, cursor, limit = 20 } = query;

    const where: Prisma.AuditLogWhereInput = {
      ...(studentId && { studentId }),
      ...(subjectId && { subjectId }),
      ...(actorId && { actorId }),
      ...(action && { action }),
    };
    if (from || to) {
      where.createdAt = {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: endOfRange(to) }),
      };
    }
    if (cursor) {
      // Rows strictly after the cursor row in (createdAt desc, id desc) order: older, or the same instant and a smaller id
      const { at, id } = decodeCursor(cursor);
      where.AND = [{ OR: [{ createdAt: { lt: new Date(at) } }, { createdAt: new Date(at), id: { lt: id } }] }];
    }

    // One row more than the page tells whether there is a next page, without counting the whole table
    const rows = await this.prisma.auditLog.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });
    const data = rows.slice(0, limit);
    const last = data[data.length - 1];
    const nextCursor = rows.length > limit && last ? encodeCursor({ at: last.createdAt.toISOString(), id: last.id }) : null;

    // Names are looked up for the page only (two queries), the log itself keeps just ids: the rows may be gone
    const [students, subjects] = await Promise.all([
      this.prisma.student.findMany({
        where: { id: { in: [...new Set(data.flatMap((r) => (r.studentId ? [r.studentId] : [])))] } },
        select: { id: true, firstName: true, lastName: true },
      }),
      this.prisma.subject.findMany({
        where: { id: { in: [...new Set(data.flatMap((r) => (r.subjectId ? [r.subjectId] : [])))] } },
        select: { id: true, name: true },
      }),
    ]);
    const studentNames = new Map(students.map((s) => [s.id, `${s.lastName} ${s.firstName}`]));
    const subjectNames = new Map(subjects.map((s) => [s.id, s.name]));

    return {
      data: data.map((record) => ({
        ...record,
        createdAt: record.createdAt.toISOString(),
        studentName: (record.studentId && studentNames.get(record.studentId)) || null,
        subjectName: (record.subjectId && subjectNames.get(record.subjectId)) || null,
      })),
      nextCursor,
      limit,
    };
  }
}

/** A plain date means the whole day: move it to 23:59:59.999 UTC */
function endOfRange(to: string): Date {
  return /^\d{4}-\d{2}-\d{2}$/.test(to) ? new Date(`${to}T23:59:59.999Z`) : new Date(to);
}
