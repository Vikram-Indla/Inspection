import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { extname, normalize, resolve, sep } from "node:path";

const CONTENT_TYPES: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

export interface PrototypeServer {
  origin: string;
  close(): Promise<void>;
}

export async function startPrototypeServer(root: string): Promise<PrototypeServer> {
  const canonicalRoot = resolve(root);
  let server: Server;
  server = createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
    const candidate = resolve(canonicalRoot, `.${normalize(pathname)}`);
    if (candidate !== canonicalRoot && !candidate.startsWith(`${canonicalRoot}${sep}`)) {
      response.writeHead(403).end("Forbidden");
      return;
    }
    if (!existsSync(candidate) || !statSync(candidate).isFile()) {
      response.writeHead(404).end("Not found");
      return;
    }
    response.writeHead(200, {
      "content-type": CONTENT_TYPES[extname(candidate)] ?? "application/octet-stream",
      "cache-control": "no-store",
    });
    createReadStream(candidate).pipe(response);
  });
  await new Promise<void>((resolvePromise, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolvePromise());
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Prototype server did not bind TCP");
  return {
    origin: `http://127.0.0.1:${address.port}`,
    close: () => new Promise<void>((resolvePromise, reject) => {
      server.close(error => error ? reject(error) : resolvePromise());
    }),
  };
}
