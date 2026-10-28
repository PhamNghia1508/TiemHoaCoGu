#!/usr/bin/env node
import { spawn } from 'node:child_process';

const api = process.env.INTEGRATION_API_URL;
const base = process.env.INTEGRATION_BASE_URL || 'http://localhost:3100';
const allowed = (url) => ['localhost', '127.0.0.1', '::1'].includes(new URL(url).hostname);
if (!api)
  throw new Error('Thiếu INTEGRATION_API_URL (backend local, ví dụ http://127.0.0.1:5085).');
if ((!allowed(api) || !allowed(base)) && process.env.INTEGRATION_ALLOW_NON_LOOPBACK !== 'true') {
  throw new Error(
    'Integration chỉ chạy loopback; đặt INTEGRATION_ALLOW_NON_LOOPBACK=true nếu đã kiểm soát môi trường.',
  );
}
process.env.API_BASE_URL = api;
process.env.INTEGRATION_BASE_URL = base;
process.env.STOREFRONT_WRITES_ENABLED ||= 'true';
process.env.NEXT_DIST_DIR ||= '.next-integration';
let server;
try {
  if (process.env.INTEGRATION_START_SERVER === 'true') {
    const port = new URL(base).port || '3100';
    server = spawn('npm', ['run', 'dev', '--', '--hostname', '127.0.0.1', '--port', port], {
      stdio: 'inherit',
      env: process.env,
      detached: true,
    });
    const deadline = Date.now() + 90_000;
    let ready = false;
    while (Date.now() < deadline) {
      if (server.exitCode !== null)
        throw new Error(
          `Frontend integration server exited before readiness (code ${server.exitCode}).`,
        );
      try {
        const response = await fetch(base);
        if (response.ok || response.status < 500) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    if (!ready) throw new Error(`Frontend integration server did not become ready at ${base}.`);
  }
  const result = spawn(
    'npx',
    ['playwright', 'test', '--config=playwright.integration.config.ts', ...process.argv.slice(2)],
    { stdio: 'inherit', env: process.env },
  );
  const code = await new Promise((resolve) => result.on('exit', (value) => resolve(value ?? 1)));
  process.exitCode = code;
} finally {
  if (server?.pid) {
    try {
      process.kill(-server.pid, 'SIGTERM');
    } catch {}
  }
}
