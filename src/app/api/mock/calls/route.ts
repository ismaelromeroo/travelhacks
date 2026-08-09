import { createCall, listCalls } from "@/lib/mock-store";

export async function GET() {
  return Response.json({ calls: listCalls() });
}

export async function POST(request: Request) {
  const brief = await request.json();
  return Response.json({ callId: createCall(brief), status: "queued" }, { status: 201 });
}
