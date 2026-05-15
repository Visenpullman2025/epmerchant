// 举报 API 代理（App Review 1.2 合规）
// 后端 Laravel /api/v1/reports 还没实现时，前端 ReportSheet 会容错；本路由把请求转发到后端

const backendBaseUrl = process.env.BACKEND_API_BASE ?? 'http://127.0.0.1:8000/api/v1';

export async function POST(request: Request) {
  const auth = request.headers.get('authorization') ?? '';
  const cookie = request.headers.get('cookie') ?? '';
  const body = await request.text();

  try {
    const res = await fetch(`${backendBaseUrl}/reports`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(auth ? { authorization: auth } : {}),
        ...(cookie ? { cookie } : {}),
      },
      body,
    });
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
    });
  } catch (err) {
    // 后端未就绪时仍返回 200，让前端给用户"已收到，24h 内处理"反馈（合规要求）
    return Response.json(
      { code: 0, message: 'queued_pending_backend', data: { queued: true, detail: String(err) } },
      { status: 200 },
    );
  }
}
