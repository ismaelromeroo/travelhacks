import { NextRequest } from "next/server";
import { getProvider, mapConversationStatus } from "@/lib/providers";
import { generateNotes } from "@/lib/notes";
import { callStore } from "@/lib/store";
import type { CallStatus, TranscriptTurn } from "@/lib/types";

export const dynamic = "force-dynamic";

const POLL_INTERVAL_MS = 2000;
const MAX_STREAM_DURATION_MS = 5 * 60 * 1000;

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/calls/[callId]/stream">
) {
  const { callId } = await ctx.params;
  const call = callStore.get(callId);

  if (!call) {
    return new Response("Call not found", { status: 404 });
  }

  const encoder = new TextEncoder();
  const sseHeaders = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  };

  // Seeded / already-finished calls: client already hydrated from GET — just close the stream.
  if (call.status === "completed" || call.status === "failed") {
    const snapshot = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(sseEvent("status", { status: call.status })));
        if (call.notes) {
          controller.enqueue(encoder.encode(sseEvent("notes", call.notes)));
        }
        controller.enqueue(encoder.encode(sseEvent("done", {})));
        controller.close();
      },
    });
    return new Response(snapshot, { headers: sseHeaders });
  }

  if (!call.conversationId) {
    return new Response("Call has no active conversation", { status: 409 });
  }

  const provider = getProvider();
  const conversationId = call.conversationId;
  const startedAt = Date.now();
  const { signal } = request;

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const close = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          // stream already closed by the client aborting
        }
      };
      signal.addEventListener("abort", close);

      let sentTurnCount = 0;
      let lastStatus: CallStatus = call.status;

      while (!closed && Date.now() - startedAt < MAX_STREAM_DURATION_MS) {
        let state;
        try {
          state = await provider.getConversation(conversationId);
        } catch {
          call.status = "failed";
          controller.enqueue(encoder.encode(sseEvent("status", { status: "failed" })));
          controller.enqueue(encoder.encode(sseEvent("done", {})));
          close();
          break;
        }

        for (let i = sentTurnCount; i < state.transcript.length; i++) {
          const turn: TranscriptTurn = {
            ...state.transcript[i],
            timestamp: new Date().toISOString(),
          };
          call.transcript.push(turn);
          controller.enqueue(encoder.encode(sseEvent("transcript", turn)));
        }
        sentTurnCount = state.transcript.length;

        const mappedStatus = mapConversationStatus(state.status);
        if (mappedStatus !== lastStatus) {
          lastStatus = mappedStatus;
          call.status = mappedStatus;
          controller.enqueue(encoder.encode(sseEvent("status", { status: mappedStatus })));
        }

        if (mappedStatus === "completed" || mappedStatus === "failed") {
          if (mappedStatus === "completed") {
            const notes = await generateNotes(call);
            call.notes = notes;
            controller.enqueue(encoder.encode(sseEvent("notes", notes)));
          }
          controller.enqueue(encoder.encode(sseEvent("done", {})));
          close();
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      }

      close();
    },
  });

  return new Response(stream, { headers: sseHeaders });
}
