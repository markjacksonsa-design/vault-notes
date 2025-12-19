// Cloudflare D1 Database binding
interface Env {
  DB: D1Database;
}

declare global {
  interface Cloudflare {
    env: Env;
  }
}

