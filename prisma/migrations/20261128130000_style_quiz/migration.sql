-- Quiz phong cách. Tắt mặc định. Không seed câu đang bật.
CREATE TABLE "QuizSettings" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "QuizSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuizQuestion" (
  "id" TEXT NOT NULL,
  "prompt" TEXT NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuizOption" (
  "id" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0,
  "categorySlug" TEXT,
  "gender" TEXT,
  "priceMax" INTEGER,
  CONSTRAINT "QuizOption_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "QuizOption_questionId_idx" ON "QuizOption"("questionId");
ALTER TABLE "QuizOption" ADD CONSTRAINT "QuizOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuizQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
