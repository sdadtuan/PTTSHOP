-- Trợ lý AI. Mặc định tắt, provider rỗng. Không chứa khóa LLM.
CREATE TABLE "ChatSettings" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "provider" TEXT NOT NULL DEFAULT '',
  "sessionTokenBudget" INTEGER,
  "dailyTokenBudget" INTEGER,
  "ttlDays" INTEGER NOT NULL DEFAULT 30,
  CONSTRAINT "ChatSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChatSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "tokenCount" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ChatSession_expiresAt_idx" ON "ChatSession"("expiresAt");

CREATE TABLE "ChatMessage" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "citationsJson" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ChatMessage_sessionId_idx" ON "ChatMessage"("sessionId");
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ChatUsageDay" (
  "id" TEXT NOT NULL,
  "day" TEXT NOT NULL,
  "tokens" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "ChatUsageDay_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ChatUsageDay_day_key" ON "ChatUsageDay"("day");
