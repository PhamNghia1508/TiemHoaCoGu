import { NextResponse } from 'next/server';

export async function GET(_request: Request, context: { params: Promise<{ name: string }> }) {
  const { name } = await context.params;
  const base = process.env.API_BASE_URL?.trim().replace(/\/$/, '');
  if (!base || !/^[0-9a-f]{32}\.(png|jpg|webp)$/i.test(name)) {
    return new NextResponse(null, { status: 404 });
  }
  try {
    const response = await fetch(`${base}/api/media/${name}`, {
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(10000),
      headers: { Accept: 'image/png,image/jpeg,image/webp' },
    });
    if (!response.ok)
      return new NextResponse(null, { status: response.status === 404 ? 404 : 502 });
    const type = response.headers.get('content-type')?.split(';')[0];
    if (!type || !['image/png', 'image/jpeg', 'image/webp'].includes(type))
      return new NextResponse(null, { status: 502 });
    const limit = 8 * 1024 * 1024;
    if (Number(response.headers.get('content-length')) > limit)
      return new NextResponse(null, { status: 502 });
    const reader = response.body?.getReader();
    if (!reader) return new NextResponse(null, { status: 502 });
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) {
        await reader.cancel();
        return new NextResponse(null, { status: 502 });
      }
      chunks.push(value);
    }
    const data = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      data.set(chunk, offset);
      offset += chunk.length;
    }
    return new NextResponse(data, {
      headers: {
        'Content-Type': type,
        'Cache-Control': 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'",
      },
    });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
