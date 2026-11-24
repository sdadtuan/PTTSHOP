/** Postgres chỉ dùng cho test. Không trỏ tới production. */
export const TEST_PG_HOST = process.env.TEST_PG_HOST || "127.0.0.1";
export const TEST_PG_PORT = process.env.TEST_PG_PORT || "54329";
export const TEST_PG_USER = process.env.TEST_PG_USER || "pttshop_test";

export function testPgUrl(database = "pttshop_test") {
  return `postgresql://${TEST_PG_USER}@${TEST_PG_HOST}:${TEST_PG_PORT}/${database}`;
}
