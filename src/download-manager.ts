import * as z from 'zod';

import type { ContentManager } from './content-manager';
import { addEventListener } from './events';
import type { ConfigurationFrom } from './utilities/zod';

export const downloadManagerConfigurationSchema = z.object({
  maxConcurrentDownloads: z.number().min(1).default(1),
  downloadLatestNumberOfItems: z.number().min(1).default(1),
  downloadMissingContent: z.boolean().default(true),
});

type CreateDownloadManagerOptions = ConfigurationFrom<typeof downloadManagerConfigurationSchema.shape> & {
  contentManager: ContentManager;
  downloadContent: (contentId: string, contentManager: ContentManager) => Promise<void>;
};

export const createDownloadManager = ({
  configuration,
  contentManager,
  downloadContent,
}: CreateDownloadManagerOptions) => {
  const config = downloadManagerConfigurationSchema.parse(configuration ?? {});

  const activeDownloads = new Set<string>();
  const queue = new Array<string>();

  const startNextDownload = () => {
    while (queue.length > 0) {
      if (activeDownloads.size >= config.maxConcurrentDownloads) {
        return;
      }

      const contentId = queue.shift();

      if (contentId === undefined) {
        return;
      }

      activeDownloads.add(contentId);

      downloadContent(contentId, contentManager).finally(() => {
        activeDownloads.delete(contentId);

        if (queue.length > 0) {
          startNextDownload();
        }
      });
    }
  };

  const addToDownloadQueue = (contentId: string, options?: { addToFrontOfQueue?: boolean }) =>
    contentManager.getContent(contentId).then((content) => {
      if (!!content || queue.includes(contentId) || activeDownloads.has(contentId)) {
        return;
      }

      if (options?.addToFrontOfQueue) {
        queue.unshift(contentId);
      } else {
        queue.push(contentId);
      }

      startNextDownload();
    });

  if (config.downloadLatestNumberOfItems) {
    addEventListener('feed-data-with-content-loaded', ({ content }) =>
      content
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .filter((_, index) => index < config.downloadLatestNumberOfItems)
        .forEach(({ contentId }) => addToDownloadQueue(contentId)),
    );
  }

  if (config.downloadMissingContent) {
    addEventListener('content-missing', ({ contentId }) => addToDownloadQueue(contentId, { addToFrontOfQueue: true }));
  }

  return { addToDownloadQueue };
};

export type DownloadManager = ReturnType<typeof createDownloadManager>;
