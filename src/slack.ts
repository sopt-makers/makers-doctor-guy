import type { KnownBlock } from "@slack/types";
import { Action, BlockActionPayload } from "./types/interaction";

export interface SlackClient {
  postSlackMessage(blocks: KnownBlock[], channel: string): Promise<Response>;
}

export function createSlackClient(botToken: string): SlackClient {
  async function postSlackMessage(blocks: KnownBlock[], channel: string) {
    return await fetch("https://slack.com/api/chat.postMessage", {
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
  message: MessagePayload
) {
  return await fetch(responseURL, {
    body: JSON.stringify(message),
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

export function handleAction<K extends Action["type"]>(
  actions: Action[],
  type: K,
  actionId: string,
  cb: (action: ActionTypeOf<Action, K>) => void
) {
  const maybeAction = actions.find(
    (action) =>
      action.type === "static_select" && action.action_id === "check_server"
  );

  if (maybeAction) {
  }
}
