import { Router } from "itty-router";
import qs from "qs";
import { checkerList } from "./checker";
import {
  serverFailureMessageBlock,
  serverSelectMessageBlock,
  serverWorkingMessageBlock,
} from "./message";
import {
  createSlackClient,
  createMessageResponse,
  SlackClient,
  sendToResponseURL,
  parseBlockActionPayload,
  handleAction,
} from "./slack";

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

      return createMessageResponse({
        text: "",
        blocks: serverSelectMessageBlock(),
      });
    });

    router.post("/action", async () => {
      const body = await request.text();
      const params = qs.parse(body);
      if (typeof params.payload !== "string") {
        throw new Error("invalid payload");
      }
      const payload = parseBlockActionPayload(params.payload);
      if (!payload) {
        throw new Error("invalid payload");
      }

      const { actions, response_url } = payload;
      await handleAction(
        actions,
        "static_select",
        "check_server",
        async (action) => {
          const name = decodeURIComponent(action.selected_option.value);
          const entry = checkerList.find((entry) => entry.name === name);
          if (entry) {
            if (await entry.checker(entry.url)) {
              await sendToResponseURL(response_url, {
                text: "",
                blocks: serverWorkingMessageBlock(entry.name, entry.url),
                response_type: "in_channel",
                replace_original: false,
                delete_original: true,
              });
            } else {
              await sendToResponseURL(response_url, {
                text: "",
                blocks: serverFailureMessageBlock(entry.name, entry.url),
                response_type: "in_channel",
                replace_original: false,
                delete_original: true,
              });
            }
          }
        }
      );

      return new Response();
    });

    router.all("*", () => new Response("Not Found", { status: 404 }));

    return router.handle(request);
  },
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    const slackClient = createSlackClient(env.SLACK_BOT_API_TOKEN);

    await checkServerAll(slackClient);
  },
};

async function checkServerAll(slackClient: SlackClient) {
  return await Promise.allSettled(
    checkerList.map(async ({ name, url, channel, mentions, checker }) => {
      const isAlive = await checker(url);
      if (isAlive) {
        return;
      }

      const blocks = serverFailureMessageBlock(name, url, mentions);
      await slackClient.postSlackMessage(blocks, channel);
    })
  );
}
