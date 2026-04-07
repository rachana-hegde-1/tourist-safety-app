import crypto from "node:crypto";

export function generateFirCaseNumber(now = new Date()) {
  const year = now.getFullYear();
  const digits = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
  return `FIR-${year}-${digits}`;
}

