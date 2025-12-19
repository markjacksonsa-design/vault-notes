// D1 Database binding export
// This will be available via Cloudflare's runtime environment

export function getDB(): D1Database {
  // In Cloudflare Pages/Workers runtime, DB is available via env.DB
  // This function will be called from server actions that have access to the env context
  if (typeof process !== 'undefined' && process.env.DB) {
    return process.env.DB as D1Database;
  }
  
  // For Cloudflare Pages, the binding is passed through the request context
  // This is a placeholder - actual implementation depends on your Cloudflare adapter
  throw new Error('D1 database binding not available. Ensure you are running in Cloudflare runtime.');
}

