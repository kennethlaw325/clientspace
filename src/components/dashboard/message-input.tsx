"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sendMessage } from "@/lib/actions/messages";
import { Send } from "lucide-react";

export function MessageInput({
  projectId,
  parentId,
  onSent,
  compact = false,
}: {
  projectId: string;
  parentId?: string;
  onSent?: () => void;
  compact?: boolean;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    const result = await sendMessage(projectId, formData);
    setPending(false);

    if (!result.error) {
      formRef.current?.reset();
      router.refresh();
      onSent?.();
    }
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-2">
      {parentId && <input type="hidden" name="parent_id" value={parentId} />}
      <Textarea
        name="content"
        placeholder={parentId ? "Write a reply..." : "Write a message..."}
        required
        rows={compact ? 2 : 3}
        className={compact ? "text-sm" : ""}
      />
      <div className="flex justify-end">
        <Button type="submit" size={compact ? "sm" : "default"} disabled={pending}>
          <Send className="h-4 w-4 mr-1" />
          {pending ? "Sending..." : "Send"}
        </Button>
      </div>
    </form>
  );
}
