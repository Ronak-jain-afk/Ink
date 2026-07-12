import { getConversation, getStreaming } from "../modules/ai/panel-store";

export function AIPanel() {
  const conversation = getConversation();
  const streaming = getStreaming();

  if (conversation.length === 0 && !streaming) {
    return (
      <box flexDirection="column" paddingLeft={1}>
        <text content={" AI"} />
        <text content={" No conversation yet."} />
      </box>
    );
  }

  return (
    <box flexDirection="column" paddingLeft={1}>
      <text content={" AI"} />
      {conversation.map((msg, i) => (
        <text key={i} content={` ${msg.role === "user" ? ">" : " "} ${msg.content.slice(0, 80)}${msg.content.length > 80 ? "…" : ""}`} />
      ))}
      {streaming && <text content={" (streaming…)"} />}
    </box>
  );
}
