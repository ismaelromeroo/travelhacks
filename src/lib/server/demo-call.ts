import type { Call } from "../types";

const at = (base: string, seconds: number) =>
  new Date(Date.parse(base) + seconds * 1000).toISOString();

const riveraBase = "2026-08-08T14:22:00.000Z";
const mendezBase = "2026-08-07T11:05:00.000Z";

/** Past calls seeded into mock history to illustrate the product. */
export const demoCalls: Call[] = [
  {
    callId: "demo-rivera-costa-mar",
    status: "completed",
    createdAt: riveraBase,
    brief: {
      hotelName: "Costa Mar Resort",
      hotelPhone: "+1 305 555 0142",
      guestName: "Rivera family reunion",
      bookingRef: "RIV-7741",
      objective: "confirm_amenity",
      context:
        "Party of 7 checking in August 16. Need beach-view rooms if possible, dairy-free for 2 and gluten-free for 1 on breakfast and welcome dinner, and a spa block for all seven that afternoon.",
      language: "en",
    },
    research: [
      {
        fact: "Costa Mar Resort advertises ocean-view doubles and an on-site spa with 50-minute treatments.",
        source: "hotel site",
      },
    ],
    transcript: [
      {
        speaker: "agent",
        text: "Hi, this is CallDesk calling for the Rivera group, booking RIV-7741 — seven guests checking in August 16th. I have three quick asks.",
        timestamp: at(riveraBase, 1),
      },
      {
        speaker: "hotel",
        text: "Sure, go ahead.",
        timestamp: at(riveraBase, 5),
      },
      {
        speaker: "agent",
        text: "First, can we move them to beach-view rooms if anything opens? Second, two guests need dairy-free and one is gluten-free — can kitchen adapt breakfast and the welcome dinner? Third, we'd like to book a spa block that afternoon for all seven — massage or facial mix is fine.",
        timestamp: at(riveraBase, 7),
      },
      {
        speaker: "hotel",
        text: "Beach view… I can hold three ocean-view doubles and two garden rooms facing the water — that's the closest package. Dietary notes I'll flag for F&B today. For spa on the 16th at 3pm, I can lock seven fifty-minute slots if you confirm now.",
        timestamp: at(riveraBase, 16),
      },
      {
        speaker: "agent",
        text: "Confirm the spa for 3pm, take the ocean-view package, and please email the dietary confirmation to the booking file. Anything on a group rate for the spa block?",
        timestamp: at(riveraBase, 22),
      },
      {
        speaker: "hotel",
        text: "I can do 10% off the spa package when all seven book together. I'll note dietary adaptations and send written confirmation within the hour.",
        timestamp: at(riveraBase, 26),
      },
      {
        speaker: "agent",
        text: "Perfect — ocean-view package, dietary adaptations on file, spa for seven at 3pm on August 16 with the 10% group discount. Thank you.",
        timestamp: at(riveraBase, 30),
      },
    ],
    notes: {
      outcome: "success",
      summary:
        "Confirmed beach-oriented rooms, kitchen dietary adaptations, and a 7-person spa block for August 16 with a group discount.",
      negotiatedTerms:
        "3 ocean-view doubles + 2 water-facing garden rooms; dairy-free ×2 + gluten-free ×1 on breakfast & welcome dinner; spa 7×50min @ 3pm Aug 16; 10% off spa package",
      keyQuotes: [
        "I can lock seven fifty-minute slots if you confirm now.",
        "10% off the spa package when all seven book together.",
      ],
      discrepancies: [],
    },
  },
  {
    callId: "demo-mendez-hotel-sol",
    status: "completed",
    createdAt: mendezBase,
    brief: {
      hotelName: "Hotel Sol y Mar",
      hotelPhone: "+34 952 555 018",
      guestName: "Laura Méndez",
      bookingRef: "on file",
      objective: "request_upgrade",
      context: "Quiere cambiar a habitación con vista al mar para el viernes.",
      language: "es",
    },
    research: [],
    transcript: [
      {
        speaker: "agent",
        text: "Hola, llamo de parte de Laura Méndez. Tiene una reserva con ustedes para el viernes.",
        timestamp: at(mendezBase, 1),
      },
      {
        speaker: "hotel",
        text: "Sí, dígame.",
        timestamp: at(mendezBase, 4),
      },
      {
        speaker: "agent",
        text: "Quería saber si se puede cambiar a una habitación con vista al mar.",
        timestamp: at(mendezBase, 6),
      },
      {
        speaker: "hotel",
        text: "Sí, hay disponibilidad. El suplemento es de 40 euros por noche.",
        timestamp: at(mendezBase, 10),
      },
      {
        speaker: "agent",
        text: "De acuerdo, lo confirmamos. ¿Me lo puede dejar anotado?",
        timestamp: at(mendezBase, 14),
      },
      {
        speaker: "hotel",
        text: "Claro, ya lo dejo en la reserva. Que tenga buen día.",
        timestamp: at(mendezBase, 17),
      },
      {
        speaker: "agent",
        text: "Perfecto, gracias.",
        timestamp: at(mendezBase, 20),
      },
    ],
    notes: {
      outcome: "success",
      summary: "Confirmado el cambio a habitación con vista al mar, con suplemento.",
      negotiatedTerms: "Upgrade a vista al mar · suplemento +40 € por noche",
      keyQuotes: ["El suplemento es de 40 euros por noche."],
      discrepancies: [],
    },
  },
];
