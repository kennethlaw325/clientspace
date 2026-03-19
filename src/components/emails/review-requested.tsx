import { Button, Hr, Section, Text } from "@react-email/components";
import * as React from "react";
import { BaseLayout } from "./base-layout";

interface ReviewRequestedEmailProps {
  recipientName: string;
  workspaceName: string;
  reviewTitle: string;
  projectName: string;
  reviewUrl: string;
  description?: string;
}

export function ReviewRequestedEmail({
  recipientName,
  workspaceName,
  reviewTitle,
  projectName,
  reviewUrl,
  description,
}: ReviewRequestedEmailProps) {
  return (
    <BaseLayout
      preview={`Review requested: ${reviewTitle} — ${projectName}`}
      workspaceName={workspaceName}
    >
      <Text className="text-slate-800 text-xl font-semibold mt-0 mb-2">
        Deliverable ready for your review
      </Text>
      <Text className="text-slate-600 mt-0 mb-6">Hi {recipientName},</Text>
      <Text className="text-slate-600 mt-0 mb-6">
        {workspaceName} has submitted a deliverable for your review on <strong>{projectName}</strong>.
      </Text>

      <Section className="bg-slate-50 rounded-lg p-5 mb-6">
        <Text className="text-slate-500 text-sm m-0 mb-1">Deliverable</Text>
        <Text className="text-slate-800 font-semibold text-base m-0 mb-4">{reviewTitle}</Text>

        {description && (
          <>
            <Text className="text-slate-500 text-sm m-0 mb-1">Notes</Text>
            <Text className="text-slate-700 text-sm m-0">{description}</Text>
          </>
        )}
      </Section>

      <Button
        href={reviewUrl}
        className="bg-indigo-600 text-white font-semibold px-6 py-3 rounded-lg no-underline block text-center"
      >
        Review Deliverable
      </Button>

      <Hr className="border-slate-200 my-6" />
      <Text className="text-slate-400 text-sm m-0">
        You can approve this deliverable or request revisions directly from the review page.
      </Text>
    </BaseLayout>
  );
}

export default ReviewRequestedEmail;
