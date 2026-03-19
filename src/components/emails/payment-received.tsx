import { Hr, Section, Text } from "@react-email/components";
import * as React from "react";
import { BaseLayout } from "./base-layout";

interface PaymentReceivedEmailProps {
  recipientName: string;
  workspaceName: string;
  invoiceNumber: string;
  amount: string;
  projectName?: string;
  clientName?: string;
}

export function PaymentReceivedEmail({
  recipientName,
  workspaceName,
  invoiceNumber,
  amount,
  projectName,
  clientName,
}: PaymentReceivedEmailProps) {
  return (
    <BaseLayout
      preview={`Payment received: ${amount} for invoice ${invoiceNumber}`}
      workspaceName={workspaceName}
    >
      <Text className="text-slate-800 text-xl font-semibold mt-0 mb-2">
        Payment received ✓
      </Text>
      <Text className="text-slate-600 mt-0 mb-6">Hi {recipientName},</Text>
      <Text className="text-slate-600 mt-0 mb-6">
        Great news — payment has been received{clientName ? ` from ${clientName}` : ""}
        {projectName ? ` for ${projectName}` : ""}.
      </Text>

      <Section className="bg-green-50 border border-green-200 rounded-lg p-5 mb-6">
        <Text className="text-slate-500 text-sm m-0 mb-1">Invoice</Text>
        <Text className="text-slate-800 font-semibold text-base m-0 mb-4">{invoiceNumber}</Text>

        <Text className="text-slate-500 text-sm m-0 mb-1">Amount Paid</Text>
        <Text className="text-green-700 font-bold text-2xl m-0">{amount}</Text>
      </Section>

      <Hr className="border-slate-200 my-6" />
      <Text className="text-slate-400 text-sm m-0">
        The payment has been recorded in your ClientSpace workspace.
      </Text>
    </BaseLayout>
  );
}

export default PaymentReceivedEmail;
