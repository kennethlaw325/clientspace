import { Button, Hr, Section, Text } from "@react-email/components";
import * as React from "react";
import { BaseLayout } from "./base-layout";

interface DeliverableApprovedEmailProps {
  recipientName: string;
  workspaceName: string;
  reviewTitle: string;
  projectName: string;
  clientName: string;
  reviewUrl: string;
}

export function DeliverableApprovedEmail({
  recipientName,
  workspaceName,
  reviewTitle,
  projectName,
  clientName,
  reviewUrl,
}: DeliverableApprovedEmailProps) {
  return (
    <BaseLayout
      preview={`✅ "${reviewTitle}" approved by ${clientName}`}
      workspaceName={workspaceName}
    >
      <Text className="text-slate-800 text-xl font-semibold mt-0 mb-2">
        Deliverable approved ✅
      </Text>
      <Text className="text-slate-600 mt-0 mb-6">Hi {recipientName},</Text>
      <Text className="text-slate-600 mt-0 mb-6">
        <strong>{clientName}</strong> has approved your deliverable on{" "}
        <strong>{projectName}</strong>.
      </Text>

      <Section className="bg-green-50 border border-green-200 rounded-lg p-5 mb-6">
        <Text className="text-slate-500 text-sm m-0 mb-1">Deliverable</Text>
        <Text className="text-slate-800 font-semibold text-base m-0 mb-3">{reviewTitle}</Text>
        <Text className="text-green-700 font-semibold text-sm m-0">Status: Approved</Text>
      </Section>

      <Button
        href={reviewUrl}
        className="bg-indigo-600 text-white font-semibold px-6 py-3 rounded-lg no-underline block text-center"
      >
        View Review
      </Button>

      <Hr className="border-slate-200 my-6" />
      <Text className="text-slate-400 text-sm m-0">
        Keep up the great work! This review is recorded in your ClientSpace workspace.
      </Text>
    </BaseLayout>
  );
}

export default DeliverableApprovedEmail;
