/**
 * Accounts are opened with a username + password — no email. Supabase Auth
 * still requires an email internally, so we map each username to a synthetic
 * address the user never sees. A value that already contains "@" is treated as
 * a real email as-is, so existing email accounts keep working at sign-in.
 */
export const USERNAME_EMAIL_DOMAIN = "pickly.local";

export function usernameToEmail(input: string): string {
  const v = input.trim().toLowerCase();
  return v.includes("@") ? v : `${v}@${USERNAME_EMAIL_DOMAIN}`;
}
