-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN "pdfUrl" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "taxBreakdown" TEXT;

-- CreateTable
CREATE TABLE "CannedResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "StorageBucket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL DEFAULT 0,
    "objects" INTEGER NOT NULL DEFAULT 0,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "endpoint" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StorageBucket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BlockVolume" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "serverId" TEXT,
    "name" TEXT NOT NULL,
    "sizeGB" INTEGER NOT NULL,
    "region" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'available',
    "proxmoxDisk" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BlockVolume_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BlockVolume_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LoadBalancer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL DEFAULT 'round_robin',
    "ipv4" TEXT,
    "protocol" TEXT NOT NULL DEFAULT 'HTTP',
    "port" INTEGER NOT NULL DEFAULT 80,
    "healthCheck" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LoadBalancer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LoadBalancerTarget" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "loadBalancerId" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "port" INTEGER NOT NULL DEFAULT 80,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "isHealthy" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "LoadBalancerTarget_loadBalancerId_fkey" FOREIGN KEY ("loadBalancerId") REFERENCES "LoadBalancer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LoadBalancerTarget_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ManagedDatabase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "engine" TEXT NOT NULL DEFAULT 'postgresql',
    "version" TEXT NOT NULL DEFAULT '15',
    "planId" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'creating',
    "host" TEXT,
    "port" INTEGER,
    "database" TEXT,
    "username" TEXT,
    "password" TEXT,
    "backupEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ManagedDatabase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VPC" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "cidr" TEXT NOT NULL DEFAULT '10.0.0.0/16',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VPC_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VPCMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vpcId" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "privateIp" TEXT NOT NULL,
    CONSTRAINT "VPCMember_vpcId_fkey" FOREIGN KEY ("vpcId") REFERENCES "VPC" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "VPCMember_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DnsZone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DnsZone_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DnsRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "zoneId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "ttl" INTEGER NOT NULL DEFAULT 300,
    "priority" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DnsRecord_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "DnsZone" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "referrerId" TEXT NOT NULL,
    "refereeId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reward" REAL NOT NULL DEFAULT 0,
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Referral_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AbuseReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serverId" TEXT,
    "userId" TEXT,
    "reporterIp" TEXT NOT NULL,
    "reporterEmail" TEXT,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "resolvedBy" TEXT,
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AppTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "logo" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "minPlanSlug" TEXT NOT NULL DEFAULT 'c2-medium',
    "userDataScript" TEXT NOT NULL,
    "envVars" TEXT NOT NULL DEFAULT '[]',
    "ports" TEXT NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "installs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "StatusIncident" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'investigating',
    "impact" TEXT NOT NULL DEFAULT 'minor',
    "affectedServices" TEXT NOT NULL DEFAULT '[]',
    "affectedRegions" TEXT NOT NULL DEFAULT '[]',
    "updates" TEXT NOT NULL DEFAULT '[]',
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

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
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Plan" ("bandwidthTB", "cpu", "createdAt", "diskGB", "id", "isActive", "isPopular", "name", "priceHourly", "priceInr", "priceMonthly", "ramGB", "slug", "sortOrder") SELECT "bandwidthTB", "cpu", "createdAt", "diskGB", "id", "isActive", "isPopular", "name", "priceHourly", "priceInr", "priceMonthly", "ramGB", "slug", "sortOrder" FROM "Plan";
DROP TABLE "Plan";
ALTER TABLE "new_Plan" RENAME TO "Plan";
CREATE UNIQUE INDEX "Plan_slug_key" ON "Plan"("slug");
CREATE TABLE "new_Region" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "flag" TEXT NOT NULL,
    "latencyMs" INTEGER NOT NULL DEFAULT 20,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Region" ("city", "country", "countryCode", "createdAt", "flag", "id", "isActive", "name", "slug") SELECT "city", "country", "countryCode", "createdAt", "flag", "id", "isActive", "name", "slug" FROM "Region";
DROP TABLE "Region";
ALTER TABLE "new_Region" RENAME TO "Region";
CREATE UNIQUE INDEX "Region_slug_key" ON "Region"("slug");
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
INSERT INTO "new_Server" ("backupEnabled", "bandwidth", "createdAt", "deletedAt", "dnsRecordId", "hostname", "id", "ipv4", "ipv6", "name", "nextBillDate", "nodeId", "notes", "osTemplateId", "planId", "proxmoxNode", "proxmoxVmId", "regionId", "rootPassword", "specs", "status", "tags", "updatedAt", "userId", "zabbixHostId") SELECT "backupEnabled", "bandwidth", "createdAt", "deletedAt", "dnsRecordId", "hostname", "id", "ipv4", "ipv6", "name", "nextBillDate", "nodeId", "notes", "osTemplateId", "planId", "proxmoxNode", "proxmoxVmId", "regionId", "rootPassword", "specs", "status", "tags", "updatedAt", "userId", "zabbixHostId" FROM "Server";
DROP TABLE "Server";
ALTER TABLE "new_Server" RENAME TO "Server";
CREATE UNIQUE INDEX "Server_hostname_key" ON "Server"("hostname");
CREATE TABLE "new_SshKey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SshKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SshKey" ("createdAt", "fingerprint", "id", "name", "publicKey", "userId") SELECT "createdAt", "fingerprint", "id", "name", "publicKey", "userId" FROM "SshKey";
DROP TABLE "SshKey";
ALTER TABLE "new_SshKey" RENAME TO "SshKey";
CREATE TABLE "new_SupportTicket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "category" TEXT NOT NULL DEFAULT 'general',
    "department" TEXT NOT NULL DEFAULT 'support',
    "assignedTo" TEXT,
    "rating" INTEGER,
    "ratedAt" DATETIME,
    "firstReplyAt" DATETIME,
    "resolvedAt" DATETIME,
    "slaTargetAt" DATETIME,
    "slaBreached" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "closedAt" DATETIME,
    CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SupportTicket" ("assignedTo", "category", "closedAt", "createdAt", "department", "firstReplyAt", "id", "priority", "ratedAt", "rating", "resolvedAt", "status", "subject", "ticketNumber", "updatedAt", "userId") SELECT "assignedTo", "category", "closedAt", "createdAt", "department", "firstReplyAt", "id", "priority", "ratedAt", "rating", "resolvedAt", "status", "subject", "ticketNumber", "updatedAt", "userId" FROM "SupportTicket";
DROP TABLE "SupportTicket";
ALTER TABLE "new_SupportTicket" RENAME TO "SupportTicket";
CREATE UNIQUE INDEX "SupportTicket_ticketNumber_key" ON "SupportTicket"("ticketNumber");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "balance" REAL NOT NULL DEFAULT 0,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifyToken" TEXT,
    "resetToken" TEXT,
    "resetTokenExpiry" DATETIME,
    "stripeCustomerId" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "phone" TEXT,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "country" TEXT NOT NULL DEFAULT 'IN',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "language" TEXT NOT NULL DEFAULT 'en',
    "creditLimit" REAL NOT NULL DEFAULT 0,
    "loginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" DATETIME,
    "notes" TEXT,
    "metadata" TEXT,
    "company" TEXT,
    "website" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "gstNumber" TEXT,
    "vatNumber" TEXT,
    "notifEmail" BOOLEAN NOT NULL DEFAULT true,
    "notifSms" BOOLEAN NOT NULL DEFAULT false,
    "notifSlackUrl" TEXT,
    "notifPrefs" TEXT,
    "referralCode" TEXT,
    "referredById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastLoginAt" DATETIME
);
INSERT INTO "new_User" ("balance", "country", "createdAt", "creditLimit", "currency", "email", "emailVerified", "emailVerifyToken", "firstName", "id", "language", "lastLoginAt", "lastName", "lockedUntil", "loginAttempts", "metadata", "notes", "passwordHash", "phone", "phoneVerified", "resetToken", "resetTokenExpiry", "role", "status", "stripeCustomerId", "timezone", "twoFactorEnabled", "twoFactorSecret", "updatedAt") SELECT "balance", "country", "createdAt", "creditLimit", "currency", "email", "emailVerified", "emailVerifyToken", "firstName", "id", "language", "lastLoginAt", "lastName", "lockedUntil", "loginAttempts", "metadata", "notes", "passwordHash", "phone", "phoneVerified", "resetToken", "resetTokenExpiry", "role", "status", "stripeCustomerId", "timezone", "twoFactorEnabled", "twoFactorSecret", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "StorageBucket_name_key" ON "StorageBucket"("name");

-- CreateIndex
CREATE INDEX "StorageBucket_userId_idx" ON "StorageBucket"("userId");

-- CreateIndex
CREATE INDEX "BlockVolume_userId_idx" ON "BlockVolume"("userId");

-- CreateIndex
CREATE INDEX "ManagedDatabase_userId_idx" ON "ManagedDatabase"("userId");

-- CreateIndex
CREATE INDEX "VPC_userId_idx" ON "VPC"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VPCMember_vpcId_serverId_key" ON "VPCMember"("vpcId", "serverId");

-- CreateIndex
CREATE UNIQUE INDEX "DnsZone_domain_key" ON "DnsZone"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_refereeId_key" ON "Referral"("refereeId");

-- CreateIndex
CREATE INDEX "Referral_referrerId_status_idx" ON "Referral"("referrerId", "status");

-- CreateIndex
CREATE INDEX "AbuseReport_status_createdAt_idx" ON "AbuseReport"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AppTemplate_slug_key" ON "AppTemplate"("slug");

-- CreateIndex
CREATE INDEX "StatusIncident_status_createdAt_idx" ON "StatusIncident"("status", "createdAt");
