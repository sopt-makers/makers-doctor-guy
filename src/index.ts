import { Router } from "itty-router";
import qs from "qs";
import { handleCommand, handleInteractiveMessage } from "./bot";
import { checkServerAll } from "./cron";
import { createSlackClient } from "./slack";

const ERROR_MESSAGE_INTERVAL = 30 * 60; // 30 minutes

export interface Env {
  SLACK_BOT_API_TOKEN: string;

  MAKERS_DOCTOR_GUY: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const router = Router();

    router.post("/command", async () => {
      return handleCommand();
    });

    router.post("/action", async () => {
      const body = await request.text();
      const params = qs.parse(body);
      if (typeof params.payload !== "string") {
        console.log("Invalid payload detedted.", params);
        return new Response(null, { status: 400 });
      }

      return await handleInteractiveMessage(params.payload);
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

    await checkServerAll(
      slackClient,
      env.MAKERS_DOCTOR_GUY,
      ERROR_MESSAGE_INTERVAL
    );
  },
};
