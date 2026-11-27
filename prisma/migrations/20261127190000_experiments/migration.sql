CREATE TABLE IF NOT EXISTS "Experiment" (
  "key" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "variants" TEXT NOT NULL,
  "trafficPercent" INTEGER NOT NULL DEFAULT 50,
  CONSTRAINT "Experiment_pkey" PRIMARY KEY ("key")
);

INSERT INTO "Experiment" ("key", "enabled", "variants", "trafficPercent")
VALUES
  ('buy_now_copy', false, 'control,mua_ngay_hom_nay', 50),
  ('sticky_bar', false, 'control,off', 50)
ON CONFLICT ("key") DO NOTHING;
