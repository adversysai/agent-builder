"use client";

import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";
import { ClerkProvider } from '@clerk/nextjs';
import ColorStyles from "@/components/shared/color-styles/color-styles";
import Scrollbar from "@/components/ui/scrollbar";
import { BigIntProvider } from "@/components/providers/BigIntProvider";
import "styles/main.css";

// Removed Convex - using NeonDB instead


// Metadata must be in a separate server component
// For now, set via document head

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <title>Open Agent Builder</title>
          <meta name="description" content="Build AI agents and workflows with visual programming" />
          <link rel="icon" href="/favicon.png" />
          <ColorStyles />
        </head>
        <body
          className={`${GeistMono.variable} font-sans text-accent-black bg-background-base overflow-x-clip`}
        >
          <BigIntProvider>
            <main className="overflow-x-clip">{children}</main>
            <Scrollbar />
            <Toaster position="bottom-right" />
          </BigIntProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

