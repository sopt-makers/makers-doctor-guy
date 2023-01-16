import { checkerList } from "./checker";
import {
  serverFailureMessageBlock,
  serverSelectMessageBlock,
  serverWorkingMessage,
} from "./message";
import {
  createMessageResponse,
  handleAction,
  parseBlockActionPayload,
  sendToResponseURL,
} from "./slack";

export async function handleInteractiveMessage(data: string) {
  const payload = parseBlockActionPayload(data);
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
          await sendToResponseURL(response_url, {
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

  return new Response();
}

export function handleCommand() {
  return createMessageResponse({
    text: "",
    blocks: serverSelectMessageBlock(),
  });
}
