import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const SS = 'C:/Users/jorj/OneDrive/Desktop/cafe-screenshots';
const OUT = 'C:/Users/jorj/OneDrive/Desktop/cafe-ai-manager-presentation.html';

function b64(file) {
  try {
    const d = readFileSync(join(SS, file));
    return 'data:image/png;base64,' + d.toString('base64');
  } catch {
    console.warn('Missing:', file);
    return '';
  }
}

const I = {
  landing:   b64('01-landing.png'),
  menu:      b64('02-menu.png'),
  hub:       b64('03-hub.png'),
  punch:     b64('04-punch.png'),
  waiter:    b64('05-waiter.png'),
  kitchen:   b64('06-kitchen.png'),
  login:     b64('07-login.png'),
  hubAdmin:  b64('08-hub-admin-view.png'),
  dashboard: b64('09-admin-dashboard.png'),
  tabAI:     b64('10-dashboard-tab0.png'),
  tabCats:   b64('10-dashboard-tab1.png'),
  tabMenu:   b64('10-dashboard-tab2.png'),
  tabEmps:   b64('10-dashboard-tab3.png'),
  reports:   b64('11-reports.png'),
  perf:      b64('12-performance.png'),
  history:   b64('13-history.png'),
  insights:  b64('14-insights.png'),
  promo:     b64('15-promo.png'),
};

const html = /* html */`<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cafe AI Manager — פרויקט גמר 2026</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.6.1/reset.min.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.6.1/reveal.min.css">
<style>
@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;600;700;800;900&display=swap');

:root{
  --c0:#07040a; --c1:#110a1f; --c2:#1e1035;
  --amber:#f59e0b; --amber2:#fcd34d; --amber3:#fef3c7;
  --teal:#14b8a6; --purple:#a855f7; --rose:#f43f5e;
  --green:#22c55e; --blue:#3b82f6;
  --card:rgba(255,255,255,0.05); --border:rgba(255,255,255,0.10);
  --text:#f1f0f5; --muted:#9489a8;
}
*{box-sizing:border-box;margin:0;padding:0}
.reveal{font-family:'Heebo',sans-serif}
.reveal .slides{text-align:right}
.reveal .slides section{color:var(--text)}
.reveal h1,.reveal h2,.reveal h3{font-family:'Heebo',sans-serif;font-weight:800;letter-spacing:-0.02em}
.reveal .progress{height:4px;background:rgba(255,255,255,0.08)}
.reveal .progress span{background:linear-gradient(90deg,var(--amber),var(--purple))}
.reveal .controls button{color:var(--amber)}
.reveal .slide-number{font-family:'Heebo',sans-serif;font-size:.8rem;color:var(--muted)}

/* ── SLIDE BACKGROUNDS ── */
.bg-title{background:radial-gradient(ellipse at 30% 50%,#1a0a2e 0%,#07040a 70%)}
.bg-dark{background:var(--c0)}
.bg-purple{background:radial-gradient(ellipse at 70% 30%,#1e0a3c 0%,#07040a 65%)}
.bg-teal{background:radial-gradient(ellipse at 30% 70%,#042e2b 0%,#07040a 65%)}
.bg-amber{background:radial-gradient(ellipse at 50% 20%,#2a1400 0%,#07040a 65%)}
.bg-rose{background:radial-gradient(ellipse at 80% 50%,#2a0515 0%,#07040a 65%)}
.bg-blue{background:radial-gradient(ellipse at 20% 80%,#020c2a 0%,#07040a 65%)}

/* ── LAYOUT HELPERS ── */
.slide-body{width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;padding:2rem 3rem;gap:1.2rem}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:2rem;align-items:center}
.three-col{display:grid;grid-template-columns:repeat(3,1fr);gap:1.2rem}
.four-col{display:grid;grid-template-columns:repeat(4,1fr);gap:1.1rem}

/* ── TITLE SLIDE ── */
.title-wrap{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:1.8rem;text-align:center}
.logo-orb{width:130px;height:130px;border-radius:50%;
  background:conic-gradient(from 180deg,#7c3aed,#d97706,#7c3aed);
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 0 80px rgba(124,58,237,0.5),0 0 40px rgba(217,119,6,0.3);
  animation:spin-slow 8s linear infinite}
@keyframes spin-slow{to{transform:rotate(360deg)}}
.logo-inner{width:114px;height:114px;border-radius:50%;background:#07040a;
  display:flex;align-items:center;justify-content:center;font-size:3.5rem}
.title-h1{font-size:4rem;font-weight:900;
  background:linear-gradient(135deg,#fcd34d,#f59e0b,#a855f7);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
  line-height:1.1}
.title-sub{font-size:1.3rem;color:#d1c8e8;letter-spacing:0.05em}
.badge-row{display:flex;gap:.7rem;flex-wrap:wrap;justify-content:center}
.badge{padding:.3rem .9rem;border-radius:2rem;font-size:.78rem;font-weight:700;
  border:1px solid rgba(245,158,11,0.35);background:rgba(245,158,11,0.1);color:var(--amber2)}
.badge.purple{border-color:rgba(168,85,247,0.35);background:rgba(168,85,247,0.1);color:#c084fc}
.badge.teal{border-color:rgba(20,184,166,0.35);background:rgba(20,184,166,0.1);color:#5eead4}
.badge.rose{border-color:rgba(244,63,94,0.35);background:rgba(244,63,94,0.1);color:#fb7185}

/* ── SECTION HEADER ── */
.section-header{margin-bottom:1rem}
.section-header h2{font-size:2.1rem;font-weight:800}
.section-header p{font-size:.95rem;color:var(--muted);margin-top:.3rem}
.accent-bar{width:56px;height:4px;border-radius:2px;margin-bottom:.9rem}
.accent-amber{background:linear-gradient(90deg,var(--amber),var(--amber2))}
.accent-purple{background:linear-gradient(90deg,#7c3aed,#a855f7)}
.accent-teal{background:linear-gradient(90deg,#0d9488,#14b8a6)}
.accent-rose{background:linear-gradient(90deg,#e11d48,#f43f5e)}
.accent-blue{background:linear-gradient(90deg,#1d4ed8,#3b82f6)}

/* ── SCREENSHOT ── */
.screen{border-radius:14px;overflow:hidden;
  border:1px solid rgba(255,255,255,0.12);
  box-shadow:0 24px 64px rgba(0,0,0,0.55),0 0 0 1px rgba(255,255,255,0.04);
  background:#1e1035}
.screen img{width:100%;display:block}
.screen-glow-amber{box-shadow:0 0 60px rgba(245,158,11,0.2),0 20px 60px rgba(0,0,0,0.5)}
.screen-glow-purple{box-shadow:0 0 60px rgba(168,85,247,0.25),0 20px 60px rgba(0,0,0,0.5)}
.screen-glow-teal{box-shadow:0 0 60px rgba(20,184,166,0.2),0 20px 60px rgba(0,0,0,0.5)}
.screen-caption{text-align:center;font-size:.72rem;color:var(--muted);margin-top:.5rem}

/* ── CARD ── */
.card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:1.3rem}
.card .icon{font-size:1.8rem;margin-bottom:.6rem}
.card h3{font-size:1rem;font-weight:700;color:var(--amber2);margin-bottom:.4rem}
.card p{font-size:.82rem;color:var(--muted);line-height:1.5}
.card.bordered-purple{border-color:rgba(168,85,247,0.3)}
.card.bordered-teal{border-color:rgba(20,184,166,0.3)}
.card.bordered-rose{border-color:rgba(244,63,94,0.3)}
.card.bordered-blue{border-color:rgba(59,130,246,0.3)}

/* ── TECH ITEM ── */
.tech-item{background:var(--card);border:1px solid var(--border);border-radius:14px;
  padding:1.2rem;text-align:center}
.tech-item .ti-icon{font-size:2.2rem;margin-bottom:.5rem}
.tech-item .ti-name{font-size:.85rem;font-weight:700;color:var(--amber2)}
.tech-item .ti-desc{font-size:.68rem;color:var(--muted);margin-top:.2rem}

/* ── CHECK LIST ── */
.check-list{list-style:none;padding:0}
.check-list li{display:flex;align-items:center;gap:.7rem;padding:.45rem 0;font-size:.95rem;color:var(--text)}
.check-list li::before{content:'✓';color:var(--green);font-weight:800;font-size:1rem;flex-shrink:0}
.check-list.purple li::before{color:#c084fc}
.check-list.teal li::before{color:#5eead4}
.check-list.rose li::before{color:#fb7185}

/* ── HIGHLIGHT BOX ── */
.hi-box{border-radius:12px;padding:.9rem 1.3rem;font-size:.88rem;line-height:1.5}
.hi-amber{background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.25);color:var(--amber3)}
.hi-purple{background:rgba(168,85,247,0.1);border:1px solid rgba(168,85,247,0.25);color:#e9d5ff}
.hi-teal{background:rgba(20,184,166,0.1);border:1px solid rgba(20,184,166,0.25);color:#ccfbf1}
.hi-rose{background:rgba(244,63,94,0.1);border:1px solid rgba(244,63,94,0.25);color:#ffe4e6}
.hi-blue{background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.25);color:#dbeafe}

/* ── KPI STRIP ── */
.kpi-strip{display:flex;gap:1rem;justify-content:center;flex-wrap:wrap}
.kpi{background:var(--card);border:1px solid var(--border);border-radius:14px;
  padding:1rem 1.5rem;text-align:center;min-width:110px}
.kpi .kv{font-size:2rem;font-weight:900;line-height:1.1}
.kpi .kl{font-size:.72rem;color:var(--muted);margin-top:.3rem}
.kv-amber{color:var(--amber2)}
.kv-purple{color:#c084fc}
.kv-teal{color:#5eead4}
.kv-rose{color:#fb7185}
.kv-green{color:#86efac}

/* ── ARCH ── */
.arch-row{display:flex;align-items:center;justify-content:center;gap:.5rem;flex-wrap:wrap}
.arch-box{background:var(--card);border:1px solid var(--border);border-radius:14px;
  padding:.9rem 1.2rem;text-align:center;min-width:110px}
.arch-box .ab-icon{font-size:2rem}
.arch-box .ab-name{font-size:.8rem;font-weight:700;color:var(--amber2);margin-top:.3rem}
.arch-box .ab-sub{font-size:.65rem;color:var(--muted)}
.arch-arrow{font-size:1.4rem;color:var(--amber);padding:0 .3rem}

/* ── ROLE CARD ── */
.role-card{background:var(--card);border:1px solid var(--border);border-radius:16px;
  padding:1.5rem;text-align:center}
.role-icon{font-size:2.4rem;margin-bottom:.8rem}
.role-card h3{font-size:1.1rem;font-weight:700;color:var(--amber2);margin-bottom:.4rem}
.role-card p{font-size:.8rem;color:var(--muted)}

/* ── STAR BADGE ── */
.star-badge{display:inline-flex;align-items:center;gap:.5rem;padding:.4rem 1rem;
  border-radius:2rem;background:linear-gradient(135deg,var(--amber),var(--amber2));
  color:#07040a;font-weight:800;font-size:.85rem}

/* ── CHART WRAPPER ── */
.chart-wrap{position:relative;width:100%;max-width:520px;margin:0 auto}
canvas{max-width:100%}

/* ── EMPLOYEE ROW ── */
.emp-row{display:flex;align-items:center;gap:1rem;padding:.8rem 1rem;
  background:var(--card);border:1px solid var(--border);border-radius:12px;margin-bottom:.6rem}
.emp-avatar{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;
  justify-content:center;font-size:1.3rem;flex-shrink:0}
.emp-name{font-weight:700;font-size:.95rem;color:var(--text)}
.emp-role{font-size:.75rem;color:var(--muted);margin-top:.1rem}
.emp-bar-wrap{flex:1;background:rgba(255,255,255,0.06);border-radius:4px;height:8px;overflow:hidden}
.emp-bar{height:100%;border-radius:4px}
.emp-stat{font-size:.82rem;font-weight:700;color:var(--amber2);white-space:nowrap}

/* ── FRAGMENTS ── */
.reveal .fragment.fade-up{opacity:0;transform:translateY(22px);transition:all .5s ease}
.reveal .fragment.fade-up.visible{opacity:1;transform:translateY(0)}
</style>
</head>
<body style="background:#07040a">
<div class="reveal">
<div class="slides">

<!-- ══ 01 TITLE ══════════════════════════════════════════════════════════ -->
<section data-transition="zoom" data-background-class="bg-title" data-background-color="#07040a">
<div class="title-wrap">
  <div class="logo-orb"><div class="logo-inner">☕</div></div>
  <div>
    <div class="title-h1">Cafe AI Manager</div>
    <div class="title-sub" style="margin-top:.6rem">מערכת ניהול בית קפה חכמה מבוססת בינה מלאכותית</div>
  </div>
  <div class="badge-row">
    <span class="badge">React 18</span>
    <span class="badge">TypeScript</span>
    <span class="badge purple">Supabase</span>
    <span class="badge purple">Claude AI</span>
    <span class="badge teal">Real-time</span>
    <span class="badge rose">RTL / 4 שפות</span>
  </div>
  <p style="color:var(--muted);font-size:.95rem">פרויקט גמר · 2026</p>
</div>
</section>

<!-- ══ 02 PROBLEM ══════════════════════════════════════════════════════ -->
<section data-transition="slide" data-background-color="#07040a">
<div class="slide-body">
  <div class="accent-bar accent-rose"></div>
  <div class="section-header">
    <h2>הבעיה שפתרתי</h2>
    <p>ניהול בית קפה ידני — כאב ראש לכולם</p>
  </div>
  <div class="three-col" style="margin-top:.5rem">
    <div class="card bordered-rose fragment fade-up">
      <div class="icon">📋</div>
      <h3>הזמנות על נייר</h3>
      <p>רישום ידני → אובדן הזמנות → שגיאות במסירה למטבח → לקוחות מתוסכלים</p>
    </div>
    <div class="card bordered-rose fragment fade-up">
      <div class="icon">📊</div>
      <h3>אפס נתונים</h3>
      <p>המנהל לא יודע מה נמכר, מתי שעות השיא, איזה עובד מניב הכי הרבה</p>
    </div>
    <div class="card bordered-rose fragment fade-up">
      <div class="icon">🗂️</div>
      <h3>ניהול ידני מסורבל</h3>
      <p>עדכון מחירים, הוספת מנות, ניהול מלאי — מסורבל, איטי, ומועד לטעויות</p>
    </div>
  </div>
  <div class="hi-box hi-amber fragment fade-up" style="text-align:center;margin-top:.5rem">
    💡 <strong>הפתרון:</strong> אפליקציה All-in-One לכל תפקידי בית הקפה — עם AI שמנהל בשבילך
  </div>
</div>
</section>

<!-- ══ 03 ROLES ══════════════════════════════════════════════════════════ -->
<section data-transition="slide" data-background-color="#07040a">
<div class="slide-body">
  <div class="accent-bar accent-teal"></div>
  <div class="section-header">
    <h2>4 תפקידים · אפליקציה אחת</h2>
    <p>כל תפקיד מקבל ממשק ייעודי ומותאם</p>
  </div>
  <div class="four-col" style="margin-top:.5rem">
    <div class="role-card fragment fade-up">
      <div class="role-icon">🛍️</div>
      <h3>לקוח</h3>
      <p>תפריט דיגיטלי בעברית, ערבית, אנגלית, רוסית — עם תמונות ומחירים</p>
    </div>
    <div class="role-card fragment fade-up" style="border-color:rgba(20,184,166,0.3)">
      <div class="role-icon">🍽️</div>
      <h3>מלצר</h3>
      <p>שולחנות, הזמנות, תשלום, חלוקת חשבון, הנחות</p>
    </div>
    <div class="role-card fragment fade-up" style="border-color:rgba(168,85,247,0.3)">
      <div class="role-icon">👨‍🍳</div>
      <h3>מטבח</h3>
      <p>תצוגת הזמנות Real-time, סטטוסים, התראות, טיימרים</p>
    </div>
    <div class="role-card fragment fade-up" style="border-color:rgba(245,158,11,0.3)">
      <div class="role-icon">📈</div>
      <h3>מנהל</h3>
      <p>דשבורד AI, דוחות, עובדים, מלאי, תובנות, פרסומות</p>
    </div>
  </div>
  <div class="hi-box hi-teal fragment fade-up" style="margin-top:.5rem;text-align:center">
    🔐 כל תפקיד מוגן עם PIN אישי + אימות Supabase — אין גישה ללא הרשאה
  </div>
</div>
</section>

<!-- ══ 04 TECH STACK ══════════════════════════════════════════════════ -->
<section data-transition="slide" data-background-color="#07040a">
<div class="slide-body">
  <div class="accent-bar accent-purple"></div>
  <div class="section-header">
    <h2>ערימת הטכנולוגיות</h2>
    <p>כלים מודרניים לפרויקט מקצועי ומוכן לייצור</p>
  </div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-top:.5rem">
    <div class="tech-item fragment fade-up"><div class="ti-icon">⚛️</div><div class="ti-name">React 18</div><div class="ti-desc">Frontend SPA</div></div>
    <div class="tech-item fragment fade-up"><div class="ti-icon">🔷</div><div class="ti-name">TypeScript</div><div class="ti-desc">Type Safety</div></div>
    <div class="tech-item fragment fade-up"><div class="ti-icon">⚡</div><div class="ti-name">Vite</div><div class="ti-desc">Build Tool</div></div>
    <div class="tech-item fragment fade-up" style="border-color:rgba(168,85,247,0.3)"><div class="ti-icon">🗄️</div><div class="ti-name">Supabase</div><div class="ti-desc">DB · Auth · Realtime · Storage</div></div>
    <div class="tech-item fragment fade-up" style="border-color:rgba(168,85,247,0.3)"><div class="ti-icon">🤖</div><div class="ti-name">Claude AI</div><div class="ti-desc">Anthropic API</div></div>
    <div class="tech-item fragment fade-up"><div class="ti-icon">🎨</div><div class="ti-name">Tailwind CSS</div><div class="ti-desc">Styling</div></div>
    <div class="tech-item fragment fade-up"><div class="ti-icon">🗺️</div><div class="ti-name">React Router v6</div><div class="ti-desc">Client Routing</div></div>
    <div class="tech-item fragment fade-up"><div class="ti-icon">🔄</div><div class="ti-name">TanStack Query</div><div class="ti-desc">Server State</div></div>
  </div>
</div>
</section>

<!-- ══ 05 ARCHITECTURE ══════════════════════════════════════════════ -->
<section data-transition="slide" data-background-color="#07040a">
<div class="slide-body" style="text-align:center">
  <div class="accent-bar accent-blue" style="margin:0 auto .9rem"></div>
  <div class="section-header" style="text-align:center">
    <h2>ארכיטקטורת המערכת</h2>
    <p>זרימת נתונים מהמשתמש ועד ה-AI</p>
  </div>
  <div class="arch-row" style="margin-top:1.5rem">
    <div class="arch-box fragment fade-up"><div class="ab-icon">📱</div><div class="ab-name">Browser</div><div class="ab-sub">React + Vite</div></div>
    <div class="arch-arrow fragment fade-up">⟷</div>
    <div class="arch-box fragment fade-up" style="border-color:rgba(168,85,247,0.4);background:rgba(168,85,247,0.06)"><div class="ab-icon">🗄️</div><div class="ab-name">Supabase</div><div class="ab-sub">PostgreSQL · Auth · Realtime · RLS</div></div>
    <div class="arch-arrow fragment fade-up">⟶</div>
    <div class="arch-box fragment fade-up"><div class="ab-icon">⚙️</div><div class="ab-name">Edge Functions</div><div class="ab-sub">Deno Runtime</div></div>
    <div class="arch-arrow fragment fade-up">⟶</div>
    <div class="arch-box fragment fade-up" style="border-color:rgba(245,158,11,0.4);background:rgba(245,158,11,0.06)"><div class="ab-icon">🤖</div><div class="ab-name">Claude AI</div><div class="ab-sub">Anthropic API</div></div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-top:1.5rem;max-width:760px;margin-left:auto;margin-right:auto">
    <div class="hi-box hi-purple fragment fade-up">🔐 <strong>Row Level Security</strong><br>כל שאילתה מוגנת ב-DB</div>
    <div class="hi-box hi-teal fragment fade-up">⚡ <strong>WebSockets</strong><br>עדכוני Real-time לכל הלקוחות</div>
    <div class="hi-box hi-blue fragment fade-up">🌐 <strong>Edge Computing</strong><br>AI קרוב למשתמש — תגובה מהירה</div>
  </div>
</div>
</section>

<!-- ══ 06 LANDING PAGE ══════════════════════════════════════════════ -->
<section data-transition="slide" data-background-color="#07040a">
<div class="slide-body">
  <div class="accent-bar accent-amber"></div>
  <div class="two-col">
    <div>
      <div class="section-header">
        <h2>עמוד הבית</h2>
        <p>חוויה ויזואלית ראשונה ללקוח</p>
      </div>
      <ul class="check-list" style="margin-top:.8rem">
        <li class="fragment fade-up">קרוסלת תמונות אוטומטית עם האוכל</li>
        <li class="fragment fade-up">לוגו ומידע על הקפה</li>
        <li class="fragment fade-up">מעבר חלק לתפריט בלחיצה</li>
        <li class="fragment fade-up">בחירת שפה — 4 שפות כולל RTL</li>
        <li class="fragment fade-up">עיצוב רספונסיבי מובייל/דסקטופ</li>
        <li class="fragment fade-up">אנימציות כניסה מרשימות</li>
      </ul>
    </div>
    <div class="screen screen-glow-amber fragment fade-up">
      <img src="${I.landing}" alt="Landing Page">
    </div>
  </div>
</div>
</section>

<!-- ══ 07 MENU ══════════════════════════════════════════════════════ -->
<section data-transition="slide" data-background-color="#07040a">
<div class="slide-body">
  <div class="accent-bar accent-teal"></div>
  <div class="two-col">
    <div class="screen screen-glow-teal fragment fade-up">
      <img src="${I.menu}" alt="Menu">
    </div>
    <div>
      <div class="section-header">
        <h2>תפריט דיגיטלי</h2>
        <p>110+ מנות ב-6 קטגוריות</p>
      </div>
      <ul class="check-list teal" style="margin-top:.8rem">
        <li class="fragment fade-up">תמונה ומחיר לכל מנה</li>
        <li class="fragment fade-up">קטגוריות גמישות (קפה, בורגרים...)</li>
        <li class="fragment fade-up">מחירים מתעדכנים בזמן אמת מה-DB</li>
        <li class="fragment fade-up">תמיכה בכל 4 השפות</li>
        <li class="fragment fade-up">פרסומות מונפשות בחלון Overlay</li>
      </ul>
      <div class="hi-box hi-teal fragment fade-up" style="margin-top:.8rem">
        📲 הלקוח סורק QR קוד ומקבל את התפריט — ללא הורדת אפליקציה
      </div>
    </div>
  </div>
</div>
</section>

<!-- ══ 08 HUB ══════════════════════════════════════════════════════ -->
<section data-transition="slide" data-background-color="#07040a">
<div class="slide-body">
  <div class="accent-bar accent-purple"></div>
  <div class="two-col">
    <div>
      <div class="section-header">
        <h2>מרכז הכניסה — Hub</h2>
        <p>בחירת תפקיד עם אימות PIN</p>
      </div>
      <ul class="check-list purple" style="margin-top:.8rem">
        <li class="fragment fade-up">בחירה בין: מלצר / מטבח / מנהל</li>
        <li class="fragment fade-up">כניסה עם PIN אישי לכל עובד</li>
        <li class="fragment fade-up">PIN נפרד (4 ספרות) לגישת מנהל</li>
        <li class="fragment fade-up">אימות כפול: PIN + Supabase Auth</li>
        <li class="fragment fade-up">גישה מהירה לשעון נוכחות</li>
      </ul>
    </div>
    <div class="screen screen-glow-purple fragment fade-up">
      <img src="${I.hub}" alt="Hub">
    </div>
  </div>
</div>
</section>

<!-- ══ 09 WAITER ══════════════════════════════════════════════════ -->
<section data-transition="slide" data-background-color="#07040a">
<div class="slide-body">
  <div class="accent-bar accent-teal"></div>
  <div class="two-col">
    <div class="screen screen-glow-teal fragment fade-up">
      <img src="${I.waiter}" alt="Waiter Tables">
    </div>
    <div>
      <div class="section-header">
        <h2>מפת שולחנות — מלצר</h2>
        <p>תמונה ויזואלית של כל המסעדה</p>
      </div>
      <ul class="check-list teal" style="margin-top:.8rem">
        <li class="fragment fade-up">15+ שולחנות מקובצים לאזורים (פנים/חוץ/קומה)</li>
        <li class="fragment fade-up">צבע לפי סטטוס: פנוי / פעיל / ממתין לתשלום / ניקוי</li>
        <li class="fragment fade-up">מעבר מיידי להזמנות של כל שולחן</li>
        <li class="fragment fade-up">סיכום בזמן אמת: כמה שולחנות פעילים</li>
      </ul>
    </div>
  </div>
</div>
</section>

<!-- ══ 10 WAITER FEATURES ══════════════════════════════════════ -->
<section data-transition="slide" data-background-color="#07040a">
<div class="slide-body">
  <div class="accent-bar accent-amber"></div>
  <div class="section-header">
    <h2>ניהול הזמנות מלאה — מלצר</h2>
    <p>מהזמנה ועד תשלום בלחיצות בודדות</p>
  </div>
  <div class="three-col" style="margin-top:.5rem">
    <div class="card fragment fade-up"><div class="icon">🛒</div><h3>עגלת הזמנה חכמה</h3><p>הוספה מהתפריט, כמויות, הערות לכל פריט</p></div>
    <div class="card bordered-teal fragment fade-up"><div class="icon">💳</div><h3>4 אמצעי תשלום</h3><p>מזומן · אשראי · אפליקציה · אחר</p></div>
    <div class="card bordered-purple fragment fade-up"><div class="icon">🔀</div><h3>חלוקת חשבון</h3><p>פיצול בין כמה משלמים — אוטומטי</p></div>
    <div class="card bordered-rose fragment fade-up"><div class="icon">🏷️</div><h3>מערכת הנחות</h3><p>אחוז / סכום קבוע עם אישור מנהל</p></div>
    <div class="card bordered-blue fragment fade-up"><div class="icon">📝</div><h3>הערות שולחן</h3><p>אלרגיות, VIP, בקשות מיוחדות</p></div>
    <div class="card fragment fade-up"><div class="icon">⚡</div><h3>שליחה למטבח</h3><p>הזמנה מגיעה למטבח תוך שניה — Real-time</p></div>
  </div>
</div>
</section>

<!-- ══ 11 KITCHEN ══════════════════════════════════════════════════ -->
<section data-transition="slide" data-background-color="#07040a">
<div class="slide-body">
  <div class="accent-bar accent-rose"></div>
  <div class="two-col">
    <div>
      <div class="section-header">
        <h2>תצוגת מטבח — KDS</h2>
        <p>Kitchen Display System בזמן אמת</p>
      </div>
      <ul class="check-list rose" style="margin-top:.8rem">
        <li class="fragment fade-up">Supabase Realtime — הזמנה מופיעה תוך שניות</li>
        <li class="fragment fade-up">3 עמודות: חדש / בהכנה / מוכן</li>
        <li class="fragment fade-up">טיימר לכל הזמנה — אדום כשמאחרים</li>
        <li class="fragment fade-up">שם הפריטים וכמויות ברורות</li>
        <li class="fragment fade-up">לחיצה אחת = מעבר לשלב הבא</li>
      </ul>
      <div class="hi-box hi-rose fragment fade-up" style="margin-top:.8rem">
        ⚡ WebSocket חי — כשמלצר שולח, המטבח רואה מיד, ללא רענון
      </div>
    </div>
    <div class="screen screen-glow-purple fragment fade-up">
      <img src="${I.kitchen}" alt="Kitchen">
    </div>
  </div>
</div>
</section>

<!-- ══ 12 PUNCH CLOCK ══════════════════════════════════════════ -->
<section data-transition="slide" data-background-color="#07040a">
<div class="slide-body">
  <div class="accent-bar accent-blue"></div>
  <div class="two-col">
    <div class="screen screen-glow-amber fragment fade-up">
      <img src="${I.punch}" alt="Punch Clock">
    </div>
    <div>
      <div class="section-header">
        <h2>שעון נוכחות</h2>
        <p>כניסה ויציאה ממשמרת עם PIN אישי</p>
      </div>
      <ul class="check-list" style="margin-top:.8rem">
        <li class="fragment fade-up">כניסה / יציאה עם PIN 4 ספרות</li>
        <li class="fragment fade-up">חישוב שעות עבודה אוטומטי</li>
        <li class="fragment fade-up">ניטור הפסקות</li>
        <li class="fragment fade-up">מעקב מי מחובר עכשיו</li>
        <li class="fragment fade-up">תואם לדיני עבודה ישראלי</li>
      </ul>
      <div class="hi-box hi-blue fragment fade-up" style="margin-top:.8rem">
        📊 כל המשמרות נשמרות ב-DB ומוצגות בדוח ביצועי עובדים
      </div>
    </div>
  </div>
</div>
</section>

<!-- ══ 13 ADMIN LOGIN ══════════════════════════════════════════ -->
<section data-transition="slide" data-background-color="#07040a">
<div class="slide-body">
  <div class="accent-bar accent-amber"></div>
  <div class="two-col">
    <div>
      <div class="section-header">
        <h2>כניסת מנהל — אבטחה כפולה</h2>
        <p>מייל + סיסמה · ואז PIN</p>
      </div>
      <ul class="check-list" style="margin-top:.8rem">
        <li class="fragment fade-up">כניסה עם מייל וסיסמה (Supabase Auth)</li>
        <li class="fragment fade-up">בדיקת הרשאות מול טבלת user_roles</li>
        <li class="fragment fade-up">Row Level Security — הגנה בבסיס הנתונים</li>
        <li class="fragment fade-up">JWT Token · Sessions · Auto-refresh</li>
        <li class="fragment fade-up">PIN נפרד לגישת לוח הניהול</li>
      </ul>
      <div class="hi-box hi-amber fragment fade-up" style="margin-top:.8rem">
        🛡️ גם אם מישהו יש לו את הסיסמה — בלי ה-PIN הוא לא מגיע ללוח הניהול
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:1rem">
      <div class="screen screen-glow-amber fragment fade-up">
        <img src="${I.login}" alt="Admin Login">
      </div>
    </div>
  </div>
</div>
</section>

<!-- ══ 14 ADMIN HUB ══════════════════════════════════════════════ -->
<section data-transition="slide" data-background-color="#07040a">
<div class="slide-body">
  <div class="accent-bar accent-purple"></div>
  <div class="two-col">
    <div class="screen screen-glow-purple fragment fade-up">
      <img src="${I.hubAdmin}" alt="Admin Hub">
    </div>
    <div>
      <div class="section-header">
        <h2>לוח מנהל — ניווט ראשי</h2>
        <p>6 מודולים בלוח ניהול אחד</p>
      </div>
      <ul class="check-list purple" style="margin-top:.8rem">
        <li class="fragment fade-up"><strong style="color:#c084fc">ניהול</strong> — דשבורד עם AI Chat לניהול תפריט</li>
        <li class="fragment fade-up"><strong style="color:#c084fc">דוחות</strong> — ניתוח הכנסות ומכירות</li>
        <li class="fragment fade-up"><strong style="color:#c084fc">ביצועי עובדים</strong> — שעות, מכירות, דירוג</li>
        <li class="fragment fade-up"><strong style="color:#c084fc">היסטוריה</strong> — כל ההזמנות לפי שולחן ותאריך</li>
        <li class="fragment fade-up"><strong style="color:#c084fc">המלצות AI</strong> — תובנות שבועיות חכמות</li>
        <li class="fragment fade-up"><strong style="color:#c084fc">פרסומות</strong> — באנרים שיווקיים ללקוחות</li>
      </ul>
    </div>
  </div>
</div>
</section>

<!-- ══ 15 AI CHAT ⭐ ══════════════════════════════════════════════ -->
<section data-transition="zoom" data-background-color="#0a0518">
<div class="slide-body" style="text-align:center">
  <span class="star-badge" style="margin:0 auto .8rem">⭐ פיצ'ר כוכב — ייחודי לפרויקט</span>
  <h2 style="font-size:2.2rem;background:linear-gradient(135deg,#fcd34d,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:.3rem">עוזר AI לניהול בשפה טבעית</h2>
  <p style="color:var(--muted);margin-bottom:1rem">שאל בעברית → AI מנהל את התפריט אוטומטית בבסיס הנתונים</p>
  <div class="two-col">
    <div class="screen screen-glow-purple fragment fade-up">
      <img src="${I.dashboard}" alt="AI Dashboard">
    </div>
    <div style="background:#faf7f4;border-radius:14px;padding:1.2rem;color:#1e1035;direction:rtl;text-align:right" class="fragment fade-up">
      <div style="display:flex;gap:.7rem;margin-bottom:.9rem;align-items:flex-start">
        <div style="width:34px;height:34px;border-radius:50%;background:#d97706;display:flex;align-items:center;justify-content:center;font-size:.9rem;flex-shrink:0">👤</div>
        <div style="background:#e8e4ff;padding:.6rem 1rem;border-radius:12px 12px 12px 4px;font-size:.82rem;max-width:85%">הוסף לתפריט "פיצה מרגריטה" ב-52 שקל לקטגוריית מנות עיקריות</div>
      </div>
      <div style="display:flex;gap:.7rem;margin-bottom:.9rem;align-items:flex-start;flex-direction:row-reverse">
        <div style="width:34px;height:34px;border-radius:50%;background:#7c3aed;display:flex;align-items:center;justify-content:center;font-size:.9rem;flex-shrink:0">🤖</div>
        <div style="background:white;border:1px solid #e8e0d8;padding:.6rem 1rem;border-radius:12px 12px 4px 12px;font-size:.82rem;max-width:85%"><span style="color:#22c55e;font-weight:700">✓</span> הוספתי "פיצה מרגריטה" ב-52₪ לקטגוריית מנות עיקריות</div>
      </div>
      <div style="display:flex;gap:.7rem;margin-bottom:.9rem;align-items:flex-start">
        <div style="width:34px;height:34px;border-radius:50%;background:#d97706;display:flex;align-items:center;justify-content:center;font-size:.9rem;flex-shrink:0">👤</div>
        <div style="background:#e8e4ff;padding:.6rem 1rem;border-radius:12px 12px 12px 4px;font-size:.82rem;max-width:85%">עדכן את מחיר הקפה האמריקאי ל-18 שקל</div>
      </div>
      <div style="display:flex;gap:.7rem;align-items:flex-start;flex-direction:row-reverse">
        <div style="width:34px;height:34px;border-radius:50%;background:#7c3aed;display:flex;align-items:center;justify-content:center;font-size:.9rem;flex-shrink:0">🤖</div>
        <div style="background:white;border:1px solid #e8e0d8;padding:.6rem 1rem;border-radius:12px 12px 4px 12px;font-size:.82rem;max-width:85%"><span style="color:#22c55e;font-weight:700">✓</span> עדכנתי "קפה אמריקאי" מ-15₪ ל-18₪ בהצלחה</div>
      </div>
    </div>
  </div>
  <div class="hi-box hi-purple fragment fade-up" style="margin-top:.8rem">
    🤖 מופעל על ידי <strong>Claude AI</strong> דרך Supabase Edge Function — מבצע שאילתות SQL בזמן אמת
  </div>
</div>
</section>

<!-- ══ 16 DASHBOARD TABS ══════════════════════════════════════════ -->
<section data-transition="slide" data-background-color="#07040a">
<div class="slide-body">
  <div class="accent-bar accent-amber"></div>
  <div class="section-header">
    <h2>ניהול תפריט ועובדים</h2>
    <p>4 לשוניות בדשבורד המנהל</p>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1rem;margin-top:.5rem">
    <div class="fragment fade-up">
      <div class="screen"><img src="${I.tabCats}" alt="Categories"></div>
      <p class="screen-caption" style="color:var(--muted);font-size:.72rem;text-align:center;margin-top:.4rem">📁 קטגוריות — שם רב-לשוני + תמונה</p>
    </div>
    <div class="fragment fade-up">
      <div class="screen"><img src="${I.tabMenu}" alt="Menu Items"></div>
      <p class="screen-caption" style="color:var(--muted);font-size:.72rem;text-align:center;margin-top:.4rem">🍕 פריטי תפריט — מחיר, עלות, תמונה</p>
    </div>
    <div class="fragment fade-up">
      <div class="screen"><img src="${I.tabEmps}" alt="Employees"></div>
      <p class="screen-caption" style="color:var(--muted);font-size:.72rem;text-align:center;margin-top:.4rem">👥 עובדים — תפקיד, PIN, תעריף שעתי</p>
    </div>
  </div>
</div>
</section>

<!-- ══ 17 REPORTS + CHART ══════════════════════════════════════════ -->
<section data-transition="slide" data-background-color="#07040a">
<div class="slide-body">
  <div class="accent-bar accent-teal"></div>
  <div class="section-header"><h2>דוחות ואנליטיקה</h2><p>נתונים אמיתיים מהמערכת — ינואר עד יוני 2026</p></div>
  <div class="two-col" style="margin-top:.5rem">
    <div class="screen screen-glow-teal fragment fade-up">
      <img src="${I.reports}" alt="Reports">
    </div>
    <div class="fragment fade-up">
      <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:1.2rem">
        <p style="font-size:.82rem;color:var(--muted);margin-bottom:.8rem;text-align:center">📈 הכנסות חודשיות (₪) — מגמת צמיחה</p>
        <canvas id="revenueChart" height="200"></canvas>
      </div>
      <div class="kpi-strip" style="margin-top:1rem">
        <div class="kpi"><div class="kv kv-teal">474</div><div class="kl">סה"כ הזמנות</div></div>
        <div class="kpi"><div class="kv kv-amber">₪84K</div><div class="kl">סה"כ הכנסות</div></div>
        <div class="kpi"><div class="kv kv-purple">₪177</div><div class="kl">ממוצע להזמנה</div></div>
      </div>
    </div>
  </div>
</div>
</section>

<!-- ══ 18 PERFORMANCE ══════════════════════════════════════════════ -->
<section data-transition="slide" data-background-color="#07040a">
<div class="slide-body">
  <div class="accent-bar accent-purple"></div>
  <div class="two-col">
    <div>
      <div class="section-header"><h2>ביצועי עובדים</h2><p>נתוני עבודה אמיתיים מ-5 חודשים</p></div>
      <div style="margin-top:1rem">
        <div class="emp-row fragment fade-up">
          <div class="emp-avatar" style="background:rgba(245,158,11,0.2)">👨</div>
          <div style="flex:1">
            <div class="emp-name">george</div>
            <div class="emp-role">מלצר · 105 משמרות</div>
            <div class="emp-bar-wrap" style="margin-top:.4rem"><div class="emp-bar" style="width:100%;background:linear-gradient(90deg,var(--amber),var(--amber2))"></div></div>
          </div>
          <div class="emp-stat">1,544 שעות</div>
        </div>
        <div class="emp-row fragment fade-up">
          <div class="emp-avatar" style="background:rgba(168,85,247,0.2)">👨‍🍳</div>
          <div style="flex:1">
            <div class="emp-name">jawad</div>
            <div class="emp-role">מלצר · 103 משמרות</div>
            <div class="emp-bar-wrap" style="margin-top:.4rem"><div class="emp-bar" style="width:53%;background:linear-gradient(90deg,#7c3aed,#a855f7)"></div></div>
          </div>
          <div class="emp-stat">818 שעות</div>
        </div>
        <div class="emp-row fragment fade-up">
          <div class="emp-avatar" style="background:rgba(20,184,166,0.2)">👩</div>
          <div style="flex:1">
            <div class="emp-name">נור</div>
            <div class="emp-role">עובדת · 83 משמרות</div>
            <div class="emp-bar-wrap" style="margin-top:.4rem"><div class="emp-bar" style="width:43%;background:linear-gradient(90deg,#0d9488,#14b8a6)"></div></div>
          </div>
          <div class="emp-stat">664 שעות</div>
        </div>
      </div>
    </div>
    <div class="screen screen-glow-purple fragment fade-up">
      <img src="${I.perf}" alt="Performance">
    </div>
  </div>
</div>
</section>

<!-- ══ 19 HISTORY + INSIGHTS ══════════════════════════════════ -->
<section data-transition="slide" data-background-color="#07040a">
<div class="slide-body">
  <div class="accent-bar accent-blue"></div>
  <div class="section-header"><h2>היסטוריה · המלצות AI</h2></div>
  <div class="two-col" style="margin-top:.5rem">
    <div>
      <div class="screen screen-glow-amber fragment fade-up">
        <img src="${I.history}" alt="History">
      </div>
      <p style="text-align:center;color:var(--muted);font-size:.78rem;margin-top:.5rem;padding:0 .5rem" class="fragment fade-up">📚 כל ההזמנות לפי שולחן ותאריך — חיפוש, סינון, ייצוא</p>
    </div>
    <div>
      <div class="screen screen-glow-purple fragment fade-up">
        <img src="${I.insights}" alt="AI Insights">
      </div>
      <p style="text-align:center;color:var(--muted);font-size:.78rem;margin-top:.5rem;padding:0 .5rem" class="fragment fade-up">✨ Claude AI מנתח את נתוני השבוע ומייצר המלצות אסטרטגיות</p>
    </div>
  </div>
</div>
</section>

<!-- ══ 20 PROMO ══════════════════════════════════════════════════ -->
<section data-transition="slide" data-background-color="#07040a">
<div class="slide-body">
  <div class="accent-bar accent-rose"></div>
  <div class="two-col">
    <div class="screen screen-glow-amber fragment fade-up">
      <img src="${I.promo}" alt="Promo Banners">
    </div>
    <div>
      <div class="section-header"><h2>מערכת פרסומות</h2><p>באנרים שיווקיים ללקוחות</p></div>
      <ul class="check-list rose" style="margin-top:.8rem">
        <li class="fragment fade-up">העלאת תמונת באנר לאחסון Supabase</li>
        <li class="fragment fade-up">הגדרת זמן הצגה בשניות</li>
        <li class="fragment fade-up">הפעלה / כיבוי מיידי</li>
        <li class="fragment fade-up">מוצג אוטומטית ללקוחות בתפריט</li>
        <li class="fragment fade-up">מבצעים, ברכות, הודעות חשובות</li>
      </ul>
    </div>
  </div>
</div>
</section>

<!-- ══ 21 ORDERS CHART ══════════════════════════════════════════ -->
<section data-transition="slide" data-background-color="#07040a">
<div class="slide-body" style="text-align:center">
  <div class="accent-bar accent-amber" style="margin:0 auto .9rem"></div>
  <div class="section-header" style="text-align:center">
    <h2>מגמת צמיחה — נתונים אמיתיים</h2>
    <p>ינואר עד יוני 2026 · 474 הזמנות · ₪84,042 הכנסות</p>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:2rem;margin-top:1rem;align-items:center">
    <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:1.2rem" class="fragment fade-up">
      <p style="font-size:.8rem;color:var(--muted);margin-bottom:.8rem">📦 הזמנות לחודש</p>
      <canvas id="ordersChart" height="220"></canvas>
    </div>
    <div class="fragment fade-up">
      <div class="kpi-strip" style="flex-direction:column;gap:.8rem">
        <div class="kpi" style="width:100%;display:flex;justify-content:space-between;align-items:center;flex-direction:row;padding:1rem 1.5rem">
          <div>
            <div class="kv kv-amber" style="font-size:1.6rem">+100%</div>
            <div class="kl">צמיחה ינואר → מאי</div>
          </div>
          <span style="font-size:2.5rem">📈</span>
        </div>
        <div class="kpi" style="width:100%;display:flex;justify-content:space-between;align-items:center;flex-direction:row;padding:1rem 1.5rem">
          <div>
            <div class="kv kv-teal" style="font-size:1.6rem">₪21,663</div>
            <div class="kl">שיא הכנסות — מאי 2026</div>
          </div>
          <span style="font-size:2.5rem">🏆</span>
        </div>
        <div class="kpi" style="width:100%;display:flex;justify-content:space-between;align-items:center;flex-direction:row;padding:1rem 1.5rem">
          <div>
            <div class="kv kv-purple" style="font-size:1.6rem">291</div>
            <div class="kl">משמרות עובדים שנרשמו</div>
          </div>
          <span style="font-size:2.5rem">⏰</span>
        </div>
      </div>
    </div>
  </div>
</div>
</section>

<!-- ══ 22 LANGUAGES ══════════════════════════════════════════════ -->
<section data-transition="slide" data-background-color="#07040a">
<div class="slide-body" style="text-align:center">
  <div class="accent-bar accent-teal" style="margin:0 auto .9rem"></div>
  <div class="section-header" style="text-align:center">
    <h2>תמיכה מלאה ב-4 שפות</h2>
    <p>כולל RTL מלא לעברית וערבית</p>
  </div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1.2rem;margin-top:1.5rem;max-width:800px;margin-left:auto;margin-right:auto">
    <div class="role-card fragment fade-up"><div class="role-icon">🇮🇱</div><h3>עברית</h3><p>RTL · ממשק מלא</p></div>
    <div class="role-card fragment fade-up" style="border-color:rgba(20,184,166,0.3)"><div class="role-icon">🇸🇦</div><h3>ערבית</h3><p>RTL מלא · כל המסכים</p></div>
    <div class="role-card fragment fade-up" style="border-color:rgba(59,130,246,0.3)"><div class="role-icon">🇺🇸</div><h3>English</h3><p>LTR Full UI</p></div>
    <div class="role-card fragment fade-up" style="border-color:rgba(168,85,247,0.3)"><div class="role-icon">🇷🇺</div><h3>Русский</h3><p>Полный интерфейс</p></div>
  </div>
  <div class="hi-box hi-teal fragment fade-up" style="margin-top:1.5rem;max-width:600px;margin-left:auto;margin-right:auto">
    🔄 שמירת בחירת השפה ב-localStorage — נשמרת בין ביקורים אוטומטית
  </div>
</div>
</section>

<!-- ══ 23 SUMMARY ══════════════════════════════════════════════════ -->
<section data-transition="slide" data-background-color="#07040a">
<div class="slide-body">
  <div class="accent-bar accent-amber"></div>
  <div class="section-header"><h2>סיכום — מה בניתי</h2><p>פרויקט Full-Stack מלא, מוכן לייצור, עם AI</p></div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.2rem;margin-top:.5rem">
    <div class="card bordered-purple fragment fade-up"><div class="icon">📱</div><h3>19 דפי React</h3><p>ממשקים ייעודיים לכל תפקיד עם 80+ קומפוננטות</p></div>
    <div class="card bordered-teal fragment fade-up"><div class="icon">🗄️</div><h3>בסיס נתונים עשיר</h3><p>12 טבלאות, 20+ מיגרציות SQL, RLS על כולן</p></div>
    <div class="card bordered-rose fragment fade-up"><div class="icon">⚙️</div><h3>3 Edge Functions</h3><p>AI Chat, Weekly Insights, Promo Images</p></div>
    <div class="card fragment fade-up"><div class="icon">⚡</div><h3>Real-time</h3><p>WebSockets · Supabase Realtime Channels</p></div>
  </div>
  <div class="kpi-strip fragment fade-up" style="margin-top:1rem">
    <div class="kpi"><div class="kv kv-amber">474</div><div class="kl">הזמנות במערכת</div></div>
    <div class="kpi"><div class="kv kv-teal">110+</div><div class="kl">פריטי תפריט</div></div>
    <div class="kpi"><div class="kv kv-purple">3</div><div class="kl">עובדים פעילים</div></div>
    <div class="kpi"><div class="kv kv-rose">4</div><div class="kl">שפות</div></div>
    <div class="kpi"><div class="kv kv-green">AI</div><div class="kl">Claude Powered</div></div>
  </div>
</div>
</section>

<!-- ══ 24 THANK YOU ══════════════════════════════════════════════ -->
<section data-transition="zoom" data-background-color="#07040a">
<div class="title-wrap">
  <div class="logo-orb"><div class="logo-inner">☕</div></div>
  <div>
    <div class="title-h1">תודה רבה!</div>
    <div class="title-sub" style="margin-top:.6rem">Cafe AI Manager · פרויקט גמר 2026</div>
  </div>
  <div class="badge-row">
    <span class="badge">React</span>
    <span class="badge purple">Supabase</span>
    <span class="badge teal">Claude AI</span>
    <span class="badge rose">Real-time</span>
  </div>
  <p style="color:var(--amber2);font-size:1.2rem;font-weight:700">שאלות? 🙋</p>
</div>
</section>

</div><!-- /slides -->
</div><!-- /reveal -->

<script src="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.6.1/reveal.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js"></script>
<script>
Reveal.initialize({
  hash:true, slideNumber:'c/t',
  transition:'slide', transitionSpeed:'default',
  backgroundTransition:'fade',
  controls:true, progress:true, center:true,
  fragments:true,
  keyboard:{39:'next',37:'prev',40:'next',38:'prev'}
});

// ── Revenue Chart ──
Reveal.on('slidechanged', ({indexh}) => {
  if(indexh === 16) initRevenueChart();
  if(indexh === 20) initOrdersChart();
});

let revenueInited = false, ordersInited = false;

function initRevenueChart(){
  if(revenueInited) return; revenueInited = true;
  new Chart(document.getElementById('revenueChart'), {
    type:'bar',
    data:{
      labels:['ינואר','פברואר','מרץ','אפריל','מאי','יוני*'],
      datasets:[{
        label:'הכנסות ₪',
        data:[10574,12703,15751,16927,21663,6424],
        backgroundColor:[
          'rgba(245,158,11,0.7)','rgba(245,158,11,0.7)','rgba(245,158,11,0.7)',
          'rgba(245,158,11,0.7)','rgba(245,158,11,0.9)','rgba(20,184,166,0.7)'
        ],
        borderColor:['#f59e0b','#f59e0b','#f59e0b','#f59e0b','#fcd34d','#14b8a6'],
        borderWidth:2, borderRadius:6
      }]
    },
    options:{
      responsive:true, plugins:{legend:{display:false},
        tooltip:{callbacks:{label:c=>'₪'+c.raw.toLocaleString()}}},
      scales:{
        y:{ticks:{color:'#9489a8',callback:v=>'₪'+v.toLocaleString()},grid:{color:'rgba(255,255,255,0.06)'}},
        x:{ticks:{color:'#9489a8'},grid:{display:false}}
      }
    }
  });
}

function initOrdersChart(){
  if(ordersInited) return; ordersInited = true;
  new Chart(document.getElementById('ordersChart'), {
    type:'line',
    data:{
      labels:['ינואר','פברואר','מרץ','אפריל','מאי','יוני*'],
      datasets:[{
        label:'הזמנות',
        data:[60,72,90,97,120,35],
        borderColor:'#a855f7', backgroundColor:'rgba(168,85,247,0.15)',
        borderWidth:3, tension:0.4, fill:true, pointRadius:6,
        pointBackgroundColor:'#a855f7', pointBorderColor:'#fff', pointBorderWidth:2
      }]
    },
    options:{
      responsive:true, plugins:{legend:{display:false},
        tooltip:{callbacks:{label:c=>c.raw+' הזמנות'}}},
      scales:{
        y:{ticks:{color:'#9489a8'},grid:{color:'rgba(255,255,255,0.06)'}},
        x:{ticks:{color:'#9489a8'},grid:{display:false}}
      }
    }
  });
}
</script>
</body>
</html>`;

writeFileSync(OUT, html, 'utf8');
console.log('✅ Presentation built:', OUT);
console.log('   Size:', (html.length / 1024 / 1024).toFixed(1), 'MB');
