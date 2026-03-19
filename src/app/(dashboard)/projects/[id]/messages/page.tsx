import { getProjectMessages } from "@/lib/actions/messages";
import { MessageThread } from "@/components/dashboard/message-thread";
import { MessageInput } from "@/components/dashboard/message-input";

export default async function ProjectMessagesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const messages = await getProjectMessages(id);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {messages.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No messages yet. Start the conversation.
          </p>
        ) : (
          messages.map((msg) => (
            <MessageThread key={msg.id} message={msg} projectId={id} />
          ))
        )}
      </div>
      <MessageInput projectId={id} />
    </div>
  );
}
