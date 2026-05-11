#!/usr/bin/env node
/**
 * One-shot dev bootstrap. Idempotent:
 *   1. install workspace deps
 *   2. ensure .env files exist (copy from .env.example, never overwrite)
 *   3. start docker-compose infra (postgres, redis, mailhog)
 *   4. build @auction/shared
 *   5. apply DB migrations
 *   6. seed dev fixtures
 *
 * Run with: `pnpm bootstrap`
 */
import { spawn } from 'node:child_process';
import { existsSync, copyFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const run = (cmd, args, opts = {}) =>
  new Promise((resolveStep, rejectStep) => {
    const proc = spawn(cmd, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
      cwd: opts.cwd ?? root,
    });
    proc.on('close', (code) => {
      if (code === 0) resolveStep();
      else rejectStep(new Error(`${cmd} ${args.join(' ')} exited ${code}`));
    });
  });

const ensureEnv = (relExample, relTarget) => {
  const example = resolve(root, relExample);
  const target = resolve(root, relTarget);
  if (existsSync(target)) {
    console.log(`[bootstrap] ${relTarget} exists — leaving as-is`);
    return;
  }
  copyFileSync(example, target);
  console.log(`[bootstrap] copied ${relExample} → ${relTarget}`);
};

async function main() {
  console.log('[bootstrap] step 1/6: install');
  await run('pnpm', ['install']);

  console.log('[bootstrap] step 2/6: env files');
  ensureEnv('.env.example', '.env');
  ensureEnv('apps/api/.env.example', 'apps/api/.env');

  console.log('[bootstrap] step 3/6: docker compose up -d');
  await run('docker', ['compose', 'up', '-d']);

  console.log('[bootstrap] step 4/6: build @auction/shared');
  await run('pnpm', ['--filter', '@auction/shared', 'run', 'build']);

  console.log('[bootstrap] step 5/6: db:migrate');
  await run('pnpm', ['--filter', '@auction/api', 'run', 'db:migrate']);

  console.log('[bootstrap] step 6/6: db:seed');
  await run('pnpm', ['--filter', '@auction/api', 'run', 'db:seed']);

  console.log('[bootstrap] done. Start dev with: pnpm dev');
}

main().catch((err) => {
  console.error(`[bootstrap] failed: ${err.message}`);
  process.exit(1);
});
