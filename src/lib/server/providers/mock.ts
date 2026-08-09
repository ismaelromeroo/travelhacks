import { randomUUID } from "crypto";
import type {
  CallBrief,
  CallProvider,
  ConversationState,
  Language,
  Objective,
  ProviderTranscriptTurn,
} from "../../types";

interface ScriptLine extends ProviderTranscriptTurn {
  atSeconds: number;
}

const HANGUP_GRACE_SECONDS = 2;

interface ScriptStrings {
  opening: (guestName: string, bookingRef: string) => string;
  greeting: string;
  objective: Record<Objective, string>;
  checking: string;
  offer: string;
  confirmRequest: string;
  confirmReply: string;
}

const SCRIPT_STRINGS: Record<Language, ScriptStrings> = {
  en: {
    opening: (guestName, bookingRef) =>
      `Hi, this is Ava calling on behalf of ${guestName}, a client of ours. I'm calling about booking reference ${bookingRef}.`,
    greeting: "Hi there, sure, let me pull that up. How can I help?",
    objective: {
      negotiate_rate:
        "I'd like to negotiate the nightly rate on that booking — my client found a lower rate with breakfast included elsewhere.",
      confirm_amenity:
        "I just need to confirm what amenities are included with that booking, specifically breakfast.",
      request_upgrade: "I'd like to request a room upgrade for this guest if one is available.",
    },
    checking: "One moment, let me check what we can do.",
    offer: "I can offer $189 a night with breakfast included, down from $210.",
    confirmRequest: "That works great. Could you send written confirmation for our records?",
    confirmReply: "Absolutely, I'll email that over now. Have a great day.",
  },
  es: {
    opening: (guestName, bookingRef) =>
      `Hola, hablo en nombre de ${guestName}, cliente de nuestra agencia de viajes. Los llamo respecto a la reserva ${bookingRef}.`,
    greeting: "Buenas tardes, claro, ¿en qué puedo ayudarle?",
    objective: {
      negotiate_rate:
        "Quisiera negociar la tarifa de esa reserva. Nuestro cliente encontró una tarifa más baja y con desayuno incluido en otra plataforma.",
      confirm_amenity:
        "Solo necesito confirmar qué servicios están incluidos en esa reserva, específicamente el desayuno.",
      request_upgrade:
        "Quisiera solicitar una mejora de habitación para este huésped, si hay alguna disponible.",
    },
    checking: "Déjeme revisar la reserva un momento.",
    offer: "Puedo ofrecer 189 dólares por noche con desayuno incluido, en lugar de 210.",
    confirmRequest: "Eso funciona perfectamente. ¿Podría confirmarlo por escrito para nuestros registros?",
    confirmReply: "Por supuesto, se lo confirmo ahora mismo por correo. Que tenga buen día.",
  },
};

function scriptFor(brief: CallBrief): ScriptLine[] {
  const s = SCRIPT_STRINGS[brief.language];
  return [
    { speaker: "agent", text: s.opening(brief.guestName, brief.bookingRef), atSeconds: 1 },
    { speaker: "hotel", text: s.greeting, atSeconds: 4 },
    { speaker: "agent", text: s.objective[brief.objective], atSeconds: 7 },
    { speaker: "hotel", text: s.checking, atSeconds: 11 },
    { speaker: "hotel", text: s.offer, atSeconds: 16 },
    { speaker: "agent", text: s.confirmRequest, atSeconds: 19 },
    { speaker: "hotel", text: s.confirmReply, atSeconds: 22 },
  ];
}

const sessions = new Map<string, { startedAt: number; script: ScriptLine[] }>();

export const startCall: CallProvider["startCall"] = async (brief) => {
  const conversationId = `mock_${randomUUID()}`;
  sessions.set(conversationId, { startedAt: Date.now(), script: scriptFor(brief) });
  return conversationId;
};

export const getConversation: CallProvider["getConversation"] = async (conversationId) => {
  const session = sessions.get(conversationId);
  if (!session) {
    throw new Error(`Unknown mock conversation: ${conversationId}`);
  }

  const elapsedSeconds = (Date.now() - session.startedAt) / 1000;
  const revealed = session.script.filter((line) => line.atSeconds <= elapsedSeconds);
  const lastLineAt = session.script[session.script.length - 1].atSeconds;

  const state: ConversationState = {
    status: elapsedSeconds >= lastLineAt + HANGUP_GRACE_SECONDS ? "done" : "in-progress",
    transcript: revealed.map(({ speaker, text }) => ({ speaker, text })),
  };
  return state;
};
