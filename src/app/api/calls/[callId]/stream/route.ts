import { NextRequest } from "next/server";
import { getProvider, mapConversationStatus } from "@/lib/server/providers";
import { generateNotes } from "@/lib/server/notes";
import { callStore } from "@/lib/server/store";
import type { CallStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const POLL_INTERVAL_MS = 2000;
const MAX_STREAM_DURATION_MS = 5 * 60 * 1000;

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

/**
 * SSE stream for one call. Replays everything already in the store, then polls
 * the provider while the call is live. Turns carry their store index so clients
 * can dedupe across reconnects, and only turns the store doesn't have yet are
 * appended — a refresh, second tab, or EventSource auto-reconnect never
 * duplicates history.
 */
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

      const send = (event: string, data: unknown) => {
        if (!closed) controller.enqueue(encoder.encode(sseEvent(event, data)));
      };

      let sentTurnCount = 0;
      const sendNewTurns = () => {
        for (; sentTurnCount < call.transcript.length; sentTurnCount++) {
          send("transcript", { ...call.transcript[sentTurnCount], index: sentTurnCount });
        }
      };

      const finish = async () => {
        if (call.status === "completed") {
          call.notes ??= await generateNotes(call);
          send("notes", call.notes);
        }
        send("done", {});
        close();
      };

      let lastStatus: CallStatus = call.status;
      send("status", { status: call.status });
      sendNewTurns();

      if (call.status === "completed" || call.status === "failed") {
        await finish();
        return;
      }

      // Still dialing, no conversation to poll yet: end without `done` so the
      // browser's EventSource auto-reconnect acts as the retry loop.
      if (!call.conversationId) {
        close();
        return;
      }

      const provider = getProvider();
      const conversationId = call.conversationId;

      while (!closed && Date.now() - startedAt < MAX_STREAM_DURATION_MS) {
        let state;
        try {
          state = await provider.getConversation(conversationId);
        } catch {
          call.status = "failed";
          send("status", { status: "failed" });
          send("done", {});
          close();
          return;
        }

        // Append only turns the store hasn't recorded (another connection may have).
        for (let i = call.transcript.length; i < state.transcript.length; i++) {
          call.transcript.push({
            ...state.transcript[i],
            timestamp: new Date().toISOString(),
          });
        }
        sendNewTurns();

        const mappedStatus = mapConversationStatus(state.status);
        if (mappedStatus !== lastStatus) {
          lastStatus = mappedStatus;
          call.status = mappedStatus;
          send("status", { status: mappedStatus });
        }

        if (mappedStatus === "completed" || mappedStatus === "failed") {
          await finish();
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      }

      close();
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
