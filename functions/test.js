export async function onRequest(context) {
    // This code runs on the server, not in the browser
    return new Response("Hello from the Cloudflare server!");
  }