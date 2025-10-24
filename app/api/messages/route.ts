import { NextResponse } from "next/server";
import { logMessage } from "../../../lib/state";
import { sendGroupMessage } from "../../../lib/whatsapp";

type MessageRequest = {
  groupId: string;
  content: string;
  dryRun?: boolean;
};

export async function POST(request: Request) {
  const body = (await request.json()) as MessageRequest;

  if (!body.groupId || !body.content) {
    return NextResponse.json(
      { error: "groupId and content are required" },
      { status: 400 }
    );
  }

  try {
    if (body.dryRun) {
      logMessage({
        groupId: body.groupId,
        sender: process.env.AGENT_NAME ?? "Nova",
        content: body.content,
        fromAgent: true
      });
      return NextResponse.json({ status: "simulated" });
    }

    const result = await sendGroupMessage({
      groupId: body.groupId,
      content: body.content
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
