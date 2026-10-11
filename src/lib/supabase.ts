import { createClient } from '@supabase/supabase-js';

const meta = import.meta as unknown as { env?: Record<string, string> };
const supabaseUrl = meta.env?.VITE_SUPABASE_URL || 'https://ztrienftcizoqaqprvzf.supabase.co';
const supabaseAnonKey = meta.env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_V5GQ8YMzerUK3UzJ81m_Lw_MlSmCEBx';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
