
import { createClient } from '@supabase/supabase-js';

// 브라우저/Vite/Node 환경 어디서든 안전하게 환경 변수를 가져오는 헬퍼
const getSafeEnv = (key: string): string => {
  try {
    // 1. Vite 환경 (import.meta.env)
    const viteEnv = (import.meta as any).env?.[key];
    if (viteEnv) return viteEnv;
    
    // 2. Node/Webpack 환경 (process.env)
    const processEnv = typeof process !== 'undefined' ? process.env[key] : undefined;
    if (processEnv) return processEnv;

    // 3. 글로벌 윈도우 환경
    return (window as any)._env_?.[key] || '';
  } catch {
    return '';
  }
};

const supabaseUrl = getSafeEnv('SUPABASE_URL') || 'https://vslxjfstoctokpdevjgn.supabase.co';
const supabaseAnonKey = getSafeEnv('SUPABASE_ANON_KEY') || 'sb_publishable_DrfX9aZcYf8lZzCycwnTCQ_UODvit_p';

export const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.includes('supabase.co')
);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      db: { schema: 'public' }
    }) 
  : null;
