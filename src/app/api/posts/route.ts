// 商户端代理：浏览器 fetch `/api/posts` → 转发到 Laravel `/api/v1/posts`
// 客户端 ep 同款 SquareFeed 组件直接用 `/api/posts`，本路由让商户端也能消费同一份数据

import { buildBackendUrl } from "@/lib/api/backend";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = new URL(buildBackendUrl("/api/v1/posts"));
  ["sort", "type", "topic", "city", "page", "pageSize", "lat", "lng", "tab", "authorId", "limit", "locale"].forEach(
    (k) => {
      const v = searchParams.get(k);
      if (v) url.searchParams.set(k, v);
    },
  );

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { "content-type": res.headers.get("content-type") ?? "application/json" },
    });
  } catch (err) {
    return Response.json(
      { code: 500, message: "posts_proxy_failed", data: null, detail: String(err) },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  const auth = request.headers.get("authorization") ?? "";
  const cookie = request.headers.get("cookie") ?? "";
  const body = await request.text();

  try {
    const res = await fetch(buildBackendUrl("/api/v1/posts"), {
      method: "POST",
      headers: {
        "content-type": request.headers.get("content-type") ?? "application/json",
        ...(auth ? { authorization: auth } : {}),
        ...(cookie ? { cookie } : {}),
      },
      body,
    });
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { "content-type": res.headers.get("content-type") ?? "application/json" },
    });
  } catch (err) {
    return Response.json(
      { code: 500, message: "posts_create_failed", data: null, detail: String(err) },
      { status: 502 },
    );
  }
}
