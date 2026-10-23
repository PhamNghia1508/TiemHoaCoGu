import { cp } from 'node:fs/promises';

// Next standalone omits static assets; make `npm start` work without extra shell steps.
await cp(
  new URL('../public', import.meta.url),
  new URL('../.next/standalone/public', import.meta.url),
  { recursive: true },
);
await cp(
  new URL('../.next/static', import.meta.url),
  new URL('../.next/standalone/.next/static', import.meta.url),
  { recursive: true },
);
process.env.HOSTNAME = process.env.NEXT_HOSTNAME || '0.0.0.0';
process.env.PORT ||= '3000';
await import('../.next/standalone/server.js');
