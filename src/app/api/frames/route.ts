import { NextResponse } from "next/server";
import { getTotalFramesServer, getPreferredExtensionServer } from "@/lib/frames.server";

export async function GET() {
  const totalFrames = getTotalFramesServer();
  const extension = getPreferredExtensionServer();
  return NextResponse.json({
    totalFrames,
    extension,
    firstFrame: `/frames/frame_0001.${extension}`,
  });
}
