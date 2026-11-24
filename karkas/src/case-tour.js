/* The guide follows the same section switches as the dashboard, including deep links. */
(() => {
  "use strict";
  const sections = window.KarkasTourSections;
  const story = ["drw", "tkp", "sit", "req", "snb", "fin"];
  const groups = [
    ["От чертежа до бюджета", ["drw", "tkp", "tnd", "sit", "req", "snb", "fin"]],
    ["Работа команды", ["msg", "tsk", "wg", "emp", "tv", "me"]],
    ["Документы и справочные данные", ["fil", "let", "ref"]],
    ["Обучение и настройка", ["lrn", "iss", "usr"]]
  ];
  const $ = id => document.getElementById(id);
  const guide = $("ktGuide");
  const dialog = $("ktWelcome");
  const tip = $("ktTip");
  const floatingTip = document.querySelector(".kt-tab-note");
  const locate = guide.querySelector('[data-kt="locate"]');
  const back = guide.querySelector('[data-kt="back"]');
  const next = guide.querySelector('[data-kt="next"]');
  const anchors = new Map([...document.querySelectorAll(".side [data-s]")].map(a => [a.dataset.s, a]));
  const names = new Map([...anchors].map(([id, a]) => [id, a.textContent.trim()]));
  const entry = new URLSearchParams(window.KARKAS_DEMO?.entrySearch ?? location.search);
  let id = "";
  let index = 0;
  let inStory = false;
  let collapsed = false;
  let target;
  let lastTab = null;
  let queued = false;
  let noteTimer;
  let guideInView = true;
  const changes = new MutationObserver(scheduleRefresh);
  const visible = el => !!el && !el.closest("[hidden]") && el.getClientRects().length > 0;
  const allowed = key => sections[key] && anchors.has(key) && !anchors.get(key).hidden && !anchors.get(key).hasAttribute("data-off");
  const keyForPage = () => document.documentElement.dataset.sec || entry.get("s") || "emp";
  const step = () => sections[id]?.steps[index];

  function setSeen() {
    try { localStorage.setItem("case-guide-intro-v1", "1"); } catch (_) { /* private browsing */ }
  }
  function hasSeen() {
    try { return localStorage.getItem("case-guide-intro-v1") === "1"; } catch (_) { return false; }
  }
  function button(text, className, fn) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = className;
    b.textContent = text;
    b.addEventListener("click", fn);
    return b;
  }
  function hideNote() {
    clearTimeout(noteTimer);
    floatingTip.hidden = true;
  }
  function unmark() {
    if (target) target.classList.remove("kt-highlight");
    target = null;
  }
  function findTarget(selector) {
    if (!selector) return null;
    return [...document.querySelectorAll(selector)].find(visible) || null;
  }
  function refreshTarget() {
    const found = guide.hidden || dialog.open ? null : findTarget(step()?.selector);
    if (found !== target) {
      unmark();
      target = found;
      if (target) target.classList.add("kt-highlight");
    }
    locate.hidden = !target;
  }
  function syncDock() {
    const resume = document.querySelector("[data-demo-resume]");
    if (resume) resume.hidden = !sections[id] || (!collapsed && guideInView);
  }
  function refreshTab() {
    if (guide.hidden || dialog.open) return;
    const tabs = sections[id]?.tabs || [];
    if (!tabs.length) return;
    if (lastTab && findTarget(lastTab.selector)) return;
    const active = tabs.find(tab => {
      const el = findTarget(tab.selector);
      return el && el.matches('.on, .active, [aria-selected="true"], [aria-pressed="true"]');
    });
    if ((active || null) !== lastTab) displayTab(active || null, false);
  }
  function scheduleRefresh() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; refreshTarget(); refreshTab(); });
  }
  function displayTab(tab, notify) {
    lastTab = tab;
    tip.hidden = !tab;
    tip.textContent = tab ? tab.title + " · " + tab.text : "";
    hideNote();
    if (!tab || !notify || guide.hidden || dialog.open) return;
    const rect = guide.getBoundingClientRect();
    if (rect.bottom > 80 && rect.top < window.innerHeight - 48) return;
    floatingTip.textContent = tip.textContent;
    floatingTip.hidden = false;
    noteTimer = setTimeout(hideNote, 7000);
  }
  function storyRoute() { return story.filter(allowed); }
  function paint() {
    const data = sections[id];
    guide.hidden = !data || collapsed;
    syncDock();
    if (guide.hidden) { unmark(); return; }
    const route = storyRoute();
    const position = inStory ? route.indexOf(id) : -1;
    $("ktLocation").textContent = (position < 0 ? "Гид" : "Кейс " + (position + 1) + " из " + route.length) + " · " + names.get(id);
    $("ktTitle").textContent = data.title;
    $("ktBenefit").textContent = data.benefit;
    $("ktStepTitle").textContent = (index + 1) + "/" + data.steps.length + " · " + step().label;
    $("ktStepText").textContent = step().text;
    back.disabled = index === 0 && position <= 0;
    if (index + 1 < data.steps.length) next.textContent = "Следующий шаг";
    else if (position >= 0 && position + 1 < route.length) next.textContent = "Далее · " + names.get(route[position + 1]);
    else next.textContent = position < 0 ? "К другим разделам" : "Итог кейса";
    refreshTarget();
  }
  function watchPage() {
    const current = keyForPage();
    if (current !== id) {
      changes.disconnect();
      hideNote();
      unmark();
      id = current;
      index = 0;
      collapsed = false;
      if (!story.includes(id)) inStory = false;
      displayTab(null, false);
      const root = $("sec-" + id);
      if (root) changes.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden", "open", "aria-selected"] });
      paint();
    }
  }
  function showGuide() {
    collapsed = false;
    paint();
    if (!guide.hidden) {
      guide.scrollIntoView({block: "start"});
      const title = $("ktTitle");
      title.tabIndex = -1;
      title.focus({preventScroll: true});
    }
  }
  function leaveDialog() {
    setSeen();
    if (dialog.open) dialog.close();
    hideNote();
  }
  function visit(key, n = 0) {
    if (!allowed(key)) { showDialog("map"); return; }
    leaveDialog();
    if (keyForPage() !== key) anchors.get(key).click();
    watchPage();
    index = n;
    showGuide();
  }
  function startStory() {
    const route = storyRoute();
    if (!route.length) return;
    inStory = true;
    visit(route[0]);
  }
  function introList() {
    const list = document.createElement("ol");
    list.className = "kt-journey";
    for (const [heading, body] of [
      ["Инженер разбирает чертёж", "Выберите лист или перетащите файл. Проверьте спецификацию и объёмы работ."],
      ["Сметчик готовит предложение", "Выберите работы и условия оплаты. Посмотрите сумму, которую увидит заказчик."],
      ["Руководитель проверяет стройку", "Откройте дом 3 ЖК «Северный парк». Сверьте заявку мастера, цены поставщиков и фактические расходы."]
    ]) {
      const row = document.createElement("li");
      const title = document.createElement("b");
      const desc = document.createElement("span");
      title.textContent = heading; desc.textContent = body;
      row.append(title, desc); list.append(row);
    }
    return list;
  }
  function mapList() {
    const box = document.createElement("div");
    box.className = "kt-map-list";
    for (const [title, ids] of groups) {
      const items = ids.filter(allowed);
      if (!items.length) continue;
      const section = document.createElement("div");
      section.className = "kt-map-group";
      const h = document.createElement("h3");
      h.textContent = title;
      const list = document.createElement("ul");
      for (const key of items) {
        const li = document.createElement("li");
        li.append(button(names.get(key), "kt-secondary", () => { inStory = false; visit(key); }));
        list.append(li);
      }
      section.append(h, list); box.append(section);
    }
    return box;
  }
  function showDialog(page) {
    hideNote();
    const isIntro = page === "intro";
    const isMap = page === "map";
    $("ktDialogKicker").textContent = isMap ? "Путеводитель по платформе" : "Демонстрационный кейс · Северный Монтаж";
    $("ktDialogTitle").textContent = isIntro ? "Сколько будет стоить монтаж?" : isMap ? "Что хотите проверить?" : "Из чего складывается цена монтажа";
    $("ktDialogLead").textContent = isIntro
      ? "Заказчик ЖК «Северный парк» прислал план этажа и ждёт цену монтажа. Вместе со сметчиком подготовьте предложение, затем проверьте, что заказал участок и сколько компания потратила на материалы."
      : isMap ? "Выберите раздел. Гид покажет задачу сотрудника, подскажет, куда нажать, и объяснит, как проверить результат."
      : "Состав работ можно сверить со спецификацией, цену закупки — с предложениями поставщиков, а расходы — с бюджетом объекта. Теперь посмотрите, как команда обсуждает поставку и передаёт поручения.";
    const body = $("ktDialogBody");
    body.replaceChildren();
    if (isIntro) body.append(introList());
    if (isMap) body.append(mapList());
    const actions = $("ktDialogActions");
    const close = () => { leaveDialog(); showGuide(); };
    actions.replaceChildren();
    if (isIntro) actions.append(button("Начать с чертежа", "kt-primary", startStory),
      button("Выбрать раздел", "kt-secondary", () => showDialog("map")));
    else if (isMap) actions.append(button("К текущему разделу", "kt-primary", close),
      button("Кейс с начала", "kt-secondary", () => showDialog("intro")));
    else actions.append(button("Перейти в мессенджер", "kt-primary", () => { inStory = false; visit("msg"); }),
      button("Все разделы", "kt-secondary", () => showDialog("map")));
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
    $("ktDialogTitle").focus({preventScroll: true});
    refreshTarget();
  }
  guide.addEventListener("click", e => {
    const control = e.target.closest("[data-kt]");
    if (!control || !step()) return;
    const action = control.dataset.kt;
    if (action === "collapse") {
      collapsed = true; paint(); hideNote();
      document.querySelector("[data-demo-resume]")?.focus({preventScroll: true});
    } else if (action === "locate") {
      refreshTarget();
      if (!target) return;
      target.scrollIntoView({block: "center", inline: "nearest"});
      if (target.matches("button, a, select, input, textarea, [tabindex]")) target.focus({preventScroll: true});
    } else {
      const route = storyRoute();
      const pos = inStory ? route.indexOf(id) : -1;
      if (action === "back" && index > 0) index--;
      else if (action === "back" && pos > 0) {
        const previous = route[pos - 1];
        visit(previous, sections[previous].steps.length - 1); return;
      } else if (action === "next" && index + 1 < sections[id].steps.length) index++;
      else if (action === "next" && pos >= 0 && pos + 1 < route.length) { visit(route[pos + 1]); return; }
      else if (action === "next") { showDialog(pos >= 0 ? "end" : "map"); return; }
      paint();
    }
  });
  // Capture the clicked tab before the original module replaces its markup.
  document.addEventListener("click", e => {
    const nav = e.target.closest(".side a[data-s]");
    if (nav && allowed(nav.dataset.s) && !dialog.open) {
      requestAnimationFrame(() => { if (keyForPage() === nav.dataset.s) showGuide(); });
      return;
    }
    if (guide.contains(e.target) || !sections[id] || dialog.open) return;
    const tab = sections[id].tabs?.find(t => e.target.closest(t.selector));
    if (tab) displayTab(tab, true);
  }, true);
  dialog.addEventListener("cancel", setSeen);
  dialog.addEventListener("close", scheduleRefresh);
  new MutationObserver(watchPage).observe(document.documentElement, {attributes: true, attributeFilter: ["data-sec"]});
  // Permissions are applied asynchronously. Never build the map from the HTML placeholders.
  function initAfterAccess() {
    if (!allowed("drw")) return false;
    watchPage();
    if (entry.get("tour") === "map") showDialog("map");
    else if (entry.get("tour") === "start" || (!entry.has("s") && !hasSeen())) showDialog("intro");
    return true;
  }
  if (typeof IntersectionObserver !== "undefined") {
    new IntersectionObserver(entries => {
      guideInView = entries[0].isIntersecting;
      syncDock();
    }, {threshold: 0.15}).observe(guide);
  }
  window.KarkasTour = {open: () => showDialog("map"), current: showGuide};
  watchPage();
  if (!initAfterAccess()) {
    const access = new MutationObserver(() => {
      if (initAfterAccess()) access.disconnect();
    });
    access.observe(document.querySelector(".side"), {subtree: true, attributes: true, attributeFilter: ["hidden"]});
  }
})();
