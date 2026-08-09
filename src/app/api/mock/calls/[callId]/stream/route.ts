import { getCall } from "@/lib/mock-store";

const event = (name: string, data: unknown) =>
  `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`;

export async function GET(_req: Request, ctx: RouteContext<"/api/mock/calls/[callId]/stream">) {
  const { callId } = await ctx.params;
  if (!getCall(callId)) return new Response("Not found", { status: 404 });

  let sentLines = 0;
  let sentStatus = "";
  let sentNotes = false;

  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();
      const send = (name: string, data: unknown) => controller.enqueue(enc.encode(event(name, data)));

      // ponytail: polls its own in-memory store instead of a pub/sub hub. 400ms is
      // invisible next to a real phone call; swap for an emitter if it ever matters.
      const tick = setInterval(() => {
        const call = getCall(callId);
        if (!call) return;

        if (call.status !== sentStatus) {
          sentStatus = call.status;
          send("status", { status: call.status });
        }
        while (sentLines < call.transcript.length) {
          send("transcript", call.transcript[sentLines++]);
        }
        if (call.notes && !sentNotes) {
          sentNotes = true;
          send("notes", call.notes);
        }
        if (call.status === "completed" || call.status === "failed") {
          send("done", {});
          clearInterval(tick);
          controller.close();
        }
      }, 400);

      _req.signal.addEventListener("abort", () => clearInterval(tick));
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
