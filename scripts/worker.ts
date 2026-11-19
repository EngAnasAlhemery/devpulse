
import { safeFetch } from "../src/lib/safe-fetch";
import { prisma } from "../src/lib/prisma";

let isRunning = false;

async function checkMonitor(monitor: {
  id: string;
  name: string;
  url: string;
}) {
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

  await prisma.$transaction(async (tx) => {
    await tx.checkResult.create({
      data: {
        monitorId: monitor.id,
        isUp,
        statusCode,
        responseTimeMs,
        errorMessage,
      },
    });

    const openIncident = await tx.incident.findFirst({
      where: {
        monitorId: monitor.id,
        resolvedAt: null,
      },
    });

    if (!isUp && !openIncident) {
      await tx.incident.create({
        data: {
          monitorId: monitor.id,
          title: `${monitor.name} is down`,
          description: errorMessage,
        },
      });
    }

    if (isUp && openIncident) {
      await tx.incident.update({
        where: { id: openIncident.id },
        data: { resolvedAt: new Date() },
      });
    }
  });

  console.log(
    `[${new Date().toISOString()}] ${monitor.name}: ${
      isUp ? "UP" : "DOWN"
    } | HTTP ${statusCode ?? "N/A"} | ${responseTimeMs}ms`
  );
}

async function runDueChecks() {
  if (isRunning) return;

  isRunning = true;

  try {
    const monitors = await prisma.monitor.findMany({
      where: { isActive: true },
      include: {
        checks: {
          take: 1,
          orderBy: { checkedAt: "desc" },
        },
      },
    });

    const now = Date.now();

    for (const monitor of monitors) {
      const lastCheck = monitor.checks[0];

      const isDue =
        !lastCheck ||
        now - lastCheck.checkedAt.getTime() >=
          monitor.intervalSeconds * 1000;

      if (!isDue) continue;

      try {
        await checkMonitor(monitor);
      } catch (error) {
        console.error(
          `Failed to check ${monitor.name}:`,
          error
        );
      }
    }
  } catch (error) {
    console.error("Worker cycle failed:", error);
  } finally {
    isRunning = false;
  }
}

console.log("DevPulse Monitoring Worker started.");

void runDueChecks();

const scheduler = setInterval(() => {
  void runDueChecks();
}, 5000);

function shutdown() {
  console.log("Stopping DevPulse Worker...");
  clearInterval(scheduler);

  void prisma.$disconnect().finally(() => {
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
