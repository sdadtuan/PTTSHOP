-- CreateTable
CREATE TABLE "Consent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subject" TEXT NOT NULL,
    "userId" TEXT,
    "purpose" TEXT NOT NULL,
    "policyVersion" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT true,
    "ip" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'grant',
    "requestType" TEXT,
    "detail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'recorded',
    "handledAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Consent_subject_idx" ON "Consent"("subject");

-- CreateIndex
CREATE INDEX "Consent_status_idx" ON "Consent"("status");
