import { notFound } from "next/navigation";
import { getProject } from "@/lib/actions/projects";
import { getProjectReviews } from "@/lib/actions/reviews";
import { ReviewList } from "@/components/dashboard/review-list";
import { CreateReviewForm } from "@/components/dashboard/create-review-form";

export default async function ProjectReviewsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [project, reviews] = await Promise.all([
    getProject(id),
    getProjectReviews(id),
  ]);

  if (!project) notFound();

  return (
    <div className="space-y-6">
      <CreateReviewForm projectId={id} />
      <ReviewList reviews={reviews} projectId={id} />
    </div>
  );
}
