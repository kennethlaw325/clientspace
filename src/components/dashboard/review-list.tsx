"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReviewWithToken } from "@/lib/actions/reviews";

const statusConfig = {
  pending_review: { label: "Pending Review", variant: "secondary" as const, className: "bg-amber-100 text-amber-700" },
  approved: { label: "Approved", variant: "default" as const, className: "bg-green-100 text-green-700" },
  revision_requested: { label: "Revision Requested", variant: "destructive" as const, className: "bg-red-100 text-red-700" },
};

function CopyLinkButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const reviewUrl = `${window.location.origin}/reviews/${token}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(reviewUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex gap-1">
      <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5 text-xs">
        {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copied!" : "Copy Link"}
      </Button>
      <a
        href={`/reviews/${token}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}

export function ReviewList({
  reviews,
  projectId: _projectId,
}: {
  reviews: ReviewWithToken[];
  projectId: string;
}) {
  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No review requests yet.</p>
        <p className="text-sm mt-1">Create one above to share a deliverable with your client.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((review) => {
        const config = statusConfig[review.status];
        const token = review.review_tokens?.[0]?.token;
        const commentCount = review.review_comments?.length ?? 0;

        return (
          <Card key={review.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base truncate">{review.title}</CardTitle>
                  {review.description && (
                    <p className="text-sm text-muted-foreground mt-0.5">{review.description}</p>
                  )}
                </div>
                <Badge className={`shrink-0 text-xs ${config.className}`} variant="secondary">
                  {config.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {review.file_type && (
                    <span className="capitalize">{review.file_type}</span>
                  )}
                  {commentCount > 0 && (
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {commentCount} comment{commentCount !== 1 ? "s" : ""}
                    </span>
                  )}
                  <span>{new Date(review.created_at).toLocaleDateString()}</span>
                </div>
                {token && <CopyLinkButton token={token} />}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
