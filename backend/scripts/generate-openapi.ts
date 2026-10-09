/**
 * Writes backend/openapi.json from the controllers and Zod DTOs.
 * Runs the Nest app in preview mode: routes are registered, but providers are not created,
 * so neither PostgreSQL nor Redis is needed. `--check` fails when the committed file is stale (CI).
 */
import { NestFactory } from '@nestjs/core';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { buildOpenApiDocument } from '../src/openapi';

const OUTPUT = resolve(__dirname, '../openapi.json');

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { preview: true, logger: false });
  configureApp(app);
  const json = `${JSON.stringify(buildOpenApiDocument(app), null, 2)}\n`;
  await app.close();

  if (process.argv.includes('--check')) {
    const current = existsSync(OUTPUT) ? readFileSync(OUTPUT, 'utf8') : '';
    if (current !== json) {
      console.error('backend/openapi.json is out of date. Run `npm run openapi:generate` in backend and commit the result.');
      process.exit(1);
    }
    console.log('openapi.json is up to date');
    return;
  }
  writeFileSync(OUTPUT, json);
  console.log(`Wrote ${OUTPUT}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
