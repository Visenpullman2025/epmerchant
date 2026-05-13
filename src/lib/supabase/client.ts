/**
 * Supabase browser client (singleton) — 商家端
 *
 * 用法（client components / hooks）：
 *   import { supabase } from '@/lib/supabase/client'
 *
 * 服务端 / Server Components 用 server.ts。
 */
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createBrowserClient(supabaseUrl, supabaseAnon);
