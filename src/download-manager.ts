import * as z from 'zod';

import type { ContentManager } from './content-manager';
import type { PartialShape } from './utilities/zod';

export const downloadManagerConfigurationSchema = z.object({
  maxConcurrentDownloads: z.number().min(1).default(1),
});

type Configuration = PartialShape<typeof downloadManagerConfigurationSchema.shape>;

type CreateDownloadManagerOptions = {
  configuration: Configuration;
  contentManager: ContentManager;
  downloadContent: (contentId: string, contentManager: ContentManager) => Promise<void>;
};

export const createDownloadManager = ({
  configuration,
  contentManager,
  downloadContent,
}: CreateDownloadManagerOptions) => {
  const config = downloadManagerConfigurationSchema.parse(configuration);

  let currentDownloadCount = 0;
  const queue = new Array<() => Promise<void>>();

  const startNextDownload = () => {
    while (queue.length > 0) {
      if (currentDownloadCount >= config.maxConcurrentDownloads) {
        return;
      }

      const downloadTask = queue.shift();

      if (downloadTask === undefined) {
        return;
      }

      currentDownloadCount++;

      downloadTask().finally(() => {
        currentDownloadCount--;

        if (queue.length > 0) {
          startNextDownload();
        }
      });
    }
  };

  const addToDownloadQueue = (contentId: string, options?: { addToFrontOfQueue?: boolean }) =>
    contentManager.getContent(contentId).then((content) => {
      if (content) {
        return;
      }

      const downloadTask = () => downloadContent(contentId, contentManager);

      if (options?.addToFrontOfQueue) {
        queue.unshift(downloadTask);
      } else {
        queue.push(downloadTask);
      }

      startNextDownload();
    });

  return { addToDownloadQueue };
};

export type DownloadManager = ReturnType<typeof createDownloadManager>;
