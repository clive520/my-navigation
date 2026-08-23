# 導覽網站開發計畫書

## 📌 專案概述

| 項目 | 內容 |
|------|------|
| **專案名稱** | My Navigation |
| **目的** | 建立個人導覽網站，集中管理所有製作的網站連結 |
| **使用者** | 主要自己使用，其他人也可以訪問 |
| **開發日期** | 2026 年 8 月 |

---

## 🛠️ 技術棧

| 類別 | 技術 |
|------|------|
| **前端框架** | React 18 + Vite |
| **樣式** | Tailwind CSS |
| **後端** | Cloudflare Pages Functions |
| **API 框架** | Hono |
| **資料庫** | Cloudflare D1 (SQLite) |
| **物件儲存** | Cloudflare R2 |
| **部署** | Cloudflare Pages |
| **版本控制** | GitHub |

---

## 🌐 網路資源

| 資源 | 名稱 |
|------|------|
| **GitHub Repo** | `my-navigation` |
| **Cloudflare Pages** | `my-navigation.pages.dev` |
| **D1 資料庫** | `my-navigation-db` |
| **R2 Bucket** | `my-navigation-images` |

---

## 🎨 設計風格

- **風格**：視覺豐富（背景圖、動畫效果、色彩鮮豔）
- **佈局**：卡片式展示
- **互動**：支援搜尋、Tag 篩選、拖拽排序

---

## 🗄️ 資料庫設計

### items 表（導覽項目）

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | INTEGER | 主鍵 |
| name | TEXT | 網站名稱 |
| url | TEXT | 網站連結 |
| description | TEXT | 簡短描述 |
| image_url | TEXT | 截圖 URL（R2） |
| sort_order | INTEGER | 排序順序 |
| created_at | TEXT | 建立時間 |
| updated_at | TEXT | 更新時間 |

### tags 表（標籤）

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | INTEGER | 主鍵 |
| name | TEXT | 標籤名稱（唯一） |

### item_tags 表（關聯表）

| 欄位 | 類型 | 說明 |
|------|------|------|
| item_id | INTEGER | 項目 ID |
| tag_id | INTEGER | 標籤 ID |

---

## 🏷️ 預設標籤

| 標籤 | 說明 |
|------|------|
| 工具 | 線上工具、轉換器、計算器 |
| 學習 | 教學、課程、文件 |
| 娛樂 | 遊戲、影音、社群 |
| 開發 | 程式開發、API、框架 |
| 設計 | 設計資源、圖片、字型 |
| 商業 | 電商、行銷、金流 |
| AI | AI 工具、機器學習 |
| 其他 | 未分類 |

---

## 📝 預設範例資料

| 名稱 | Tag | 說明 |
|------|-----|------|
| GitHub | 開發 | 程式碼版本控制平台 |
| YouTube | 娛樂 | 影片分享平台 |
| Notion | 工具 | 線上筆記與知識管理 |
| Figma | 設計 | UI 設計工具 |
| ChatGPT | AI | AI 對話助手 |
| Udemy | 學習 | 線上課程平台 |
| Stripe | 商業 | 線上金流服務 |
| 範例網站 | 其他 | 測試用的範例 |

---

## 🔐 安全性

- **管理後台**：密碼保護
- **密碼儲存**：Cloudflare 環境變數
- **API 驗證**：Bearer Token 機制

---

## 📁 項目結構

```
my-navigation/
├── public/
├── src/
│   ├── components/
│   │   ├── Card.tsx
│   │   ├── SearchBar.tsx
│   │   └── TagFilter.tsx
│   ├── pages/
│   │   ├── Home.tsx
│   │   └── Admin.tsx
│   ├── hooks/
│   │   └── useItems.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
├── functions/
│   └── api/
│       ├── items.ts
│       ├── items/[id].ts
│       └── auth.ts
├── schema.sql
├── wrangler.toml
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

---

## 🛠️ 開發流程

### Phase 1: 環境建置
1. 建立 React + Vite 項目
2. 安裝 Tailwind CSS、Hono
3. 初始化 Git，推送到 GitHub

### Phase 2: Cloudflare 設定
4. 建立 D1 資料庫
5. 建立 R2 Bucket
6. 配置 wrangler.toml
7. 設定密碼環境變數

### Phase 3: 後端 API
8. 建立資料表
9. 實作 CRUD API
10. 實作密碼驗證

### Phase 4: 前端頁面
11. 主頁：卡片式導覽展示
12. 搜尋 + Tag 篩選
13. 管理後台：登入頁面
14. 管理後台：CRUD 介面
15. 圖片上傳功能
16. 拖拽排序

### Phase 5: 部署上線
17. 推送到 GitHub
18. 連接 Cloudflare Pages
19. 測試所有功能

---

## ⏱️ 時間預估

| 階段 | 時間 |
|------|------|
| Phase 1: 環境建置 | 30 分鐘 |
| Phase 2: Cloudflare 設定 | 30 分鐘 |
| Phase 3: 後端 API | 1 小時 |
| Phase 4: 前端頁面 | 1.5 小時 |
| Phase 5: 部署上線 | 30 分鐘 |
| **總計** | **4 小時** |

---

## ✅ 確認事項

- [x] 管理密碼由使用者私下設定
- [x] 使用者已確認所有需求
- [x] 計畫書已閱讀並同意

---

## 📅 開發時程

- **開始日期**：2026-08-23
- **預計完成**：2026-08-23
