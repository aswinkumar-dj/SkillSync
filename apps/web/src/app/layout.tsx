import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Providers } from "../components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "SkillSync",
  description: "AI-assisted mock interview matching for developers.",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

