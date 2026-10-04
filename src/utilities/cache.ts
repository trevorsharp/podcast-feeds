import NodeCache from 'node-cache';

const cache = new NodeCache({ checkperiod: 120 });

export const withCache =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  <TFunc extends (...args: any[]) => Promise<any>>(
      { cacheKey, timeToLive }: { cacheKey: string; timeToLive: number },
      func: TFunc,
    ) =>
    async (...args: Parameters<TFunc>): Promise<Awaited<ReturnType<TFunc>>> => {
      const fullCacheKey = `${cacheKey}${args.length > 0 ? '-' : ''}${args.join('-')}`;

      const cacheResult = cache.get<Awaited<ReturnType<TFunc>>>(fullCacheKey);

      if (cacheResult) {
        return cacheResult;
      }

      const result = await func(...args);

      if (result && timeToLive > 0) {
        cache.set(fullCacheKey, result, timeToLive);
      }

      return result;
    };
