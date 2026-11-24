import { config } from "dotenv";
import { runVerifyCli } from "../src/lib/sqlite-transfer";

config();

runVerifyCli()
  .then((code) => process.exit(code))
  .catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : "Lỗi đối chiếu");
    process.exit(1);
  });
