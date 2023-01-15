import { Router } from "itty-router";
import qs from "qs";
import { CheckerEntry, checkerList } from "./checker";
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

const ERROR_MESSAGE_INTERVAL = 30 * 60; // 30 minutes

export interface Env {
  SLACK_BOT_API_TOKEN: string;

  MAKERS_DOCTOR_GUY: KVNamespace;
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
                blocks: serverWorkingMessageBlock(
                  entry.name,
                  entry.url,
                  `(호출자: <@${payload.user.id}>)`
                ),
                response_type: "in_channel",
                replace_original: false,
                delete_original: true,
              });
            } else {
              await sendToResponseURL(response_url, {
                text: "",
                blocks: serverFailureMessageBlock(
                  entry.name,
                  entry.url,
                  `(호출자: <@${payload.user.id}>)`
                ),
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

    await checkServerAll(slackClient, env.MAKERS_DOCTOR_GUY);
  },
};

async function checkServerAll(slackClient: SlackClient, store: KVNamespace) {
  const checkOne = async ({
    name,
    url,
    channel,
    mentions,
    checker,
  }: CheckerEntry) => {
    const isAlive = await checker(url);
    if (isAlive) {
      return;
    }

    const isRecentFailed = await store.get(`server:recentFail:${url}`, "text");
    if (!isRecentFailed) {
      const blocks = serverFailureMessageBlock(name, url, mentions);
      await slackClient.postSlackMessage(blocks, channel);

      await store.put(`server:recentFail:${url}`, new Date().toISOString(), {
        expirationTtl: ERROR_MESSAGE_INTERVAL,
      });
    }
  };

  return await Promise.allSettled(
    checkerList.map(async (checker) => await checkOne(checker))
  );
}
