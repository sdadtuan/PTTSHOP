import { PrismaClient } from "@prisma/client";
import { runAbandonedCartDry } from "../src/lib/notify/abandoned-cart";

const db = new PrismaClient();
runAbandonedCartDry(db)
  .then((counts) => {
    process.stdout.write(`${JSON.stringify({ mode: "dry-run", ...counts })}\n`);
  })
  .catch(() => {
    process.stdout.write(`${JSON.stringify({ mode: "dry-run", ok: false })}\n`);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
