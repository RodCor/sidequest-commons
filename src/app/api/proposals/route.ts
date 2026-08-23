import { NextResponse } from "next/server";
import { getProposals } from "@/lib/proposals";

export const revalidate = 60;

export async function GET() {
  const proposals = await getProposals();
  return NextResponse.json(
    { proposals, generatedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
}
