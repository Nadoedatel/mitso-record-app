import { INestApplication } from '@nestjs/common';
import { ModulesContainer } from '@nestjs/core';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';

/**
 * Build the OpenAPI document of the API.
 * Shared by the Swagger UI (main.ts, outside production) and by `npm run openapi:generate`,
 * which writes it to openapi.json so clients (Nuxt, Flutter) can be generated from one source.
 */
export function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('MITSO Record App API')
    .setDescription('API for student record management system')
    .setVersion('2.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('students', 'Student management endpoints')
    .addTag('teachers', 'Teacher management endpoints')
    .addTag('subjects', 'Subject management endpoints')
    .addTag('grades', 'Grade management endpoints')
    .addTag('health', 'Health check')
    .addBearerAuth()
    .build();

  fixNullableTypes(app);
  return cleanupOpenApiDoc(SwaggerModule.createDocument(app, config));
}

type ZodDtoClass = { _OPENAPI_METADATA_FACTORY?: () => Record<string, Record<string, unknown>>; __nullableFixed?: boolean };

/**
 * nestjs-zod describes `z.string().nullish()` as `type: ['string', 'null']` (OpenAPI 3.1), but
 * @nestjs/swagger 7 reads an array `type` as "array of" and emits `{ type: 'array', items: string }`.
 * A client generated from that spec would send `string[]` for fields the API takes as `string`.
 * This rewrites such properties to the 3.0 form `{ type: 'string', nullable: true }` that swagger keeps intact.
 * Real arrays are unaffected: Zod emits them as `type: 'array'` (a string, not a list).
 */
function fixNullableTypes(app: INestApplication): void {
  const modules = app.get(ModulesContainer);
  const dtoClasses = new Set<ZodDtoClass>();
  for (const module of modules.values()) {
    for (const wrapper of module.controllers.values()) {
      const prototype = (wrapper.metatype as { prototype?: object } | null)?.prototype;
      if (!prototype) continue;
      for (const method of Object.getOwnPropertyNames(prototype)) {
        const types: unknown[] = Reflect.getMetadata('design:paramtypes', prototype, method) ?? [];
        for (const type of types) {
          if (typeof type === 'function' && '_OPENAPI_METADATA_FACTORY' in type) dtoClasses.add(type as ZodDtoClass);
        }
      }
    }
  }

  for (const dto of dtoClasses) {
    const original = dto._OPENAPI_METADATA_FACTORY;
    if (!original || dto.__nullableFixed) continue;
    dto.__nullableFixed = true;
    dto._OPENAPI_METADATA_FACTORY = () => {
      const properties = original.call(dto);
      for (const property of Object.values(properties)) {
        const type = property.type;
        if (!Array.isArray(type)) continue;
        const concrete = type.filter((t) => t !== 'null');
        if (concrete.length === 1) {
          property.type = concrete[0];
          property.nullable = type.includes('null');
        }
      }
      return properties;
    };
  }
}
