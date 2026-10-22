import { readFileSync } from 'fs';
import { resolve } from 'path';

type Schema = { type?: unknown; nullable?: boolean; required?: string[]; properties?: Record<string, Schema>; items?: Schema };
type Doc = { components: { schemas: Record<string, Schema> }; paths: Record<string, Record<string, { responses: Record<string, { content?: unknown }> }>> };

/**
 * Guards for the committed openapi.json (the source of the generated frontend client).
 * The file itself is kept fresh by `npm run openapi:check` in CI; these tests pin the two workarounds in src/openapi.ts.
 */
describe('openapi.json response contracts', () => {
  const doc = JSON.parse(readFileSync(resolve(__dirname, '../openapi.json'), 'utf8')) as Doc;
  const schemas = doc.components.schemas;

  it('describes the body of the main success responses', () => {
    const faculties = doc.paths['/api/faculties'];
    expect(faculties.get.responses['200'].content).toBeDefined();
    expect(faculties.post.responses['201'].content).toBeDefined();
    expect(doc.paths['/api/auth/me'].get.responses['200'].content).toBeDefined();
    expect(doc.paths['/api/grades/batch'].post.responses['201'].content).toBeDefined();
    expect(doc.paths['/api/jobs/{id}'].get.responses['200'].content).toBeDefined();
    expect(doc.paths['/api/auth/2fa/setup'].post.responses['200'].content).toBeDefined();
    expect(doc.paths['/api/auth/2fa/enable'].post.responses['200'].content).toBeDefined();
    expect(doc.paths['/api/jobs/imports/students'].post.responses['202'].content).toBeDefined();
  });

  it('keeps nullable strings as `string, nullable` instead of an array of strings', () => {
    expect(schemas.TeacherResponseDto.properties?.middleName).toEqual({ type: 'string', nullable: true });
    expect(schemas.FacultyResponseDto.properties?.specializations?.items?.properties?.code).toEqual({
      type: 'string',
      nullable: true,
    });
  });

  it('keeps the required keys of nested objects (swagger drops them by default)', () => {
    expect(schemas.FacultyResponseDto.properties?._count?.required).toEqual(['specializations', 'groups']);
  });
});
