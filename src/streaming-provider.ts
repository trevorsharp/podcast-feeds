import * as z from 'zod';

import { withCache } from './utilities/cache';

export const streamingProviderConfigurationSchema = z.object({
  cacheStreamingUrlTimeToLive: z.number().default(0),
});

export type StreamingProviderConfiguration = z.infer<typeof streamingProviderConfigurationSchema>;

export type BaseStreamingOptions = object | undefined;

export const createStreamingProvider = <TStreamingOptions extends BaseStreamingOptions = BaseStreamingOptions>(
  configuration: unknown,
  fetchStreamingUrl: (contentId: string, options?: TStreamingOptions) => Promise<string>,
) => {
  const config = streamingProviderConfigurationSchema.parse(configuration);

  const getStreamingUrl = withCache(
    {
      cacheKey: 'streaming-url',
      timeToLive: config.cacheStreamingUrlTimeToLive,
    },
    fetchStreamingUrl,
  );

  return { getStreamingUrl };
};

export type StreamingProvider<TStreamingOptions extends BaseStreamingOptions = BaseStreamingOptions> = ReturnType<
  typeof createStreamingProvider<TStreamingOptions>
>;
