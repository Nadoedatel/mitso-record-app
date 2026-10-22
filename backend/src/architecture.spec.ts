import { readdirSync, readFileSync, statSync } from 'fs';
import { dirname, join, normalize, relative, resolve, sep } from 'path';

/**
 * The shape of the backend, checked on every test run.
 * It reads the `import ... from '...'` lines of the source files (no extra tool) and fails when the structure drifts:
 * a module reaching into the internals of another, a dependency nobody decided on, a cycle, a service that knows HTTP.
 * Failing here means "decide": either fix the import or change the table below on purpose, in the same commit.
 */
const SRC = resolve(__dirname);

/** Shared kernel: every module may import these, deep paths included */
const SHARED = ['common', 'prisma'];

/** Which modules each module may import (besides SHARED). A new line here is a design decision, not a formality. */
const ALLOWED_DEPENDENCIES: Record<string, string[]> = {
  audit: ['auth'],
  auth: ['cache'],
  cache: ['auth', 'metrics'],
  faculties: ['cache'],
  grades: ['audit', 'auth'],
  groups: ['cache'],
  health: [],
  jobs: ['auth', 'cache', 'metrics', 'students'],
  metrics: [],
  specializations: ['cache'],
  students: ['auth', 'cache'],
  subjects: ['cache'],
  teachers: ['cache'],
  throttling: ['cache'],
};

/** What other modules may import from a module: its index, plus the AuthUser contract that every layer needs */
const isPublicPath = (target: string) => /^[^/]+(\/index)?$/.test(target) || target.startsWith('auth/interfaces/');

interface Import {
  file: string;
  module: string;
  target: string;
  targetModule: string;
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return path.endsWith('.ts') && !path.endsWith('.spec.ts') ? [path] : [];
  });
}

/** Relative imports of production code that leave their own top-level module */
function crossModuleImports(): Import[] {
  const result: Import[] = [];
  for (const file of sourceFiles(SRC)) {
    const fromSrc = relative(SRC, file).split(sep);
    if (fromSrc.length < 2) continue; // files directly in src (main.ts, app.module.ts) wire everything together
    const module = fromSrc[0];
    for (const match of readFileSync(file, 'utf8').matchAll(/from '(\.\.?\/[^']+)'/g)) {
      const target = relative(SRC, normalize(join(dirname(file), match[1]))).split(sep).join('/');
      const targetModule = target.split('/')[0];
      if (targetModule !== module) result.push({ file: relative(SRC, file), module, target, targetModule });
    }
  }
  return result;
}

describe('backend architecture', () => {
  const imports = crossModuleImports();
  const modules = new Set(readdirSync(SRC).filter((name) => statSync(join(SRC, name)).isDirectory()));

  it('finds the modules and their imports (a sanity check of this test itself)', () => {
    expect(modules.size).toBeGreaterThan(10);
    expect(imports.length).toBeGreaterThan(30);
  });

  it('modules import each other only through the public API (index.ts), not the internals', () => {
    const violations = imports
      .filter((i) => !SHARED.includes(i.targetModule) && !isPublicPath(i.target))
      .map((i) => `${i.file} imports ${i.target}: import from '../${i.targetModule}' instead`);

    expect(violations).toEqual([]);
  });

  it('every module-to-module dependency is declared in ALLOWED_DEPENDENCIES', () => {
    const violations = imports
      .filter((i) => !SHARED.includes(i.targetModule) && !(ALLOWED_DEPENDENCIES[i.module] ?? []).includes(i.targetModule))
      .map((i) => `${i.module} -> ${i.targetModule} (${i.file}): not declared; add it to ALLOWED_DEPENDENCIES if it is intended`);

    expect([...new Set(violations)]).toEqual([]);
  });

  it('declares only dependencies that really exist, and no unknown modules', () => {
    const used = new Set(imports.map((i) => `${i.module}>${i.targetModule}`));
    const stale: string[] = [];
    for (const [module, targets] of Object.entries(ALLOWED_DEPENDENCIES)) {
      if (!modules.has(module)) stale.push(`${module} is not a module`);
      for (const target of targets) {
        if (!modules.has(target)) stale.push(`${module} -> ${target}: no such module`);
        else if (!used.has(`${module}>${target}`)) stale.push(`${module} -> ${target}: declared but never imported, remove it`);
      }
    }

    expect(stale).toEqual([]);
  });

  it('has no dependency cycles between modules (the AuthUser type contract aside)', () => {
    const graph = new Map<string, Set<string>>();
    for (const i of imports) {
      if (SHARED.includes(i.targetModule) || i.target.startsWith('auth/interfaces/')) continue;
      graph.set(i.module, (graph.get(i.module) ?? new Set()).add(i.targetModule));
    }

    const cycles: string[] = [];
    const visit = (node: string, path: string[]) => {
      if (path.includes(node)) return void cycles.push([...path.slice(path.indexOf(node)), node].join(' -> '));
      for (const next of graph.get(node) ?? []) visit(next, [...path, node]);
    };
    for (const node of graph.keys()) visit(node, []);

    expect([...new Set(cycles)]).toEqual([]);
  });

  it('services and workers know nothing about HTTP: no express, no Nest HTTP exceptions', () => {
    const offenders: string[] = [];
    for (const file of sourceFiles(SRC).filter((f) => /\.(service|worker|repository)\.ts$/.test(f))) {
      const text = readFileSync(file, 'utf8');
      if (/from 'express'/.test(text)) offenders.push(`${relative(SRC, file)} imports express`);
      const exception = text.match(/\b(NotFound|Conflict|Forbidden|BadRequest|Unauthorized|ServiceUnavailable|Http)Exception\b/);
      if (exception) offenders.push(`${relative(SRC, file)} uses ${exception[0]}: throw a domain error (common/errors) instead`);
    }

    expect(offenders).toEqual([]);
  });

  it('only repositories, the services not yet migrated and infrastructure build Prisma queries (the list may only shrink)', () => {
    // Services that still call `this.prisma.<model>` directly. Migrating one means removing it from this list.
    const NOT_YET_MIGRATED = [
      'auth/auth.service.ts',
      'auth/two-factor/two-factor.service.ts',
      'audit/audit.service.ts',
      'faculties/faculties.service.ts',
      'groups/groups.service.ts',
      'health/health.service.ts',
      'jobs/jobs.service.ts',
      'jobs/jobs.worker.ts',
      'specializations/specializations.service.ts',
      'subjects/subjects.service.ts',
      'teachers/teachers.service.ts',
    ];
    const direct = sourceFiles(SRC)
      .filter((f) => /\.(service|worker)\.ts$/.test(f) && /this\.prisma\./.test(readFileSync(f, 'utf8')))
      .map((f) => relative(SRC, f).split(sep).join('/'))
      .sort();

    expect(direct).toEqual([...NOT_YET_MIGRATED].sort());
  });
});
