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

      return replyResponse({
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "*어떤 서버의 상태를 검사할까요?*",
            },
          },
          {
            type: "divider",
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "대상 서버 선택:",
            },
            accessory: {
              type: "static_select",
              action_id: "check_server",
              placeholder: {
                type: "plain_text",
                text: "Select an item",
                emoji: true,
              },
              options: [
                ...checkerList.map(({ name }) => ({
                  text: {
                    type: "plain_text",
                    text: name,
                    emoji: true,
                  } as const,
                  value: encodeURIComponent(name),
                })),
              ],
            },
          },
          {
            type: "divider",
          },
        ],
        target: "sender",
      });
    });

    router.post("/action", async () => {
      const body = await request.text();
      const params = qs.parse(body);
      if (typeof params.payload !== "string") {
        throw new Error("invalid payload");
      }

      const payload = JSON.parse(params.payload);

      const { actions, response_url } = payload;

      if (actions[0]) {
        if (actions[0].action_id === "check_server") {
          const name = decodeURIComponent(actions[0].selected_option.value);

          const entry = checkerList.find((entry) => entry.name === name);
          if (entry) {
            if (await entry.checker(entry.url)) {
              await fetch(response_url, {
                body: JSON.stringify({
                  text: "",
                  blocks: serverWorkingMessageBlock(entry.name, entry.url),
                  response_type: "in_channel",
                  replace_original: false,
                  delete_original: true,
                }),
                headers: {
                  "content-type": "application/json",
                },
                method: "POST",
              });
            } else {
              await fetch(response_url, {
                body: JSON.stringify({
                  text: "",
                  blocks: serverFailureMessageBlock(entry.name, entry.url),
                  response_type: "in_channel",
                  replace_original: false,
                  delete_original: true,
                }),
                headers: {
                  "content-type": "application/json",
                },
                method: "POST",
              });
            }
          }
        }
      }

      return replyResponse({ text: "오류가 발생했습니다.", target: "sender" });
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
