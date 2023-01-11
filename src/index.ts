import { Router } from "itty-router";
import qs from "qs";
import { checkerList } from "./checker";
import {
  serverFailureMessageBlock,
  serverWorkingMessageBlock,
} from "./message";
import { createSlackClient, replyResponse, SlackClient } from "./slack";

/**
 * Welcome to Cloudflare Workers! This is your first scheduled worker.
 *
 * - Run `wrangler dev --local` in your terminal to start a development server
 * - Run `curl "http://localhost:8787/cdn-cgi/mf/scheduled"` to trigger the scheduled event
 * - Go back to the console to see what your worker has logged
 * - Update the Cron trigger in wrangler.toml (see https://developers.cloudflare.com/workers/wrangler/configuration/#triggers)
 * - Run `wrangler publish --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/runtime-apis/scheduled-event/
 */

export interface Env {
  SLACK_BOT_API_TOKEN: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const router = Router();

    router.post("/command", async () => {
      const body = await request.text();
      const params = qs.parse(body);
      const cmd = (params.text ?? "prod").toString().trim();

      return replyResponse({
        blocks: [],
        target: "sender",
      });
    });

    router.post("/action", async () => {});

    router.all("*", () => new Response("Not Found", { status: 404 }));

    return router.handle(request);
  },
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    const slackClient = createSlackClient(env.SLACK_BOT_API_TOKEN);

    await checkServerAll(slackClient, "ignoreSuccess");
  },
};

async function checkServerAll(
  slackClient: SlackClient,
  mode: "all" | "ignoreSuccess" = "ignoreSuccess"
) {
  return await Promise.allSettled(
    checkerList.map(async ({ name, url, channel, mentions, checker }) => {
      const isAlive = await checker(url);
      if (isAlive) {
        if (mode === "all") {
          const blocks = serverWorkingMessageBlock(name, url);
          await slackClient.postSlackMessage(blocks, channel);
        }
        return;
      }

      const blocks = serverFailureMessageBlock(name, url, mentions);
      slackClient.postSlackMessage(blocks, channel);
    })
  );
}
