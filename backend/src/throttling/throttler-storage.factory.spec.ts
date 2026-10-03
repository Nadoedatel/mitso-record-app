import { ResilientThrottlerStorage } from './resilient-throttler.storage';
import { createThrottlerStorage } from './throttler-storage.factory';

describe('createThrottlerStorage', () => {
  it('returns undefined without REDIS_URL, so Throttler keeps its default memory storage', () => {
    expect(createThrottlerStorage({})).toBeUndefined();
  });

  it('builds the resilient Redis storage with REDIS_URL, without connecting during construction', () => {
    const storage = createThrottlerStorage({ REDIS_URL: 'redis://127.0.0.1:1' });

    expect(storage).toBeInstanceOf(ResilientThrottlerStorage);
    (storage as ResilientThrottlerStorage).onModuleDestroy();
  });
});
