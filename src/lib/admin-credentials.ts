export class AdminCredentialsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminCredentialsError";
  }
}

type AdminCredentialEnv = {
  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD?: string;
};

export function readAdminCredentials(
  env: AdminCredentialEnv = {
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  },
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

/** Quy tắc của rotate-admin. Không đưa mật khẩu vào thông báo lỗi. */
export function assertStrongAdminPassword(password: string) {
  const strong =
    password.length >= 12 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password);
  if (!strong) {
    throw new AdminCredentialsError(
      "ADMIN_PASSWORD cần ít nhất 12 ký tự, có chữ hoa, chữ thường và số.",
    );
  }
}
