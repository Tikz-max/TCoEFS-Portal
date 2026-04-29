/**
 * Environment variable utilities.
 *
 * Provides a fail-fast mechanism for required environment variables.
 * Instead of getting cryptic "cannot read property of undefined" errors deep
 * in a request handler, the app throws immediately at module load time with a
 * clear message about exactly which variable is missing.
 *
 * Usage:
 *   import { env } from "@/lib/utils/env";
 *   const apiKey = env("REMITA_API_KEY");
 *
 * For optional variables with a fallback:
 *   import { envOptional } from "@/lib/utils/env";
 *   const logLevel = envOptional("LOG_LEVEL", "info");
 */

/**
 * Returns the value of a required environment variable.
 *
 * Throws at call time if the variable is not set or is an empty string.
 * This surfaces misconfiguration immediately — at module initialisation —
 * rather than silently failing mid-request.
 *
 * @param name - The environment variable name (e.g. "REMITA_API_KEY")
 * @returns The non-empty string value of the variable
 * @throws {Error} if the variable is missing or empty
 */
export function env(name: string): string {
  const value = process.env[name];

  if (value === undefined || value.trim() === "") {
    throw new Error(
      `[env] Required environment variable "${name}" is not set.\n` +
        `Check your .env.local file and ensure it matches .env.example.`
    );
  }

  return value;
}

/**
 * Returns the value of an optional environment variable, or a fallback.
 *
 * @param name     - The environment variable name
 * @param fallback - Value to return if the variable is not set
 * @returns The variable value, or the fallback
 */
export function envOptional(name: string, fallback: string): string {
  const value = process.env[name];
  return value !== undefined && value.trim() !== "" ? value : fallback;
}

/**
 * Returns the value of an environment variable parsed as a positive integer.
 *
 * @param name     - The environment variable name
 * @param fallback - Integer fallback if the variable is not set
 * @returns The parsed integer value
 * @throws {Error} if the variable is set but is not a valid positive integer
 */
export function envInt(name: string, fallback: number): number {
  const value = process.env[name];

  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  const parsed = parseInt(value, 10);

  if (isNaN(parsed) || parsed <= 0) {
    throw new Error(
      `[env] Environment variable "${name}" must be a positive integer. ` +
        `Got: "${value}"`
    );
  }

  return parsed;
}

/**
 * Returns the value of an environment variable parsed as a boolean.
 *
 * Accepts: "true", "1", "yes" → true
 *          "false", "0", "no" → false
 *
 * @param name     - The environment variable name
 * @param fallback - Boolean fallback if the variable is not set
 * @returns The parsed boolean value
 * @throws {Error} if the variable is set but is not a recognised boolean string
 */
export function envBool(name: string, fallback: boolean): boolean {
  const value = process.env[name];

  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  const lower = value.toLowerCase().trim();

  if (["true", "1", "yes"].includes(lower)) return true;
  if (["false", "0", "no"].includes(lower)) return false;

  throw new Error(
    `[env] Environment variable "${name}" must be a boolean. ` +
      `Accepted values: true, false, 1, 0, yes, no. Got: "${value}"`
  );
}

/**
 * Validates that all required environment variables are set.
 *
 * Call this once at application startup (e.g. in instrumentation.ts or a
 * top-level layout) to surface ALL missing variables at once rather than
 * one at a time as each module loads.
 *
 * @param names - Array of required variable names
 * @throws {Error} listing every missing variable if any are absent
 */
export function requireEnvVars(names: string[]): void {
  const missing = names.filter((name) => {
    const value = process.env[name];
    return value === undefined || value.trim() === "";
  });

  if (missing.length > 0) {
    throw new Error(
      `[env] The following required environment variables are not set:\n` +
        missing.map((name) => `  • ${name}`).join("\n") +
        `\n\nCheck your .env.local file and ensure it matches .env.example.`
    );
  }
}

/**
 * The complete list of environment variables required for the portal to run.
 *
 * Import and call validateAllEnvVars() in instrumentation.ts to catch
 * missing config before any requests are served.
 */
export const REQUIRED_ENV_VARS = [
  // Supabase
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  // Cloudflare R2
  "R2_ENDPOINT",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  // Resend
  "RESEND_API_KEY",
  "RESEND_FROM_ADDRESS",
  // Remita
  "REMITA_MERCHANT_ID",
  "REMITA_SERVICE_TYPE_ID",
  "REMITA_API_KEY",
  "REMITA_SECRET_KEY",
  "REMITA_PUBLIC_KEY",
  "REMITA_BASE_URL",
  // App
  "NEXT_PUBLIC_SITE_URL",
] as const;

/** Convenience: validate all required portal env vars at once. */
export function validateAllEnvVars(): void {
  requireEnvVars([...REQUIRED_ENV_VARS]);
}
