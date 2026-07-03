# 廠商及客戶資料系統 部署資訊

## 基本資訊
- **部署平台：** GitHub Pages
- **GitHub Repo：** https://github.com/jacky5453-beep/derlife-contact-system
- **線上網址：** https://jacky5453-beep.github.io/derlife-contact-system/
- **系統類型：** 類型 A（單一 HTML 檔案）
- **資料庫：** Firebase Firestore（專案 `derlife-audit`）

## 部署指令
```bash
cd "/Users/jacky/Desktop/claude/claude code/廠商及客戶資料系統"
git add index.html
git commit -m "描述"
git push origin main
# GitHub Pages 會自動部署（約 1~2 分鐘）
```

## 環境變數
無（Firebase 設定直接寫在 index.html 的前端 config）

## 主要功能
- 前台：
  - 「我要賣貨」分兩條路徑：第一次提品（新廠商）／既有供應商
  - 兩步驟 wizard：step1 廠商資料 → step2 商品資訊（17 欄位含八大營養標示）
  - 「我要買貨」客戶填表（含勾選想詢價產品）
- 後台：資料審核、編輯、匯出
  - 廠商列表：「商品數」欄、「身份」徽章（新／既有）
  - **廠商列表點「📦 N ▾」徽章可就地展開商品明細，並提供「匯出商品」「⬇️ 匯出這些商品」快速鈕（免進編輯）**（2026-07-03）
  - 編輯彈窗：商品清單展開預覽（含營養標示）
  - **每個商品明細底部有「✍️ 一鍵產生文案」按鈕，帶商品資料開啟文案生成系統**（2026-07-03，沿用開團系統的 URL 參數格式）
  - 「帳號權限管理」分頁底下可編輯身份卡片 icon／標題／說明（支援 emoji、文字、上傳圖片）
- 統一編號支援三種模式：有統編（8碼）／無統編／無需統編
- 匯出支援四種格式：
  - **ERP 匯入檔**（14 欄，供應商／客戶各自格式）
  - **得來素歸檔**（73 欄，對應 ERP 得來素範本）
  - **緣味歸檔**（22 欄，對應 ERP 緣味範本）
  - **商品匯入檔**（9 欄 ERP 商品格式，僅廠商分頁可見，供匯進 ERP 用，勿改欄位）
- 匯出邏輯：有勾選就匯出勾選資料，未勾選則匯出全部
- **單廠商商品匯出**（編輯彈窗「匯出此廠商商品」／列表「匯出商品」）自 2026-07-03 起改輸出**完整商品資訊**（25 欄，含成分／營養／文案／目標客群等，檔名 `商品資訊_廠商_日期.xlsx`），供複製到官網建立商品；與上面 9 欄 ERP 匯入檔用途不同

## Firestore Collections
- `contact-suppliers` — 廠商資料（含 `products` array、`submissionType: new/existing`）
- `contact-customers` — 客戶資料
- `contact-products` — 給客戶選擇的產品報價清單
- `contact-whitelist` — 後台帳號白名單（含 role）
- `contact-settings` — 全域設定（如 `supplier-entry` 身份卡片設定）

## Firestore 規則
規則統一管理在 `/Users/jacky/Desktop/claude/claude code/規則主檔/derlife-audit/`，部署：
```bash
cd "/Users/jacky/Desktop/claude/claude code/規則主檔"
./deploy.sh derlife-audit
```

## Telegram 新資料通知（Cloud Functions，2026-06-23 新增）
廠商／客戶填完送出 → 自動推 Telegram 到「得來素業務戰情」群組，不用再去後台守著。

- **位置：** `functions/index.js`（Gen2、Node 22、region `asia-east1`、codebase `contact`）
- **函式：**
  - `contactSupplierAlert` — 監聽 `contact-suppliers`，新廠商提品／既有廠商補商品都推；訊息含聯絡資訊＋商品清單（品名／規格／成本價）
  - `contactCustomerAlert` — 監聽 `contact-customers`，新客戶資料推；含客戶類型／聯絡資訊／勾選產品數
- **bot／群組：** 共用業務戰情告警系統的 bot（@derlife_sales_alert_bot）與群組，**共用同一組 Secret**：
  - `TELEGRAM_BOT_TOKEN`、`TELEGRAM_CHAT_ID`（Secret Manager，derlife-audit）
  - ⚠️ 與「業務戰情 Telegram 告警系統」共用此 token／chat_id，任一邊改 token 另一邊要同步
- **部署指令：**
  ```bash
  cd "/Users/jacky/Desktop/claude/claude code/廠商及客戶資料系統"
  firebase deploy --only functions:contact --project derlife-audit
  ```
  （用 `functions:contact` 限定 codebase，不會動到業務戰情等其他系統的 functions）
- **查 log：**
  ```bash
  firebase functions:log --only contactSupplierAlert,contactCustomerAlert --project derlife-audit
  ```

## 最後部署日期
2026-06-23（新增 Telegram 新資料通知 Cloud Functions）

## 更新歷程
- 2026-06-23 — 新增 Cloud Functions：廠商／客戶填完送出自動推 Telegram 到業務戰情群組（共用業務告警 bot 與密鑰）
- 2026-05-14 — 廠商身份卡片支援上傳圖片當 icon（瀏覽器壓縮成 128×128 PNG → Firestore base64）
- 2026-05-14 — 後台加入「身份卡片設定」（Firestore `contact-settings/supplier-entry`，公開讀／manager+ 寫；同步部署 rules）
- 2026-05-14 — 「我要賣貨」拆成「第一次提品」「既有供應商」兩條路徑、兩步驟 wizard；廠商提品支援商品資訊（17 欄含八大營養）；後台新增「商品數」欄、「商品匯入檔」匯出（9 欄 ERP）
- 2026-04-23 — 新增得來素／緣味歸檔格式匯出，匯出按鈕改為三格式版面
- 2026-04-17 — 統一編號改為非必填，新增「無統編／無需統編」選項
