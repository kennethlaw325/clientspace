import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import * as React from "react";

interface BaseLayoutProps {
  preview: string;
  children: React.ReactNode;
  workspaceName?: string;
}

export function BaseLayout({ preview, children, workspaceName }: BaseLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind>
        <Body className="bg-slate-50 font-sans">
          <Container className="mx-auto max-w-[560px] py-10">
            <Section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <Section className="bg-indigo-600 px-8 py-5">
                <Text className="text-white font-bold text-lg m-0">
                  {workspaceName ?? "ClientSpace"}
                </Text>
              </Section>
              <Section className="px-8 py-8">
                {children}
              </Section>
            </Section>
            <Text className="text-slate-400 text-xs text-center mt-6">
              Sent via ClientSpace — the simple client portal for freelancers
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
