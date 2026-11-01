import type { Metadata, Viewport } from "next";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/manrope";
import { Shell } from "@/components/Shell";
import "./globals.css";
import "./relay-design.css";

export const metadata: Metadata = {
  title: "RELAY · Evidence-based lesson feedback",
  description: "Real-time, evidence-based feedback on what teachers say and what students learn.",
};

export const viewport: Viewport = { themeColor: "#fafbf7" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
