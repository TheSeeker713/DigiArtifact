import { getCloudflareContext } from "@opennextjs/cloudflare";

type D1Statement = {
  all: <T = unknown>() => Promise<{ results: T[] }>;
  run: () => Promise<unknown>;
  bind: (...values: unknown[]) => {
    all: <T = unknown>() => Promise<{ results: T[] }>;
    run: () => Promise<unknown>;
  };
};

type D1DatabaseLike = {
  prepare: (query: string) => D1Statement;
};

export function getDb() {
  const context = getCloudflareContext() as unknown as { env: { DB: D1DatabaseLike } };
  return context.env.DB;
}
