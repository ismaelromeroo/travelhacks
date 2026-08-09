import { NextResponse } from "next/server";
import { callStore, toPublicCall } from "@/lib/store";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/calls/[callId]">
) {
  const { callId } = await ctx.params;
  const call = callStore.get(callId);

  if (!call) {
    return NextResponse.json({ error: "Call not found" }, { status: 404 });
  }

  return NextResponse.json(toPublicCall(call));
}
