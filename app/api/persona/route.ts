import { NextResponse } from "next/server";
import { AgentPersona, updatePersona } from "../../../lib/state";

export async function PUT(request: Request) {
  const data = (await request.json()) as Partial<AgentPersona>;
  const persona = updatePersona(data);
  return NextResponse.json(persona);
}
