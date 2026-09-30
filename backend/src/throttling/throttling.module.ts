import { Module } from '@nestjs/common';
import { createThrottlerStorage } from './throttler-storage.factory';

/** Injection token for the rate-limit counter store (undefined = Throttler's own memory storage) */
export const THROTTLER_STORAGE = Symbol('THROTTLER_STORAGE');

/**
 * Creates the counter store inside Nest's DI instead of at import time, so that Nest owns its
 * lifecycle (its Redis connection is closed on shutdown) and tests can replace it before any
 * connection is opened.
 */
@Module({
  providers: [{ provide: THROTTLER_STORAGE, useFactory: () => createThrottlerStorage() }],
  exports: [THROTTLER_STORAGE],
})
export class ThrottlingModule {}
