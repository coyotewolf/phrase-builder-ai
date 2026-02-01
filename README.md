# Vocabulary Flow 📚

**智慧單字學習助手** — 一款結合科學記憶法與 AI 智能的現代化單字記憶應用

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Platform](https://img.shields.io/badge/platform-Web%20%7C%20PWA-green)
![License](https://img.shields.io/badge/license-MIT-yellow)

---

## 📖 目錄

- [專案簡介](#-專案簡介)
- [核心功能](#-核心功能)
- [技術架構](#-技術架構)
- [安裝與運行](#-安裝與運行)
- [使用指南](#-使用指南)
- [資料結構](#-資料結構)
- [開發指南](#-開發指南)
- [部署說明](#-部署說明)
- [常見問題](#-常見問題)
- [貢獻指南](#-貢獻指南)

---

## 🎯 專案簡介

### 開發動機

Vocabulary Flow 是專為語言學習者設計的單字記憶應用，解決了傳統背單字方法的幾個核心問題：

1. **記憶效率低** — 傳統的死記硬背容易遺忘
2. **缺乏科學方法** — 沒有根據記憶曲線安排複習
3. **內容準備繁瑣** — 手動整理單字資料費時費力
4. **學習進度不透明** — 難以掌握自己的學習狀況

### 解決方案

本應用整合了以下解決方案：

- **SM-2 間隔重複演算法** — 根據艾賓浩斯遺忘曲線科學安排複習時間
- **Gemini AI 智能輔助** — 自動生成音標、釋義、例句、同義詞等完整資料
- **視覺化學習統計** — 即時追蹤學習進度、正確率、連續天數
- **多元複習模式** — 支援傳統模式、SRS 模式、錯誤優先等多種學習策略

### 目標使用者

- 📚 準備英語考試的學生（高中7000單、托福、雅思、GRE、SAT等）
- 🌍 想要擴展詞彙量的語言學習者
- 💼 需要商務英語或學術英語的專業人士
- 🎓 任何想要用科學方法記憶單字的人

---

## ✨ 核心功能

### 1. 智慧單詞書管理

| 功能 | 說明 |
|------|------|
| **多本單詞書** | 按主題、考試類型、難度等分類管理 |
| **CSV 匯入/匯出** | 支援批量匯入單字，方便與其他工具整合 |
| **預設詞庫** | 內建高中7000單、托福3000、GRE3000等常用詞庫 |
| **自定義標籤** | 為單字添加標籤，方便篩選和分類 |
| **星號收藏** | 標記重要或困難的單字 |

### 2. AI 智能生成

使用 Google Gemini AI 自動補齊單字資料：

- 🔤 **KK/IPA 音標** — 正確的發音標記
- 📝 **中英文釋義** — 精確的語意解釋
- 📖 **詞性標註** — 名詞、動詞、形容詞等
- 🔄 **同義詞/反義詞** — 擴展詞彙網絡
- 💬 **例句** — 實際語境中的使用方式
- 📌 **學習筆記** — AI 生成的記憶技巧

### 3. 科學複習系統

#### 間隔重複系統 (SRS)

採用經典的 **SM-2 演算法**：

```
新間隔 = 舊間隔 × 難易度係數 (EF)
難易度係數 = EF + (0.1 - (5 - 品質) × (0.08 + (5 - 品質) × 0.02))
```

| 複習結果 | 品質分數 | 效果 |
|----------|----------|------|
| 完全正確 | 4 | 間隔延長，下次更久後複習 |
| 錯誤 | 1 | 間隔重置，短期內再次複習 |

#### 傳統模式

複習昨天學習過的所有單字，適合：
- 初次接觸 SRS 概念的使用者
- 偏好固定複習節奏的學習者
- 短期密集學習需求

### 4. 多元學習模式

| 模式 | 說明 | 適用場景 |
|------|------|----------|
| **待複習** | SRS 到期的卡片 + 新卡片 | 日常學習 |
| **常見錯誤** | 錯誤率高的單字 | 針對性加強 |
| **新單字** | 尚未學習的新卡片 | 擴展詞彙 |
| **全部複習** | 單詞書內所有卡片 | 考前衝刺 |
| **隨機模式** | 打亂順序複習 | 增加挑戰 |

### 5. 學習統計

- 📊 **今日進度** — 當日完成數量與目標對比
- 🔥 **連續天數** — 連續學習的天數追蹤
- 📈 **正確率分析** — 各單詞書的正確率統計
- ⏰ **複習歷史** — 每日複習記錄查詢
- 🎯 **里程碑通知** — 達成目標時的成就提醒

### 6. 個人化設定

- 🎯 每日學習目標設定
- 🔔 學習提醒（可設定時間和星期）
- 🗣️ TTS 語音朗讀（多種語音選擇）
- 🌓 深色/淺色主題切換
- 📱 響應式設計，支援手機和桌面

### 7. 雲端同步

- ☁️ Firebase 帳號登入
- 🔄 資料自動備份與同步
- 📤 跨設備存取

---

## 🛠 技術架構

### 前端技術棧

| 技術 | 版本 | 用途 |
|------|------|------|
| **React** | 18.3 | UI 框架 |
| **TypeScript** | 5.x | 型別安全 |
| **Vite** | 5.4 | 建置工具 |
| **Tailwind CSS** | 3.x | 樣式框架 |
| **shadcn/ui** | latest | UI 元件庫 |
| **React Router** | 6.x | 路由管理 |
| **TanStack Query** | 5.x | 資料管理 |
| **Framer Motion** | 12.x | 動畫效果 |

### 後端與儲存

| 技術 | 用途 |
|------|------|
| **IndexedDB** | 本地資料持久化 |
| **Firebase Auth** | 使用者認證 |
| **Firestore** | 雲端資料同步 |
| **Firebase Storage** | 圖片儲存 |

### AI 整合

| 服務 | 用途 |
|------|------|
| **Google Gemini API** | 單字資料生成 |
| **Web Speech API** | 文字轉語音 |

### 專案結構

```
src/
├── components/          # React 元件
│   ├── ui/              # shadcn/ui 基礎元件
│   ├── AddCardDialog.tsx
│   ├── EditCardDialog.tsx
│   ├── GenerateWordbookDialog.tsx
│   └── ...
├── pages/               # 頁面元件
│   ├── Home.tsx         # 首頁
│   ├── Wordbooks.tsx    # 單詞書列表
│   ├── WordbookDetail.tsx
│   ├── Review.tsx       # 複習頁面
│   ├── Statistics.tsx   # 統計頁面
│   └── Settings.tsx     # 設定頁面
├── lib/                 # 工具函式
│   ├── db.ts            # IndexedDB 封裝
│   ├── firebase.ts      # Firebase 設定
│   ├── gemini-api.ts    # Gemini AI API
│   ├── srs.ts           # SRS 演算法
│   ├── tts.ts           # 語音合成
│   └── utils.ts
├── hooks/               # 自定義 Hooks
├── data/                # 預設資料
│   └── preset-wordlists.ts
└── index.css            # 全域樣式
```

---

## 🚀 安裝與運行

### 環境需求

- Node.js 18+ 或 Bun
- 現代瀏覽器（Chrome, Firefox, Safari, Edge）

### 本地開發

```bash
# 克隆專案
git clone <repository-url>
cd vocabulary-flow

# 安裝依賴
npm install
# 或使用 bun
bun install

# 啟動開發伺服器
npm run dev
# 或
bun run dev
```

應用將在 `http://localhost:8080` 運行。

### 建置生產版本

```bash
npm run build
# 或
bun run build
```

建置產物將輸出到 `dist/` 目錄。

### 環境變數

創建 `.env.local` 檔案（可選）：

```env
# Firebase 設定（如果需要雲端同步）
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## 📱 使用指南

### 快速開始

#### 1. 創建單詞書

1. 點擊底部導航的「單詞書」
2. 點擊右上角的 `+` 按鈕
3. 選擇創建方式：
   - **手動創建** — 輸入名稱和描述
   - **AI 生成** — 選擇預設詞庫或自定義單字列表
   - **CSV 匯入** — 上傳 CSV 檔案

#### 2. 添加單字卡

1. 進入單詞書詳情頁
2. 點擊 `+` 按鈕
3. 輸入單字（headword）
4. 點擊「AI 補齊」自動生成完整資料
5. 或手動填寫音標、釋義、例句等

#### 3. 開始複習

1. 回到首頁
2. 點擊「待複習」開始學習
3. 查看卡片正面（單字）
4. 點擊卡片翻轉查看背面（釋義）
5. 選擇「記得」或「不記得」

#### 4. 查看統計

1. 點擊底部導航的「統計」
2. 查看今日進度、正確率、連續天數
3. 點擊各統計卡片查看詳細資訊

### 進階功能

#### SRS 模式 vs 傳統模式

| 特性 | SRS 模式 | 傳統模式 |
|------|----------|----------|
| 複習排程 | 根據記憶強度動態調整 | 固定複習昨天的卡片 |
| 適合場景 | 長期記憶、大量詞彙 | 短期衝刺、小量詞彙 |
| 學習曲線 | 需要時間適應 | 立即上手 |

切換方式：設定 → 複習模式

#### 錯誤卡片篩選

可在首頁「常見錯誤」自定義篩選條件：

- **前 N 名** — 顯示錯誤次數最多的 N 張卡片
- **最少錯誤數** — 顯示錯誤次數 ≥ N 的卡片
- **最低錯誤率** — 顯示錯誤率 ≥ X% 的卡片

#### CSV 格式

匯入 CSV 時，支援以下欄位：

```csv
headword,phonetic,meaning_zh,meaning_en,part_of_speech,examples,synonyms,antonyms
apple,/ˈæp.əl/,蘋果,a round fruit,noun,"I eat an apple every day.",fruit,
```

---

## 💾 資料結構

### IndexedDB Stores

#### wordbooks

| 欄位 | 類型 | 說明 |
|------|------|------|
| `id` | string | UUID |
| `name` | string | 單詞書名稱 |
| `description` | string? | 描述 |
| `level` | string? | 程度（國中/高中/大學等） |
| `created_at` | string | 創建時間 |
| `updated_at` | string | 更新時間 |

#### cards

| 欄位 | 類型 | 說明 |
|------|------|------|
| `id` | string | UUID |
| `wordbook_id` | string | 所屬單詞書 |
| `headword` | string | 單字 |
| `phonetic` | string? | 音標 |
| `meanings` | CardMeaning[] | 釋義列表 |
| `notes` | string? | 筆記 |
| `star` | boolean | 是否收藏 |
| `tags` | string[] | 標籤 |

#### card_stats

| 欄位 | 類型 | 說明 |
|------|------|------|
| `id` | string | UUID |
| `card_id` | string | 對應卡片 |
| `shown_count` | number | 顯示次數 |
| `right_count` | number | 正確次數 |
| `wrong_count` | number | 錯誤次數 |
| `last_reviewed_at` | string? | 最後複習時間 |

#### card_srs

| 欄位 | 類型 | 說明 |
|------|------|------|
| `id` | string | UUID |
| `card_id` | string | 對應卡片 |
| `ease` | number | 難易度係數 (EF) |
| `interval_days` | number | 複習間隔（天） |
| `repetitions` | number | 成功重複次數 |
| `due_at` | string | 下次複習時間 |

---

## 👨‍💻 開發指南

### 程式碼風格

- 使用 ESLint 和 Prettier 進行程式碼格式化
- 遵循 React Hooks 最佳實踐
- 使用 TypeScript 嚴格模式

### 元件開發

```tsx
// 使用 shadcn/ui 元件
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// 使用語義化 Tailwind 類別
<Button variant="default" size="lg">
  開始學習
</Button>
```

### 添加新功能

1. 在 `src/pages/` 創建新頁面
2. 在 `src/App.tsx` 添加路由
3. 更新 `src/components/BottomNav.tsx` 或 `SideMenu.tsx`

### SRS 演算法修改

核心邏輯在 `src/lib/srs.ts`：

```typescript
export function calculateNextReview(
  currentState: SRSState,
  quality: Quality
): SRSState {
  // SM-2 演算法實現
  // ...
}
```

---

## 🌐 部署說明

### Firebase Hosting

```bash
# 安裝 Firebase CLI
npm install -g firebase-tools

# 登入 Firebase
firebase login

# 初始化專案
firebase init hosting

# 建置並部署
npm run build
firebase deploy
```

### Lovable 部署

直接在 [Lovable](https://lovable.dev/projects/fe29e667-9c3b-4357-aa44-026fc6943e2d) 點擊 Share → Publish 即可部署。

### 其他平台

- **Vercel** — 直接連接 GitHub 倉庫
- **Netlify** — 支援自動部署
- **GitHub Pages** — 設定 `base` 路徑

---

## ❓ 常見問題

### Q: 如何設定 Gemini API 金鑰？

A: 前往設定頁面 → API 設定 → 輸入你的 Gemini API 金鑰。可在 [Google AI Studio](https://makersuite.google.com/) 免費獲取。

### Q: 資料會不會遺失？

A: 
- 本地資料存儲在瀏覽器的 IndexedDB 中
- 登入 Firebase 帳號後可開啟雲端同步
- 建議定期匯出 CSV 備份

### Q: 支援哪些語言？

A: 目前 UI 為繁體中文，單字內容支援任何語言（主要針對英語優化）。

### Q: 可以離線使用嗎？

A: 是的！除了 AI 生成功能需要網路，其他功能都可以離線使用。

---

## 🤝 貢獻指南

歡迎提交 Issue 和 Pull Request！

### 貢獻流程

1. Fork 本專案
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

### 報告問題

請在 GitHub Issues 中提供：
- 問題描述
- 重現步驟
- 預期行為
- 截圖（如適用）
- 瀏覽器和系統資訊

---

## 📄 授權

本專案採用 MIT 授權 — 詳見 [LICENSE](LICENSE) 檔案。

---

## 🙏 致謝

- [shadcn/ui](https://ui.shadcn.com/) — 精美的 UI 元件庫
- [Lucide Icons](https://lucide.dev/) — 簡潔的圖標庫
- [Google Gemini](https://deepmind.google/technologies/gemini/) — 強大的 AI 模型
- [SM-2 Algorithm](https://www.supermemo.com/en/archives1990-2015/english/ol/sm2) — 經典的間隔重複演算法
- [Lovable](https://lovable.dev) — AI 驅動的開發平台

---

<p align="center">
  Made with ❤️ for language learners
</p>
