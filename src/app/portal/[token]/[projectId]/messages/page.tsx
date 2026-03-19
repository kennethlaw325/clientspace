import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { PortalMessageForm } from "@/components/portal/portal-message-form";
import { Badge } from "@/components/ui/badge";
import type { Message } from "@/types/database";

function formatTimestamp(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

export default async function PortalMessagesPage({
  params,
}: {
  params: Promise<{ token: string; projectId: string }>;
}) {
  const { token, projectId } = await params;
  const supabase = createAdminClient();

  // Validate token
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("portal_token", token)
    .single() as { data: { id: string } | null };

  if (!client) notFound();

  // Verify project belongs to client
  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", projectId)
    .eq("client_id", client.id)
    .single() as { data: { id: string; name: string } | null };

  if (!project) notFound();

  // Get messages (top-level + replies)
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  const allMessages = (messages ?? []) as Message[];
  const topLevel = allMessages.filter((m) => !m.parent_id);
  const replies = allMessages.filter((m) => m.parent_id);

  const threads = topLevel.map((msg) => ({
    ...msg,
    replies: replies.filter((r) => r.parent_id === msg.id),
  }));

  return (
    <div>
      <Link
        href={`/portal/${token}/${projectId}`}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {project.name}
      </Link>

      <h1 className="text-2xl font-bold mb-6">Messages</h1>

      <div className="space-y-4 mb-6">
        {threads.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No messages yet. Start the conversation below.</p>
          </div>
        ) : (
          threads.map((thread) => (
            <div key={thread.id} className="rounded-lg border bg-white p-4 space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={thread.sender_type === "freelancer" ? "default" : "secondary"}>
                    {thread.sender_type === "freelancer" ? "Freelancer" : "You"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(thread.created_at)}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{thread.content}</p>
              </div>
              {thread.replies.map((reply) => (
                <div key={reply.id} className="ml-8 border-l-2 border-border pl-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={reply.sender_type === "freelancer" ? "default" : "secondary"}>
                      {reply.sender_type === "freelancer" ? "Freelancer" : "You"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(reply.created_at)}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{reply.content}</p>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      <PortalMessageForm token={token} projectId={projectId} />
    </div>
  );
}
