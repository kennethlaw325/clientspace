import { Button, Hr, Section, Text } from "@react-email/components";
import * as React from "react";
import { BaseLayout } from "./base-layout";

interface InvoiceSentEmailProps {
  recipientName: string;
  workspaceName: string;
  invoiceNumber: string;
  amount: string;
  projectName?: string;
  paymentLink?: string;
  dueDate?: string;
}

export function InvoiceSentEmail({
  recipientName,
  workspaceName,
  invoiceNumber,
  amount,
  projectName,
  paymentLink,
  dueDate,
}: InvoiceSentEmailProps) {
  return (
    <BaseLayout
      preview={`Invoice ${invoiceNumber} for ${amount} from ${workspaceName}`}
      workspaceName={workspaceName}
    >
      <Text className="text-slate-800 text-xl font-semibold mt-0 mb-2">
        You have a new invoice
      </Text>
      <Text className="text-slate-600 mt-0 mb-6">Hi {recipientName},</Text>
      <Text className="text-slate-600 mt-0 mb-6">
        {workspaceName} has sent you an invoice{projectName ? ` for ${projectName}` : ""}.
      </Text>

      <Section className="bg-slate-50 rounded-lg p-5 mb-6">
        <Text className="text-slate-500 text-sm m-0 mb-1">Invoice Number</Text>
        <Text className="text-slate-800 font-semibold text-base m-0 mb-4">{invoiceNumber}</Text>

        <Text className="text-slate-500 text-sm m-0 mb-1">Amount Due</Text>
        <Text className="text-slate-800 font-bold text-2xl m-0 mb-4">{amount}</Text>

        {dueDate && (
          <>
            <Text className="text-slate-500 text-sm m-0 mb-1">Due Date</Text>
            <Text className="text-slate-800 font-semibold text-base m-0">{dueDate}</Text>
          </>
        )}
      </Section>

      {paymentLink && (
        <Button
          href={paymentLink}
          className="bg-indigo-600 text-white font-semibold px-6 py-3 rounded-lg no-underline block text-center"
        >
          Pay Now
        </Button>
      )}

      <Hr className="border-slate-200 my-6" />
      <Text className="text-slate-400 text-sm m-0">
        If you have any questions, please reply to this email or contact {workspaceName}.
      </Text>
    </BaseLayout>
  );
}

export default InvoiceSentEmail;
