import * as z from 'zod';

export const downloadManagerConfigurationSchema = z.object({
  maxConcurrentDownloads: z.number().min(1).default(1),
});

export type DownloadManagerConfiguration = z.infer<typeof downloadManagerConfigurationSchema>;

export type DownloadManager = {
  addToDownloadQueue: (id: string, options?: { addToFrontOfQueue?: boolean }) => void;
};

export const createDownloadManager = (
  config: DownloadManagerConfiguration,
  downloadContent: (id: string) => Promise<void>,
): DownloadManager => {
  let currentDownloadCount = 0;
  const queue = new Array<string>();

  const startNextDownload = () => {
    while (queue.length > 0) {
      if (currentDownloadCount >= config.maxConcurrentDownloads) {
        return;
      }

      const id = queue.shift();

      if (id === undefined) {
        return;
      }

      currentDownloadCount++;

      downloadContent(id).finally(() => {
        currentDownloadCount--;

        if (queue.length > 0) {
          startNextDownload();
        }
      });
    }
  };

  return {
    addToDownloadQueue: (id, options) => {
      if (options?.addToFrontOfQueue) {
        queue.unshift(id);
      } else {
        queue.push(id);
      }

      startNextDownload();
    },
  };
};
