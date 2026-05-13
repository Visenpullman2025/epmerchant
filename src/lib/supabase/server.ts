/**
 * Supabase server client（Server Components / Route Handlers）— 商家端
 *
 * 用法：
 *   import { createServerSupabase } from '@/lib/supabase/server'
 *   const supabase = await createServerSupabase()
 */
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export async function createServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component 调用 setAll 时忽略；middleware/proxy 负责刷新
        }
      },
    },
  });
}
