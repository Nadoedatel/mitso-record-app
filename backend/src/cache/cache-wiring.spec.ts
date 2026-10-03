import { DIRECTORY_NAMESPACE } from './cache.constants';
import { createCacheStore } from './cache.module';
import { INVALIDATES_CACHE } from './invalidates-cache.decorator';
import { MemoryCacheStore } from './memory-cache.store';
import { RedisCacheStore } from './redis-cache.store';
import { FacultiesService } from '../faculties/faculties.service';
import { GroupsService } from '../groups/groups.service';
import { SpecializationsService } from '../specializations/specializations.service';
import { StudentsService } from '../students/students.service';
import { SubjectsService } from '../subjects/subjects.service';
import { TeachersService } from '../teachers/teachers.service';

/**
 * Every write to data that appears in a cached response must invalidate the cache.
 * The responses embed each other (a group lists its students, a subject its teachers and groups),
 * so writes in ALL of these services bump the same namespace. If someone adds a write method and
 * forgets the decorator, add it here and the test documents the intent.
 */
describe('cache invalidation wiring', () => {
  const writes: [string, { prototype: object }, string[]][] = [
    ['FacultiesService', FacultiesService, ['create', 'update', 'remove']],
    ['SpecializationsService', SpecializationsService, ['create', 'update', 'remove']],
    ['GroupsService', GroupsService, ['create', 'update', 'setSubjects', 'remove']],
    ['SubjectsService', SubjectsService, ['create', 'update', 'remove', 'assignGroups', 'setTeachers']],
    ['StudentsService', StudentsService, ['create', 'update', 'remove']],
    ['TeachersService', TeachersService, ['create', 'update', 'remove', 'assignSubjects', 'removeSubject', 'setSubjects']],
  ];

  it.each(writes)('%s invalidates the directory cache on every write', (_name, service, methods) => {
    for (const method of methods) {
      const fn = (service.prototype as Record<string, unknown>)[method];
      expect({ method, namespace: Reflect.getMetadata(INVALIDATES_CACHE, fn as object) }).toEqual({
        method,
        namespace: DIRECTORY_NAMESPACE,
      });
    }
  });
});

describe('createCacheStore', () => {
  it('uses memory when REDIS_URL is not set', () => {
    expect(createCacheStore({})).toBeInstanceOf(MemoryCacheStore);
  });

  it('uses Redis when REDIS_URL is set (without connecting during construction)', async () => {
    const store = createCacheStore({ REDIS_URL: 'redis://127.0.0.1:1' });

    expect(store).toBeInstanceOf(RedisCacheStore);
    await store.close();
  });
});
