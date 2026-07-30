interface Fetcher {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(column?: string): Promise<T | null>;
  run<T = Record<string, unknown>>(): Promise<T>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  raw<T = unknown[]>(): Promise<T[]>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<T[]>;
  exec(query: string): Promise<unknown>;
  dump(): Promise<ArrayBuffer>;
}

interface R2ObjectBody {
  body: ReadableStream;
  httpEtag: string;
  size: number;
  httpMetadata?: {
    contentType?: string;
    cacheControl?: string;
  };
}

interface R2Bucket {
  put(
    key: string,
    value: ReadableStream | ArrayBuffer | Blob,
    options?: {
      httpMetadata?: {
        contentType?: string;
        cacheControl?: string;
      };
      customMetadata?: Record<string, string>;
    },
  ): Promise<unknown>;
  get(key: string): Promise<R2ObjectBody | null>;
  delete(key: string): Promise<void>;
}

declare module "cloudflare:workers" {
  export const env: {
    DB?: D1Database;
    BD_ASSETS?: R2Bucket;
  };
}
