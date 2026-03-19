"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageInput } from "./message-input";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Message } from "@/types/database";

type MessageWithReplies = Message & { replies: Message[] };

function formatTimestamp(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

function SenderBadge({ type }: { type: "freelancer" | "client" }) {
  return (
    <Badge variant={type === "freelancer" ? "default" : "secondary"}>
      {type === "freelancer" ? "Freelancer" : "Client"}
    </Badge>
  );
}

function MessageBubble({
  message,
  projectId,
  isReply = false,
}: {
  message: Message;
  projectId: string;
  isReply?: boolean;
}) {
  const [showReply, setShowReply] = useState(false);

  return (
    <div className={isReply ? "ml-4 sm:ml-8 border-l-2 border-border pl-3 sm:pl-4" : ""}>
      <div className="flex items-center gap-2 mb-1">
        <SenderBadge type={message.sender_type} />
        <span className="text-xs text-muted-foreground">
          {formatTimestamp(message.created_at)}
        </span>
      </div>
      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
      {!isReply && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-1 h-7 text-xs text-muted-foreground"
          onClick={() => setShowReply(!showReply)}
        >
          Reply
        </Button>
      )}
      {showReply && (
        <div className="mt-2 ml-4 sm:ml-8">
          <MessageInput
            projectId={projectId}
            parentId={message.id}
            onSent={() => setShowReply(false)}
            compact
          />
        </div>
      )}
    </div>
  );
}

export function useRealtimeMessages(projectId: string) {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${projectId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `project_id=eq.${projectId}` },
        () => router.refresh()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [projectId, router, supabase]);
}

export function MessageThread({
  message,
  projectId,
}: {
  message: MessageWithReplies;
  projectId: string;
}) {
  useRealtimeMessages(projectId);

  return (
    <div className="rounded-lg border border-border bg-white p-4 space-y-3">
      <MessageBubble message={message} projectId={projectId} />
      {message.replies.map((reply) => (
        <MessageBubble
          key={reply.id}
          message={reply}
          projectId={projectId}
          isReply
        />
      ))}
    </div>
  );
}
