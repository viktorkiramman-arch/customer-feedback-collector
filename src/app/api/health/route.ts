import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "customer-feedback-collector",
    version: process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? "development",
  });
}
