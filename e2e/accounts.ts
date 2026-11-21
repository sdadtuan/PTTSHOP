function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Thiếu biến môi trường ${name}`);
  }
  return value;
}

export function e2eAdmin() {
  return {
    email: requiredEnv("E2E_ADMIN_EMAIL"),
    password: requiredEnv("E2E_ADMIN_PASSWORD"),
  };
}

export function e2eCustomer() {
  return {
    email: requiredEnv("E2E_CUSTOMER_EMAIL"),
    password: requiredEnv("E2E_CUSTOMER_PASSWORD"),
  };
}
