import { checkerList } from "./checker";
import { AnySendableMessageBlock } from "slack-cloudflare-workers";

export function serverWorkingMessage(name: string, url: string, mentions = "") {
  const blocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*서버가 잘 동작중이에요!* :rocket:\n${mentions}`,
      },
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*서버 이름:*\n${name}`,
        },
        {
          type: "mrkdwn",
          text: `*서버 URL:*\n${url}`,
        },
        {
          type: "mrkdwn",
          text: `*시간(Local Time):*\n${formatTimeForSlack(new Date())}`,
        },
        {
          type: "mrkdwn",
          text: `*Timestamp:*\n${new Date().toISOString()}`,
        },
      ],
    },
    {
      type: "divider",
    },
  ] satisfies AnySendableMessageBlock[];

  return {
    text: `${name} 서버가 잘 동작중이에요! ${mentions}`,
    blocks,
  };
}

export function serverFailureMessageBlock(
  name: string,
  url: string,
  mentions = ""
) {
  const blocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*서버에 문제가 발생했어요!* :blob-oohcry:\n${mentions}`,
      },
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*서버 이름:*\n${name}`,
        },
        {
          type: "mrkdwn",
          text: `*서버 URL:*\n${url}`,
        },
        {
          type: "mrkdwn",
          text: `*시간(Local Time):*\n${formatTimeForSlack(new Date())}`,
        },
        {
          type: "mrkdwn",
          text: `*Timestamp:*\n${new Date().toISOString()}`,
        },
      ],
    },
    {
      type: "divider",
    },
  ] satisfies AnySendableMessageBlock[];

  return {
    text: `${name} 서버에 문제가 발생했어요!\n${mentions}`,
    blocks,
  };
}

export function serverSelectMessageBlock() {
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
  ] satisfies AnySendableMessageBlock[];
}

function formatTimeForSlack(time: Date) {
  return `<!date^${Math.floor(
    time.getTime() / 1000
  )}^{date_num} {time_secs}|${new Date().toISOString()}>`;
}
