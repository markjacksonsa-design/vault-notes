/// <reference types="@cloudflare/workers-types" />

// Cloudflare D1 Database binding
interface CloudflareEnv {
  DB: D1Database;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv extends CloudflareEnv {}
  }
  
  // For Cloudflare Workers/Pages runtime
  interface Cloudflare {
    env: CloudflareEnv;
  }
  
  // For direct access in server actions
  var DB: D1Database | undefined;
}

