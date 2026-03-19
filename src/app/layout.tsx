import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "ClientSpace — Simple Client Portal for Freelancers",
    template: "%s — ClientSpace",
  },
  description:
    "Share files, track progress, collect approvals, and get paid — all in one place. The client portal freelancers deserve.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://clientspace.app"
  ),
  openGraph: {
    title: "ClientSpace — Simple Client Portal for Freelancers",
    description:
      "Share files, track progress, collect approvals, and get paid — all in one place.",
    url: "/",
    siteName: "ClientSpace",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ClientSpace — Simple Client Portal for Freelancers",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ClientSpace — Simple Client Portal for Freelancers",
    description:
      "Share files, track progress, collect approvals, and get paid — all in one place.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
