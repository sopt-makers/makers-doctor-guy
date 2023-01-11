import type { KnownBlock } from "@slack/types";

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

interface Reply {
  blocks?: KnownBlock[];
  text?: string;
  target: "sender" | "sentChannel";
  replaceOriginal?: boolean;
}

export function replyResponse({
  blocks,
  target,
  text = "",
  replaceOriginal = false,
}: Reply) {
  const response_type = target === "sentChannel" ? "in_channel" : undefined;
  const replace_original = replaceOriginal ? "true" : "false";

  return new Response(
    JSON.stringify({ blocks, text, response_type, replace_original }),
    {
      headers: { "Content-type": "application/json" },
    }
  );
}
