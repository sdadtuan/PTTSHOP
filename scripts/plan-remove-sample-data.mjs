import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";

const groups = JSON.parse(
  readFileSync(new URL("../docs/ops/sample-removal-ids.json", import.meta.url), "utf8"),
);

if (process.argv.includes("--apply")) {
  console.error("Chưa được duyệt. Không xóa, không sửa dữ liệu.");
  process.exit(2);
}

if (!process.argv.includes("--dry-run")) {
  console.error("Chỉ chạy với --dry-run.");
  process.exit(2);
}

const dbPath = process.env.SAMPLE_DB_PATH;
if (!dbPath) {
  console.error("Thiếu SAMPLE_DB_PATH.");
  process.exit(2);
}

const db = new DatabaseSync(dbPath, { readOnly: true });
let planned = 0;
for (const [name, group] of Object.entries(groups)) {
  const found = group.ids.filter((id) => {
    const row = db.prepare(`SELECT id FROM "${group.table}" WHERE id = ?`).get(id);
    return Boolean(row);
  }).length;
  planned += found;
  console.log(`${name} ${group.action} yeu-cau=${group.ids.length} tim-thay=${found}`);
}
console.log(`tong-tim-thay=${planned}`);
console.log("dry-run: khong sua du lieu");
