-- CreateTable
CREATE TABLE "IpPool" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "regionId" TEXT NOT NULL,
    "cidr" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'public',
    "gateway" TEXT NOT NULL,
    "dns1" TEXT NOT NULL DEFAULT '8.8.8.8',
    "dns2" TEXT NOT NULL DEFAULT '1.1.1.1',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IpPool_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IpAddress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "poolId" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'available',
    "serverId" TEXT,
    "assignedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IpAddress_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "IpPool" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "IpAddress_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PromoCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'credit',
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "usageLimit" INTEGER NOT NULL DEFAULT 100,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "minTopup" REAL NOT NULL DEFAULT 0,
    "expiresAt" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PromoRedemption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "promoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PromoRedemption_promoId_fkey" FOREIGN KEY ("promoId") REFERENCES "PromoCode" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PromoRedemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IsoImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL DEFAULT 0,
    "nodeId" TEXT,
    "downloadUrl" TEXT,
    "proxmoxTask" TEXT,
    "status" TEXT NOT NULL DEFAULT 'available',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IsoImage_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FloatingIp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "serverId" TEXT,
    "rdns" TEXT,
    "status" TEXT NOT NULL DEFAULT 'unassigned',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FloatingIp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FloatingIp_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FloatingIp_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AlertRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "serverId" TEXT,
    "name" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "threshold" REAL NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 5,
    "channels" TEXT NOT NULL DEFAULT '[]',
    "webhookUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastFiredAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AlertRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AlertRule_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "source" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "StatusSubscriber" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "onboardingDone" BOOLEAN NOT NULL DEFAULT false,
    "dataExportedAt" DATETIME,
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
INSERT INTO "new_User" ("addressLine1", "addressLine2", "balance", "city", "company", "country", "createdAt", "creditLimit", "currency", "email", "emailVerified", "emailVerifyToken", "firstName", "gstNumber", "id", "language", "lastLoginAt", "lastName", "lockedUntil", "loginAttempts", "metadata", "notes", "notifEmail", "notifPrefs", "notifSlackUrl", "notifSms", "passwordHash", "phone", "phoneVerified", "postalCode", "referralCode", "referredById", "resetToken", "resetTokenExpiry", "role", "state", "status", "stripeCustomerId", "timezone", "twoFactorEnabled", "twoFactorSecret", "updatedAt", "vatNumber", "website") SELECT "addressLine1", "addressLine2", "balance", "city", "company", "country", "createdAt", "creditLimit", "currency", "email", "emailVerified", "emailVerifyToken", "firstName", "gstNumber", "id", "language", "lastLoginAt", "lastName", "lockedUntil", "loginAttempts", "metadata", "notes", "notifEmail", "notifPrefs", "notifSlackUrl", "notifSms", "passwordHash", "phone", "phoneVerified", "postalCode", "referralCode", "referredById", "resetToken", "resetTokenExpiry", "role", "state", "status", "stripeCustomerId", "timezone", "twoFactorEnabled", "twoFactorSecret", "updatedAt", "vatNumber", "website" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "IpPool_regionId_idx" ON "IpPool"("regionId");

-- CreateIndex
CREATE UNIQUE INDEX "IpAddress_ip_key" ON "IpAddress"("ip");

-- CreateIndex
CREATE INDEX "IpAddress_poolId_status_idx" ON "IpAddress"("poolId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");

-- CreateIndex
CREATE INDEX "PromoCode_isActive_expiresAt_idx" ON "PromoCode"("isActive", "expiresAt");

-- CreateIndex
CREATE INDEX "PromoRedemption_userId_idx" ON "PromoRedemption"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PromoRedemption_promoId_userId_key" ON "PromoRedemption"("promoId", "userId");

-- CreateIndex
CREATE INDEX "IsoImage_nodeId_status_idx" ON "IsoImage"("nodeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "FloatingIp_ip_key" ON "FloatingIp"("ip");

-- CreateIndex
CREATE INDEX "FloatingIp_userId_idx" ON "FloatingIp"("userId");

-- CreateIndex
CREATE INDEX "FloatingIp_regionId_idx" ON "FloatingIp"("regionId");

-- CreateIndex
CREATE INDEX "FloatingIp_serverId_idx" ON "FloatingIp"("serverId");

-- CreateIndex
CREATE INDEX "AlertRule_userId_isActive_idx" ON "AlertRule"("userId", "isActive");

-- CreateIndex
CREATE INDEX "AlertRule_serverId_idx" ON "AlertRule"("serverId");

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistEntry_email_product_key" ON "WaitlistEntry"("email", "product");

-- CreateIndex
CREATE UNIQUE INDEX "StatusSubscriber_email_key" ON "StatusSubscriber"("email");
