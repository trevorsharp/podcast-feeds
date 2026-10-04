import * as z from 'zod';

import type { BaseDownloadOptions, DownloadManager } from './download-manager';
import type { BaseStreamingOptions, StreamingProvider } from './streaming-provider';
import { folderExists } from './utilities/folders';

export const contentServerConfigurationSchema = z.object({
  contentFolder: z.string().endsWith('/').optional(),
  downloadMissingContent: z.boolean().default(false),
});

export type ContentServerConfiguration = z.infer<typeof contentServerConfigurationSchema>;

export type BaseContentOptions = { baseUrl: string };

export type ContentFileExtension = '.mp4' | '.m3u8' | '.mp3';

export const createContentServer = async <
  TContentOptions extends BaseContentOptions = BaseContentOptions,
  TStreamingOptions extends BaseStreamingOptions = BaseStreamingOptions,
  TDownloadOptions extends BaseDownloadOptions = BaseDownloadOptions,
>(
  config: ContentServerConfiguration,
  getContentFileExtension?: (contentId: string, options?: TContentOptions) => string,
  streamingProvier?: StreamingProvider<TStreamingOptions>,
  mapContentOptionsToStreamingOptions?: (contentOptions: TContentOptions) => TStreamingOptions,
  downloadManager?: DownloadManager<TDownloadOptions>,
  mapContentOptionsToDownloadOptions?: (contentOptions: TContentOptions) => TDownloadOptions,
) => {
  if (config.contentFolder && !folderExists(config.contentFolder)) {
    throw new Error(`Content folder (${config.contentFolder}) does not exist`);
  }

  const getContent = async (contentId: string, options: TContentOptions) => {
    if (config.contentFolder) {
      const contentFileExtension = getContentFileExtension?.(contentId, options);
      const contentFile = Bun.file(`${config.contentFolder}${contentId}${contentFileExtension}`);

      if (await contentFile.exists()) {
        return contentFile;
      }

      if (config.downloadMissingContent) {
        const downloadOptions = mapContentOptionsToDownloadOptions?.(options);
        downloadManager?.addToDownloadQueue(contentId, downloadOptions);
      }
    }

    const streamingOptions = mapContentOptionsToStreamingOptions?.(options) ?? undefined;
    return await streamingProvier?.getStreamingUrl(contentId, streamingOptions);
  };

  return { getContent };
};

export type ContentServer<
  TContentOptions extends BaseContentOptions = BaseContentOptions,
  TStreamingOptions extends BaseStreamingOptions = BaseStreamingOptions,
  TDownloadOptions extends BaseDownloadOptions = BaseDownloadOptions,
> = Awaited<ReturnType<typeof createContentServer<TContentOptions, TStreamingOptions, TDownloadOptions>>>;
