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

  const nestedRequired = fixNullableTypes(app);
  const document = SwaggerModule.createDocument(app, config);
  restoreNestedRequired(document, nestedRequired);
  return cleanupOpenApiDoc(document);
}

/**
 * Rewrites `type: ['string', 'null']` to `type: 'string', nullable: true` in a schema and in everything nested
 * inside it (object properties, array items, unions). Schemas of other shapes are left untouched.
 */
function normalizeNullable(node: unknown): void {
  if (Array.isArray(node)) {
    node.forEach(normalizeNullable);
    return;
  }
  if (typeof node !== 'object' || node === null) return;
  const schema = node as Record<string, unknown>;
  const type = schema.type;
  if (Array.isArray(type)) {
    const concrete = type.filter((t) => t !== 'null');
    if (concrete.length === 1) {
      schema.type = concrete[0];
      schema.nullable = type.includes('null');
    }
  }
  for (const value of Object.values(schema)) normalizeNullable(value);
}

/**
 * Metadata key under which @ApiResponse stores a method's responses. @nestjs/swagger 11 no longer lets us import it
 * (`dist/constants` is outside the package `exports`), so it is repeated here; openapi.spec.ts fails if it changes.
 */
const API_RESPONSE_METADATA = 'swagger/apiResponse';

type ZodDtoClass = { name: string; _OPENAPI_METADATA_FACTORY?: () => Record<string, Record<string, unknown>>; __nullableFixed?: boolean };

/**
 * nestjs-zod describes `z.string().nullish()` as `type: ['string', 'null']` (OpenAPI 3.1), but
 * @nestjs/swagger reads an array `type` as "array of" and emits `{ type: 'array', items: string }`
 * (so in 7; still so in 11, checked when upgrading: without this workaround the spec comes out wrong).
 * A client generated from that spec would send `string[]` for fields the API takes as `string`.
 * This rewrites such properties to the 3.0 form `{ type: 'string', nullable: true }` that swagger keeps intact.
 * Real arrays are unaffected: Zod emits them as `type: 'array'` (a string, not a list).
 */
function fixNullableTypes(app: INestApplication): NestedRequired {
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
        // Response DTOs (`@ApiResponse({ type })`) go through the same swagger reader
        const handler = (prototype as Record<string, unknown>)[method];
        if (typeof handler !== 'function') continue;
        const responses: Record<string, { type?: unknown }> = Reflect.getMetadata(API_RESPONSE_METADATA, handler) ?? {};
        for (const { type } of Object.values(responses)) {
          if (typeof type === 'function' && '_OPENAPI_METADATA_FACTORY' in type) dtoClasses.add(type as ZodDtoClass);
        }
      }
    }
  }

  const nestedRequired: NestedRequired = new Map();
  for (const dto of dtoClasses) {
    const original = dto._OPENAPI_METADATA_FACTORY;
    if (!original || dto.__nullableFixed) continue;
    dto.__nullableFixed = true;
    dto._OPENAPI_METADATA_FACTORY = () => {
      const properties = original.call(dto);
      for (const [name, property] of Object.entries(properties)) {
        normalizeNullable(property);
        // Zod puts the required keys of a nested object into `required: [...]`, but swagger reads that key
        // as its own boolean flag of the property and drops the list. Keep it to put back after createDocument.
        if (Array.isArray(property.required)) {
          const perProperty = nestedRequired.get(dto.name) ?? {};
          perProperty[name] = property.required as string[];
          nestedRequired.set(dto.name, perProperty);
        }
      }
      return properties;
    };
  }
  return nestedRequired;
}

/** Schema name -> property name -> keys the nested object requires */
type NestedRequired = Map<string, Record<string, string[]>>;

/** Puts back the `required` lists of nested objects that swagger dropped (see fixNullableTypes) */
function restoreNestedRequired(document: OpenAPIObject, nestedRequired: NestedRequired): void {
  const schemas = document.components?.schemas ?? {};
  for (const [schemaName, perProperty] of nestedRequired) {
    const schema = schemas[schemaName] as { properties?: Record<string, { required?: string[] }> } | undefined;
    for (const [property, required] of Object.entries(perProperty)) {
      const target = schema?.properties?.[property];
      if (target) target.required = required;
    }
  }
}
