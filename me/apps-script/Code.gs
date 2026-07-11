const SPREADSHEET_ID = "1ikLDWcpGYPO-gL-18-gdmi73hC-qGEjiyw-L2jgtpTM";
const TIMEZONE = "Asia/Yekaterinburg";

const TABLES = {
  morning: "morning_logs",
  strengths: "strengths",
  goals: "goals",
  focus: "daily_focus"
};

function doGet() {
  return jsonResponse_({ ok: true, service: "Roman ME", dashboard: getDashboard_() });
}

function doPost(event) {
  try {
    const request = JSON.parse((event && event.postData && event.postData.contents) || "{}");
    const action = String(request.action || "getDashboard");
    const payload = request.payload || {};
    const context = {
      device_id: String(request.device_id || ""),
      timezone: String(request.timezone || TIMEZONE)
    };

    if (action === "getDashboard") return jsonResponse_({ ok: true, dashboard: getDashboard_() });
    if (action === "completeMorning") return jsonResponse_(completeMorning_(payload, context));
    if (action === "addGoal") return jsonResponse_(addGoal_(payload));
    if (action === "updateGoal") return jsonResponse_(updateGoal_(payload));
    if (action === "deleteGoal") return jsonResponse_(deleteGoal_(payload));
    if (action === "saveFocus") return jsonResponse_(saveFocus_(payload, context));
    if (action === "resolveGoalUrl") return jsonResponse_({ ok: true, metadata: resolveGoalUrl_(payload.url) });

    throw new Error("Неизвестное действие: " + action);
  } catch (error) {
    return jsonResponse_({ ok: false, error: error && error.message ? error.message : String(error) });
  }
}

function getDashboard_() {
  const today = Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd");
  const focusRows = readObjects_(TABLES.focus);
  const focus = focusRows.find(function (row) {
    return normalizeDate_(row.date) === today;
  }) || {
    date: today,
    money_task: "",
    money_done: false,
    content_task: "",
    content_done: false,
    health_task: "",
    health_done: false,
    day_note: ""
  };

  return {
    today: today,
    morning_logs: readObjects_(TABLES.morning),
    strengths: readObjects_(TABLES.strengths)
      .filter(function (item) { return item.active === "" || truthy_(item.active); })
      .sort(function (a, b) { return Number(a.sort_order || 0) - Number(b.sort_order || 0); }),
    goals: readObjects_(TABLES.goals)
      .filter(function (item) { return String(item.status || "active") !== "removed"; })
      .sort(function (a, b) {
        return String(b.created_at || "").localeCompare(String(a.created_at || ""));
      }),
    daily_focus: focus
  };
}

function completeMorning_(payload, context) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const today = Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd");
    const rows = readObjects_(TABLES.morning);
    const existing = rows.some(function (row) {
      return normalizeDate_(row.date) === today && truthy_(row.completed);
    });

    if (!existing) {
      appendObject_(TABLES.morning, {
        id: "morning-" + new Date().getTime(),
        date: today,
        completed: true,
        completed_at: new Date(),
        timezone: context.timezone || TIMEZONE,
        device_id: context.device_id || "",
        note: String(payload.note || "")
      });
    }
    return { ok: true, existing: existing, dashboard: getDashboard_() };
  } finally {
    lock.releaseLock();
  }
}

function addGoal_(payload) {
  if (!String(payload.title || "").trim()) throw new Error("У цели нет названия");
  const now = new Date();
  appendObject_(TABLES.goals, {
    id: "goal-" + now.getTime(),
    title: String(payload.title || "").trim(),
    description: String(payload.description || "").trim(),
    source_url: safeHttpUrl_(payload.source_url),
    image_url: safeHttpUrl_(payload.image_url),
    price_value: numberOrBlank_(payload.price_value),
    currency: String(payload.currency || "RUB").toUpperCase(),
    price_text: String(payload.price_text || "").trim(),
    target_date: normalizeDate_(payload.target_date),
    status: String(payload.status || "active"),
    category: String(payload.category || "Личное").trim(),
    created_at: now,
    updated_at: now,
    source_checked_at: payload.source_checked_at || "",
    source_note: String(payload.source_note || "")
  });
  return { ok: true, dashboard: getDashboard_() };
}

function updateGoal_(payload) {
  const id = String(payload.id || "");
  if (!id) throw new Error("Не передан ID цели");
  const located = findRowByValue_(TABLES.goals, "id", id);
  if (!located) throw new Error("Цель не найдена");

  const next = Object.assign({}, located.object, payload, {
    id: id,
    source_url: safeHttpUrl_(payload.source_url || located.object.source_url),
    image_url: safeHttpUrl_(payload.image_url || located.object.image_url),
    price_value: numberOrBlank_(payload.price_value),
    target_date: normalizeDate_(payload.target_date),
    updated_at: new Date()
  });
  writeObjectAtRow_(TABLES.goals, located.row, next);
  return { ok: true, dashboard: getDashboard_() };
}

function deleteGoal_(payload) {
  const id = String(payload.id || "");
  const located = findRowByValue_(TABLES.goals, "id", id);
  if (!located) throw new Error("Цель не найдена");
  sheet_(TABLES.goals).deleteRow(located.row);
  return { ok: true, dashboard: getDashboard_() };
}

function saveFocus_(payload, context) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const today = Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd");
    const located = findRowByValue_(TABLES.focus, "date", today, true);
    const completed = truthy_(payload.money_done) && truthy_(payload.content_done) && truthy_(payload.health_done);
    const next = Object.assign({}, located ? located.object : {}, payload, {
      date: today,
      money_done: truthy_(payload.money_done),
      content_done: truthy_(payload.content_done),
      health_done: truthy_(payload.health_done),
      completed_at: completed ? (located && located.object.completed_at ? located.object.completed_at : new Date()) : "",
      updated_at: new Date(),
      device_id: context.device_id || ""
    });

    if (located) writeObjectAtRow_(TABLES.focus, located.row, next);
    else appendObject_(TABLES.focus, next);
    return { ok: true, dashboard: getDashboard_() };
  } finally {
    lock.releaseLock();
  }
}

function resolveGoalUrl_(rawUrl) {
  const url = safeHttpUrl_(rawUrl);
  if (!url) throw new Error("Нужна ссылка, начинающаяся с http:// или https://");

  const response = UrlFetchApp.fetch(url, {
    followRedirects: true,
    muteHttpExceptions: true,
    validateHttpsCertificates: true,
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; RomanME/1.0; +https://ii41.ru/me/)"
    }
  });
  const code = response.getResponseCode();
  if (code < 200 || code >= 400) throw new Error("Страница вернула код " + code);

  const html = response.getContentText().slice(0, 1500000);
  const jsonLd = findProductJsonLd_(html);
  const title = firstNonEmpty_(
    jsonLd.name,
    metaContent_(html, "og:title"),
    metaContent_(html, "twitter:title"),
    tagText_(html, "title")
  );
  const image = firstNonEmpty_(
    jsonLd.image,
    metaContent_(html, "og:image"),
    metaContent_(html, "twitter:image")
  );
  const price = firstNonEmpty_(
    jsonLd.price,
    metaContent_(html, "product:price:amount"),
    metaContent_(html, "og:price:amount")
  );
  const currency = firstNonEmpty_(
    jsonLd.currency,
    metaContent_(html, "product:price:currency"),
    metaContent_(html, "og:price:currency"),
    "RUB"
  );

  return {
    source_url: url,
    title: decodeHtml_(title || ""),
    image_url: absoluteUrl_(decodeHtml_(image || ""), url),
    price_value: numberOrBlank_(price),
    currency: String(currency || "RUB").toUpperCase(),
    price_text: price ? formatPriceText_(price, currency) : "",
    source_checked_at: new Date().toISOString(),
    source_note: "Автоматически прочитаны Open Graph / JSON-LD страницы. Перед сохранением цену нужно проверить."
  };
}

function findProductJsonLd_(html) {
  const result = { name: "", image: "", price: "", currency: "" };
  const regex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html))) {
    try {
      const parsed = JSON.parse(decodeHtml_(match[1].trim()));
      const nodes = flattenJsonLd_(parsed);
      const product = nodes.find(function (node) {
        const type = Array.isArray(node && node["@type"]) ? node["@type"].join(" ") : String(node && node["@type"] || "");
        return /product|vehicle|car/i.test(type);
      });
      if (!product) continue;
      const offer = Array.isArray(product.offers) ? product.offers[0] : (product.offers || {});
      const image = Array.isArray(product.image) ? product.image[0] : product.image;
      result.name = product.name || "";
      result.image = typeof image === "object" && image ? image.url || image.contentUrl || "" : image || "";
      result.price = offer.price || offer.lowPrice || product.price || "";
      result.currency = offer.priceCurrency || product.priceCurrency || "";
      return result;
    } catch (error) {
      // Some sites publish malformed JSON-LD. Other metadata is still useful.
    }
  }
  return result;
}

function flattenJsonLd_(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.reduce(function (all, item) { return all.concat(flattenJsonLd_(item)); }, []);
  if (value["@graph"] && Array.isArray(value["@graph"])) return [value].concat(value["@graph"]);
  return [value];
}

function metaContent_(html, key) {
  const escaped = String(key).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const first = new RegExp("<meta[^>]+(?:property|name)=[\\\"']" + escaped + "[\\\"'][^>]+content=[\\\"']([^\\\"']+)[\\\"'][^>]*>", "i").exec(html);
  if (first) return first[1];
  const reverse = new RegExp("<meta[^>]+content=[\\\"']([^\\\"']+)[\\\"'][^>]+(?:property|name)=[\\\"']" + escaped + "[\\\"'][^>]*>", "i").exec(html);
  return reverse ? reverse[1] : "";
}

function tagText_(html, tag) {
  const match = new RegExp("<" + tag + "[^>]*>([\\s\\S]*?)</" + tag + ">", "i").exec(html);
  return match ? match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "";
}

function absoluteUrl_(value, base) {
  if (!value) return "";
  const text = String(value).trim();
  if (/^https?:\/\//i.test(text)) return text;
  const baseMatch = String(base).match(/^(https?):\/\/([^/]+)(\/.*)?$/i);
  if (!baseMatch) return "";
  if (text.indexOf("//") === 0) return baseMatch[1] + ":" + text;
  if (text.charAt(0) === "/") return baseMatch[1] + "://" + baseMatch[2] + text;
  const directory = (baseMatch[3] || "/").replace(/[^/]*$/, "");
  return baseMatch[1] + "://" + baseMatch[2] + directory + text;
}

function formatPriceText_(value, currency) {
  const amount = Number(String(value).replace(/[^0-9.,-]/g, "").replace(/,/g, "."));
  if (!isFinite(amount)) return String(value || "");
  const marks = { RUB: "₽", USD: "$", EUR: "€", AED: "AED", GBP: "£" };
  return Utilities.formatString("%s %s", amount.toLocaleString("ru-RU"), marks[String(currency || "RUB").toUpperCase()] || currency || "").trim();
}

function sheet_(name) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(name);
  if (!sheet) throw new Error("Не найден лист " + name);
  return sheet;
}

function headers_(name) {
  const sheet = sheet_(name);
  const lastColumn = sheet.getLastColumn();
  if (!lastColumn) throw new Error("В листе " + name + " нет заголовков");
  return sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0].map(function (value) { return String(value).trim(); });
}

function readObjects_(name) {
  const sheet = sheet_(name);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(function (value) { return String(value).trim(); });
  return values.slice(1)
    .filter(function (row) { return row.some(function (value) { return value !== ""; }); })
    .map(function (row) {
      const object = {};
      headers.forEach(function (header, index) { object[header] = serializeCell_(row[index]); });
      return object;
    });
}

function appendObject_(name, object) {
  const sheet = sheet_(name);
  const headers = headers_(name);
  sheet.appendRow(headers.map(function (header) { return object[header] === undefined ? "" : object[header]; }));
}

function writeObjectAtRow_(name, rowNumber, object) {
  const sheet = sheet_(name);
  const headers = headers_(name);
  sheet.getRange(rowNumber, 1, 1, headers.length).setValues([
    headers.map(function (header) { return object[header] === undefined ? "" : object[header]; })
  ]);
}

function findRowByValue_(name, headerName, target, normalizeDate) {
  const sheet = sheet_(name);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return null;
  const headers = values[0].map(function (value) { return String(value).trim(); });
  const index = headers.indexOf(headerName);
  if (index < 0) throw new Error("В листе " + name + " нет столбца " + headerName);

  for (let rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    const actual = normalizeDate ? normalizeDate_(values[rowIndex][index]) : String(values[rowIndex][index]);
    if (actual === String(target)) {
      const object = {};
      headers.forEach(function (header, columnIndex) { object[header] = serializeCell_(values[rowIndex][columnIndex]); });
      return { row: rowIndex + 1, object: object };
    }
  }
  return null;
}

function serializeCell_(value) {
  if (Object.prototype.toString.call(value) === "[object Date]" && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX");
  }
  return value;
}

function normalizeDate_(value) {
  if (!value) return "";
  if (Object.prototype.toString.call(value) === "[object Date]" && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, TIMEZONE, "yyyy-MM-dd");
  }
  const text = String(value).trim();
  const iso = text.match(/^\d{4}-\d{2}-\d{2}/);
  if (iso) return iso[0];
  const ru = text.match(/^(\d{2})[./](\d{2})[./](\d{4})$/);
  return ru ? ru[3] + "-" + ru[2] + "-" + ru[1] : text;
}

function truthy_(value) {
  return value === true || value === 1 || /^(true|да|yes|1)$/i.test(String(value));
}

function numberOrBlank_(value) {
  if (value === "" || value === null || value === undefined) return "";
  const number = Number(String(value).replace(/\s/g, "").replace(",", ".").replace(/[^0-9.-]/g, ""));
  return isFinite(number) ? number : "";
}

function safeHttpUrl_(value) {
  const text = String(value || "").trim();
  return /^https?:\/\//i.test(text) ? text : "";
}

function firstNonEmpty_() {
  for (let index = 0; index < arguments.length; index += 1) {
    if (arguments[index] !== "" && arguments[index] !== null && arguments[index] !== undefined) return arguments[index];
  }
  return "";
}

function decodeHtml_(value) {
  return String(value || "")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, function (_, number) { return String.fromCharCode(Number(number)); })
    .trim();
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
