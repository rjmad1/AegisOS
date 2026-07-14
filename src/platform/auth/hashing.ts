// src/platform/auth/hashing.ts
// Secure password hashing and verification using Node's native crypto module.

import crypto from "crypto";

const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const ALGORITHM = "sha512";

/**
 * Hashes a plaintext password using PBKDF2 with SHA-512.
 * Output format: pbkdf2$iterations$salt$hash (hex encoded)
 */
export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, ALGORITHM, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`pbkdf2$${ITERATIONS}$${salt}$${derivedKey.toString("hex")}`);
    });
  });
}

/**
 * Compares a plaintext password against a derived key hash.
 */
export async function comparePassword(password: string, storedHash: string): Promise<boolean> {
  // If the hash is not formatted with our scheme, fallback to plaintext comparison (or reject)
  // To assist migration, let's allow comparing plaintext if it doesn't start with pbkdf2$
  if (!storedHash.startsWith("pbkdf2$")) {
    return password === storedHash;
  }

  return new Promise((resolve, reject) => {
    const parts = storedHash.split("$");
    if (parts.length !== 4) {
      return reject(new Error("Invalid stored hash format"));
    }

    const iterations = parseInt(parts[1], 10);
    const salt = parts[2];
    const keyHex = parts[3];

    crypto.pbkdf2(password, salt, iterations, KEY_LENGTH, ALGORITHM, (err, derivedKey) => {
      if (err) return reject(err);
      // Use timingSafeEqual to protect against timing attacks
      const bufferA = Buffer.from(keyHex, "hex");
      const bufferB = derivedKey;
      if (bufferA.length !== bufferB.length) {
        resolve(false);
      } else {
        resolve(crypto.timingSafeEqual(bufferA, bufferB));
      }
    });
  });
}
