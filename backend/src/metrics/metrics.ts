import { NextFunction, Request, Response } from 'express';
import { collectDefaultMetrics, Counter, Gauge, Histogram, Registry } from 'prom-client';

/**
 * Metrics of the process in Prometheus format.
 * They live in one registry created once per process (module level), so any code can count something
 * without being injected with a service, and several Nest apps in one test run do not register the same metric twice.
 */
export const registry = new Registry();
collectDefaultMetrics({ register: registry });

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'HTTP requests handled, by method, route template and status code',
  labelNames: ['method', 'route', 'status'] as const,
  registers: [registry],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration (until the response is finished)',
  labelNames: ['method', 'route', 'status'] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [registry],
});

export const httpRequestsInFlight = new Gauge({
  name: 'http_requests_in_flight',
  help: 'HTTP requests being handled right now',
  registers: [registry],
});

export const cacheRequestsTotal = new Counter({
  name: 'cache_requests_total',
  help: 'Cache lookups: hit (served from the cache), shared (joined a load already running), miss (went to the database)',
  labelNames: ['namespace', 'result'] as const,
  registers: [registry],
});

export const backgroundJobsTotal = new Counter({
  name: 'background_jobs_total',
  help: 'Background job attempts that ended, by job name and result (a retried job counts one failed attempt each time)',
  labelNames: ['job', 'result'] as const,
  registers: [registry],
});

/** Paths that are not worth counting: probes and the scrape itself would only add noise */
const SKIPPED_PATHS = ['/api/metrics', '/api/health'];

/**
 * Label for the `route` dimension: the route TEMPLATE (`/api/students/:id`), never the real URL.
 * A label per real URL would create a new time series for every id and grow without bound.
 * Requests that matched no route (404 for a random path) share one label for the same reason.
 */
export function routeLabel(req: Pick<Request, 'route'>): string {
  const path: unknown = req.route?.path;
  return typeof path === 'string' ? path : 'unmatched';
}

/**
 * Express middleware that counts every request. It is middleware, not a Nest interceptor, on purpose:
 * interceptors run after the guards, so a 401, 403 or 429 answered by a guard would never be counted.
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (SKIPPED_PATHS.includes(req.path)) return next();

  const stopTimer = httpRequestDuration.startTimer();
  httpRequestsInFlight.inc();

  res.on('close', () => {
    // 'close' fires also when the client hangs up before the end; the status is then whatever was set so far
    const labels = { method: req.method, route: routeLabel(req), status: String(res.statusCode) };
    httpRequestsInFlight.dec();
    httpRequestsTotal.inc(labels);
    stopTimer(labels);
  });
  next();
}

/** Cache namespaces like `user:42` exist per user: keep only the part before the colon as the label */
export function namespaceLabel(namespace: string): string {
  return namespace.split(':')[0];
}
