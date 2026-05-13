/**
 * Supabase OAuth 回调 — 商家端
 *
 * 与用户端 ep 同构。同步 access_token 到 localStorage（兼容商家端 auth-client）+ cookie + 跳转。
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET(req: NextRequest, ctx: { params: Promise<{ locale: string }> }) {
  const { locale } = await ctx.params;
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') || `/${locale}/merchant/dashboard`;
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');

  if (error) {
    const back = new URL(`/${locale}/merchant/login`, url.origin);
    back.searchParams.set('error', errorDescription || error);
    return NextResponse.redirect(back);
  }

  if (!code) {
    return NextResponse.redirect(new URL(`/${locale}/merchant/login?error=missing_code`, url.origin));
  }

  const supabase = await createServerSupabase();
  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError || !data?.session) {
    const back = new URL(`/${locale}/merchant/login`, url.origin);
    back.searchParams.set('error', exchangeError?.message || 'oauth_exchange_failed');
    return NextResponse.redirect(back);
  }

  const access = data.session.access_token || '';
  const refresh = data.session.refresh_token || '';
  const expiresIn = data.session.expires_in || 3600;

  const html = `<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="utf-8"><title>登录中…</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#f5f5f3;color:#1a1a1a;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-size:14px;color:#666}</style>
</head>
<body>
<p>正在完成登录…</p>
<script>
(function () {
  try {
    var access = ${JSON.stringify(access)};
    var refresh = ${JSON.stringify(refresh)};
    var expMs = Date.now() + (${expiresIn} * 1000);
    if (access) {
      localStorage.setItem('expath_merchant.auth.token', JSON.stringify(access));
      if (refresh) localStorage.setItem('expath_merchant.auth.refresh_token', JSON.stringify(refresh));
      localStorage.setItem('expath_merchant.auth.token_expiry', String(expMs));
      document.cookie = 'expath_merchant_auth_token=' + encodeURIComponent(access) + '; Path=/; Max-Age=604800; SameSite=Lax';
    }
  } catch (e) {}
  window.location.replace(${JSON.stringify(next)});
})();
</script>
</body></html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
