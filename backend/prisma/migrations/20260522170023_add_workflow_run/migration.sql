-- CreateTable
CREATE TABLE "WorkflowRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "currentStep" TEXT,
    "context" TEXT NOT NULL,
    "steps" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    "error" TEXT
);

-- CreateIndex
CREATE INDEX "WorkflowRun_type_status_idx" ON "WorkflowRun"("type", "status");

-- CreateIndex
CREATE INDEX "WorkflowRun_resourceId_idx" ON "WorkflowRun"("resourceId");

-- CreateIndex
CREATE INDEX "WorkflowRun_status_startedAt_idx" ON "WorkflowRun"("status", "startedAt");
