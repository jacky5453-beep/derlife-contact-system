/**
 * 廠商及客戶資料系統 — 新資料 Telegram 通知
 *
 * 監聽 Firestore：
 *   - contact-suppliers（廠商提品／報價）
 *   - contact-customers（新客戶資料）
 * 有人填完送出（新增一筆 doc）→ 組訊息推到 Telegram 群組。
 *
 * Bot token / chat_id 走 Secret Manager，不寫死在程式裡。
 * 共用「業務戰情 Telegram 告警系統」既有的密鑰與 bot（@derlife_sales_alert_bot），
 * 推到同一個「得來素業務戰情」群組：
 *   TELEGRAM_BOT_TOKEN  = Telegram bot token
 *   TELEGRAM_CHAT_ID    = 群組 chat_id
 *
 * 部署 codebase：contact（與其他系統的 functions 隔離，避免互相覆蓋）
 */

const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { defineSecret } = require('firebase-functions/params');

// 全系統統一台灣時間
process.env.TZ = 'Asia/Taipei';

// 業務戰情群：@derlife_sales_alert_bot
const TG_TOKEN = defineSecret('TELEGRAM_BOT_TOKEN');
const TG_CHAT = defineSecret('TELEGRAM_CHAT_ID');
// 行銷專案群：沿用工作管理表既有的 bot（@derlife_worklog_bot）＋群組。
// 該 bot 早已在「得來素行銷專案群」裡（工作管理表每日進度表就是推這裡），
// 所以廠商提品時直接用它推行銷群，不必另外加機器人。
const WORKLOG_TG_TOKEN = defineSecret('WORKLOG_TG_TOKEN');
const WORKLOG_TG_CHAT = defineSecret('WORKLOG_TG_CHAT');

const REGION = 'asia-east1';

// ── 工具：把值安全轉字串，空值給「—」 ──
function v(x) {
  const s = (x === undefined || x === null) ? '' : String(x).trim();
  return s || '—';
}

// ── 工具：HTML escape（Telegram parse_mode=HTML 用）──
function esc(x) {
  return String(x === undefined || x === null ? '' : x)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ── 推送 Telegram 到單一 chat ──
async function sendToChat(token, chatId, text) {
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Telegram 推送失敗（chat ${chatId}）${res.status}: ${body}`);
  }
}

// ── 推送到多個目標群組（各自可用不同 bot）──
// targets: [{ token, chatId, label }]；缺 token 或 chatId 的自動略過。
// 各目標獨立送出，其中一個失敗不影響其他目標（只記 log）。
async function pushToTargets(text, targets) {
  const valid = targets.filter((t) => t && t.token && t.chatId);
  const results = await Promise.allSettled(
    valid.map((t) => sendToChat(t.token, t.chatId, text))
  );
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.error(`推送到「${valid[i].label}」失敗：`, r.reason && r.reason.message);
    }
  });
}

// ── 組共用聯絡欄位 ──
function commonLines(d) {
  const taxId = v(d.taxId);
  return [
    `🏢 名稱：${esc(v(d.name))}（${esc(v(d.shortName))}）`,
    `🧾 統編：${esc(taxId)}`,
    `👤 主聯絡人：${esc(v(d.contact))}`,
    `📞 電話：${esc(v(d.phone))}　📱 行動：${esc(v(d.mobile))}`,
    `✉️ Email：${esc(v(d.email))}`,
    `📍 公司地址：${esc(v(d.companyAddr))}`,
    `🚚 送貨地址：${esc(v(d.deliveryAddr))}`,
  ];
}

// ── 廠商：新提品／報價 ──
exports.contactSupplierAlert = onDocumentCreated(
  {
    document: 'contact-suppliers/{id}',
    region: REGION,
    secrets: [TG_TOKEN, TG_CHAT, WORKLOG_TG_TOKEN, WORKLOG_TG_CHAT],
  },
  async (event) => {
    const d = event.data && event.data.data();
    if (!d) return;

    const isExisting = d.submissionType === 'existing';
    const header = isExisting
      ? '🟠 <b>既有廠商補商品</b>'
      : '🟢 <b>新廠商提品／報價</b>';

    const lines = [header, '', ...commonLines(d)];

    // 商品清單
    const products = Array.isArray(d.products) ? d.products : [];
    if (products.length) {
      lines.push('', `📦 <b>商品（${products.length} 項）</b>`);
      products.slice(0, 15).forEach((p, i) => {
        const name = v(p.name);
        const spec = p.spec ? `／${v(p.spec)}` : '';
        const cost = (Number(p.cost) > 0) ? `　成本$${p.cost}` : '';
        lines.push(`　${i + 1}. ${esc(name)}${esc(spec)}${esc(cost)}`);
      });
      if (products.length > 15) lines.push(`　…還有 ${products.length - 15} 項`);
    }

    if (v(d.note) !== '—') lines.push('', `📝 備註：${esc(v(d.note))}`);
    lines.push('', '👉 請到後台查看：https://jacky5453-beep.github.io/derlife-contact-system/');

    // 廠商提品：同步推「業務戰情群」（sales bot）＋「行銷專案群」（worklog bot）
    await pushToTargets(lines.join('\n'), [
      { token: TG_TOKEN.value(), chatId: TG_CHAT.value(), label: '業務戰情群' },
      { token: WORKLOG_TG_TOKEN.value(), chatId: WORKLOG_TG_CHAT.value(), label: '行銷專案群' },
    ]);
  }
);

// ── 客戶：新客戶資料 ──
exports.contactCustomerAlert = onDocumentCreated(
  {
    document: 'contact-customers/{id}',
    region: REGION,
    secrets: [TG_TOKEN, TG_CHAT],
  },
  async (event) => {
    const d = event.data && event.data.data();
    if (!d) return;

    const lines = [
      '🔵 <b>新客戶資料</b>',
      '',
      ...commonLines(d),
    ];

    if (v(d.customerType) !== '—') {
      lines.splice(2, 0, `🏷️ 客戶類型：${esc(v(d.customerType))}`);
    }

    // 客戶勾選的產品
    const picked = Array.isArray(d.selectedProducts) ? d.selectedProducts : [];
    if (picked.length) lines.push('', `🛒 勾選產品：${picked.length} 項`);

    if (v(d.note) !== '—') lines.push('', `📝 備註：${esc(v(d.note))}`);
    lines.push('', '👉 請到後台查看：https://jacky5453-beep.github.io/derlife-contact-system/');

    // 客戶資料只推業務戰情群（不推行銷專案群）
    await sendToChat(TG_TOKEN.value(), TG_CHAT.value(), lines.join('\n'));
  }
);
