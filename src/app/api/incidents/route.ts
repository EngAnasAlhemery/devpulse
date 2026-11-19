import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const incidents = await prisma.incident.findMany({
      orderBy: {
        startedAt: "desc",
      },
      include: {
        monitor: {
          select: {
            id: true,
            name: true,
            url: true,
          },
        },
      },
    });

    return NextResponse.json({
      incidents,
      count: incidents.length,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch incidents" },
      { status: 500 }
    );
  }
}