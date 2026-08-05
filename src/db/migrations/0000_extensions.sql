-- Runs before the generated migrations. citext backs profile.handle so
-- lookups by /[handle] are case-insensitive without app-layer normalization.
CREATE EXTENSION IF NOT EXISTS citext;
