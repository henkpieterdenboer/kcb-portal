import crypto from "crypto";

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function tokenExpiry(hours = 24): Date {
  return new Date(Date.now() + hours * 3600000);
}
