/**
 * Races a promise against a timer. Anything on the request path that talks to
 * Supabase goes through this, so an unreachable or deleted project costs at
 * most `ms` instead of hanging until the platform kills the invocation (which
 * is how a dead database once turned every page into a 504).
 */
export async function withTimeout<T>(
  promise: PromiseLike<T>,
  ms: number,
  label = "operation",
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms,
    );
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}
