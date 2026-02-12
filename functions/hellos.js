export async function onRequest() {
  return new Response("Hello from the server at " + new Date().toISOString());
}
