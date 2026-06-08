import { createClient } from "@supabase/supabase-js";

function create() {
  const url = import.meta.env.VITE_SUPABASE_URL as string;
  // Suporte ao naming padrão (ANON_KEY) e ao naming do Lovable (PUBLISHABLE_KEY)
  const key = (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) as string;
  return createClient(url, key);
}

let _client: ReturnType<typeof create> | undefined;

// Proxy lazy para evitar crash no SSR quando as env vars ainda não estão disponíveis
export const supabase = new Proxy({} as ReturnType<typeof create>, {
  get(_, prop, receiver) {
    if (!_client) _client = create();
    return Reflect.get(_client, prop, receiver);
  },
});
