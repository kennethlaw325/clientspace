import { notFound } from "next/navigation";
import { getReviewByToken } from "@/lib/actions/reviews";
import { ReviewClientView } from "@/components/review/review-client-view";

export default async function ReviewTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await getReviewByToken(token);

  if (!result) notFound();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <ReviewClientView
          review={result.review}
          comments={result.comments}
          token={token}
        />
      </div>
    </div>
  );
}
