-- CreateTable
CREATE TABLE "monitors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "intervalSeconds" INTEGER NOT NULL DEFAULT 60,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "check_results" (
    "id" TEXT NOT NULL,
    "isUp" BOOLEAN NOT NULL,
    "statusCode" INTEGER,
    "responseTimeMs" INTEGER,
    "errorMessage" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "monitorId" TEXT NOT NULL,

    CONSTRAINT "check_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "monitorId" TEXT NOT NULL,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "monitors_isActive_idx" ON "monitors"("isActive");

-- CreateIndex
CREATE INDEX "check_results_monitorId_checkedAt_idx" ON "check_results"("monitorId", "checkedAt");

-- CreateIndex
CREATE INDEX "incidents_monitorId_startedAt_idx" ON "incidents"("monitorId", "startedAt");

-- AddForeignKey
ALTER TABLE "check_results" ADD CONSTRAINT "check_results_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "monitors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "monitors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
