import * as z from 'zod';

export const downloadManagerConfigurationSchema = z.object({
  maxConcurrentDownloads: z.number().min(1).default(1),
});

export type DownloadManagerConfiguration = z.infer<typeof downloadManagerConfigurationSchema>;

export type BaseDownloadOptions = { addToFrontOfQueue?: boolean } | undefined;

export const createDownloadManager = <TDownloadOptions extends BaseDownloadOptions = BaseDownloadOptions>(
  configuration: unknown,
  downloadContent: (contentId: string, options?: TDownloadOptions) => Promise<void>,
) => {
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

  const addToDownloadQueue = (contentId: string, options?: TDownloadOptions) => {
    const downloadTask = () => downloadContent(contentId, options);

    if (options?.addToFrontOfQueue) {
      queue.unshift(downloadTask);
    } else {
      queue.push(downloadTask);
    }

    startNextDownload();
  };

  return { addToDownloadQueue };
};

export type DownloadManager<TDownloadOptions extends BaseDownloadOptions = BaseDownloadOptions> = ReturnType<
  typeof createDownloadManager<TDownloadOptions>
>;
