"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { portalSendMessage } from "@/lib/actions/portal";
import { Send } from "lucide-react";

export function PortalMessageForm({
  token,
  projectId,
}: {
  token: string;
  projectId: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await portalSendMessage(token, projectId, formData);
    setPending(false);

    if (result.error) {
      setError(result.error);
    } else {
      formRef.current?.reset();
      router.refresh();
    }
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-2">
      <Textarea
        name="content"
        placeholder="Write a message..."
        required
        rows={3}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          <Send className="h-4 w-4 mr-1" />
          {pending ? "Sending..." : "Send Message"}
        </Button>
      </div>
    </form>
  );
}
