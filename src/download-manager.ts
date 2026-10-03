import * as z from 'zod';

export const downloadManagerConfigurationSchema = z.object({
  maxConcurrentDownloads: z.number().min(1).default(1),
});

export type DownloadManagerConfiguration = z.infer<typeof downloadManagerConfigurationSchema>;

export type DownloadManager<TDownloadOptions> = {
  addToDownloadQueue: (id: string, options?: { addToFrontOfQueue?: boolean } & TDownloadOptions) => void;
};

type DownloadContent<TDownloadOptions> = (id: string, options?: TDownloadOptions) => Promise<void>;

type CreateDownloadManager = <TDownloadOptions>(
  config: DownloadManagerConfiguration,
  downloadContent: DownloadContent<TDownloadOptions>,
) => DownloadManager<TDownloadOptions>;

export const createDownloadManager: CreateDownloadManager = (config, downloadContent) => {
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

  return {
    addToDownloadQueue: (id, options) => {
      const downloadTask = () => downloadContent(id, options);

      if (options?.addToFrontOfQueue) {
        queue.unshift(downloadTask);
      } else {
        queue.push(downloadTask);
      }

      startNextDownload();
    },
  };
};
