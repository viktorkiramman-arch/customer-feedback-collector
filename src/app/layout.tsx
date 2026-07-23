import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "FeedbackLoop", template: "%s | FeedbackLoop" },
  description: "Collect customer feedback, identify patterns, and turn responses into action.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
