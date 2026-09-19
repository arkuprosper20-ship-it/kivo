import { useSupabase } from '../../config';
import type { Store } from './index';
import { MemoryStore } from './memoryStore';
import { SupabaseStore } from './supabaseStore';

let store: Store | null = null;

export function getStore(): Store {
  if (!store) {
    store = useSupabase ? new SupabaseStore() : new MemoryStore();
    // eslint-disable-next-line no-console
    console.log(`[kivo] store: ${store.kind}`);
  }
  return store;
}
