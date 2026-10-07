import NodeCache from 'node-cache';

export const withCache =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  <TFunc extends (...args: any[]) => Promise<any>>(
    { cacheKey, timeToLive }: { cacheKey: string | ((...args: Parameters<TFunc>) => string); timeToLive: number },
    func: TFunc,
  ) => {
    const cache = timeToLive > 0 ? new NodeCache({ checkperiod: 120 }) : undefined;

    return async (...args: Parameters<TFunc>): Promise<Awaited<ReturnType<TFunc>>> => {
      if (!cache) {
        return func(...args);
      }

      const fullCacheKey = typeof cacheKey === 'string' ? cacheKey : cacheKey(...args);

      const cacheResult = cache.get<Awaited<ReturnType<TFunc>>>(fullCacheKey);

      if (cacheResult !== undefined) {
        return cacheResult;
      }

      const result = await func(...args);

      if (result !== undefined) {
        cache.set(fullCacheKey, result, timeToLive);
      }

      return result;
    };
  };
