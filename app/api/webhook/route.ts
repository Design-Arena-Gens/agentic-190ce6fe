import { NextRequest, NextResponse } from "next/server";
import { handleWebhookEvent, WhatsAppWebhookPayload } from "../../../lib/agent-runtime";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as WhatsAppWebhookPayload;
  await handleWebhookEvent(payload);
  return NextResponse.json({ received: true });
}
