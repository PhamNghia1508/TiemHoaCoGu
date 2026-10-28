import { cp } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// UI fixtures only. A configured backend must never be reachable from this process.
const dist = process.env.ADMIN_UI_DIST_DIR || '.next';
if (!/^\.next(?:-[a-z0-9-]+)?$/i.test(dist))
  throw new Error('Invalid admin UI fixture build directory.');
const root = resolve(dist, 'standalone');
await cp(resolve('public'), resolve(root, 'public'), { recursive: true });
await cp(resolve(dist, 'static'), resolve(root, dist, 'static'), { recursive: true });
process.env.API_BASE_URL = '';
process.env.PREVIEW_ORIGIN = '';
process.env.STOREFRONT_WRITES_ENABLED = 'true';
process.env.HOSTNAME = '127.0.0.1';
process.env.PORT = process.env.ADMIN_UI_PORT || '3104';
await import(pathToFileURL(resolve(root, 'server.js')).href);
