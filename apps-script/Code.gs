// ====================================================
// Бюроучета.рф — Google Apps Script
// Вставьте Calendar ID своих календарей ниже,
// затем: Развернуть → Новое развёртывание → Веб-приложение
//   Выполнять как: Я (ваш аккаунт)
//   Кто имеет доступ: Все
// ====================================================

const CALENDARS = {
  anastasia: 'PASTE_ANASTASIA_CALENDAR_ID',  // например: your@gmail.com
  olga:      'PASTE_OLGA_CALENDAR_ID'
};

const WORK_HOURS = {
  anastasia: { start: 14, end: 16 },  // МСК, каждый будний день
  olga: {                              // МСК, по дням (1=Пн..5=Пт)
    1: { start: 9,  end: 18 },  // Пн
    2: { start: 12, end: 18 },  // Вт
    3: { start: 9,  end: 13 },  // Ср
    4: { start: 9,  end: 18 },  // Чт
    5: { start: 9,  end: 17 }   // Пт
  }
};

const TZ = '+03:00'; // Москва UTC+3

// ── Точка входа ──────────────────────────────────────
function doGet(e) {
  const p = e.parameter;
  let result;
  try {
    if      (p.action === 'slots') result = getSlots(p.specialist, p.date);
    else if (p.action === 'book')  result = createBooking(p);
    else                           result = { error: 'unknown action' };
  } catch (err) {
    result = { error: err.message };
  }
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Возвращает свободные часы на дату ────────────────
function getWorkHoursForDay(whConfig, dateStr) {
  if (whConfig.start !== undefined) return whConfig; // простой формат
  const dayOfWeek = new Date(dateStr + 'T12:00:00' + TZ).getDay(); // 0=Вс,1=Пн..6=Сб
  return whConfig[dayOfWeek] || null; // null = нет приёма в этот день
}

function getSlots(specialist, dateStr) {
  if (!CALENDARS[specialist]) return { error: 'unknown specialist' };
  const wh = getWorkHoursForDay(WORK_HOURS[specialist], dateStr);
  if (!wh) return { slots: [] }; // нет приёма в этот день
  const cal = CalendarApp.getCalendarById(CALENDARS[specialist]);

  const dayStart = new Date(dateStr + 'T00:00:00' + TZ);
  const dayEnd   = new Date(dateStr + 'T23:59:59' + TZ);
  const events   = cal.getEvents(dayStart, dayEnd);

  const busy = new Set();
  events.forEach(ev => {
    const evS = ev.getStartTime().getTime();
    const evE = ev.getEndTime().getTime();
    for (let h = wh.start; h < wh.end; h++) {
      const sS = new Date(dateStr + 'T' + pad2(h)   + ':00:00' + TZ).getTime();
      const sE = new Date(dateStr + 'T' + pad2(h+1) + ':00:00' + TZ).getTime();
      if (evS < sE && evE > sS) busy.add(h);
    }
  });

  const slots = [];
  for (let h = wh.start; h < wh.end; h++) {
    if (!busy.has(h)) slots.push(h);
  }
  return { slots };
}

// ── Создаёт событие в календаре специалиста ──────────
function createBooking(p) {
  const { specialist, date, hour, name, phone, telegram, comment } = p;
  if (!CALENDARS[specialist]) return { error: 'unknown specialist' };

  const h     = Number(hour);
  const start = new Date(date + 'T' + pad2(h)   + ':00:00' + TZ);
  const end   = new Date(date + 'T' + pad2(h+1) + ':00:00' + TZ);

  const specNames = { anastasia: 'Анастасия Сергеева', olga: 'Ольга Смагина' };
  const title = 'Консультация · ' + (name || 'Клиент');
  const desc  = [
    'Специалист: ' + (specNames[specialist] || specialist),
    'Телефон: '    + (phone    || '—'),
    'Telegram: '   + (telegram || '—'),
    'Комментарий: '+ (comment  || '—'),
  ].join('\n');

  CalendarApp.getCalendarById(CALENDARS[specialist])
    .createEvent(title, start, end, { description: desc });

  return { ok: true };
}

function pad2(n) { return String(n).padStart(2, '0'); }
