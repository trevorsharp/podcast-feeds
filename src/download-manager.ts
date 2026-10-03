import * as z from 'zod';

export const downloadManagerConfigurationSchema = z.object({
  maxConcurrentDownloads: z.number().min(1).default(1),
});

export type DownloadManagerConfiguration = z.infer<typeof downloadManagerConfigurationSchema>;

export const createDownloadManager = <TDownloadOptions>(
  config: DownloadManagerConfiguration,
  downloadContent: (id: string, options?: TDownloadOptions) => Promise<void>,
) => {
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

  const addToDownloadQueue = (id: string, options?: { addToFrontOfQueue?: boolean } & TDownloadOptions) => {
    const downloadTask = () => downloadContent(id, options);

    if (options?.addToFrontOfQueue) {
      queue.unshift(downloadTask);
    } else {
      queue.push(downloadTask);
    }

    startNextDownload();
  };

  return { addToDownloadQueue };
};

export type DownloadManager<TDownloadOptions> = ReturnType<typeof createDownloadManager<TDownloadOptions>>;
