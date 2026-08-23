-- 建立項目表
CREATE TABLE IF NOT EXISTS items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  url         TEXT NOT NULL,
  description TEXT,
  image_url   TEXT,
  sort_order  INTEGER DEFAULT 0,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);

-- 建立標籤表
CREATE TABLE IF NOT EXISTS tags (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

-- 建立關聯表
CREATE TABLE IF NOT EXISTS item_tags (
  item_id INTEGER,
  tag_id  INTEGER,
  PRIMARY KEY (item_id, tag_id)
);

-- 建立項目檔案表
CREATE TABLE IF NOT EXISTS item_files (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id       INTEGER NOT NULL,
  file_name     TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_type     TEXT NOT NULL,
  file_size     INTEGER NOT NULL,
  created_at    TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

-- 建立允許的檔案類型表
CREATE TABLE IF NOT EXISTS file_types (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  extension  TEXT NOT NULL UNIQUE,
  mime_type  TEXT NOT NULL,
  label      TEXT NOT NULL,
  enabled    INTEGER DEFAULT 1
);

-- 插入預設標籤
INSERT INTO tags (name) VALUES ('工具');
INSERT INTO tags (name) VALUES ('學習');
INSERT INTO tags (name) VALUES ('娛樂');
INSERT INTO tags (name) VALUES ('開發');
INSERT INTO tags (name) VALUES ('設計');
INSERT INTO tags (name) VALUES ('商業');
INSERT INTO tags (name) VALUES ('AI');
INSERT INTO tags (name) VALUES ('其他');

-- 插入預設檔案類型
INSERT INTO file_types (extension, mime_type, label, enabled) VALUES ('txt', 'text/plain', '純文字檔案', 1);
INSERT INTO file_types (extension, mime_type, label, enabled) VALUES ('md', 'text/markdown', 'Markdown 檔案', 1);
INSERT INTO file_types (extension, mime_type, label, enabled) VALUES ('png', 'image/png', 'PNG 圖片', 1);
INSERT INTO file_types (extension, mime_type, label, enabled) VALUES ('jpg', 'image/jpeg', 'JPG 圖片', 1);
INSERT INTO file_types (extension, mime_type, label, enabled) VALUES ('jpeg', 'image/jpeg', 'JPEG 圖片', 1);
INSERT INTO file_types (extension, mime_type, label, enabled) VALUES ('gif', 'image/gif', 'GIF 圖片', 1);
INSERT INTO file_types (extension, mime_type, label, enabled) VALUES ('pdf', 'application/pdf', 'PDF 文件', 1);

-- 插入預設項目
INSERT INTO items (name, url, description, sort_order) VALUES ('GitHub', 'https://github.com', '程式碼版本控制平台', 1);
INSERT INTO items (name, url, description, sort_order) VALUES ('YouTube', 'https://youtube.com', '影片分享平台', 2);
INSERT INTO items (name, url, description, sort_order) VALUES ('Notion', 'https://notion.so', '線上筆記與知識管理', 3);
INSERT INTO items (name, url, description, sort_order) VALUES ('Figma', 'https://figma.com', 'UI 設計工具', 4);
INSERT INTO items (name, url, description, sort_order) VALUES ('ChatGPT', 'https://chat.openai.com', 'AI 對話助手', 5);
INSERT INTO items (name, url, description, sort_order) VALUES ('Udemy', 'https://udemy.com', '線上課程平台', 6);
INSERT INTO items (name, url, description, sort_order) VALUES ('Stripe', 'https://stripe.com', '線上金流服務', 7);

-- 建立預設關聯
INSERT INTO item_tags (item_id, tag_id) VALUES (1, 4); -- GitHub -> 開發
INSERT INTO item_tags (item_id, tag_id) VALUES (2, 3); -- YouTube -> 娛樂
INSERT INTO item_tags (item_id, tag_id) VALUES (3, 1); -- Notion -> 工具
INSERT INTO item_tags (item_id, tag_id) VALUES (4, 5); -- Figma -> 設計
INSERT INTO item_tags (item_id, tag_id) VALUES (5, 7); -- ChatGPT -> AI
INSERT INTO item_tags (item_id, tag_id) VALUES (6, 2); -- Udemy -> 學習
INSERT INTO item_tags (item_id, tag_id) VALUES (7, 6); -- Stripe -> 商業
