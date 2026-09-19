import { buildApp } from './app';
import { config, useLlm, useSupabase } from './config';
import { getStore } from './services/store/getStore';

const app = buildApp();
// Touch the store so the seed log prints once at boot
getStore();

// eslint-disable-next-line no-console
console.log(`[kivo] ai: ${useLlm ? 'llm' : 'deterministic-fallback'} | db: ${useSupabase ? 'supabase' : 'memory'}`);

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`[kivo] backend listening on http://localhost:${config.port}`);
});
