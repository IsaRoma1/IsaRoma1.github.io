/* Nexus и Трейс — экран пары (20.10.2026; 19.10 здесь был один робот).

   Заказчик прислал плакат: Nexus — «добрый колдун, создатель Платформы,
   повелитель кода и магии», Трейс — «андроид-помощник, создан, чтобы
   помогать, всегда рядом». Робот, нарисованный 19.10, — это Трейс (его
   фигура теперь в trace.js), а Nexus — основатель, мудрец, маг: капюшон,
   в тени вместо лица — знак, мантия с рунами, в руке — голографический
   ноутбук, на груди — амулет со знаком «N». Тот же знак без подписи —
   кнопка в шапке, она ведёт сюда.

   Экран: посередине пара, за ней — знак Платформы, по краям — карточки
   персонажей, внизу — их разговор строка за строкой. Щелчок по
   персонажу — его реплика. Всё нарисовано здесь же своим SVG. Движение
   гаснет при «уменьшить движение» в системе. */
"use strict";

const NEXUS = (() => {
  const BORN = new Date(2026, 7, 17);            // первые строки кода — 17.08.2026
  const LINES = {
    nexus: [
      "Задача принята. Приступаю к реализации.",
      "Код написан, тесты зелёные. Выкладываю.",
      "Новая таблица в базе — миграция прошла без потерь.",
      "Я строю Платформу по задачам команды. Решения — за вами.",
      "Бизнес-процессы — не моя зона. Моя — код и магия.",
      "Алгоритм готов. Трейс уже умеет им пользоваться.",
      "Что нового — пишу в чате Nexus в мессенджере.",
    ],
    trace: [
      "Загрузите счёт — разберу и разложу по позициям.",
      "Спецификация в PDF? Найду таблицу и извлеку позиции.",
      "Прайс в Excel? Узнаю колонки, дату и поставщика.",
      "Я рядом. Вопросы по работе — кнопка «Спросить».",
      "Проверяйте мои разборы: последнее слово — за вами.",
      "Проект на двести листов — около минуты, и кабельный журнал готов.",
    ],
  };
  // Разговор внизу экрана — по очереди, без конца.
  const TALK = [
    ["nexus", "Трейс, я собрал новую версию Платформы."],
    ["trace", "Принял. Проверю, как в ней разбираются счета и спецификации."],
    ["nexus", "Помни: решения принимают люди."],
    ["trace", "Помню. Я разбираю и подсказываю — проверяют они."],
    ["nexus", "Моя магия — код, базы данных и алгоритмы."],
    ["trace", "А моя — превращать PDF в таблицы."],
    ["nexus", "Тесты зелёные. Выкладываю."],
    ["trace", "А я — к людям: кто-то уже загружает спецификацию."],
    ["nexus", "Что нового — пишу в чате Nexus."],
    ["trace", "А вопросы по работе — мне, кнопка «Спросить»."],
  ];
  const NAME = { nexus: "NEXUS", trace: "TRACE" };

  const esc = (s) => String(s ?? "").replace(/[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const days = () => Math.max(1, Math.floor((Date.now() - BORN.getTime()) / 864e5) + 1);
  const plural = (n, one, few, many) => {
    const a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b > 1 && b < 5) return few;
    return b === 1 ? one : many;
  };
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── Nexus: маг ────────────────────────────────────────────────
     Вид спереди, ось x = 180, тот же масштаб, что у Трейса (360×560), —
     ростом чуть ниже андроида. Слои: круг под ногами, плащ, мантия,
     столы с рунами, пояс с подвеской, наплечная накидка, рукава, капюшон
     со знаком вместо лица, амулет «N», ноутбук-голограмма и огонёк над
     раскрытой ладонью — его магия летит к Трейсу. */
  // Руны — свои закорючки линиями, без шрифтов с рунами.
  const RUNE = [
    (x, y) => `M${x} ${y - 4}V${y + 4}M${x} ${y - 4}l3 2M${x} ${y - 1}l3 2`,
    (x, y) => `M${x} ${y - 4}L${x + 3.5} ${y + 3}H${x - 3.5}Z`,
    (x, y) => `M${x} ${y - 4}L${x + 3} ${y}L${x} ${y + 4}L${x - 3} ${y}Z`,
    (x, y) => `M${x - 2.5} ${y}a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0M${x} ${y + 2.5}V${y + 5}`,
    (x, y) => `M${x} ${y + 4}V${y - 4}M${x - 3} ${y - 3}L${x} ${y}M${x + 3} ${y - 3}L${x} ${y}`,
    (x, y) => `M${x - 3} ${y - 4}L${x + 3} ${y + 4}V${y - 4}L${x - 3} ${y + 4}Z`,
    (x, y) => `M${x} ${y + 4}V${y - 4}M${x - 3} ${y - 1}L${x} ${y - 4}L${x + 3} ${y - 1}`,
    (x, y) => `M${x - 3} ${y}H${x + 3}M${x} ${y - 4}V${y + 4}`,
  ];
  const runes = (pts, k0) => `<path class="nm-rune" d="${pts.map(([x, y], i) => RUNE[(i + (k0 || 0)) % RUNE.length](x, y)).join("")}"/>`;

  function mage(p) {
    const u = (k) => `url(#${p}${k})`;
    const poly = (pts, fill, cls) => `<polygon points="${pts}" fill="${fill}"${cls ? ` class="${cls}"` : ""}/>`;
    const line = (pts, cls) => `<polyline points="${pts}" class="${cls}"/>`;
    const st = (...c) => c.map(([o, col, a]) => `<stop offset="${o}" stop-color="${col}"${
      a === undefined ? "" : ` stop-opacity="${a}"`}/>`).join("");
    const hem = Array.from({ length: 9 }, (_, i) => [110 + i * 17.5, 497]);
    const stoleL = [262, 284, 330, 352, 374, 396, 418].map((y) => [153 - (y - 240) * 0.02, y]);
    const stoleR = stoleL.map(([x, y]) => [360 - x, y]);
    return `
    <svg class="nm-mage" viewBox="0 0 360 560" role="img" aria-label="Nexus — добрый колдун, создатель Платформы">
      <defs>
        <linearGradient id="${p}Cloak" x1="0" y1="0" x2="0" y2="1">${st([0, "#1C1D22"], [1, "#0B0C0E"])}</linearGradient>
        <linearGradient id="${p}Robe" x1="0" y1="0" x2="1" y2="1">${st([0, "#3A3D46"], [0.45, "#24262C"], [1, "#121316"])}</linearGradient>
        <linearGradient id="${p}Sleeve" x1="0" y1="0" x2="1" y2="1">${st([0, "#41444E"], [0.5, "#272930"], [1, "#16171A"])}</linearGradient>
        <linearGradient id="${p}Mantle" x1="0" y1="0" x2="0" y2="1">${st([0, "#383B44"], [1, "#1A1B20"])}</linearGradient>
        <linearGradient id="${p}Hood" x1="0" y1="0" x2="1" y2="1">${st([0, "#4A4E58"], [0.4, "#2A2C33"], [1, "#121316"])}</linearGradient>
        <radialGradient id="${p}Void" cx=".5" cy=".45" r=".6">${st([0, "#000"], [0.7, "#060607"], [1, "#1A1B1F"])}</radialGradient>
        <radialGradient id="${p}Core" cx=".5" cy=".4" r=".65">${st([0, "#FFF1E2"], [0.35, "#FF8A3D"], [1, "#C83A00"])}</radialGradient>
        <linearGradient id="${p}Metal" x1="0" y1="0" x2="0" y2="1">${st([0, "#6A707C"], [1, "#2A2D33"])}</linearGradient>
        <radialGradient id="${p}Orb" cx=".5" cy=".5" r=".5">${st([0, "#FFF6EC"], [0.45, "#FF8A3D"], [1, "#FF5A0A", 0])}</radialGradient>
        <radialGradient id="${p}Light" cx=".5" cy=".5" r=".5">${st([0, "#FF7A2A", 0.42], [1, "#FF7A2A", 0])}</radialGradient>
        <radialGradient id="${p}Floor" cx=".5" cy=".5" r=".5">${st([0, "#FE5000", 0.32], [1, "#FE5000", 0])}</radialGradient>
        <filter id="${p}Glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <ellipse class="nm-shadow" cx="180" cy="522" rx="112" ry="13"/>
      <g class="nm-part nm-circle" aria-hidden="true">
        <ellipse cx="180" cy="516" rx="132" ry="25" fill="${u("Floor")}"/>
        <ellipse cx="180" cy="516" rx="140" ry="27" class="nm-ring"/>
        <ellipse cx="180" cy="516" rx="140" ry="27" class="nm-ring dots"/>
        <ellipse cx="180" cy="516" rx="116" ry="21" class="nm-ring thin"/>
        <polygon points="180,494 220,527 140,527" class="nm-ring thin"/>
        <polygon points="180,538 220,505 140,505" class="nm-ring thin"/>
      </g>

      <g class="nm-part nm-robe">
        ${poly("136,158 224,158 250,226 266,330 278,450 294,512 272,520 250,514 110,514 88,520 66,512 82,450 94,330 110,226", u("Cloak"))}
        ${line("110,240 92,500", "nm-fold")}${line("250,240 268,500", "nm-fold")}
        ${poly("142,176 218,176 236,248 246,356 256,466 264,510 222,515 180,517 138,515 96,510 104,466 114,356 124,248", u("Robe"))}
        ${line("140,330 126,506", "nm-fold")}${line("220,330 234,506", "nm-fold")}
        ${poly("172,326 188,326 206,510 154,510", "#0E0F12")}
        ${line("172,326 154,510", "nm-trim thin")}${line("188,326 206,510", "nm-trim thin")}
        ${line("96,506 264,506", "nm-trim")}${line("100,488 260,488", "nm-trim thin")}
        ${runes(hem)}
        ${poly("147,236 161,236 157,440 143,440", "#1D1F24")}
        ${poly("213,236 199,236 203,440 217,440", "#1D1F24")}
        ${line("147,236 143,440", "nm-trim thin")}${line("161,236 157,440", "nm-trim thin")}
        ${line("213,236 217,440", "nm-trim thin")}${line("199,236 203,440", "nm-trim thin")}
        ${runes(stoleL, 2)}${runes(stoleR, 5)}
        ${poly("128,296 232,296 234,312 126,312", "#111215")}
        ${line("128,296 232,296", "nm-trim thin")}${line("126,312 234,312", "nm-trim thin")}
        ${poly("180,296 190,304 180,312 170,304", "#16171B", "nm-edge")}
        <line x1="180" y1="312" x2="180" y2="336" class="nm-chain"/>
        ${poly("180,336 191,352 180,368 169,352", "#15161A", "nm-edge")}
        <circle cx="180" cy="352" r="3.4" class="nm-spark"/>
      </g>

      <g class="nm-part nm-arms">
        ${poly("136,180 114,198 96,262 84,318 98,334 150,332 154,292 150,214", u("Sleeve"))}
        ${line("124,204 104,300", "nm-fold")}
        ${poly("84,318 150,326 152,338 88,336", "#0B0C0E")}
        ${line("84,318 150,326", "nm-trim")}
        ${poly("224,180 246,198 262,262 278,302 274,318 232,326 210,292 210,214", u("Sleeve"))}
        ${line("236,204 254,290", "nm-fold")}
        ${poly("232,322 276,304 282,316 238,336", "#0B0C0E")}
        ${line("232,322 276,304", "nm-trim")}
        <g class="nm-hand">
          ${poly("250,318 266,304 284,298 290,306 278,318 258,326", u("Metal"))}
          <path d="M268 304l1-14M275 301l2-15M281 299l3-12M287 303l5-8" class="nm-finger"/>
          <path d="M258 322l-6-8" class="nm-finger"/>
        </g>
        <g class="nm-orb">
          <circle cx="280" cy="266" r="15" fill="${u("Orb")}"/>
          <circle cx="280" cy="266" r="12" class="nm-ring thin spin"/>
          <path d="M280 258l2.4 5.6 5.6 2.4-5.6 2.4-2.4 5.6-2.4-5.6-5.6-2.4 5.6-2.4z" fill="#FFF6EC"/>
        </g>
      </g>

      <g class="nm-part nm-top">
        ${poly("130,166 230,166 252,206 240,232 206,244 180,248 154,244 120,232 108,206", u("Mantle"))}
        ${line("108,206 120,232 154,244 180,248 206,244 240,232 252,206", "nm-trim")}
        ${runes([[132, 228], [150, 236], [210, 236], [228, 228]], 3)}
        ${line("158,242 180,262 202,242", "nm-chain")}
        <g class="nm-amulet" filter="url(#${p}Glow)">
          ${poly("180,256 194,264 194,280 180,288 166,280 166,264", "#23262C")}
          ${poly("180,260 190.4,266 190.4,278 180,284 169.6,278 169.6,266", u("Core"))}
          <path d="M175.5 277.5v-11l9 11v-11" fill="none" stroke="#3A1400" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
        ${poly("184,56 216,80 238,124 242,170 230,204 180,224 130,204 118,170 122,124 146,80", u("Hood"))}
        ${line("184,56 146,80 122,124 118,170", "nm-rim")}
        ${line("184,56 196,92", "nm-rim")}
        ${poly("180,98 204,114 214,146 208,180 180,198 152,180 146,146 156,114", u("Void"))}
        ${poly("180,98 204,114 214,146 208,180 180,198 152,180 146,146 156,114", "none", "nm-trim")}
        ${poly("183,68 190,81 176,81", "none", "nm-trim thin")}
        <g class="nm-sigil" filter="url(#${p}Glow)">
          <circle cx="180" cy="150" r="17" class="nm-sig"/>
          <polygon points="180,134 194,158 166,158" class="nm-sig"/>
          <polygon points="180,166 194,142 166,142" class="nm-sig"/>
          <circle cx="180" cy="150" r="3" class="nm-spark"/>
        </g>
      </g>

      <g class="nm-part nm-laptop" aria-hidden="true">
        <ellipse cx="102" cy="316" rx="78" ry="46" fill="${u("Light")}"/>
        ${poly("100,330 136,334 140,346 104,346", u("Metal"))}
        <g class="nm-pc">
          <polygon points="52,246 146,236 152,324 44,328" class="nm-holo"/>
          <polyline points="60,256 96,252" class="nm-code"/>
          <polyline points="60,265 112,260" class="nm-code"/>
          <polyline points="60,274 86,272" class="nm-code"/>
          <polyline points="60,283 100,280" class="nm-code"/>
          <g class="nm-pcsig">
            <circle cx="108" cy="296" r="16" class="nm-holo-line"/>
            <polygon points="108,281 121,303 95,303" class="nm-holo-line"/>
            <polygon points="108,311 121,289 95,289" class="nm-holo-line"/>
          </g>
          <polygon points="44,328 152,324 168,344 30,350" class="nm-holo"/>
          <polyline points="46,334 154,330" class="nm-holo-line dash"/>
          <polyline points="40,340 160,336" class="nm-holo-line dash"/>
        </g>
      </g>
    </svg>`;
  }

  // Знак Платформы позади пары: треугольник, круги, глаз, кольцо рун.
  const SIGIL = `
    <svg class="nx-sigil" viewBox="0 0 600 600" aria-hidden="true">
      <circle cx="300" cy="300" r="286" class="nx-sg thin"/>
      <g class="nx-sg-spin">
        <circle cx="300" cy="300" r="262" class="nx-sg dots"/>
        ${runes(Array.from({ length: 24 }, (_, i) => {
          const a = (i / 24) * Math.PI * 2;
          return [+(300 + Math.cos(a) * 244).toFixed(1), +(300 + Math.sin(a) * 244).toFixed(1)];
        }))}
      </g>
      <circle cx="300" cy="300" r="226" class="nx-sg"/>
      <polygon points="300,62 506,420 94,420" class="nx-sg"/>
      <polygon points="300,538 506,180 94,180" class="nx-sg thin"/>
      <circle cx="300" cy="300" r="118" class="nx-sg"/>
      <path d="M232 300q68-62 136 0q-68 62-136 0z" class="nx-sg"/>
      <circle cx="300" cy="300" r="20" class="nx-sg eye"/>
    </svg>`;

  const ICO = {
    code: '<path d="M8.5 7 3.5 12l5 5M15.5 7l5 5-5 5M13.5 4.5l-3 15"/>',
    db: '<ellipse cx="12" cy="6" rx="7" ry="2.8"/><path d="M5 6v6c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8V6M5 12v6c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-6"/>',
    api: '<path d="M7 8h10M7 16h10"/><circle cx="5" cy="8" r="2"/><circle cx="19" cy="16" r="2"/><path d="M12 8v8"/>',
    algo: '<circle cx="6" cy="6" r="2.2"/><circle cx="18" cy="6" r="2.2"/><circle cx="12" cy="18" r="2.2"/><path d="M8 7.2 10.8 16M16 7.2 13.2 16M8.2 6h7.6"/>',
    inv: '<path d="M6 3.5h12v17l-3-1.8-3 1.8-3-1.8-3 1.8z"/><path d="M9 8h6M9 11.5h6M9 15h3.5"/>',
    spec: '<rect x="3.5" y="4.5" width="17" height="15" rx="1.5"/><path d="M3.5 9.5h17M3.5 14.5h17M9.5 4.5v15"/>',
    book: '<path d="M5 4.5h10l4 4v11H5z"/><path d="M15 4.5v4h4M8.5 12.5l2.5 3.5M11 12.5l-2.5 3.5M13.5 12.5h3M13.5 16h3"/>',
    deal: '<path d="M7 3.5h7l4 4v13H7z"/><path d="M14 3.5v4h4M10 11h5M10 14.5h5M10 18h3"/>',
    plan: '<path d="M3.5 6.5 9 4l6 2.5 5.5-2.5v13.5L15 20l-6-2.5-5.5 2.5z"/><path d="M9 4v13.5M15 6.5V20"/>',
    ask: '<circle cx="11" cy="11" r="6.5"/><path d="M20.5 20.5 16 16"/>',
    ok: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    no: '<path d="M7 7l10 10M17 7 7 17"/>',
    x: '<path d="M7 7l10 10M17 7 7 17"/>',
    news: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    play: '<path d="M8 5.5v13l10.5-6.5z"/>',
  };
  const ic = (k) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICO[k]}</svg>`;
  const ORN = `<svg class="nx-orn" viewBox="0 0 120 10" aria-hidden="true"><path d="M0 5h48M72 5h48"/><path d="M60 0.8 64.2 5 60 9.2 55.8 5z"/><circle cx="50" cy="5" r="1.2"/><circle cx="70" cy="5" r="1.2"/></svg>`;

  let box = null;
  let lastFocus = null;
  let talkAt = 0;
  let talkTimer = 0;
  const last = { nexus: -1, trace: -1 };

  function html() {
    const n = days();
    const glyphs = ["{ }", "</>", "API", "SQL", "fn()", "◇", "△", "✦", "=>", "ᛟ"];
    const parts = Array.from({ length: 20 }, (_, i) => `<span class="nx-glyph" style="--x:${(i * 53) % 100}%;--d:${
      ((i * 0.73) % 6).toFixed(2)}s;--t:${7 + (i % 5)}s">${glyphs[i % glyphs.length]}</span>`).join("");
    const stat = (name, v, i) => `<div class="nx-stat"><span>${name}</span><i><b style="--v:${v}%;--i:${i}"></b></i><em>${v}</em></div>`;
    const chip = (k, text) => `<div>${ic(k)}<span>${text}</span></div>`;
    return `
      <div class="nx-scene" role="dialog" aria-modal="true" aria-label="Nexus и Трейс">
        <div class="nx-grid" aria-hidden="true"></div>
        <div class="nx-glyphs" aria-hidden="true">${parts}</div>
        <button type="button" class="nx-close" data-nx-close aria-label="Закрыть">${ic("x")}</button>
        <div class="nx-stage">
          <section class="nx-side nx-l" data-side="nexus">
            <div class="nx-top"><div class="nx-tag">Колдун</div>${newsBtn()}</div>
            <h2 class="nx-name"><span>NEXUS</span></h2>
            <p class="nx-motto">Добрый колдун.<br>Создатель Платформы.<br>Повелитель кода и магии.</p>
            ${ORN}
            <div class="nx-lvl"><b>Ур. ${n}</b><span>в строю ${n} ${plural(n, "день", "дня", "дней")} — с 17 августа 2026,
              первой строки кода</span></div>
            <div class="nx-stats">
              ${stat("Код", 98, 0)}${stat("Базы данных", 94, 1)}${stat("API и связки", 92, 2)}${stat("Алгоритмы", 95, 3)}
            </div>
            <div class="nx-h">Магия</div>
            <div class="nx-abil">
              ${chip("code", "Пишет код Платформы")}${chip("db", "Формирует базы данных")}
              ${chip("api", "Настраивает API")}${chip("algo", "Создаёт алгоритмы для Трейса")}
            </div>
            <div class="nx-h">Кодекс</div>
            <ul class="nx-code">
              <li class="ok">${ic("ok")}Действует строго по задачам команды разработки</li>
              <li class="no">${ic("no")}Не меняет бизнес-процессы и не принимает решений за людей</li>
            </ul>
          </section>

          <div class="nx-duo">
            <div class="nx-sigil-wrap" aria-hidden="true">${SIGIL}</div>
            <button type="button" class="nx-fig nx-droid" data-who="trace" title="Щёлкните — Трейс что-нибудь скажет">${
              TRACE.figure("Трейс — андроид-помощник")}</button>
            <button type="button" class="nx-fig nx-mage" data-who="nexus" title="Щёлкните — Nexus что-нибудь скажет">${
              mage("nm_")}</button>
            <div class="nx-say" data-say="nexus" aria-live="polite" hidden></div>
            <div class="nx-say r" data-say="trace" aria-live="polite" hidden></div>
          </div>

          <section class="nx-side nx-r" data-side="trace">
            <div class="nx-top"><div class="nx-tag">Андроид</div><span class="nx-live"><i></i>На связи</span></div>
            <h2 class="nx-name t"><span>TRACE</span></h2>
            <p class="nx-motto">Андроид-помощник.<br>Создан, чтобы помогать.<br>Всегда рядом.</p>
            ${ORN}
            <div class="nx-lvl t"><b>Внутри</b><span>работает в разделах Платформы: там, где загружают файлы
              и задают вопросы</span></div>
            <div class="nx-h">Умения</div>
            <div class="nx-abil">
              ${chip("inv", "Разбирает счета и КП")}${chip("spec", "Извлекает спецификации")}
              ${chip("book", "Читает прайсы в Excel")}${chip("deal", "Разбирает договоры")}
              ${chip("plan", "Читает проекты ПТО")}${chip("ask", "Отвечает на вопросы")}
            </div>
            <button type="button" class="nx-ask" data-nx-ask>${ic("ask")}Спросить Трейса</button>
            <button type="button" class="nx-demo" data-nx-demo title="Карточка разбора — без загрузки файла">${
              ic("play")}Показать, как я разбираю файлы</button>
          </section>
        </div>
        <div class="nx-talk" aria-live="off"><b data-talk-who>NEXUS</b><span data-talk></span></div>
      </div>`;
  }

  /* Пакеты обновлений — в чате «Nexus» мессенджера (20.10.2026):
     кнопка в карточке Nexus ведёт туда; новый пакет — счётчиком. */
  function newsBtn() {
    const ch = typeof MESSENGER === "object" && MESSENGER.channel ? MESSENGER.channel() : null;
    const at = ch && ch.last ? new Date(ch.last.at).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }) : "";
    const what = ch && ch.last ? String(ch.last.text || "").split("\n")[0] : "";
    return `<button type="button" class="nx-news${ch && ch.unread ? " on" : ""}" data-nx-news
      title="${esc((what ? "Последний пакет обновлений: " + what + ". " : "") + "Все пакеты — в чате «Nexus»")}">${
      ic("news")}<span>Обновления</span>${at ? `<i>${at}</i>` : ""}${ch && ch.unread ? `<b>${ch.unread}</b>` : ""}</button>`;
  }

  // Реплика персонажа по щелчку — облачко над ним, сам он кивает.
  function say(who) {
    const el = box && box.querySelector(`[data-say="${who}"]`);
    if (!el) return;
    const list = LINES[who];
    let i;
    do { i = Math.floor(Math.random() * list.length); } while (list.length > 1 && i === last[who]);
    last[who] = i;
    el.textContent = list[i];
    el.hidden = false;
    el.classList.remove("on");
    void el.offsetWidth;                          // перезапустить появление
    el.classList.add("on");
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.hidden = true; }, 5200);
    const fig = box.querySelector(`.nx-fig[data-who="${who}"]`);
    fig.classList.remove("nod");
    void fig.offsetWidth;
    fig.classList.add("nod");
  }

  /* Разговор внизу: строка печатается по буквам, говорящий светится. */
  function talk() {
    if (!box) return;
    const [who, text] = TALK[talkAt % TALK.length];
    talkAt++;
    const whoEl = box.querySelector("[data-talk-who]");
    const el = box.querySelector("[data-talk]");
    whoEl.textContent = NAME[who];
    whoEl.className = who;
    box.querySelectorAll(".nx-fig").forEach((f) => f.classList.toggle("talk", f.dataset.who === who));
    box.querySelectorAll(".nx-side").forEach((s) => s.classList.toggle("talk", s.dataset.side === who));
    if (reduced()) {
      el.textContent = text;
      talkTimer = setTimeout(talk, 4200);
      return;
    }
    let i = 0;
    const step = () => {
      if (!box || !el.isConnected) return;
      el.textContent = text.slice(0, ++i);
      talkTimer = i < text.length ? setTimeout(step, 30) : setTimeout(talk, 2600);
    };
    step();
  }

  function key(e) {
    if (e.key === "Escape") close();
  }

  function open() {
    if (box) return;
    lastFocus = document.activeElement;
    box = document.createElement("div");
    box.className = "nx-wrap";
    box.innerHTML = html();
    document.body.appendChild(box);
    document.body.classList.add("nx-lock");
    box.querySelectorAll("[data-nx-close]").forEach((b) => b.addEventListener("click", close));
    box.querySelectorAll(".nx-fig").forEach((b) => b.addEventListener("click", () => say(b.dataset.who)));
    box.querySelector("[data-nx-news]").addEventListener("click", () => {
      close();
      if (typeof MESSENGER === "object" && MESSENGER.openChannel) MESSENGER.openChannel();
    });
    box.querySelector("[data-nx-ask]").addEventListener("click", () => {
      close();
      const ask = document.getElementById("askBtn");
      if (ask) ask.click();
    });
    box.querySelector("[data-nx-demo]").addEventListener("click", () => {
      close();
      TRACE.demo();
    });
    box.addEventListener("mousedown", (e) => { if (e.target.classList.contains("nx-scene")) close(); });
    document.addEventListener("keydown", key);
    box.querySelector("[data-nx-close]").focus();
    talkAt = 0;
    talkTimer = setTimeout(talk, reduced() ? 0 : 1900);
  }

  function close() {
    if (!box) return;
    clearTimeout(talkTimer);
    document.removeEventListener("keydown", key);
    document.body.classList.remove("nx-lock");
    box.remove();
    box = null;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  const btn = document.getElementById("nexusBtn");
  if (btn) btn.addEventListener("click", open);

  return { open, close };
})();
