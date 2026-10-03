import { MemoryCacheStore } from './memory-cache.store';

describe('MemoryCacheStore', () => {
  it('stores and returns values, null when missing', async () => {
    const store = new MemoryCacheStore();
    await store.set('a', '1', 60);

    expect(await store.get('a')).toBe('1');
    expect(await store.get('missing')).toBeNull();
  });

  it('forgets an entry once its TTL has passed', async () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(0);
    const store = new MemoryCacheStore();
    await store.set('a', '1', 10);

    now.mockReturnValue(10_001);

    expect(await store.get('a')).toBeNull();
    now.mockRestore();
  });

  it('evicts the oldest entries when full instead of growing without bound', async () => {
    const store = new MemoryCacheStore(2);
    await store.set('a', '1', 60);
    await store.set('b', '2', 60);
    await store.set('c', '3', 60);

    expect(await store.get('a')).toBeNull();
    expect(await store.get('b')).toBe('2');
    expect(await store.get('c')).toBe('3');
  });

  it('counts with incr starting from zero', async () => {
    const store = new MemoryCacheStore();

    expect(await store.incr('ver')).toBe(1);
    expect(await store.incr('ver')).toBe(2);
  });

  it('exposes a counter through get, like Redis INCR and GET share a keyspace', async () => {
    const store = new MemoryCacheStore();
    await store.incr('ver');
    await store.incr('ver');

    expect(await store.get('ver')).toBe('2');
  });

  it('never evicts a counter: losing a version would make stale keys readable again', async () => {
    const store = new MemoryCacheStore(1);
    await store.incr('ver');
    await store.set('a', '1', 60);
    await store.set('b', '2', 60);

    expect(await store.get('ver')).toBe('1');
  });

  it('clear removes entries and counters', async () => {
    const store = new MemoryCacheStore();
    await store.set('a', '1', 60);
    await store.incr('ver');

    await store.clear();

    expect(await store.get('a')).toBeNull();
    expect(await store.incr('ver')).toBe(1);
  });
});
