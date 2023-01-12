import type { KnownBlock } from "@slack/types";
import { checkerList } from "./checker";

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

export function serverSelectMessageBlock(): KnownBlock[] {
  return [
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
  ];
}
