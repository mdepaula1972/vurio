import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Alerta em tempo de execução de desenvolvimento
if (process.env.NODE_ENV === "development" && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
  console.warn("[Supabase] Rodando com chaves placeholder de desenvolvimento.");
}

// Cliente público para uso no navegador ou operações públicas de backend
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente administrativo (bypassa RLS) - usado exclusivamente no backend/Route Handlers para operações de gerência/estoque
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    })
  : supabase;
