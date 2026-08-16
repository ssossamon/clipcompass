CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT UNIQUE NOT NULL,
  "name" TEXT,
  "role" TEXT NOT NULL DEFAULT 'free',
  "planTier" TEXT NOT NULL DEFAULT 'free',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Lead" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'free_audit_landing_page',
  "consented" BOOLEAN NOT NULL DEFAULT false,
  "videoAuditId" TEXT,
  "capturedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "VideoAudit" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES "User"("id"),
  "videoUrl" TEXT NOT NULL,
  "videoId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "optimizationScore" INTEGER NOT NULL,
  "checklist" TEXT NOT NULL,
  "tagsVisible" BOOLEAN NOT NULL,
  "dataSource" TEXT NOT NULL DEFAULT 'youtube_data_api_v3',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "KeywordSearch" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES "User"("id"),
  "seedKeyword" TEXT NOT NULL,
  "suggestions" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "FavoriteItem" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id"),
  "itemType" TEXT NOT NULL,
  "refValue" TEXT NOT NULL,
  "savedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "RankCheck" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id"),
  "videoId" TEXT NOT NULL,
  "trackedKeyword" TEXT NOT NULL,
  "checkedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "result" TEXT NOT NULL
);
