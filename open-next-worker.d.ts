/**
 * Type declarations for OpenNext generated worker
 * This file provides types for .open-next/worker.js which only exists after build.
 */
declare module "*.open-next/worker.js" {
  const handler: {
    fetch: ExportedHandlerFetchHandler<CloudflareEnv>;
  };
  export default handler;
  export class DOShardedTagCache implements DurableObject {
    constructor(state: DurableObjectState, env: CloudflareEnv);
    fetch(request: Request): Promise<Response>;
  }
}
