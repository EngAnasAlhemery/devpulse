
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validatePublicHttpUrl } from "@/lib/safe-fetch";

export async function GET() {
  try {
    const monitors = await prisma.monitor.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        checks: {
          take: 1,
          orderBy: {
            checkedAt: "desc",
          },
        },
      },
    });

    return NextResponse.json(monitors);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch monitors" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const url = String(body.url ?? "").trim();

    if (!name || !url) {
      return NextResponse.json(
        { error: "Name and URL are required" },
        { status: 400 }
      );
    }

    let safeUrl: string;

    try {
      safeUrl = await validatePublicHttpUrl(url);
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Invalid or unsafe URL",
        },
        { status: 400 }
      );
    }

    const monitor = await prisma.monitor.create({
      data: {
        name,
        url: safeUrl,
      },
    });

    return NextResponse.json(monitor, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create monitor" },
      { status: 500 }
    );
  }
}
