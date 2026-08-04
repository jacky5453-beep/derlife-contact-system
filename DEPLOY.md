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
  - 三步驟 wizard：step1 廠商資料 → step2 商品資訊（17 欄位含八大營養標示）→ step3 請款須知與資料
  - **Step 3 請款須知與資料（2026-07-30 新增）**：
    - 新廠商完整版：①月結基準日（月底 30/31 號）已閱讀勾選（必勾）②發票與對帳單提供方式擇一（必選：電子發票及電子對帳單／開立紙本發票與紙本對帳單／隨貨附發票）③合作金庫匯款帳戶說明＋存摺封面照片上傳（必傳，前端壓縮最長邊 1600px JPEG）④產品報價單檔案上傳（必傳，PDF/圖片/Excel/Word，10MB 內）⑤發票開立資訊（得來素企業有限公司／統編 53613149）已閱讀勾選（必勾）
    - 既有供應商精簡版：報價單必傳；存摺照片選填（匯款帳戶變更再傳）；須知條文收合為參考、不強制勾選
    - 檔案上傳到 Storage `contact-billing-uploads/{docId}/`（匿名僅能新增、後台登入才能讀），廠商 doc 記 `billing` 欄位（勾選狀態＋發票方式＋檔案路徑）
  - 「我要買貨」客戶填表（含勾選想詢價產品）
- 後台：資料審核、編輯、匯出
  - 廠商列表：「商品數」欄、「身份」徽章（新／既有）
  - **廠商列表點「📦 N ▾」徽章可就地展開商品明細，並提供「匯出商品」「⬇️ 匯出這些商品」快速鈕（免進編輯）**（2026-07-03）
  - **商品明細多一欄「毛利率」**（2026-08-04）：口徑＝（末端售價−進貨價）÷末端售價，同零售商品成本分析系統；下方小字附毛利金額，有填團購價再補一行團購毛利；紅黃綠分級（綠 ≥40%／黃 ≥30%／紅 <30%）。編輯彈窗商品卡標題列也帶毛利徽章，改價即時重算
  - **編輯彈窗的商品資料可就地編輯（全欄位 + 八大營養），可新增／移除商品，按「儲存」一起寫回 Firestore**（2026-07-03）
  - **廠商報價單產生器**（編輯彈窗「📄 產生報價單」，manager+）：依廠商商品自動帶入商品名(規格)/數量/單價（預設商品報價含稅、可改），5% 稅金可切換，算合計/稅金/總計；**canvas 線上簽名（客戶簽章）**；html2canvas+jsPDF 產出對應紙本版型的簽名版 PDF → 下載留存 + 上傳 Storage `contact-signed-quotations/{docId}/` + 廠商 doc 記 `quotationConfirmed`；已確認報價可在編輯彈窗再下載（2026-07-03）
  - **每個商品明細底部有「✍️ 一鍵產生文案」按鈕，帶商品資料開啟文案生成系統**（2026-07-03，沿用開團系統的 URL 參數格式）
  - **「🚀 送到上架流程」按鈕**（2026-08-04）：編輯彈窗商品卡底部（讀當下輸入框的值，免先存檔）與列表明細列（用已存資料）各一顆，把該商品整包資料（規格／條碼／效期／最少出貨量／物流／三種價格＋毛利率／成分／文案／目標客群／情境／特色／口感／營養標示／圖片連結）編成 base64url 塞進 `?import=` 開啟 https://derlife-launch-flow.web.app ，那邊自動帶進「新增商品」表單並在建立後存進專案，接力的人直接看得到（超過 7500 字元會擋下提示精簡）
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
- `contact-suppliers` — 廠商資料（含 `products` array、`submissionType: new/existing`、`quotationConfirmed`＝簽名版報價單記錄、`billing`＝請款須知與資料〔ackClosing/ackInvoiceInfo/invoiceMethod/passbookPath/quotationPath/quotationName/submittedAt〕）
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

## Storage 規則（2026-07-03，簽名版報價單存檔用；2026-07-30 加請款上傳路徑）
- **檔案：** `storage.rules`（本資料夾）；`firebase.json` 已加 `"storage": {...}`
- ⚠️ Storage 規則是「整個 bucket 一份、整份覆蓋」。目前 derlife-audit 只有本系統用 Storage。
- 規則＝Firebase 預設「需登入才能讀寫」。簽名版報價單由後台管理員（已登入）上傳到
  `contact-signed-quotations/{docId}/`，走此預設規則即可，**不對外公開**。
- **`contact-billing-uploads/{docId}/{fileName}`（2026-07-30）：** 前台廠商（未登入）上傳存摺照片／報價單專用；
  匿名僅能 `create`（不能覆蓋／刪除／讀取），單檔 10MB 上限；後台登入者走預設規則讀取（`viewBillingFile()` 取 downloadURL）。
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

- 2026-08-04（**串到商品上架流程系統**：編輯彈窗商品卡「🚀 送到上架流程」＋列表明細列「🚀 上架」按鈕，把該商品整包資料 base64url 塞進 `?import=` 開 https://derlife-launch-flow.web.app ，那邊自動帶進「新增商品」並在建立後存進專案 `source` 欄位供後續接力的人檢視；編輯彈窗按鈕讀的是「當下輸入框」的值，改完不用先存檔也帶得走；網址超過 7500 字元會擋下並提示精簡成分／文案）
- 2026-08-04（廠商提品商品明細加「毛利率」欄：（末端售價−進貨價）÷末端售價＋毛利金額＋團購毛利，紅黃綠分級；編輯彈窗商品卡毛利徽章即時試算；完整資訊匯出 Excel 加「毛利率」「毛利金額」兩欄〔ERP 匯入檔 9 欄格式不動〕）
- 2026-07-31（🐛 修客戶表單「送出資料」沒反應：7/30 新增廠商 Step 3 後，客戶單頁模式沒拔掉隱藏請款欄位〔billAckClosing／billInvoiceMethod／billAckInvoice〕的 `required`，瀏覽器 HTML5 驗證卡在看不見的欄位、無法聚焦提示 → 按送出完全靜默；`startForm` 客戶分支補拔 required，廠商新／既有模式不受影響；commit 8dc4213）
- 2026-07-31（資安稽核：Tailwind CDN 鎖定 3.4.17 版，避免 CDN 自動升級導致系統壞掉；僅動一行 script src）
2026-07-30（前台廠商流程新增第 3 步「請款須知與資料」：月結基準日／發票方式擇一／存摺照片與報價單上傳／發票開立資訊，新廠商全必填、既有供應商精簡版〔報價單必傳、存摺選填〕；檔案上傳 Storage `contact-billing-uploads/`；後台編輯彈窗新增「💰 請款須知與資料」檢視區（勾選狀態＋查看檔案）；Telegram 廠商提品通知附請款資料狀態。同步部署：Firestore 規則〔validContactCreate 白名單加 `billing`〕＋ Storage 規則＋ Functions contact codebase）

## 前次部署
2026-07-17（修後台 Google 登入進不去：GitHub Pages 跨網域 `signInWithRedirect` 被瀏覽器第三方 cookie 政策擋掉，選完帳號跳回來登入結果遺失；改為 **popup 優先、被封鎖才 fallback 到 redirect**，popup／redirect 共用 `handleLoginResult()` 做白名單驗證＋進後台）

## 更新歷程
- 2026-07-31 — 修客戶表單送出靜默失敗：客戶模式拔掉隱藏請款欄位的 required（commit 8dc4213；受影響期間 7/30～7/31 客戶端「我要買貨」表單無法送出）
- 2026-07-30 — 前台廠商 wizard 由兩步擴為三步，新增「請款須知與資料」（commit 39970fe）；Firestore 規則 `validContactCreate()` 欄位白名單加 `billing`（規則主檔 commit 034e7e2）；Storage 規則加 `contact-billing-uploads/` 匿名 create；Functions `contactSupplierAlert` 訊息附請款資料狀態
- 2026-07-17 — 修後台 Google 登入：`signInWithPopup` 優先（跨網域 redirect 受第三方 cookie 封鎖影響），`auth/popup-blocked` 才 fallback `signInWithRedirect`；登入結果處理抽成 `handleLoginResult()` 兩路共用（commit bc7cda7）
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
