import type { KnownBlock } from "@slack/types";

export function serverWorkingMessageBlock(
  name: string,
  url: string,
  mentions = ""
): KnownBlock[] {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${name} 서버가 잘 동작중이에요! :rocket: ${mentions}\n${url}`,
      },
    },
  ];
}

export function serverFailureMessageBlock(
  name: string,
  url: string,
  mentions = ""
): KnownBlock[] {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${name} 서버에 문제가 발생했어요! :blob-oohcry: ${mentions}\n${url}`,
      },
    },
  ];
}
