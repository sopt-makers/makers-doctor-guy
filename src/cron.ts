import { CheckerEntry, checkerList } from "./checker";
import { serverFailureMessageBlock, serverWorkingMessage } from "./message";
import { SlackClient } from "./slack";

export async function checkServerAll(
  slackClient: SlackClient,
  store: KVNamespace,
  minimumInterval: number
) {
  const checkOne = async ({
    name,
    url,
    channel,
    mentions,
    checker,
  }: CheckerEntry) => {
    const isAlive = await retryOnFail(() => checker(url), 2);
    const isRecentFailed = await store.get(`server:recentFail:${url}`, "text");

    if (isAlive && !isRecentFailed) {
      return;
    }
    if (!isAlive && isRecentFailed) {
      return;
    }

    if (isAlive && isRecentFailed) {
      await store.delete(`server:recentFail:${url}`);

      const message = serverWorkingMessage(name, url);
      await slackClient.postSlackMessage(message, channel);

      return;
    }
    if (!isAlive && !isRecentFailed) {
      const message = serverFailureMessageBlock(name, url, mentions);
      await slackClient.postSlackMessage(message, channel);

      await store.put(`server:recentFail:${url}`, new Date().toISOString(), {
        expirationTtl: minimumInterval,
      });
    }
  };

  return await Promise.allSettled(
    checkerList.map(async (checker) => await checkOne(checker))
  );
}

async function retryOnFail(
  fn: () => Promise<boolean>,
  retry: number
): Promise<boolean> {
  if (retry <= 0) {
    return false;
  }

  const result = await fn();
  if (result) {
    return true;
  }
  return retryOnFail(fn, retry - 1);
}
