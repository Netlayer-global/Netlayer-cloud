-- AlterTable
ALTER TABLE "Server" ADD COLUMN "paidUntil" DATETIME;
ALTER TABLE "Server" ADD COLUMN "pendingPaymentRef" TEXT;

-- CreateTable
CREATE TABLE "DeployOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "osTemplateId" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "tax" REAL NOT NULL DEFAULT 0,
    "taxBreakdown" TEXT,
    "total" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "provider" TEXT NOT NULL DEFAULT 'razorpay',
    "providerOrderId" TEXT,
    "providerPaymentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" DATETIME NOT NULL,
    "paidAt" DATETIME,
    "invoiceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DeployOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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
    "billingMode" TEXT NOT NULL DEFAULT 'retail',
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
INSERT INTO "new_User" ("addressLine1", "addressLine2", "balance", "city", "company", "country", "createdAt", "creditLimit", "currency", "dataExportedAt", "email", "emailVerified", "emailVerifyToken", "firstName", "gstNumber", "id", "language", "lastLoginAt", "lastName", "lockedUntil", "loginAttempts", "metadata", "notes", "notifEmail", "notifPrefs", "notifSlackUrl", "notifSms", "onboardingDone", "passwordHash", "phone", "phoneVerified", "postalCode", "referralCode", "referredById", "resetToken", "resetTokenExpiry", "role", "state", "status", "stripeCustomerId", "timezone", "twoFactorEnabled", "twoFactorSecret", "updatedAt", "vatNumber", "website") SELECT "addressLine1", "addressLine2", "balance", "city", "company", "country", "createdAt", "creditLimit", "currency", "dataExportedAt", "email", "emailVerified", "emailVerifyToken", "firstName", "gstNumber", "id", "language", "lastLoginAt", "lastName", "lockedUntil", "loginAttempts", "metadata", "notes", "notifEmail", "notifPrefs", "notifSlackUrl", "notifSms", "onboardingDone", "passwordHash", "phone", "phoneVerified", "postalCode", "referralCode", "referredById", "resetToken", "resetTokenExpiry", "role", "state", "status", "stripeCustomerId", "timezone", "twoFactorEnabled", "twoFactorSecret", "updatedAt", "vatNumber", "website" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "DeployOrder_serverId_key" ON "DeployOrder"("serverId");

-- CreateIndex
CREATE INDEX "DeployOrder_userId_status_idx" ON "DeployOrder"("userId", "status");

-- CreateIndex
CREATE INDEX "DeployOrder_status_expiresAt_idx" ON "DeployOrder"("status", "expiresAt");
