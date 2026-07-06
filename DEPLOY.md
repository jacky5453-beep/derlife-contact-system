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
  - **編輯彈窗的商品資料可就地編輯（全欄位 + 八大營養），可新增／移除商品，按「儲存」一起寫回 Firestore**（2026-07-03）
  - **廠商報價單產生器**（編輯彈窗「📄 產生報價單」，manager+）：依廠商商品自動帶入商品名(規格)/數量/單價（預設商品報價含稅、可改），5% 稅金可切換，算合計/稅金/總計；**canvas 線上簽名（客戶簽章）**；html2canvas+jsPDF 產出對應紙本版型的簽名版 PDF → 下載留存 + 上傳 Storage `contact-signed-quotations/{docId}/` + 廠商 doc 記 `quotationConfirmed`；已確認報價可在編輯彈窗再下載（2026-07-03）
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
- `contact-suppliers` — 廠商資料（含 `products` array、`submissionType: new/existing`、`quotationConfirmed`＝簽名版報價單記錄）
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

## Storage 規則（2026-07-03，簽名版報價單存檔用）
- **檔案：** `storage.rules`（本資料夾）；`firebase.json` 已加 `"storage": {...}`
- ⚠️ Storage 規則是「整個 bucket 一份、整份覆蓋」。目前 derlife-audit 只有本系統用 Storage。
- 規則＝Firebase 預設「需登入才能讀寫」。簽名版報價單由後台管理員（已登入）上傳到
  `contact-signed-quotations/{docId}/`，走此預設規則即可，**不對外公開**。
- **部署指令：**
  ```bash
  cd "/Users/jacky/Desktop/claude/claude code/廠商及客戶資料系統"
  firebase deploy --only storage --project derlife-audit
  ```
- **回滾：** Firebase Console > Storage > Rules > 歷史記錄，挑舊版重新發布。

## Telegram 新資料通知（Cloud Functions，2026-06-23 新增）
廠商／客戶填完送出 → 自動推 Telegram 到「得來素業務戰情」群組，不用再去後台守著。

- **位置：** `functions/index.js`（Gen2、Node 22、region `asia-east1`、codebase `contact`）
- **函式：**
  - `contactSupplierAlert` — 監聽 `contact-suppliers`，新廠商提品／既有廠商補商品都推；訊息含聯絡資訊＋商品清單（品名／規格／成本價）。**2026-07-03 起：同步推「業務戰情群」＋「得來素行銷專案群」兩個群，讓行銷也知道有人提品要作業**
  - `contactCustomerAlert` — 監聽 `contact-customers`，新客戶資料推；含客戶類型／聯絡資訊／勾選產品數。只推業務戰情群
- **bot／群組（兩隻 bot、兩個群）：**
  - 業務戰情群 → `@derlife_sales_alert_bot`，密鑰 `TELEGRAM_BOT_TOKEN`／`TELEGRAM_CHAT_ID`（共用業務戰情告警系統，⚠️ 任一邊改 token 另一邊要同步）
  - 行銷專案群 → **沿用工作管理表的** `@derlife_worklog_bot`（該 bot 本來就在「得來素行銷專案群」裡），密鑰 `WORKLOG_TG_TOKEN`／`WORKLOG_TG_CHAT`（共用工作管理表，群 id `-5399731598`）
  - 兩個群各自獨立送出，其中一個失敗不影響另一個（只記 log）
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
2026-07-06（廠商報價單簽名改選填：未簽名可直接下載 PDF（保留空白簽章欄，事後給客戶簽），只有線上簽名版才存 Storage＋記 `quotationConfirmed`；「客戶方資訊」按鈕改名「我方資訊（得來素）」避免誤會；同日稍早：公司資訊設定新增「預設注意事項」欄位）

## 更新歷程
- 2026-07-06 — 廠商報價單：線上簽名改為**選填**——沒簽名也能下載 PDF（PDF 保留空白簽章欄），未簽名版不寫 `quotationConfirmed`／不上傳 Storage；「客戶方資訊」按鈕改名「我方資訊（得來素）」並補說明（該報價單中得來素是買方）（commit 1211183）
- 2026-07-06 — 公司資訊設定新增「📌 預設注意事項」欄位（localStorage key `derlife-quote-company-info` 的 `notes`），開報價單自動帶入儲存版本，仍可針對個別客戶臨時調整（commit 81e2464）
- 2026-07-03 — 後台商品資料改可就地編輯（含八大營養、增／刪商品）；新增**廠商報價單產生器＋canvas 線上簽名**，產出簽名版 PDF 下載留存並存 Storage `contact-signed-quotations/`（廠商 doc 記 `quotationConfirmed`）；同步啟用 Storage（規則為預設需登入）
- 2026-07-03 — Cloud Functions：廠商提品通知**同步推業務戰情群＋得來素行銷專案群**（行銷群沿用工作管理表的 @derlife_worklog_bot，不必另加機器人）
- 2026-06-23 — 新增 Cloud Functions：廠商／客戶填完送出自動推 Telegram 到業務戰情群組（共用業務告警 bot 與密鑰）
- 2026-05-14 — 廠商身份卡片支援上傳圖片當 icon（瀏覽器壓縮成 128×128 PNG → Firestore base64）
- 2026-05-14 — 後台加入「身份卡片設定」（Firestore `contact-settings/supplier-entry`，公開讀／manager+ 寫；同步部署 rules）
- 2026-05-14 — 「我要賣貨」拆成「第一次提品」「既有供應商」兩條路徑、兩步驟 wizard；廠商提品支援商品資訊（17 欄含八大營養）；後台新增「商品數」欄、「商品匯入檔」匯出（9 欄 ERP）
- 2026-04-23 — 新增得來素／緣味歸檔格式匯出，匯出按鈕改為三格式版面
- 2026-04-17 — 統一編號改為非必填，新增「無統編／無需統編」選項
