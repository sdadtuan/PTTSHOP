export class AdminCredentialsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminCredentialsError";
  }
}

export function readAdminCredentials(
  env: NodeJS.ProcessEnv = process.env,
): { email: string; password: string } {
  const email = env.ADMIN_EMAIL?.trim().toLowerCase() ?? "";
  const password = env.ADMIN_PASSWORD ?? "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AdminCredentialsError("ADMIN_EMAIL không hợp lệ.");
  }
  if (password.length < 8) {
    throw new AdminCredentialsError("ADMIN_PASSWORD phải có ít nhất 8 ký tự.");
  }
  return { email, password };
}
