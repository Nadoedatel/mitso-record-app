import './instrument';
import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(WorkerModule);
  if (!process.env.REDIS_URL) {
    await app.close();
    throw new Error('REDIS_URL is required for the background worker');
  }
  app.enableShutdownHooks();
}

bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
