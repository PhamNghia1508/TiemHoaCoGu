'use client';

export async function storeRequest<T>(
  path: string,
  body?: unknown,
  method = body === undefined ? 'GET' : 'POST',
): Promise<T> {
  const payload =
    body === undefined && !['GET', 'HEAD', 'DELETE'].includes(method.toUpperCase()) ? {} : body;
  const response = await fetch(`/api/store/${path.replace(/^\/+/, '')}`, {
    method,
    credentials: 'same-origin',
    cache: 'no-store',
    headers:
      payload === undefined
        ? { Accept: 'application/json' }
        : { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || 'Yêu cầu thất bại.');
  return data as T;
}
