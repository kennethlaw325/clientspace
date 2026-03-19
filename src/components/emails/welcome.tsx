import { Button, Hr, Section, Text } from "@react-email/components";
import * as React from "react";
import { BaseLayout } from "./base-layout";

interface WelcomeEmailProps {
  recipientName?: string;
  appUrl: string;
}

export function WelcomeEmail({ recipientName, appUrl }: WelcomeEmailProps) {
  return (
    <BaseLayout
      preview="Welcome to ClientSpace — your simple client portal"
    >
      <Text className="text-slate-800 text-xl font-semibold mt-0 mb-2">
        Welcome to ClientSpace 🎉
      </Text>
      <Text className="text-slate-600 mt-0 mb-6">
        Hi {recipientName ?? "there"},
      </Text>
      <Text className="text-slate-600 mt-0 mb-6">
        Your account is ready. ClientSpace helps you share files, track project progress,
        manage deliverable reviews, and collect payments — all in one simple portal.
      </Text>

      <Section className="bg-slate-50 rounded-lg p-5 mb-6">
        <Text className="text-slate-700 font-semibold text-sm m-0 mb-3">
          Get started in 3 steps:
        </Text>
        <Text className="text-slate-600 text-sm m-0 mb-2">
          1. Create your first project
        </Text>
        <Text className="text-slate-600 text-sm m-0 mb-2">
          2. Add your client and share the portal link
        </Text>
        <Text className="text-slate-600 text-sm m-0">
          3. Upload deliverables and send invoices
        </Text>
      </Section>

      <Button
        href={appUrl}
        className="bg-indigo-600 text-white font-semibold px-6 py-3 rounded-lg no-underline block text-center"
      >
        Go to Dashboard
      </Button>

      <Hr className="border-slate-200 my-6" />
      <Text className="text-slate-400 text-sm m-0">
        Questions? Just reply to this email — we&apos;re happy to help.
      </Text>
    </BaseLayout>
  );
}

export default WelcomeEmail;
