import LiveCall from "./live-call";

export default async function CallPage({ params }: PageProps<"/calls/[callId]">) {
  const { callId } = await params;
  return <LiveCall callId={callId} />;
}
