import { NextResponse } from "next/server";
import { addGroup, getAgentState } from "../../../lib/state";
import { joinGroup } from "../../../lib/whatsapp";

type GroupRequest = {
  groupId?: string;
  name?: string;
  description?: string;
  inviteCode?: string;
  dryRun?: boolean;
};

export async function GET() {
  const { groups } = getAgentState();
  return NextResponse.json(groups);
}

export async function POST(request: Request) {
  const body = (await request.json()) as GroupRequest;

  if (!body.groupId && !body.inviteCode) {
    return NextResponse.json(
      { error: "groupId or inviteCode is required" },
      { status: 400 }
    );
  }

  if (body.dryRun) {
    const group = addGroup({
      id: body.groupId ?? body.inviteCode!,
      name: body.name ?? "Draft Group",
      description: body.description
    });
    return NextResponse.json(group);
  }

  try {
    if (body.inviteCode) {
      await joinGroup({
        inviteCode: body.inviteCode,
        name: body.name,
        description: body.description
      });
    } else {
      addGroup({
        id: body.groupId!,
        name: body.name ?? body.groupId!,
        description: body.description
      });
    }
    const { groups } = getAgentState();
    return NextResponse.json(groups);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
