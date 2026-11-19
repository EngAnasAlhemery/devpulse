
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [monitors, openIncidents, recentChecks, uptimeChecks] =
      await Promise.all([
        prisma.monitor.findMany({
          select: {
            id: true,
            isActive: true,
            checks: {
              take: 1,
              orderBy: { checkedAt: "desc" },
              select: {
                isUp: true,
                checkedAt: true,
              },
            },
          },
        }),
        prisma.incident.count({
          where: { resolvedAt: null },
        }),
        prisma.checkResult.findMany({
          where: {
            checkedAt: { gte: last24Hours },
          },
          orderBy: { checkedAt: "asc" },
          select: {
            isUp: true,
            responseTimeMs: true,
            checkedAt: true,
          },
        }),
        prisma.checkResult.findMany({
          where: {
            checkedAt: { gte: last30Days },
          },
          select: {
            isUp: true,
          },
        }),
      ]);

    const activeMonitors = monitors.filter((monitor) => monitor.isActive);
    const operational = activeMonitors.filter(
      (monitor) => monitor.checks[0]?.isUp === true
    ).length;
    const down = activeMonitors.filter(
      (monitor) => monitor.checks[0]?.isUp === false
    ).length;
    const pending = activeMonitors.filter(
      (monitor) => monitor.checks.length === 0
    ).length;

    const responseTimes = recentChecks
      .map((check) => check.responseTimeMs)
      .filter((value): value is number => value !== null);

    const averageResponseTime =
      responseTimes.length > 0
        ? Math.round(
            responseTimes.reduce((sum, value) => sum + value, 0) /
              responseTimes.length
          )
        : null;

    const successfulChecks = uptimeChecks.filter(
      (check) => check.isUp
    ).length;

    const uptime =
      uptimeChecks.length > 0
        ? Number(
            ((successfulChecks / uptimeChecks.length) * 100).toFixed(2)
          )
        : null;

    const chartBuckets = Array.from({ length: 24 }, (_, hour) => {
      const bucketStart = new Date(last24Hours);
      bucketStart.setHours(bucketStart.getHours() + hour);

      const bucketEnd = new Date(bucketStart);
      bucketEnd.setHours(bucketEnd.getHours() + 1);

      const bucketChecks = recentChecks.filter(
        (check) =>
          check.checkedAt >= bucketStart &&
          check.checkedAt < bucketEnd &&
          check.responseTimeMs !== null
      );

      const average =
        bucketChecks.length > 0
          ? Math.round(
              bucketChecks.reduce(
                (sum, check) => sum + (check.responseTimeMs ?? 0),
                0
              ) / bucketChecks.length
            )
          : null;

      return {
        hour: bucketStart.toISOString(),
        averageResponseTime: average,
        checks: bucketChecks.length,
      };
    });

    return NextResponse.json({
      generatedAt: now.toISOString(),
      monitors: {
        total: monitors.length,
        active: activeMonitors.length,
        paused: monitors.length - activeMonitors.length,
        operational,
        down,
        pending,
      },
      incidents: {
        open: openIncidents,
      },
      uptime: {
        percentage: uptime,
        periodDays: 30,
        totalChecks: uptimeChecks.length,
      },
      responseTime: {
        averageMs: averageResponseTime,
        periodHours: 24,
        totalChecks: responseTimes.length,
        chart: chartBuckets,
      },
    });
  } catch (error) {
    console.error("Dashboard API error:", error);

    return NextResponse.json(
      { error: "Failed to load dashboard statistics" },
      { status: 500 }
    );
  }
}
