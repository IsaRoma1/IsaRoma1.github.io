const SPREADSHEET_ID = '1ikLDWcpGYPO-gL-18-gdmi73hC-qGEjiyw-L2jgtpTM';
const TIMEZONE = 'Asia/Yekaterinburg';

const TAB = Object.freeze({
  MORNING: 'morning_logs',
  STRENGTHS: 'strengths',
  GOALS: 'goals',
  FOCUS: 'daily_focus',
  SETTINGS: 'settings'
});

function doGet() {
  try {
    const dashboard = getDashboard_();
    return json_({
      ok: true,
      service: 'Roman ME API',
      today: dashboard.today,
      counts: {
        morning_logs: dashboard.morning_logs.length,
        strengths: dashboard.strengths.length,
        goals: dashboard.goals.length
      }
    });
  } catch (error) {
    return json_({ ok: false, error: errorMessage_(error) });
  }
}

function doPost(event) {
  let lock = null;
  try {
    const request = parseRequest_(event);
    const action = String(request.action || '').trim();
    const payload = request.payload && typeof request.payload === 'object' ? request.payload : {};

    if (!action) throw new Error('Не передано действие action.');

    const writeActions = ['completeMorning', 'addGoal', 'updateGoal', 'deleteGoal', 'saveFocus'];
    if (writeActions.indexOf(action) !== -1) {
      lock = LockService.getScriptLock();
      if (!lock.tryLock(15000)) throw new Error('Таблица занята. Повторите действие через несколько секунд.');
    }

    const result = dispatch_(action, payload, request);
    return json_(Object.assign({ ok: true }, result || {}));
  } catch (error) {
    console.error(error);
    return json_({ ok: false, error: errorMessage_(error) });
  } finally {
    if (lock) lock.releaseLock();
  }
}

function dispatch_(action, payload, request) {
  switch (action) {
    case 'getDashboard':
      return { dashboard: getDashboard_() };
    case 'completeMorning':
      return completeMorning_(request.device_id || payload.device_id || '');
    case 'addGoal':
      return addGoal_(payload);
    case 'updateGoal':
      return updateGoal_(payload);
    case 'deleteGoal':
      return deleteGoal_(payload);
    case 'saveFocus':
      return saveFocus_(payload, request.device_id || payload.device_id || '');
    case 'resolveGoalUrl':
      return resolveGoalUrl_(payload.url);
    default:
      throw new Error('Неизвестное действие: ' + action);
  }
}

function getDashboard_() {
  const today = today_();
  const goals = rowsAsObjects_(TAB.GOALS);

  // Urus остаётся первой визуальной целью после включения серверной синхронизации.
  goals.sort(function (a, b) {
    if (a.id === 'goal-urus') return -1;
    if (b.id === 'goal-urus') return 1;
    return 0;
  });

  const focusRows = rowsAsObjects_(TAB.FOCUS);
  const focusToday = focusRows.filter(function (item) {
    return dateOnly_(item.date) === today;
  }).pop() || { date: today };

  return {
    today: today,
    morning_logs: rowsAsObjects_(TAB.MORNING),
    strengths: rowsAsObjects_(TAB.STRENGTHS),
    goals: goals,
    daily_focus: focusToday
  };
}

function completeMorning_(deviceId) {
  const today = today_();
  const rows = rowsAsObjects_(TAB.MORNING);
  const existing = rows.some(function (item) {
    return dateOnly_(item.date) === today && truthy_(item.completed);
  });

  if (!existing) {
    appendObject_(TAB.MORNING, {
      id: 'morning-' + Date.now(),
      date: today,
      completed: true,
      completed_at: new Date().toISOString(),
      timezone: TIMEZONE,
      device_id: deviceId,
      note: ''
    });
  }

  return { existing: existing, dashboard: getDashboard_() };
}

function addGoal_(payload) {
  const now = new Date().toISOString();
  const goal = Object.assign({}, payload, {
    id: payload.id || 'goal-' + Date.now(),
    title: String(payload.title || '').trim(),
    status: payload.status || 'active',
    created_at: payload.created_at || now,
    updated_at: now
  });

  if (!goal.title) throw new Error('У цели должно быть название.');
  appendObject_(TAB.GOALS, goal);
  return { dashboard: getDashboard_() };
}

function updateGoal_(payload) {
  if (!payload.id) throw new Error('Не передан id цели.');
  updateObjectById_(TAB.GOALS, payload.id, Object.assign({}, payload, {
    updated_at: new Date().toISOString()
  }));
  return { dashboard: getDashboard_() };
}

function deleteGoal_(payload) {
  if (!payload.id) throw new Error('Не передан id цели.');
  deleteObjectById_(TAB.GOALS, payload.id);
  return { dashboard: getDashboard_() };
}

function saveFocus_(payload, deviceId) {
  const today = today_();
  const sheet = sheet_(TAB.FOCUS);
  const headers = headers_(sheet);
  const values = sheet.getLastRow() > 1
    ? sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues()
    : [];
  const dateColumn = headers.indexOf('date');
  let sheetRow = -1;

  for (let index = values.length - 1; index >= 0; index -= 1) {
    if (dateOnly_(values[index][dateColumn]) === today) {
      sheetRow = index + 2;
      break;
    }
  }

  const focus = Object.assign({}, payload, {
    date: today,
    updated_at: new Date().toISOString(),
    device_id: deviceId
  });

  if (sheetRow === -1) appendObject_(TAB.FOCUS, focus);
  else updateRow_(sheet, headers, sheetRow, focus);

  return { dashboard: getDashboard_() };
}

function resolveGoalUrl_(value) {
  const url = String(value || '').trim();
  if (!/^https?:\/\//i.test(url)) throw new Error('Нужна полная ссылка, начинающаяся с http:// или https://');

  const response = UrlFetchApp.fetch(url, {
    followRedirects: true,
    muteHttpExceptions: true,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; RomanME/1.0)'
    }
  });

  const status = response.getResponseCode();
  if (status < 200 || status >= 400) throw new Error('Страница вернула HTTP ' + status);

  const html = response.getContentText().slice(0, 1500000);
  const product = productJsonLd_(html) || {};
  const offers = Array.isArray(product.offers) ? product.offers[0] || {} : product.offers || {};
  const structuredImage = Array.isArray(product.image) ? product.image[0] : product.image;
  const title = firstMeta_(html, ['og:title', 'twitter:title']) || product.name || tagText_(html, 'title');
  const description = firstMeta_(html, ['og:description', 'twitter:description', 'description']) || product.description;
  const image = firstMeta_(html, ['og:image:secure_url', 'og:image', 'twitter:image']) || structuredImage;
  const amount = firstMeta_(html, ['product:price:amount', 'og:price:amount', 'price']) || offers.price;
  const currency = firstMeta_(html, ['product:price:currency', 'og:price:currency', 'priceCurrency']) || offers.priceCurrency;

  return {
    metadata: {
      title: cleanText_(title),
      description: cleanText_(description),
      source_url: url,
      image_url: absoluteUrl_(image, url),
      price_value: numericValue_(amount),
      currency: cleanText_(currency) || 'RUB',
      source_checked_at: today_(),
      source_note: 'Метаданные автоматически прочитаны из OpenGraph или JSON-LD страницы. Цену необходимо проверить перед сохранением.'
    }
  };
}

function rowsAsObjects_(sheetName) {
  const sheet = sheet_(sheetName);
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  if (lastRow < 2 || lastColumn < 1) return [];

  const headers = sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0];
  const values = sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues();

  return values.map(function (row) {
    const item = {};
    headers.forEach(function (header, index) {
      if (header) item[header] = serializable_(row[index], header);
    });
    return item;
  }).filter(function (item) {
    return Object.keys(item).some(function (key) {
      return item[key] !== '' && item[key] !== null;
    });
  });
}

function appendObject_(sheetName, data) {
  const sheet = sheet_(sheetName);
  const headers = headers_(sheet);
  const row = headers.map(function (header) {
    return cellValue_(header, Object.prototype.hasOwnProperty.call(data, header) ? data[header] : '');
  });
  sheet.appendRow(row);
}

function updateObjectById_(sheetName, id, data) {
  const sheet = sheet_(sheetName);
  const headers = headers_(sheet);
  const idColumn = headers.indexOf('id');
  if (idColumn === -1) throw new Error('В листе ' + sheetName + ' нет колонки id.');
  if (sheet.getLastRow() < 2) throw new Error('Цель не найдена.');

  const ids = sheet.getRange(2, idColumn + 1, sheet.getLastRow() - 1, 1).getDisplayValues();
  const index = ids.findIndex(function (row) { return row[0] === String(id); });
  if (index === -1) throw new Error('Цель не найдена: ' + id);
  updateRow_(sheet, headers, index + 2, data);
}

function deleteObjectById_(sheetName, id) {
  const sheet = sheet_(sheetName);
  const headers = headers_(sheet);
  const idColumn = headers.indexOf('id');
  if (idColumn === -1 || sheet.getLastRow() < 2) throw new Error('Цель не найдена.');

  const ids = sheet.getRange(2, idColumn + 1, sheet.getLastRow() - 1, 1).getDisplayValues();
  const index = ids.findIndex(function (row) { return row[0] === String(id); });
  if (index === -1) throw new Error('Цель не найдена: ' + id);
  sheet.deleteRow(index + 2);
}

function updateRow_(sheet, headers, rowNumber, data) {
  const range = sheet.getRange(rowNumber, 1, 1, headers.length);
  const row = range.getValues()[0];
  headers.forEach(function (header, index) {
    if (Object.prototype.hasOwnProperty.call(data, header)) row[index] = cellValue_(header, data[header]);
  });
  range.setValues([row]);
}

function sheet_(name) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(name);
  if (!sheet) throw new Error('Не найден лист: ' + name);
  return sheet;
}

function headers_(sheet) {
  const lastColumn = sheet.getLastColumn();
  if (lastColumn < 1) throw new Error('В листе ' + sheet.getName() + ' нет заголовков.');
  return sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0];
}

function parseRequest_(event) {
  const body = event && event.postData && event.postData.contents ? event.postData.contents : '{}';
  try {
    return JSON.parse(body || '{}');
  } catch (error) {
    throw new Error('Сайт прислал некорректный JSON.');
  }
}

function serializable_(value, header) {
  if (!(value instanceof Date)) return value;
  if (header === 'date' || header === 'target_date' || header === 'source_checked_at') {
    return Utilities.formatDate(value, TIMEZONE, 'yyyy-MM-dd');
  }
  return value.toISOString();
}

function cellValue_(header, value) {
  if (value === null || typeof value === 'undefined') return '';
  if (['completed', 'active', 'money_done', 'content_done', 'health_done'].indexOf(header) !== -1) {
    return truthy_(value);
  }
  if (header === 'price_value' && value !== '') {
    const number = Number(String(value).replace(/\s/g, '').replace(',', '.'));
    return Number.isFinite(number) ? number : value;
  }
  return value;
}

function today_() {
  return Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd');
}

function dateOnly_(value) {
  if (value instanceof Date) return Utilities.formatDate(value, TIMEZONE, 'yyyy-MM-dd');
  return String(value || '').slice(0, 10);
}

function truthy_(value) {
  return value === true || value === 1 || String(value).toLowerCase() === 'true' || String(value).toLowerCase() === 'да';
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function errorMessage_(error) {
  return error && error.message ? error.message : String(error || 'Неизвестная ошибка');
}

function firstMeta_(html, names) {
  for (let index = 0; index < names.length; index += 1) {
    const value = meta_(html, names[index]);
    if (value) return value;
  }
  return '';
}

function productJsonLd_(html) {
  const scripts = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = scripts.exec(html))) {
    try {
      const parsed = JSON.parse(match[1].trim());
      const product = findProduct_(parsed);
      if (product) return product;
    } catch (error) {
      // Некоторые страницы содержат повреждённый JSON-LD. Продолжаем искать следующий блок.
    }
  }
  return null;
}

function findProduct_(value) {
  if (!value) return null;
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const found = findProduct_(value[index]);
      if (found) return found;
    }
    return null;
  }
  if (typeof value !== 'object') return null;
  const types = Array.isArray(value['@type']) ? value['@type'] : [value['@type']];
  if (types.some(function (type) { return ['Product', 'Vehicle', 'Car'].indexOf(type) !== -1; })) return value;
  if (value['@graph']) return findProduct_(value['@graph']);
  return null;
}

function meta_(html, name) {
  const escaped = escapeRegExp_(name);
  const patterns = [
    new RegExp('<meta[^>]+(?:property|name)=["\\\']' + escaped + '["\\\'][^>]+content=["\\\']([^"\\\']*)["\\\'][^>]*>', 'i'),
    new RegExp('<meta[^>]+content=["\\\']([^"\\\']*)["\\\'][^>]+(?:property|name)=["\\\']' + escaped + '["\\\'][^>]*>', 'i')
  ];
  for (let index = 0; index < patterns.length; index += 1) {
    const match = html.match(patterns[index]);
    if (match) return decodeEntities_(match[1]);
  }
  return '';
}

function tagText_(html, tag) {
  const match = html.match(new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)<\\/' + tag + '>', 'i'));
  return match ? decodeEntities_(match[1].replace(/<[^>]+>/g, ' ')) : '';
}

function cleanText_(value) {
  return decodeEntities_(String(value || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function numericValue_(value) {
  const cleaned = String(value || '').replace(/[^0-9.,-]/g, '').replace(',', '.');
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : '';
}

function absoluteUrl_(value, pageUrl) {
  const url = String(value || '').trim();
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  const origin = String(pageUrl).match(/^(https?:\/\/[^/]+)/i);
  if (!origin) return '';
  return url.charAt(0) === '/' ? origin[1] + url : origin[1] + '/' + url.replace(/^\.\//, '');
}

function decodeEntities_(value) {
  const map = {
    '&amp;': '&', '&quot;': '"', '&#39;': "'", '&apos;': "'", '&lt;': '<', '&gt;': '>', '&nbsp;': ' '
  };
  return String(value || '').replace(/&(amp|quot|#39|apos|lt|gt|nbsp);/gi, function (entity) {
    return map[entity.toLowerCase()] || entity;
  });
}

function escapeRegExp_(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Можно запустить вручную из редактора: функция проверит доступ ко всем листам.
function testSetup() {
  const dashboard = getDashboard_();
  console.log(JSON.stringify({
    ok: true,
    today: dashboard.today,
    strengths: dashboard.strengths.length,
    goals: dashboard.goals.length
  }));
  return dashboard;
}
