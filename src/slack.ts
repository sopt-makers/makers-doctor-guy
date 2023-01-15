import type { KnownBlock } from "@slack/types";
import { Action, BlockActionPayload } from "./types/interaction";

export interface SlackClient {
  postSlackMessage(
    blocks: KnownBlock[],
    channel: string
  ): Promise<{
    ok: boolean;
  }>;
}

export function createSlackClient(botToken: string): SlackClient {
  async function postSlackMessage(blocks: KnownBlock[], channel: string) {
    const res = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${botToken}`,
      },
      body: JSON.stringify({
        channel,
        blocks,
      }),
    });

    return await res.json<{ ok: boolean }>();
  }

  return {
    postSlackMessage,
  };
}

interface MessagePayload {
  text: string;
  blocks?: KnownBlock[];
  response_type?: "in_channel";
  replace_original?: boolean;
  delete_original?: boolean;
  thread_ts?: string;
  mrkdwn?: boolean;
}

export function createMessageResponse(message: MessagePayload) {
  return new Response(JSON.stringify(message), {
    headers: { "Content-type": "application/json" },
  });
}

export async function sendToResponseURL(
  responseURL: string,
  payload: MessagePayload
) {
  return await fetch(responseURL, {
    body: JSON.stringify(payload),
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
  });
}

export function parseBlockActionPayload(payloadStr: unknown) {
  if (typeof payloadStr !== "string") {
    throw new Error("invalid payload");
  }

  const payload = JSON.parse(payloadStr) as BlockActionPayload;
  if (payload?.type !== "block_actions") {
    return null;
  }
  return payload;
}

type ActionTypeOf<T extends Action, K extends Action["type"]> = T & { type: K };

export async function handleAction<K extends Action["type"]>(
  actions: Action[],
  type: K,
  actionId: string,
  cb: (action: ActionTypeOf<Action, K>) => Promise<void> | void
) {
  const maybeAction = actions.find(
    (action): action is ActionTypeOf<Action, K> =>
      action.type === type && action.action_id === actionId
  );

  if (maybeAction) {
    await cb(maybeAction);
  }
}
