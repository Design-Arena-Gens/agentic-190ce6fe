import { NextResponse } from "next/server";
import { getAgentState } from "../../../lib/state";

export async function GET() {
  return NextResponse.json(getAgentState());
}
