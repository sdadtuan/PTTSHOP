import { config } from "dotenv";
import { runImport } from "../src/lib/sqlite-transfer";

config();

runImport()
  .then((code) => process.exit(code))
  .catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : "Lỗi nhập");
    process.exit(1);
  });
