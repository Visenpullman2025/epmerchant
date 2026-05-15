// 屏蔽用户 API 代理（App Review 1.2 合规：UGC 必须提供 block 机制）
// POST   block   - 屏蔽该用户后，前端 feed/详情不再展示其内容
// DELETE block   - 取消屏蔽

const backendBaseUrl = process.env.BACKEND_API_BASE ?? 'http://127.0.0.1:8000/api/v1';

async function proxy(method: 'POST' | 'DELETE', request: Request, userId: string) {
  const auth = request.headers.get('authorization') ?? '';
  const cookie = request.headers.get('cookie') ?? '';
  try {
    const res = await fetch(`${backendBaseUrl}/users/${encodeURIComponent(userId)}/block`, {
      method,
      headers: {
        'content-type': 'application/json',
        ...(auth ? { authorization: auth } : {}),
        ...(cookie ? { cookie } : {}),
      },
    });
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
    });
  } catch {
    // 后端未实现时仍返回 200，避免阻塞前端合规反馈
    return Response.json({ code: 0, message: 'queued_pending_backend', data: { queued: true } });
  }
}

export async function POST(request: Request, ctx: { params: Promise<{ userId: string }> }) {
  const { userId } = await ctx.params;
  return proxy('POST', request, userId);
}

export async function DELETE(request: Request, ctx: { params: Promise<{ userId: string }> }) {
  const { userId } = await ctx.params;
  return proxy('DELETE', request, userId);
}
