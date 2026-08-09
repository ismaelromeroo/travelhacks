import { getCall } from "@/lib/mock-store";

export async function GET(_req: Request, ctx: RouteContext<"/api/mock/calls/[callId]">) {
  const { callId } = await ctx.params;
  const call = getCall(callId);
  if (!call) return new Response("Not found", { status: 404 });
  const { createdAt, ...rest } = call;
  void createdAt;
  return Response.json(rest);
}
