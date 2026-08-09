# CallDesk — Hackathon MVP Scope (3.5 hrs)

## Context
Hackathon build. An AI voice agent ("CallDesk") that calls hotels on behalf of a travel advisor to negotiate rates, confirm amenities, or request upgrades, then logs structured notes back. Idea deliberately triple-dips: ElevenLabs prize (voice call), Anecdote prize (structured call notes), and the AI trip-planning track. With only 3.5 hours, scope is one tight end-to-end demo path — cut anything not visible in the 90-second demo.

## Avatar
**independent travel advisor.** Manages multiple client bookings, regularly has to call hotels to negotiate rates/upgrades/amenities, hates being on hold, and has no time to type up call notes afterward for her client file.

## Feature List (priority order, wow-factor first)

1. **[WOW] Live outbound AI voice call** — ElevenLabs Conversational AI agent places a real outbound call (via ElevenLabs' native telephony or Twilio bridge) to a demo "hotel" line, briefed with the advisor's objective, and negotiates live.
2. **Call brief form** — Advisor inputs hotel name/phone, guest/booking ref, objective (Negotiate rate / Confirm amenity / Request upgrade), free-text context, and language (English/Spanish dropdown). This becomes the agent's goal/system prompt.
3. **Live transcript stream** — Real-time captions of the call rendered in the UI as it happens — the visible "this is really working" moment for judges.
4. **Structured call notes (Anecdote)** — When the call ends, transcript is run through Anecdote (or an LLM fallback if the integration is flaky) to produce a structured outcome card: result badge (Success/Partial/Declined), negotiated terms, key quotes.
5. **Call history dashboard** — Simple list of past calls with status badges. Cheap to build, makes the product feel complete rather than a one-shot demo.
6. **Bilingual toggle (EN/ES)** — Hardcoded: two preset agent language/voice configs selected via dropdown on the brief form. Not real UI i18n — just flavors the call itself for the demo.

**Explicitly cut:** auth/login, persistence beyond in-memory/local state, real hotel API integrations, multi-hotel comparison, CRM export, Tavily/Lovable integrations, full localization.

## MVP
One working end-to-end path:
Brief form → trigger ElevenLabs agent outbound call → live transcript streams into UI → call ends → structured notes card renders → call added to in-memory history list.

- No database — in-memory state (server-side store) is enough for a demo.
- No auth — app opens straight to the dashboard.
- The "hotel" side of the call is answered by a teammate's phone (or a second ElevenLabs agent playing hotel staff, if time allows — bigger wow, higher risk, treat as stretch).
- Use the shadcn/Base UI components already scaffolded for a fast, polished-looking UI (cards, badges, form inputs, buttons).
- Single sponsor integrations kept core (not bolted on): ElevenLabs for the call itself, Anecdote for structuring the notes.

## User Flow (Maria)
1. Opens CallDesk — lands directly on the dashboard (no login).
2. Dashboard shows past calls (empty state initially) + a "New Call" button.
3. Clicks "New Call" → fills the brief: hotel name/phone, guest/booking ref, objective dropdown, context notes, language (EN/ES).
4. Clicks "Start Call" — CallDesk's AI agent places the call live.
5. Watches the live transcript scroll in real time, with a speaking/status indicator.
6. Call ends — UI flips to "Call complete."
7. Structured Call Notes card appears: outcome badge, negotiated terms, key quotes, collapsible full transcript.
8. Call is added to the history list for future reference; Maria can copy the notes to her client file.

---

## API Endpoints (for frontend integration)

Base path: `/api`. All request/response bodies are JSON. Backend owns all state — frontend should not need any other data source.

### `POST /api/calls`
Create a new call brief and kick off the outbound call.

**Request body**
```json
{
  "hotelName": "string",
  "hotelPhone": "string",
  "guestName": "string",
  "bookingRef": "string",
  "objective": "negotiate_rate | confirm_amenity | request_upgrade",
  "context": "string (free text, optional)",
  "language": "en | es"
}
```

**Response `201`**
```json
{
  "callId": "string",
  "status": "queued"
}
```

### `GET /api/calls`
List call history for the dashboard, most recent first.

**Response `200`**
```json
{
  "calls": [
    {
      "callId": "string",
      "hotelName": "string",
      "guestName": "string",
      "objective": "negotiate_rate | confirm_amenity | request_upgrade",
      "status": "queued | in_progress | completed | failed",
      "outcome": "success | partial | declined | null",
      "createdAt": "ISO 8601 string"
    }
  ]
}
```

### `GET /api/calls/:callId`
Full state for a single call — brief, current transcript so far, and notes once available. Poll this if not using the SSE stream below.

**Response `200`**
```json
{
  "callId": "string",
  "status": "queued | in_progress | completed | failed",
  "brief": {
    "hotelName": "string",
    "hotelPhone": "string",
    "guestName": "string",
    "bookingRef": "string",
    "objective": "negotiate_rate | confirm_amenity | request_upgrade",
    "context": "string",
    "language": "en | es"
  },
  "transcript": [
    { "speaker": "agent | hotel", "text": "string", "timestamp": "ISO 8601 string" }
  ],
  "research": [
    { "fact": "string", "source": "string" }
  ],
  "notes": {
    "outcome": "success | partial | declined",
    "summary": "string",
    "negotiatedTerms": "string",
    "keyQuotes": ["string"],
    "discrepancies": [
      { "topic": "string", "claimed": "string", "confirmed": "string" }
    ]
  }
}
```
`notes` is `null` until the call reaches `completed`. `research` and `discrepancies` are **always present, possibly empty arrays** — pre-call web research (e.g. hotel amenities/rate found online) and any contradictions surfaced between what was claimed online vs. confirmed on the call (e.g. "breakfast included" claimed on the website, but the front desk says it costs extra). Render their sections only when non-empty; an empty array is a normal, expected state, not a loading/error state.

### `GET /api/calls/:callId/stream`
Server-Sent Events (SSE) endpoint. Frontend subscribes here right after `POST /api/calls` resolves, to render the live transcript without polling.

**Event types**
- `status` — `{ "status": "in_progress" | "completed" | "failed" }`
- `transcript` — `{ "speaker": "agent | hotel", "text": "string", "timestamp": "ISO 8601 string" }` (one event per new line of dialogue)
- `notes` — final structured notes payload (same shape as `notes` above, including `discrepancies`), sent once, right before the stream closes
- `done` — signals the stream is finished; frontend should close the `EventSource`

### `DELETE /api/calls/:callId` *(stretch, optional)*
End a call early. Returns `204` on success.

### Status values reference
- `queued` — call created, not yet dialed
- `in_progress` — call connected, live
- `completed` — call ended, notes available
- `failed` — call didn't connect / errored out

### Frontend build notes
- Objective and language values are fixed enums — safe to hardcode as dropdown options (`negotiate_rate`, `confirm_amenity`, `request_upgrade`; `en`, `es`).
- Until the real backend/ElevenLabs integration is wired up, these endpoints can be built against mock/fixture data with the same shapes above so frontend work isn't blocked.
