import { Button, Hr, Section, Text } from "@react-email/components";
import * as React from "react";
import { BaseLayout } from "./base-layout";

interface RevisionRequestedEmailProps {
  recipientName: string;
  workspaceName: string;
  reviewTitle: string;
  projectName: string;
  clientName: string;
  reviewUrl: string;
  clientComment?: string;
}

export function RevisionRequestedEmail({
  recipientName,
  workspaceName,
  reviewTitle,
  projectName,
  clientName,
  reviewUrl,
  clientComment,
}: RevisionRequestedEmailProps) {
  return (
    <BaseLayout
      preview={`🔄 Revision requested on "${reviewTitle}" by ${clientName}`}
      workspaceName={workspaceName}
    >
      <Text className="text-slate-800 text-xl font-semibold mt-0 mb-2">
        Revision requested 🔄
      </Text>
      <Text className="text-slate-600 mt-0 mb-6">Hi {recipientName},</Text>
      <Text className="text-slate-600 mt-0 mb-6">
        <strong>{clientName}</strong> has requested revisions on your deliverable for{" "}
        <strong>{projectName}</strong>.
      </Text>

      <Section className="bg-amber-50 border border-amber-200 rounded-lg p-5 mb-6">
        <Text className="text-slate-500 text-sm m-0 mb-1">Deliverable</Text>
        <Text className="text-slate-800 font-semibold text-base m-0 mb-3">{reviewTitle}</Text>
        <Text className="text-amber-700 font-semibold text-sm m-0 mb-3">
          Status: Revision Requested
        </Text>

        {clientComment && (
          <>
            <Text className="text-slate-500 text-sm m-0 mb-1">Client Comment</Text>
            <Text className="text-slate-700 text-sm m-0 italic">"{clientComment}"</Text>
          </>
        )}
      </Section>

      <Button
        href={reviewUrl}
        className="bg-indigo-600 text-white font-semibold px-6 py-3 rounded-lg no-underline block text-center"
      >
        View Review
      </Button>

      <Hr className="border-slate-200 my-6" />
      <Text className="text-slate-400 text-sm m-0">
        Please review the feedback and submit an updated deliverable.
      </Text>
    </BaseLayout>
  );
}

export default RevisionRequestedEmail;
