import { parseRedisUrl } from './redis-connection';

describe('parseRedisUrl', () => {
  it('reads host and port, with the default port 6379', () => {
    expect(parseRedisUrl('redis://localhost:6380')).toMatchObject({ host: 'localhost', port: 6380 });
    expect(parseRedisUrl('redis://cache')).toMatchObject({ host: 'cache', port: 6379 });
  });

  it('reads credentials, database and TLS', () => {
    expect(parseRedisUrl('rediss://user:p%40ss@redis.example:6379/2')).toMatchObject({
      host: 'redis.example',
      username: 'user',
      password: 'p@ss',
      db: 2,
      tls: {},
    });
  });

  it('never limits retries per request (workers block on Redis)', () => {
    expect(parseRedisUrl('redis://localhost')).toMatchObject({ maxRetriesPerRequest: null });
  });
});
