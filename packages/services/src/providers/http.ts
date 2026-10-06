type ThrottleOptions = {
  /** Smallest gap between two request starts, in milliseconds. */
  minIntervalMs: number;
  /** Most requests in flight at once. */
  maxConcurrent: number;
};

type ProviderFetchOptions = {
  throttle: Throttle;
  /** How the source is named in error messages: descriptive, never the vendor. */
  label: string;
  /** How many times a 429 or a 5xx is retried before giving up. */
  retries?: number;
};

export type Throttle = {
  run: <T>(task: () => Promise<T>) => Promise<T>;
};

/** A provider answered with something other than success. */
export class ProviderError extends Error {
  readonly status: number;

  constructor(label: string, status: number, detail: string) {
    super(`${label} answered ${status}${detail ? `: ${detail}` : ""}`);
    this.name = "ProviderError";
    this.status = status;
  }
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * A per-provider gate: requests start at least `minIntervalMs` apart and no
 * more than `maxConcurrent` are open at once. In-process, which is right for
 * the admin app's imports and the cron job, both of which run in one
 * function at a time; a shared limiter is only needed once several
 * instances sync at the same time.
 */
export const createThrottle = ({
  minIntervalMs,
  maxConcurrent,
}: ThrottleOptions): Throttle => {
  let nextStart = 0;
  let active = 0;
  const waiting: (() => void)[] = [];

  const acquire = async () => {
    if (active >= maxConcurrent) {
      await new Promise<void>((resolve) => {
        waiting.push(resolve);
      });
    }
    active += 1;
    const now = Date.now();
    const startAt = Math.max(now, nextStart);
    nextStart = startAt + minIntervalMs;
    if (startAt > now) {
      await sleep(startAt - now);
    }
  };

  const release = () => {
    active -= 1;
    const next = waiting.shift();
    if (next) {
      next();
    }
  };

  return {
    run: async (task) => {
      await acquire();
      try {
        return await task();
      } finally {
        release();
      }
    },
  };
};

/** Seconds from a Retry-After header, or a fallback that grows per attempt. */
const retryDelayMs = (response: Response, attempt: number): number => {
  const header = Number(response.headers.get("retry-after"));
  if (Number.isFinite(header) && header > 0) {
    return Math.min(header, 30) * 1000;
  }
  return 500 * 2 ** attempt;
};

/**
 * fetch through the provider's throttle, retrying a 429 (after the delay the
 * provider asks for) and a 5xx (with backoff). Anything else that is not a
 * success becomes a ProviderError naming the provider and the status, so an
 * import screen can say which source failed and why.
 */
export const providerFetch = async (
  url: string,
  init: RequestInit,
  { throttle, label, retries = 3 }: ProviderFetchOptions,
): Promise<unknown> => {
  for (let attempt = 0; ; attempt += 1) {
    const response = await throttle.run(() =>
      fetch(url, init),
    );
    if (response.ok) {
      return response.json();
    }
    const retryable = response.status === 429 || response.status >= 500;
    if (retryable && attempt < retries) {
      await sleep(retryDelayMs(response, attempt));
      continue;
    }
    const detail = (await response.text().catch(() => "")).slice(0, 200);
    throw new ProviderError(label, response.status, detail);
  }
};

/** A required environment variable, or a clear error naming it. */
export const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};
