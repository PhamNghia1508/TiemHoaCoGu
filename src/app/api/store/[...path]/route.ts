import { NextResponse } from 'next/server';
import {
  ACCESS_COOKIE,
  MAX_BODY_BYTES,
  REFRESH_COOKIE,
  cookieOptions,
  forward,
  publicError,
  resolveStoreRoute,
  sameOrigin,
  storeCookies,
  writesEnabled,
} from '@/lib/server/store-bff';

type Ctx = { params: Promise<{ path: string[] }> };
const noStore = { 'Cache-Control': 'no-store' };
const jsonError = (error: string, status: number) =>
  NextResponse.json({ error }, { status, headers: noStore });

function clearAuthCookies(response: NextResponse): void {
  response.cookies.set(ACCESS_COOKIE, '', cookieOptions(0));
  response.cookies.set(REFRESH_COOKIE, '', cookieOptions(0));
}

function safeAuthPayload(endpoint: string, data: unknown): unknown {
  // Tokens are held only in HttpOnly cookies and are never returned to the browser.
  if (endpoint === 'auth/logout') return { ok: true };
  if (!data || typeof data !== 'object' || Array.isArray(data)) return data;
  const record = data as Record<string, unknown>;
  if (endpoint === 'auth/login' || endpoint === 'auth/register' || endpoint === 'auth/refresh') {
    const withoutTokens: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(record)) {
      if (key !== 'accessToken' && key !== 'refreshToken') withoutTokens[key] = value;
    }
    return withoutTokens.user ?? withoutTokens;
  }
  return data;
}

async function handler(request: Request, ctx: Ctx): Promise<NextResponse> {
  const { path } = await ctx.params;
  const endpoint = path.join('/');
  const route = resolveStoreRoute(path, request.method);
  if (endpoint === 'status' && request.method === 'GET')
    return NextResponse.json(
      { configured: Boolean(process.env.API_BASE_URL?.trim()), writesEnabled: writesEnabled() },
      { headers: noStore },
    );
  if (!route) return jsonError('Route không được hỗ trợ.', 404);
  if (route.write && !writesEnabled() && !endpoint.startsWith('auth/'))
    return jsonError('Storefront writes chưa được bật.', 503);
  if (route.write && !sameOrigin(request)) return jsonError('Origin không hợp lệ.', 403);
  if (route.write && request.method !== 'DELETE' && !endpoint.startsWith('auth/logout')) {
    const contentType = request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
    const mediaUpload = endpoint === 'management/media' && request.method === 'POST';
    if (mediaUpload ? contentType !== 'multipart/form-data' : contentType !== 'application/json')
      return jsonError(
        mediaUpload ? 'Chỉ hỗ trợ multipart upload.' : 'Chỉ hỗ trợ nội dung JSON.',
        415,
      );
    const contentLength = Number(request.headers.get('content-length') ?? 0);
    if (contentLength > MAX_BODY_BYTES) return jsonError('Nội dung quá lớn.', 413);
  }

  const jar = await storeCookies();
  const token = jar.get(ACCESS_COOKIE)?.value;
  if (route.protected && !token) return jsonError('Yêu cầu đăng nhập.', 401);
  let upstreamRequest = request;
  if (endpoint === 'auth/logout') {
    const refresh = jar.get(REFRESH_COOKIE)?.value ?? '';
    upstreamRequest = new Request(request.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
    });
  }

  try {
    const result = await forward(upstreamRequest, route.upstream, token);
    if (!result.response.ok) {
      const detail = result.data && typeof result.data === 'object' && ('message' in result.data || 'error' in result.data || 'title' in result.data)
        ? String((result.data as any).message || (result.data as any).error || (result.data as any).title)
        : publicError(result.response.status);
      const errorResponse = jsonError(detail, result.response.status);
      if (endpoint === 'auth/logout') clearAuthCookies(errorResponse);
      return errorResponse;
    }
    if (endpoint === 'management/reports/orders.csv') {
      if (typeof result.data !== 'string') return jsonError('Không thể tải báo cáo.', 502);
      return new NextResponse(result.data, {
        status: 200,
        headers: {
          ...noStore,
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="orders.csv"',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }
    // NextResponse.json cannot legally carry a 204 body.
    const output =
      result.response.status === 204
        ? new NextResponse(null, { status: 204, headers: noStore })
        : NextResponse.json(safeAuthPayload(endpoint, result.data), {
            status: result.response.status,
            headers: noStore,
          });
    if (endpoint === 'auth/login' || endpoint === 'auth/register' || endpoint === 'auth/refresh') {
      const data =
        result.data && typeof result.data === 'object' && !Array.isArray(result.data)
          ? (result.data as Record<string, unknown>)
          : {};
      const expiresAt =
        typeof data.expiresAt === 'string'
          ? new Date(data.expiresAt)
          : new Date(Date.now() + 15 * 60_000);
      const age = Number.isFinite(expiresAt.getTime())
        ? Math.max(1, Math.floor((expiresAt.getTime() - Date.now()) / 1000))
        : 900;
      if (typeof data.accessToken === 'string' && data.accessToken)
        output.cookies.set(ACCESS_COOKIE, data.accessToken, cookieOptions(age));
      if (typeof data.refreshToken === 'string' && data.refreshToken)
        output.cookies.set(REFRESH_COOKIE, data.refreshToken, cookieOptions(30 * 86400));
    }
    if (endpoint === 'auth/logout' || endpoint === 'auth/change-password') clearAuthCookies(output);
    return output;
  } catch (error) {
    const errorResponse = jsonError(
      error instanceof Error && error.message === 'REQUEST_BODY_TOO_LARGE'
        ? 'Nội dung quá lớn.'
        : 'Dịch vụ đang tạm thời không khả dụng.',
      error instanceof Error && error.message === 'REQUEST_BODY_TOO_LARGE' ? 413 : 503,
    );
    if (endpoint === 'auth/logout') clearAuthCookies(errorResponse);
    return errorResponse;
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
