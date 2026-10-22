import { EventEmitter } from 'events';
import { NextFunction, Request, Response } from 'express';
import {
  httpRequestDuration,
  httpRequestsInFlight,
  httpRequestsTotal,
  metricsMiddleware,
  namespaceLabel,
  registry,
  routeLabel,
} from './metrics';
import { hasValidBearer } from './metrics.controller';

describe('routeLabel', () => {
  it('uses the route template, not the real url (one time series per route, not per id)', () => {
    expect(routeLabel({ route: { path: '/api/students/:id' } } as unknown as Request)).toBe('/api/students/:id');
  });

  it('puts requests that matched no route under one label', () => {
    expect(routeLabel({} as Request)).toBe('unmatched');
  });
});

describe('namespaceLabel', () => {
  it('drops the per-user part so the label does not grow with users', () => {
    expect(namespaceLabel('user:42')).toBe('user');
    expect(namespaceLabel('directory')).toBe('directory');
  });
});

describe('hasValidBearer', () => {
  it('accepts only the exact token', () => {
    expect(hasValidBearer('Bearer secret-token', 'secret-token')).toBe(true);
    expect(hasValidBearer('Bearer secret-token-', 'secret-token')).toBe(false);
    expect(hasValidBearer('Bearer other', 'secret-token')).toBe(false);
    expect(hasValidBearer('secret-token', 'secret-token')).toBe(false);
    expect(hasValidBearer(undefined, 'secret-token')).toBe(false);
  });
});

describe('metricsMiddleware', () => {
  beforeEach(() => {
    httpRequestsTotal.reset();
    httpRequestDuration.reset();
    httpRequestsInFlight.set(0);
  });

  /** A request that goes through the middleware and finishes with `status` */
  function run(path: string, status: number, routePath?: string) {
    const res = Object.assign(new EventEmitter(), { statusCode: status }) as unknown as Response;
    const req = { method: 'GET', path, route: routePath ? { path: routePath } : undefined } as unknown as Request;
    const next = jest.fn() as NextFunction;
    metricsMiddleware(req, res, next);
    return { res, next };
  }

  const total = async () => (await registry.getMetricsAsJSON()).find((m) => m.name === 'http_requests_total');

  it('counts a request after it ends, with method, route template and status', async () => {
    const { res, next } = run('/api/students/7', 200, '/api/students/:id');
    expect(next).toHaveBeenCalled();
    res.emit('close');

    expect((await total())?.values).toEqual([
      expect.objectContaining({ value: 1, labels: { method: 'GET', route: '/api/students/:id', status: '200' } }),
    ]);
  });

  it('counts a request that a guard rejected (no route handler ran) too', async () => {
    run('/api/groups', 401, '/api/groups').res.emit('close');
    run('/nowhere', 404).res.emit('close');

    const labels = (await total())?.values.map((v) => v.labels);
    expect(labels).toEqual(
      expect.arrayContaining([
        { method: 'GET', route: '/api/groups', status: '401' },
        { method: 'GET', route: 'unmatched', status: '404' },
      ]),
    );
  });

  it('tracks requests in flight: up on start, down on end', async () => {
    const { res } = run('/api/groups', 200, '/api/groups');
    expect((await registry.getSingleMetric('http_requests_in_flight')?.get())?.values[0].value).toBe(1);
    res.emit('close');
    expect((await registry.getSingleMetric('http_requests_in_flight')?.get())?.values[0].value).toBe(0);
  });

  it.each(['/api/metrics', '/api/health'])('ignores %s (probes and the scrape itself are noise)', async (path) => {
    const { res, next } = run(path, 200, path);
    res.emit('close');

    expect(next).toHaveBeenCalled();
    expect((await total())?.values).toEqual([]);
  });
});
