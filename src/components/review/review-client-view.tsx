"use client";

import { useState } from "react";
import { CheckCircle, RefreshCw, MessageSquare, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { updateReviewStatusByToken, addReviewCommentByToken } from "@/lib/actions/reviews";
import type { DeliverableReview, ReviewComment } from "@/types/database";

const statusConfig = {
  pending_review: { label: "Pending Your Review", className: "bg-amber-100 text-amber-700" },
  approved: { label: "Approved", className: "bg-green-100 text-green-700" },
  revision_requested: { label: "Revision Requested", className: "bg-red-100 text-red-700" },
};

interface ReviewClientViewProps {
  review: DeliverableReview;
  comments: ReviewComment[];
  token: string;
}

export function ReviewClientView({ review, comments: initialComments, token }: ReviewClientViewProps) {
  const [status, setStatus] = useState(review.status);
  const [comments, setComments] = useState(initialComments);
  const [clientName, setClientName] = useState("");
  const [actionComment, setActionComment] = useState("");
  const [newComment, setNewComment] = useState("");
  const [isActioning, setIsActioning] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionDone, setActionDone] = useState(
    review.status === "approved" || review.status === "revision_requested"
  );

  async function handleAction(newStatus: "approved" | "revision_requested") {
    if (!clientName.trim()) {
      setError("Please enter your name");
      return;
    }
    setError(null);
    setIsActioning(true);

    try {
      const result = await updateReviewStatusByToken(token, newStatus, actionComment, clientName);
      if (result.error) {
        setError(result.error);
        return;
      }

      // Optimistic update
      setStatus(newStatus);
      setActionDone(true);
      if (actionComment.trim()) {
        setComments((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            review_id: review.id,
            author_type: "client",
            author_name: clientName,
            body: actionComment.trim(),
            created_at: new Date().toISOString(),
          },
        ]);
        setActionComment("");
      }
    } finally {
      setIsActioning(false);
    }
  }

  async function handleAddComment() {
    if (!clientName.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!newComment.trim()) return;

    setError(null);
    setIsCommenting(true);
    try {
      const result = await addReviewCommentByToken(token, newComment, clientName);
      if (result.error) {
        setError(result.error);
        return;
      }
      setComments((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          review_id: review.id,
          author_type: "client",
          author_name: clientName,
          body: newComment.trim(),
          created_at: new Date().toISOString(),
        },
      ]);
      setNewComment("");
    } finally {
      setIsCommenting(false);
    }
  }

  const config = statusConfig[status];
  const isLink = review.file_type === "link";
  const isImage = review.file_type === "image";
  const isPdf = review.file_type === "pdf";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{review.title}</h1>
          {review.description && (
            <p className="text-muted-foreground mt-1">{review.description}</p>
          )}
        </div>
        <Badge className={`shrink-0 ${config.className}`} variant="secondary">
          {config.label}
        </Badge>
      </div>

      {/* Deliverable Preview */}
      {review.file_url && (
        <Card>
          <CardContent className="p-4">
            {isLink && (
              <a
                href={review.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-indigo-600 hover:underline text-sm"
              >
                <ExternalLink className="h-4 w-4" />
                {review.file_url}
              </a>
            )}
            {isImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={review.file_url}
                alt={review.title}
                className="max-w-full rounded-lg"
              />
            )}
            {isPdf && (
              <iframe
                src={review.file_url}
                className="w-full h-96 rounded-lg border"
                title={review.title}
              />
            )}
            {!isLink && !isImage && !isPdf && review.file_url && (
              <a
                href={review.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-indigo-600 hover:underline text-sm"
              >
                <ExternalLink className="h-4 w-4" />
                View File
              </a>
            )}
          </CardContent>
        </Card>
      )}

      {/* Client Name */}
      <div>
        <label className="text-sm font-medium mb-1 block">Your Name</label>
        <Input
          placeholder="Enter your name"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {/* Approve / Request Revision */}
      {!actionDone && (
        <Card className="border-dashed">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-medium">Your Decision</p>
            <Textarea
              placeholder="Add a comment (optional)"
              value={actionComment}
              onChange={(e) => setActionComment(e.target.value)}
              rows={2}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button
                onClick={() => handleAction("approved")}
                disabled={isActioning}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                {isActioning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Approve
              </Button>
              <Button
                variant="outline"
                onClick={() => handleAction("revision_requested")}
                disabled={isActioning}
                className="gap-2 border-red-300 text-red-600 hover:bg-red-50"
              >
                {isActioning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Request Revision
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {actionDone && status === "approved" && (
        <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg px-4 py-3 text-sm">
          <CheckCircle className="h-4 w-4" />
          You approved this deliverable.
        </div>
      )}

      {actionDone && status === "revision_requested" && (
        <div className="flex items-center gap-2 text-red-700 bg-red-50 rounded-lg px-4 py-3 text-sm">
          <RefreshCw className="h-4 w-4" />
          You requested revisions on this deliverable.
        </div>
      )}

      {/* Comment Thread */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Comments ({comments.length})
        </h2>

        {comments.length > 0 && (
          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                    comment.author_type === "client"
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {comment.author_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium">{comment.author_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{comment.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Comment */}
        <div className="space-y-2">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={2}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button
            onClick={handleAddComment}
            disabled={isCommenting || !newComment.trim()}
            variant="outline"
            size="sm"
          >
            {isCommenting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Post Comment
          </Button>
        </div>
      </div>
    </div>
  );
}
