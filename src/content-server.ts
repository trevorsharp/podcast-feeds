import * as z from 'zod';

import type { DownloadManager } from './download-manager';
import type { StreamingProvider } from './streaming-provider';
import { folderExists } from './utilities/folders';

export const contentServerConfigurationSchema = z.object({
  contentFolder: z.string().endsWith('/').optional(),
  downloadMissingContent: z.boolean().default(false),
  getContentFileName: z.function({ input: [z.string()], output: z.string() }).default((value) => value),
});

export type ContentServerConfiguration = z.infer<typeof contentServerConfigurationSchema>;

export const createContentServer = async ({
  configuration,
  streamingProvier,
  downloadManager,
}: {
  configuration?: Partial<ContentServerConfiguration> | undefined;
  streamingProvier?: StreamingProvider;
  downloadManager?: DownloadManager;
}) => {
  const config = contentServerConfigurationSchema.parse(configuration ?? {});

  if (config.contentFolder && !folderExists(config.contentFolder)) {
    throw new Error(`Content folder (${config.contentFolder}) does not exist`);
  }

  const getContent = async (contentId: string) => {
    if (config.contentFolder) {
      const contentFileName = config.getContentFileName(contentId);
      const contentFilePath = `${config.contentFolder}${contentFileName}`;
      const contentFile = Bun.file(contentFilePath);

      if (await contentFile.exists()) {
        return { fileName: contentFileName };
      }

      if (config.downloadMissingContent) {
        downloadManager?.addToDownloadQueue(contentId, { addToFrontOfQueue: true });
      }
    }

    const streamingUrl = await streamingProvier?.getStreamingUrl(contentId);

    if (streamingUrl) {
      return { redirectUrl: streamingUrl };
    }

    return undefined;
  };

  return { getContent };
};

export type ContentServer = Awaited<ReturnType<typeof createContentServer>>;
