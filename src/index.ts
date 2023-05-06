import { checkServerAll } from "./cron";
import { SlackApp, StaticSelectAction } from "slack-cloudflare-workers";
import {
  serverFailureMessageBlock,
  serverSelectMessageBlock,
  serverWorkingMessage,
} from "./message";
import { checkerList } from "./checker";

const ERROR_MESSAGE_INTERVAL = 30 * 60; // 30 minutes

export interface Env {
  SLACK_BOT_API_TOKEN: string;
  SLACK_SIGNING_SECRET: string;

  MAKERS_DOCTOR_GUY: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const slackApp = new SlackApp({
      env: {
        SLACK_BOT_TOKEN: env.SLACK_BOT_API_TOKEN,
        SLACK_SIGNING_SECRET: env.SLACK_SIGNING_SECRET,
      },
    });

    slackApp
      .command(/.+/, async () => {
        return {
          text: "",
          blocks: serverSelectMessageBlock(),
        };
      })
      .action(
        "check_server",
        async () => {},
        async ({ payload, context }) => {
          const action = payload.actions.find(
            (action): action is StaticSelectAction =>
              action.type === "static_select"
          );

          if (!action || !context.respond) {
            return;
          }

          const name = decodeURIComponent(action.selected_option.value);
          const entry = checkerList.find((entry) => entry.name === name);
          if (entry) {
            if (await entry.checker(entry.url)) {
              await context.respond({
                ...serverWorkingMessage(
                  entry.name,
                  entry.url,
                  `(호출자: <@${payload.user.id}>)`
                ),
                response_type: "in_channel",
                replace_original: false,
                delete_original: true,
              });
            } else {
              await context.respond({
                ...serverFailureMessageBlock(
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

    return await slackApp.run(request, ctx);
  },
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    const slackApp = new SlackApp({
      env: {
        SLACK_BOT_TOKEN: env.SLACK_BOT_API_TOKEN,
        SLACK_SIGNING_SECRET: env.SLACK_SIGNING_SECRET,
      },
    });

    await checkServerAll(
      slackApp.client,
      env.MAKERS_DOCTOR_GUY,
      ERROR_MESSAGE_INTERVAL
    );
  },
};
