import * as z from 'zod';

export const downloadManagerConfigurationSchema = z.object({
  maxConcurrentDownloads: z.number().min(1).default(1),
});

export type DownloadManagerConfiguration = z.infer<typeof downloadManagerConfigurationSchema>;

export const createDownloadManager = ({
  configuration,
  downloadContent,
}: {
  configuration?: Partial<DownloadManagerConfiguration> | undefined;
  downloadContent: (contentId: string) => Promise<void>;
}) => {
  const config = downloadManagerConfigurationSchema.parse(configuration ?? {});

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

  const addToDownloadQueue = (contentId: string, options?: { addToFrontOfQueue?: boolean }) => {
    const downloadTask = () => downloadContent(contentId);

    if (options?.addToFrontOfQueue) {
      queue.unshift(downloadTask);
    } else {
      queue.push(downloadTask);
    }

    startNextDownload();
  };

  return { addToDownloadQueue };
};

export type DownloadManager = ReturnType<typeof createDownloadManager>;
