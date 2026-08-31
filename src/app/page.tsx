import { ChatContainer } from "@/components/chat/chat-container";

export default function Home() {
  return (
    <main className="h-dvh max-h-dvh overflow-hidden supports-[height:100dvh]:h-dvh">
      <ChatContainer />
    </main>
  );
}
