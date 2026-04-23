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
git add -A
git commit -m "描述"
git push origin main
# GitHub Pages 會自動部署（約 1~2 分鐘）
```

## 環境變數
無（Firebase 設定直接寫在 index.html 的前端 config）

## 主要功能
- 前台：廠商／客戶資料填寫表單
- 後台：資料審核、編輯、匯出 Excel
- 統一編號支援三種模式：有統編（8碼）／無統編／無需統編
- 匯出支援三種格式：
  - **ERP 匯入檔**（14 欄，供應商／客戶各自格式）
  - **得來素歸檔**（73 欄，對應 ERP 得來素範本）
  - **緣味歸檔**（22 欄，對應 ERP 緣味範本）
- 匯出邏輯：有勾選就匯出勾選資料，未勾選則匯出全部

## 最後部署日期
2026-04-23（新增得來素／緣味歸檔格式匯出功能）

## 更新歷程
- 2026-04-23 — 新增得來素／緣味歸檔格式匯出，匯出按鈕改為三格式版面
- 2026-04-17 — 統一編號改為非必填，新增「無統編／無需統編」選項
