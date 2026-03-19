import { Button, Hr, Section, Text } from "@react-email/components";
import * as React from "react";
import { BaseLayout } from "./base-layout";

interface PaymentReminderEmailProps {
  recipientName: string;
  workspaceName: string;
  invoiceNumber: string;
  amount: string;
  dueDate?: string;
  projectName?: string;
  paymentLink?: string;
}

export function PaymentReminderEmail({
  recipientName,
  workspaceName,
  invoiceNumber,
  amount,
  dueDate,
  projectName,
  paymentLink,
}: PaymentReminderEmailProps) {
  return (
    <BaseLayout
      preview={`Payment reminder: Invoice ${invoiceNumber} for ${amount} is overdue`}
      workspaceName={workspaceName}
    >
      <Text className="text-red-600 text-xl font-semibold mt-0 mb-2">
        Payment Reminder
      </Text>
      <Text className="text-slate-600 mt-0 mb-6">Hi {recipientName},</Text>
      <Text className="text-slate-600 mt-0 mb-6">
        This is a friendly reminder that your invoice from {workspaceName}
        {projectName ? ` for ${projectName}` : ""} is overdue. Please make
        payment at your earliest convenience.
      </Text>

      <Section className="bg-red-50 border border-red-100 rounded-lg p-5 mb-6">
        <Text className="text-slate-500 text-sm m-0 mb-1">Invoice Number</Text>
        <Text className="text-slate-800 font-semibold text-base m-0 mb-4">
          {invoiceNumber}
        </Text>

        <Text className="text-slate-500 text-sm m-0 mb-1">Amount Due</Text>
        <Text className="text-red-600 font-bold text-2xl m-0 mb-4">{amount}</Text>

        {dueDate && (
          <>
            <Text className="text-slate-500 text-sm m-0 mb-1">Due Date</Text>
            <Text className="text-red-600 font-semibold text-base m-0">
              {dueDate} (Overdue)
            </Text>
          </>
        )}
      </Section>

      {paymentLink && (
        <Button
          href={paymentLink}
          className="bg-red-600 text-white font-semibold px-6 py-3 rounded-lg no-underline block text-center"
        >
          Pay Now
        </Button>
      )}

      <Hr className="border-slate-200 my-6" />
      <Text className="text-slate-400 text-sm m-0">
        If you have already made this payment, please disregard this reminder.
        For questions, please reply to this email or contact {workspaceName}.
      </Text>
    </BaseLayout>
  );
}

export default PaymentReminderEmail;
