import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Only available in test/dev environments — never expose user IDs in production
export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const { email } = await req.json();
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ id: user.id });
}
