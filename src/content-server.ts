import z from 'zod';

import type { ContentManager } from './content-manager';
import { sendEvent } from './events';
import type { StreamingProvider } from './streaming-provider';
import type { ConfigurationFrom } from './utilities/zod';

const contentServerConfigurationSchema = z.object({
  getContentServerUrl: z
    .function({ input: [z.object({ fileName: z.string() })], output: z.string() })
    .default((arg0) => `/content/${arg0?.fileName}`),
});

type CreateContentServerOptions = ConfigurationFrom<typeof contentServerConfigurationSchema.shape> &
  (
    | { contentManager: ContentManager; streamingProvider?: StreamingProvider }
    | { contentManager?: ContentManager; streamingProvider: StreamingProvider }
  );

export const createContentServer = ({
  configuration,
  contentManager,
  streamingProvider,
}: CreateContentServerOptions) => {
  const config = contentServerConfigurationSchema.parse(configuration ?? {});

  const getContentUrl = async (contentId: string) => {
    const content = await contentManager?.getContent(contentId);

    if (content) {
      return config.getContentServerUrl(content);
    }

    sendEvent('content-missing', { contentId });

    return await streamingProvider?.getStreamingUrl(contentId);
  };

  return { getContentUrl };
};

export type ContentServer = Awaited<ReturnType<typeof createContentServer>>;
