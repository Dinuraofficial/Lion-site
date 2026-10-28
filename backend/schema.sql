CREATE TABLE IF NOT EXISTS inquiries (
 id TEXT PRIMARY KEY, created_at TEXT NOT NULL, category TEXT NOT NULL,
 name TEXT NOT NULL, contact TEXT NOT NULL, pathway TEXT NOT NULL,
 avenue TEXT NOT NULL, message TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new'
);
CREATE TABLE IF NOT EXISTS content (
 id TEXT PRIMARY KEY, kind TEXT NOT NULL CHECK (kind IN ('leader','project','link')),
 title TEXT NOT NULL, detail TEXT NOT NULL, url TEXT NOT NULL DEFAULT '',
 published INTEGER NOT NULL DEFAULT 0 CHECK (published IN (0,1)),
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
