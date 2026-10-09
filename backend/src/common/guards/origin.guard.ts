import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { getAllowedOrigins } from '../config';

/**
 * CSRF defence in depth for cookie-based endpoints (refresh, logout).
 * SameSite=Strict already keeps the cookie off cross-site requests; this also refuses any browser
 * request whose Origin is not our frontend. Requests without Origin (curl, server-to-server, same-origin
 * navigations) pass: a browser always sends Origin on a cross-origin POST, so only real browsers can be fooled.
 */
@Injectable()
export class OriginGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const origin = context.switchToHttp().getRequest<Request>().headers.origin;
    if (origin && !getAllowedOrigins(process.env).includes(origin)) {
      throw new ForbiddenException('Запрос с этого источника запрещён');
    }
    return true;
  }
}
