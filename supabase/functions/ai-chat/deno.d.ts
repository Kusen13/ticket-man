// Global type declarations for Supabase Edge Functions (Deno)

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

declare function serve(handler: (req: Request) => Promise<Response> | Response): void;

declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(handler: (req: Request) => Promise<Response> | Response): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2" {
  export function createClient(supabaseUrl: string, supabaseKey: string): any;
}
