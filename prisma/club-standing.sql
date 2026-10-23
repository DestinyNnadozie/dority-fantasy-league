-- Additive and safe to run again. Existing tables and rows are untouched.
CREATE TABLE IF NOT EXISTS "ClubStanding" (
  "team" TEXT NOT NULL PRIMARY KEY,
  "played" INTEGER NOT NULL DEFAULT 0,
  "won" INTEGER NOT NULL DEFAULT 0,
  "drawn" INTEGER NOT NULL DEFAULT 0,
  "lost" INTEGER NOT NULL DEFAULT 0,
  "gf" INTEGER NOT NULL DEFAULT 0,
  "ga" INTEGER NOT NULL DEFAULT 0,
  "pts" INTEGER NOT NULL DEFAULT 0
);
