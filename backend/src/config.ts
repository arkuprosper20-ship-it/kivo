import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT || 5000),
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiBaseUrl: (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, ''),
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
};

export const useSupabase = Boolean(config.supabaseUrl && config.supabaseServiceKey);
export const useLlm = Boolean(config.openaiApiKey);
