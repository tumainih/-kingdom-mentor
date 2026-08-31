import { ChatContainer } from "@/components/chat/chat-container";

export default function Home() {
  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <header className="border-b border-border bg-card px-4 py-4 shadow-sm">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Kingdom AI
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A biblical wisdom mentor — not a replacement for God, pastoral care,
            or qualified professionals.
          </p>
        </div>
      </header>

      <ChatContainer />

      <footer className="border-t border-border bg-muted/30 px-4 py-3 text-center text-xs text-muted-foreground">
        Kingdom AI draws guidance from retrieved KJV Scripture only. It does
        not claim divine revelation. For abuse, danger, medical, mental health,
        legal, or financial matters, seek qualified human help.
      </footer>
    </main>
  );
}
