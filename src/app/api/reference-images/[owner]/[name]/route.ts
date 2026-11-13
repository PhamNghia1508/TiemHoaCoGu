import { NextResponse } from 'next/server';
import { ACCESS_COOKIE, storeCookies } from '@/lib/server/store-bff';

export async function GET(
  _request: Request,
  context: { params: Promise<{ owner: string; name: string }> },
) {
  const { owner, name } = await context.params;
  const base = process.env.API_BASE_URL?.trim().replace(/\/$/, '');
  if (!base || !/^[a-f0-9]{32}$/.test(owner) || !/^[a-f0-9]{32}\.(png|jpg|webp)$/.test(name))
    return new NextResponse(null, { status: 404 });
  const token = (await storeCookies()).get(ACCESS_COOKIE)?.value;
  if (!token)
    return new NextResponse(null, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  try {
    const response = await fetch(`${base}/api/custom-orders/reference-images/${owner}/${name}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok)
      return new NextResponse(null, { status: response.status === 404 ? 404 : 502 });
    const type = response.headers.get('content-type')?.split(';')[0];
    if (
      !type ||
      !['image/png', 'image/jpeg', 'image/webp'].includes(type) ||
      Number(response.headers.get('content-length')) > 900 * 1024
    )
      return new NextResponse(null, { status: 502 });
    const reader = response.body?.getReader();
    if (!reader) return new NextResponse(null, { status: 502 });
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 900 * 1024) {
        await reader.cancel();
        return new NextResponse(null, { status: 502 });
      }
      chunks.push(value);
    }
    const data = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      data.set(chunk, offset);
      offset += chunk.length;
    }
    return new NextResponse(data, {
      headers: {
        'Content-Type': type,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; sandbox",
      },
    });
  } catch {
    return new NextResponse(null, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
