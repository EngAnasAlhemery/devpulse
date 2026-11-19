
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safeFetch } from "@/lib/safe-fetch";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  _request: Request,
  context: RouteContext
) {
  const { id } = await context.params;

  try {
    const monitor = await prisma.monitor.findUnique({
      where: { id },
    });

    if (!monitor) {
      return NextResponse.json(
        { error: "Monitor not found" },
        { status: 404 }
      );
    }

    const startedAt = Date.now();
    let isUp = false;
    let statusCode: number | null = null;
    let errorMessage: string | null = null;

    try {
      const result = await safeFetch(monitor.url, 10_000);

      statusCode = result.statusCode;
      isUp = result.isUp;

      if (!isUp) {
        errorMessage = `HTTP ${result.statusCode}`;
      }
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Request failed";
    }

    const responseTimeMs = Date.now() - startedAt;

    const check = await prisma.$transaction(async (tx) => {
      const result = await tx.checkResult.create({
        data: {
          monitorId: id,
          isUp,
          statusCode,
          responseTimeMs,
          errorMessage,
        },
      });

      const openIncident = await tx.incident.findFirst({
        where: {
          monitorId: id,
          resolvedAt: null,
        },
      });

      if (!isUp && !openIncident) {
        await tx.incident.create({
          data: {
            monitorId: id,
            title: `${monitor.name} is down`,
            description: errorMessage,
          },
        });
      }

      if (isUp && openIncident) {
        await tx.incident.update({
          where: { id: openIncident.id },
          data: {
            resolvedAt: new Date(),
          },
        });
      }

      return result;
    });

    return NextResponse.json({
      monitor: monitor.name,
      isUp,
      statusCode,
      responseTimeMs,
      errorMessage,
      checkedAt: check.checkedAt,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to execute monitor check" },
      { status: 500 }
    );
  }
}
