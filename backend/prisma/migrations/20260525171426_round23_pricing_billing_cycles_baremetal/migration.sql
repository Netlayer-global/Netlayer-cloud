-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Plan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'compute',
    "cpu" INTEGER NOT NULL,
    "ramGB" INTEGER NOT NULL,
    "diskGB" INTEGER NOT NULL,
    "bandwidthTB" REAL NOT NULL,
    "priceMonthly" REAL NOT NULL,
    "priceHourly" REAL NOT NULL,
    "priceInr" REAL NOT NULL,
    "priceYearly" REAL NOT NULL DEFAULT 0,
    "hourlyEnabled" BOOLEAN NOT NULL DEFAULT true,
    "monthlyEnabled" BOOLEAN NOT NULL DEFAULT true,
    "yearlyEnabled" BOOLEAN NOT NULL DEFAULT false,
    "cpuModel" TEXT,
    "cpuCores" INTEGER,
    "cpuThreads" INTEGER,
    "diskType" TEXT NOT NULL DEFAULT 'nvme',
    "diskCount" INTEGER NOT NULL DEFAULT 1,
    "raidSupported" TEXT NOT NULL DEFAULT '[]',
    "ipv4Included" INTEGER NOT NULL DEFAULT 1,
    "ipv6Included" INTEGER NOT NULL DEFAULT 1,
    "stockTotal" INTEGER NOT NULL DEFAULT 0,
    "stockReserved" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Plan" ("bandwidthTB", "category", "cpu", "createdAt", "diskGB", "id", "isActive", "isPopular", "name", "priceHourly", "priceInr", "priceMonthly", "ramGB", "slug", "sortOrder") SELECT "bandwidthTB", "category", "cpu", "createdAt", "diskGB", "id", "isActive", "isPopular", "name", "priceHourly", "priceInr", "priceMonthly", "ramGB", "slug", "sortOrder" FROM "Plan";
DROP TABLE "Plan";
ALTER TABLE "new_Plan" RENAME TO "Plan";
CREATE UNIQUE INDEX "Plan_slug_key" ON "Plan"("slug");
CREATE TABLE "new_Server" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "nodeId" TEXT,
    "name" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "osTemplateId" TEXT NOT NULL,
    "appTemplateId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "ipv4" TEXT,
    "ipv6" TEXT,
    "proxmoxVmId" INTEGER,
    "proxmoxNode" TEXT,
    "rootPassword" TEXT,
    "specs" TEXT NOT NULL,
    "bandwidth" TEXT NOT NULL DEFAULT '{"used":0,"limit":1000}',
    "backupEnabled" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "metadata" TEXT,
    "paidUntil" DATETIME,
    "pendingPaymentRef" TEXT,
    "billingCycle" TEXT NOT NULL DEFAULT 'monthly',
    "raidConfig" TEXT,
    "customIsoId" TEXT,
    "dnsRecordId" TEXT,
    "zabbixHostId" TEXT,
    "nextBillDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Server_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Server_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Server_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Server_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Server_osTemplateId_fkey" FOREIGN KEY ("osTemplateId") REFERENCES "OsTemplate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Server_appTemplateId_fkey" FOREIGN KEY ("appTemplateId") REFERENCES "AppTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Server" ("appTemplateId", "backupEnabled", "bandwidth", "createdAt", "deletedAt", "dnsRecordId", "hostname", "id", "ipv4", "ipv6", "metadata", "name", "nextBillDate", "nodeId", "notes", "osTemplateId", "paidUntil", "pendingPaymentRef", "planId", "proxmoxNode", "proxmoxVmId", "regionId", "rootPassword", "specs", "status", "tags", "updatedAt", "userId", "zabbixHostId") SELECT "appTemplateId", "backupEnabled", "bandwidth", "createdAt", "deletedAt", "dnsRecordId", "hostname", "id", "ipv4", "ipv6", "metadata", "name", "nextBillDate", "nodeId", "notes", "osTemplateId", "paidUntil", "pendingPaymentRef", "planId", "proxmoxNode", "proxmoxVmId", "regionId", "rootPassword", "specs", "status", "tags", "updatedAt", "userId", "zabbixHostId" FROM "Server";
DROP TABLE "Server";
ALTER TABLE "new_Server" RENAME TO "Server";
CREATE UNIQUE INDEX "Server_hostname_key" ON "Server"("hostname");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
