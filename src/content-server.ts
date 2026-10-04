import * as z from 'zod';

import type { ContentManager } from './content-manager';
import type { DownloadManager } from './download-manager';
import type { StreamingProvider } from './streaming-provider';
import type { PartialShape } from './utilities/zod';

export const contentServerConfigurationSchema = z.object({
  downloadMissingContent: z.boolean().default(false),
});

type Configuration = PartialShape<typeof contentServerConfigurationSchema.shape>;

type CreateContentServerOptions = { configuration: Configuration } & (
  | { configuration: { downloadMissingContent: boolean }; downloadManager: DownloadManager }
  | { configuration: { downloadMissingContent: false }; downloadManager?: DownloadManager }
) &
  (
    | { contentManager: ContentManager; streamingProvider?: StreamingProvider }
    | { contentManager?: ContentManager; streamingProvider: StreamingProvider }
  );

export const createContentServer = ({
  configuration,
  downloadManager,
  contentManager,
  streamingProvider,
}: CreateContentServerOptions) => {
  const config = contentServerConfigurationSchema.parse(configuration);

  const findContent = async (contentId: string) => {
    const content = await contentManager?.getContent(contentId);

    if (content) {
      return { fileName: content.fileName };
    }

    if (config.downloadMissingContent) {
      downloadManager?.addToDownloadQueue(contentId, { addToFrontOfQueue: true });
    }

    const streamingUrl = await streamingProvider?.getStreamingUrl(contentId);

    if (streamingUrl) {
      return { redirectUrl: streamingUrl };
    }

    return undefined;
  };

  return { findContent };
};

export type ContentServer = Awaited<ReturnType<typeof createContentServer>>;
