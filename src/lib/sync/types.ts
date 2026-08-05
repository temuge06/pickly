import type { activityItem, connection } from "@/db/schema";

export type Connection = typeof connection.$inferSelect;

/** A normalized item ready to insert into activity_item (profile_id added by
 * the runner). */
export type NormalizedItem = Omit<
  typeof activityItem.$inferInsert,
  "id" | "profileId" | "createdAt"
>;

export type Tokens = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scopes?: string;
};

/**
 * One adapter per provider. Adding a provider later means writing one file that
 * implements this — the sync runner and the profile page never change.
 * `sync` may throw `RevokedError` to signal the connection should be marked
 * revoked (dead token) rather than a transient error.
 */
export interface ProviderAdapter {
  provider: string;
  sync(connection: Connection): Promise<NormalizedItem[]>;
  refreshAuth?(connection: Connection): Promise<Tokens>;
}

/** Thrown by an adapter when auth is permanently dead (refresh failed). The
 * runner sets status = 'revoked'. */
export class RevokedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RevokedError";
  }
}
