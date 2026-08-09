import { NextRequest } from "next/server";
import { getProvider, mapConversationStatus } from "@/lib/providers";
import { generateNotes } from "@/lib/notes";
import { callStore } from "@/lib/store";
import type { CallStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const POLL_INTERVAL_MS = 2000;
const MAX_STREAM_DURATION_MS = 5 * 60 * 1000;
/** Vapi finishes writing the transcript shortly after the call ends. */
const SETTLE_POLLS = 3;
const SETTLE_INTERVAL_MS = 2000;

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
};

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

  // Terminal call (including seeded samples): replay stored state, no polling.
  if (call.status === "completed" || call.status === "failed") {
    const replay =
      call.transcript.map((turn) => sseEvent("transcript", turn)).join("") +
      sseEvent("status", { status: call.status }) +
      (call.notes ? sseEvent("notes", call.notes) : "") +
      sseEvent("done", {});
    return new Response(replay, { headers: SSE_HEADERS });
  }

  if (!call.conversationId) {
    return new Response("Call has no active conversation", { status: 409 });
  }

  const provider = getProvider(call.mode);
  const conversationId = call.conversationId;
  const encoder = new TextEncoder();
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

      // Cursor over the canonical store transcript. Starting at 0 replays
      // everything to this client, so the UI never needs to merge GET + SSE.
      let sentToClient = 0;
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

        // Append only turns the store hasn't seen — concurrent viewers each run
        // this loop, and the length check keeps them from double-appending.
        for (let i = call.transcript.length; i < state.transcript.length; i++) {
          call.transcript.push({
            ...state.transcript[i],
            timestamp: new Date().toISOString(),
          });
        }

        while (sentToClient < call.transcript.length) {
          controller.enqueue(
            encoder.encode(sseEvent("transcript", call.transcript[sentToClient]))
          );
          sentToClient++;
        }

        const mappedStatus = mapConversationStatus(state.status);
        if (mappedStatus !== lastStatus) {
          lastStatus = mappedStatus;
          call.status = mappedStatus;
          controller.enqueue(encoder.encode(sseEvent("status", { status: mappedStatus })));
        }

        if (mappedStatus === "completed" || mappedStatus === "failed") {
          // Keep polling briefly: the last turns often land after the hangup.
          for (let i = 0; i < SETTLE_POLLS && !closed; i++) {
            await new Promise((r) => setTimeout(r, SETTLE_INTERVAL_MS));
            let settled;
            try {
              settled = await provider.getConversation(conversationId);
            } catch {
              break;
            }
            if (settled.transcript.length <= call.transcript.length) continue;

            for (let j = call.transcript.length; j < settled.transcript.length; j++) {
              call.transcript.push({
                ...settled.transcript[j],
                timestamp: new Date().toISOString(),
              });
            }
            while (sentToClient < call.transcript.length) {
              controller.enqueue(
                encoder.encode(sseEvent("transcript", call.transcript[sentToClient]))
              );
              sentToClient++;
            }
          }

          if (mappedStatus === "completed") {
            if (!call.notes) {
              call.notes = await generateNotes(call);
            }
            controller.enqueue(encoder.encode(sseEvent("notes", call.notes)));
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

  return new Response(stream, { headers: SSE_HEADERS });
}
