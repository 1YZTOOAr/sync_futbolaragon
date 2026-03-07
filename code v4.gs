/**
 * Rutinas automáticas -> calendario "Rutinas" a partir de "Finsa"
 * Reglas clave:
 * - No duplica "Trabajo".
 * - Mañanas: +Dormir prevDay 22:00–04:30, Comida 60', Café 60', Cena 20:00–21:00.
 * - Tardes: +Dormir 02:00–10:00, resto sin cambios.
 * - Noches: primera noche => SOLO Cena+Ida (+Vuelta nextDay); noches siguientes => Comida+Café+Cena+Ida (+Vuelta nextDay).
 * - Día anterior al primer bloque de Mañanas: Cena 20:00–21:00 + Dormir 22:00–04:30.
 * - Detecta turno SOLO si EMPIEZA hoy.
 * - Limpieza inteligente:
 *   (1) propio día; (2) "nextDay" de ayer solo si ayer NO fue noche; (3) "prevDay" de mañana si cae hoy.
 * - fullRefresh() borra y regenera el rango.
 * TZ proyecto: Europe/Madrid
 */

const CFG = {
  shiftCalendarName: "Finsa",
  routinesCalendarName: "Rutinas",
  keywords: { morning: "Mañana", afternoon: "Tarde", night: "Noche" },
  lookaheadDays: 60,
  tz: "Europe/Madrid",
  triggerHour: 0,          // 00:05
  triggerMinute: 5,
  autoTag: "[AUTO]",
  nextDayTitles: ["Desplazamiento Vuelta", "Dormir"], // elementos que caen en el día siguiente
  prevDayTitles: ["Dormir"], // elementos creados con prefijo de mañana pero que comienzan hoy
};

/* ========= Helpers básicos ========= */

function ev(title, h, m, durationMins, nextDay, prevDay) {
  return { title, hour: h, minute: m, durationMins, nextDay: !!nextDay, prevDay: !!prevDay };
}

function buildDateTimes_(baseDay, it) {
  // prevDay => el evento empieza en baseDay - 1
  // nextDay => el evento empieza en baseDay + 1
  let day = baseDay;
  if (it.prevDay) day = addDays_(baseDay, -1);
  if (it.nextDay) day = addDays_(baseDay, 1);

  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), it.hour, it.minute, 0, 0);
  const end = new Date(start.getTime() + it.durationMins * 60000);
  return { start, end };
}

function ensureCalendar_(name) {
  const cals = CalendarApp.getCalendarsByName(name);
  return cals.length ? cals[0] : CalendarApp.createCalendar(name, { timeZone: CFG.tz });
}
function getCalendarByName_(name) {
  const cals = CalendarApp.getCalendarsByName(name);
  return cals.length ? cals[0] : null;
}
function toMidnight_(date, tz) {
  return new Date(Utilities.formatDate(date, tz, "yyyy/MM/dd 00:00:00"));
}
function addDays_(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function dayWindow_(day) {
  const startOfDay = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0, 0);
  const endOfDay   = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999);
  return { startOfDay, endOfDay };
}
function escapeRegExp_(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Días útiles para actividades
const GYM_DAYS = [1, 3, 5]; // Lun, Mié, Vie
const STUDY_DAYS = [2, 4];  // Mar, Jue

function activityAt17_(dayOfWeek) {
  if (GYM_DAYS.includes(dayOfWeek)) return ev("Gimnasio", 17, 0, 120, false, false);
  if (STUDY_DAYS.includes(dayOfWeek)) return ev("Estudiar", 17, 0, 120, false, false);
  return null;
}

function activityAt0930_(dayOfWeek) {
  if (GYM_DAYS.includes(dayOfWeek)) return ev("Gimnasio", 9, 30, 150, false, false);
  if (STUDY_DAYS.includes(dayOfWeek)) return ev("Estudiar", 9, 30, 150, false, false);
  return null;
}

// Colores por título usando el enum `CalendarApp.EventColor`.
// Ajusta estos valores si quieres otros colores.
const COLOR_BY_TITLE = {
  "Dormir": CalendarApp.EventColor.GRAY,
  "Despertar": CalendarApp.EventColor.GRAY,
  "Desplazamiento Ida": CalendarApp.EventColor.MAUVE,
  "Desplazamiento Vuelta": CalendarApp.EventColor.MAUVE,
  "Comida": CalendarApp.EventColor.ORANGE,
  "Café": CalendarApp.EventColor.PALE_BLUE,
  "Cena": CalendarApp.EventColor.ORANGE,
  "Gimnasio": CalendarApp.EventColor.GREEN,
  "Estudiar": CalendarApp.EventColor.GREEN,
};

function baseTitleFrom_(fullTitle) {
  // Quita prefijos entre corchetes al principio (p.ej. "[AUTO][yyyy-mm-dd]")
  if (!fullTitle) return '';
  const idx = fullTitle.lastIndexOf(']');
  if (idx >= 0 && idx < fullTitle.length - 1) {
    return fullTitle.slice(idx + 1).trim();
  }
  return fullTitle;
}

// Normaliza una cadena para comparaciones: minúsculas, sin diacríticos, espacios simples
function normalizeKey_(s) {
  if (!s) return '';
  try {
    return s
      .toString()
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ');
  } catch (e) {
    // Fallback si no está disponible Unicode property escapes
    return s.toString().trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');
  }
}

/**
 * Construye un mapa { 'yyyy-MM-dd': shiftString|null } para el rango indicado.
 * Reduce llamadas repetidas a CalendarApp.getEvents() al obtener todos los eventos
 * del rango de una sola vez y agruparlos por fecha de inicio.
 */
function buildShiftMap_(shiftCal, rangeStart, rangeEnd) {
  const map = Object.create(null);
  const events = shiftCal.getEvents(rangeStart, rangeEnd);
  for (const e of events) {
    const key = Utilities.formatDate(e.getStartTime(), CFG.tz, 'yyyy-MM-dd');
    if (!map[key]) map[key] = [];
    map[key].push(e);
  }

  // Asegurar entradas para todos los días del rango
  let d = new Date(rangeStart);
  while (d <= rangeEnd) {
    const key = Utilities.formatDate(d, CFG.tz, 'yyyy-MM-dd');
    const evs = map[key] || [];
    map[key] = detectShift_(evs);
    d = addDays_(d, 1);
  }
  return map;
}

/* ========= Detección de turnos ========= */

function detectShift_(eventsStartingToday) {
  const morning = CFG.keywords.morning.toLowerCase();
  const afternoon = CFG.keywords.afternoon.toLowerCase();
  const night = CFG.keywords.night.toLowerCase();

  for (const e of eventsStartingToday) {
    const title = (e.getTitle() || "").toLowerCase();

    if (title.includes(morning))   return "morning";
    if (title.includes(afternoon)) return "afternoon";
    if (title.includes(night))     return "night";
  }
  return null;
}



function getShiftForDay_(shiftCal, day) {
  const { startOfDay, endOfDay } = dayWindow_(day);
  const eventsStartingToday = shiftCal.getEvents(startOfDay, endOfDay)
    .filter(e => e.getStartTime() >= startOfDay && e.getStartTime() < endOfDay);
  return detectShift_(eventsStartingToday);
}

function isFirstNightOfBlock_(shiftCal, day) {
  const today = getShiftForDay_(shiftCal, day);
  if (today !== "night") return false;
  const yesterday = addDays_(day, -1);
  const y = getShiftForDay_(shiftCal, yesterday);
  return y !== "night";
}

function isLastNightOfBlock_(shiftCal, day) {
  const today = getShiftForDay_(shiftCal, day);
  if (today !== "night") return false;
  const tomorrow = addDays_(day, 1);
  const t = getShiftForDay_(shiftCal, tomorrow);
  return t !== "night";
}

function hasFirstMorningTomorrow_(shiftCal, day) {
  const today = getShiftForDay_(shiftCal, day);
  const tomorrow = addDays_(day, 1);
  const t = getShiftForDay_(shiftCal, tomorrow);
  return t === "morning" && today !== "morning";
}

/* ========= Disparadores ========= */

function setupDailyTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === "generateRoutineEvents")
    .forEach(t => ScriptApp.deleteTrigger(t));

  ScriptApp.newTrigger("generateRoutineEvents")
    .timeBased()
    .atHour(CFG.triggerHour)
    .nearMinute(CFG.triggerMinute)
    .everyDays(1)
    .inTimezone(CFG.tz)
    .create();
}

/* ========= Principal ========= */

function generateRoutineEvents() {
  const shiftCal = getCalendarByName_(CFG.shiftCalendarName);
  if (!shiftCal) throw new Error(`No se encontró el calendario "${CFG.shiftCalendarName}".`);

  const routinesCal = ensureCalendar_(CFG.routinesCalendarName);
  const today = toMidnight_(new Date(), CFG.tz);

  log_('info', `generateRoutineEvents: inicio. today=${Utilities.formatDate(today, CFG.tz, 'yyyy-MM-dd')}`);

  // Construir mapa de turnos para el rango [hoy-1, hoy+lookaheadDays+1]
  const rangeStart = addDays_(today, -1);
  const rangeEnd = addDays_(today, CFG.lookaheadDays + 1);
  const shiftMap = buildShiftMap_(shiftCal, rangeStart, rangeEnd);
  log_('info', `buildShiftMap_ completo: rango ${Utilities.formatDate(rangeStart, CFG.tz, 'yyyy-MM-dd')} -> ${Utilities.formatDate(rangeEnd, CFG.tz, 'yyyy-MM-dd')}, días=${Object.keys(shiftMap).length}`);

  for (let d = 0; d < CFG.lookaheadDays; d++) {
    const day = addDays_(today, d);
    const ymd = Utilities.formatDate(day, CFG.tz, 'yyyy-MM-dd');

    log_('info', `Procesando día ${ymd}`);

    cleanupAutoForDay_(routinesCal, day, shiftMap);

    const shift = shiftMap[ymd];
    if (shift) upsertRoutineEventsForDay_(routinesCal, day, shift, shiftCal, shiftMap);

    // Día anterior al primer bloque de Mañanas: Cena + Dormir (22:00–04:30)
    const tomorrowKey = Utilities.formatDate(addDays_(day, 1), CFG.tz, 'yyyy-MM-dd');
    if (shiftMap[tomorrowKey] === 'morning' && shiftMap[ymd] !== 'morning') {
      // Cena 20–21 (día D)
      upsertEvent_(routinesCal, `${CFG.autoTag}[${ymd}] Cena`,
        new Date(day.getFullYear(), day.getMonth(), day.getDate(), 20, 0, 0, 0),
        new Date(day.getFullYear(), day.getMonth(), day.getDate(), 21, 0, 0, 0)
      );
      // Dormir 22:00–04:30 (comienza día D y cruza a D+1) -> 390 min
      const sleepStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 22, 0, 0, 0);
      const sleepEnd = new Date(sleepStart.getTime() + 390 * 60000);
      upsertEvent_(routinesCal, `${CFG.autoTag}[${ymd}] Dormir`, sleepStart, sleepEnd);
    }
  }
}

/**
 * Refresco total:
 * 1) Borra TODOS los eventos auto-generados en el rango [hoy-1, hoy+lookaheadDays]
 * 2) Vuelve a generar desde cero
 */
function fullRefresh() {
  const routinesCal = ensureCalendar_(CFG.routinesCalendarName);
  const today = toMidnight_(new Date(), CFG.tz);
  const start = addDays_(today, -1);
  const end = addDays_(today, CFG.lookaheadDays + 1);

  log_('info', `fullRefresh: borrando eventos auto en rango ${Utilities.formatDate(start, CFG.tz, 'yyyy-MM-dd')} -> ${Utilities.formatDate(end, CFG.tz, 'yyyy-MM-dd')}`);
  const all = routinesCal.getEvents(start, end);
  let deleted = 0;
  for (const e of all) {
    const title = (e.getTitle() || "");
    if (title.startsWith(CFG.autoTag + "[")) {
      e.deleteEvent();
      deleted++;
    }
  }
  log_('info', `fullRefresh: eventos borrados = ${deleted}`);
  generateRoutineEvents();
}

/* ========= Crear/actualizar rutinas (CON gimnasio y estudio) ========= */
function upsertRoutineEventsForDay_(routinesCal, dateObj, shift, shiftCal, shiftMap) {
  const date = toMidnight_(dateObj, CFG.tz);
  const ymd = Utilities.formatDate(date, CFG.tz, "yyyy-MM-dd");
  const prefix = `${CFG.autoTag}[${ymd}]`;

  log_('info', `upsertRoutineEventsForDay_: ${ymd} shift=${shift}`);

  let items = [];

  const dayOfWeek = date.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado

  // Para turnos morning añadimos la sesión 17:00–19:00 según el día
  if (shift === "morning") {
    const act = activityAt17_(dayOfWeek);
    if (act) items.push(act);
  }

  // Para turnos afternoon añadimos la sesión matinal 09:30–12:00 según el día
  if (shift === "afternoon") {
    const act = activityAt0930_(dayOfWeek);
    if (act) items = [act];
  }

  if (shift === "morning") {
    items = items.concat([
      // Dormir previo (empieza en día-1 22:00 -> termina hoy 04:30) -> 390 min
      ev("Dormir",               22,  0, 390,  false, true),  // prevDay
      ev("Despertar",             4, 30, 30,   false, false),
      ev("Desplazamiento Ida",    5,  0, 60,   false, false),
      ev("Desplazamiento Vuelta",14,  0, 60,   false, false),
      ev("Comida",               15,  0, 60,   false, false),
      ev("Café",                 16,  0, 60,   false, false),
      ev("Cena",                 20,  0, 60,   false, false),
    ]);
    // Regla nueva: si mañana NO es mañana → eliminar Cena
    const tomorrowKey = Utilities.formatDate(addDays_(date, 1), CFG.tz, 'yyyy-MM-dd');
    const nextShift = (shiftMap && shiftMap[tomorrowKey]) ? shiftMap[tomorrowKey] : getShiftForDay_(shiftCal, addDays_(date,1));

    if (nextShift !== "morning") {
      items = items.filter(it => it.title !== "Cena");
    }
  } else if (shift === "afternoon") {
    items = items.concat([
      // Dormir y rutina para turno de tardes: 00:30–08:00, Despertar 08:00–08:30, Café 08:30–09:30
      ev("Dormir", 0, 30, 450, false, false), // 00:30–08:00 (450 min)
      ev("Despertar", 8, 0, 30, false, false),
      ev("Café", 8, 30, 60, false, false),
      ev("Comida", 12, 0, 60, false, false),
      ev("Desplazamiento Ida", 13, 0, 60, false, false),
      ev("Desplazamiento Vuelta", 22, 0, 60, false, false),
      ev("Cena", 23, 0, 60, false, false),
    ]);
  } else if (shift === "night") {
    const firstNight = isFirstNightOfBlock_(shiftCal, date);
    const lastNight  = isLastNightOfBlock_(shiftCal, date);
    const act = activityAt17_(dayOfWeek);

    if (firstNight && !lastNight) {
      // Primera noche (si NO es también la última): SOLO Cena + Ida (pre), siempre Vuelta + Dormir nextDay
      items = [
        ev("Cena",                 20,  0, 60,  false, false),
        ev("Desplazamiento Ida",   21,  0, 60,  false, false),
        ev("Desplazamiento Vuelta", 6,  0, 60,  true,  false), // nextDay
        ev("Dormir",                7,  0, 450, true,  false), // nextDay 07:00–14:30 -> 450 min
      ];
    } else {
      // Noche normal o última noche: incluir Despertar + Comida + Café + (actividad 17:00) + Cena + Ida + Vuelta nextDay + Dormir nextDay
      items = [
        ev("Despertar",            14, 30, 30,  false, false),
        ev("Comida",               15,  0, 60,  false, false),
        ev("Café",                 16,  0, 60,  false, false),
      ];
      // Insertar actividad 17:00–19:00 si aplica
      if (act) items.push(act);
      items = items.concat([
        ev("Cena",                 20,  0, 60,  false, false),
        ev("Desplazamiento Ida",   21,  0, 60,  false, false),
        ev("Desplazamiento Vuelta", 6,  0, 60,  true,  false),
        ev("Dormir",                7,  0, 450, true,  false),
      ]);
    }
    // Si es la ÚLTIMA noche del bloque, además añadir, en el día siguiente al dormir,
    // Despertar + Comida + Café y la actividad según día (gimnasio/estudio) empezando ese mismo día.
    if (lastNight) {
      const nextDayOfWeek = addDays_(date, 1).getDay();
      // Despertar a 14:30 (empieza nextDay), Comida 15:00, Café 16:00
      items.push(ev("Despertar", 14, 30, 30, true, false));
      items.push(ev("Comida", 15, 0, 60, true, false));
      items.push(ev("Café", 16, 0, 60, true, false));
      const nextAct = activityAt17_(nextDayOfWeek);
      if (nextAct) {
        // forzar que la actividad sea en nextDay
        items.push(ev(nextAct.title, nextAct.hour, nextAct.minute, nextAct.durationMins, true, false));
      }
    }
    // Si es la última noche, el día siguiente no tendrá pre-noches (lo controla la detección por "empieza hoy").
  }

  for (const it of items) {
    const title = `${prefix} ${it.title}`;
    const { start, end } = buildDateTimes_(date, it);
    log_('info', `Creando/actualizando evento: ${title} ${Utilities.formatDate(start, CFG.tz, 'HH:mm')} - ${Utilities.formatDate(end, CFG.tz, 'HH:mm')}`);
    upsertEvent_(routinesCal, title, start, end);
  }
}

/* ========= Limpieza por día =========
 * 1) Borra auto-eventos de HOY (prefijo de HOY).
 * 2) Borra "nextDay" con prefijo de AYER si AYER NO fue Noche.
 * 3) Borra "prevDay" con prefijo de MAÑANA que caen HOY (p.ej., Dormir [prefix de mañana] que empieza hoy).
 */
function cleanupAutoForDay_(cal, day, shiftMap) {
  const { startOfDay, endOfDay } = dayWindow_(day);
  const ymd = Utilities.formatDate(day, CFG.tz, 'yyyy-MM-dd');
  log_('info', `cleanupAutoForDay_: inicio para ${ymd}`);

  // 1) HOY
  const todayPrefix = `${CFG.autoTag}[${Utilities.formatDate(day, CFG.tz, "yyyy-MM-dd")}]`;
  for (const e of cal.getEvents(startOfDay, endOfDay)) {
    const title = (e.getTitle() || "");
    if (title.startsWith(todayPrefix)) e.deleteEvent();
  }

  // 2) Next-day de AYER, solo si AYER NO fue Noche
  const yesterday = addDays_(day, -1);
  const yesterdayPrefix = `${CFG.autoTag}[${Utilities.formatDate(yesterday, CFG.tz, "yyyy-MM-dd")}]`;
  const yesterdayKey = Utilities.formatDate(yesterday, CFG.tz, 'yyyy-MM-dd');
  const yShift = shiftMap && shiftMap[yesterdayKey] ? shiftMap[yesterdayKey] : (function(){ const sc = getCalendarByName_(CFG.shiftCalendarName); return sc ? getShiftForDay_(sc, yesterday) : null; })();
  const shouldDeleteYesterdaysNextDay = (yShift !== "night");

  if (shouldDeleteYesterdaysNextDay) {
    for (const e of cal.getEvents(startOfDay, endOfDay)) {
      const title = (e.getTitle() || "");
      if (title.startsWith(yesterdayPrefix)) {
        if (CFG.nextDayTitles.some(t => title.endsWith(" " + t))) {
          e.deleteEvent();
        }
      }
    }
  }

  // 3) Prev-day de MAÑANA que caen HOY (p.ej. Dormir [prefix de mañana] que empieza hoy a las 22:00)
  const tomorrow = addDays_(day, 1);
  const tomorrowPrefix = `${CFG.autoTag}[${Utilities.formatDate(tomorrow, CFG.tz, "yyyy-MM-dd")}]`;
  for (const e of cal.getEvents(startOfDay, endOfDay)) {
    const title = (e.getTitle() || "");
    if (title.startsWith(tomorrowPrefix)) {
      if (CFG.prevDayTitles.some(t => title.endsWith(" " + t))) {
        e.deleteEvent();
      }
    }
  }
}

/* ========= Upsert de evento ========= */

function upsertEvent_(cal, title, start, end) {
  const existing = cal.getEvents(start, end).filter(e => e.getTitle() === title);
  let e;
  if (existing.length) {
    e = existing[0];
    if (e.getStartTime().getTime() !== start.getTime() || e.getEndTime().getTime() !== end.getTime()) {
      e.setTime(start, end);
    }
  } else {
    e = cal.createEvent(title, start, end, {
      description: "Rutina generada automáticamente desde turnos."
      // Para avisos: , reminders: [{ method: 'popup', minutes: 10 }]
    });
  }

  // Intentar asignar color (si está disponible). Usamos base title (sin prefijo auto).
  try {
    const base = baseTitleFrom_(title);
    const baseNorm = normalizeKey_(base);

    // Buscar una clave en COLOR_BY_TITLE que coincida al normalizar.
    let color = null;
    for (const k in COLOR_BY_TITLE) {
      if (!Object.prototype.hasOwnProperty.call(COLOR_BY_TITLE, k)) continue;
      if (normalizeKey_(k) === baseNorm) {
        color = COLOR_BY_TITLE[k];
        break;
      }
    }

    if (color && typeof e.setColor === 'function') {
      log_('info', `Asignando color '${String(color)}' al evento: ${title} (base='${base}')`);
      try {
        e.setColor(color);
        log_('info', `Color aplicado OK a: ${title}`);
      } catch (err2) {
        log_('error', `Error aplicando color '${String(color)}' a ${title}: ${err2}`);
      }
    } else {
      // Debug: listar claves en COLOR_BY_TITLE y sus versiones normalizadas
      const keys = Object.keys(COLOR_BY_TITLE || {});
      const mapped = keys.map(k => `${k} -> ${normalizeKey_(k)}`).join('; ');
      // Mostrar códigos de caracteres del base original para detectar espacios/acentos invisibles
      const charCodes = base.split('').map(c => c.charCodeAt(0)).join(' ');
      log_('warn', `No hay color mapeado (normalizado='${baseNorm}') para: ${title} (base='${base}'). Claves disponibles: ${mapped}. CharCodes: ${charCodes}`);
    }
  } catch (err) {
    // Silencioso: no bloqueamos la generación por problemas de color.
    log_('error', 'No se pudo determinar color para el evento ' + title + ': ' + String(err));
  }
}

// Inspecciona los eventos auto-generados en el rango y registra su color actual.
function inspectAutoColors() {
  const routinesCal = ensureCalendar_(CFG.routinesCalendarName);
  const today = toMidnight_(new Date(), CFG.tz);
  const start = addDays_(today, -1);
  const end = addDays_(today, CFG.lookaheadDays + 1);
  const events = routinesCal.getEvents(start, end);
  for (const e of events) {
    const title = e.getTitle() || '';
    if (!title.startsWith(CFG.autoTag + '[')) continue;
    const startT = e.getStartTime();
    const color = (typeof e.getColor === 'function') ? e.getColor() : '(getColor no disponible)';
    log_('info', `${Utilities.formatDate(startT, CFG.tz, 'yyyy-MM-dd HH:mm')} | ${title} | color=${color}`);
  }
  log_('info', 'Inspección de colores completada. Revisa los logs (View → Executions / Logs).');
}

// Función de prueba para crear un evento y aplicar color (útil para depuración).
function testColor() {
  const routinesCal = ensureCalendar_(CFG.routinesCalendarName);
  const start = new Date();
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const title = `${CFG.autoTag}[test] Evento prueba color`;
  const ev = routinesCal.createEvent(title, start, end, { description: 'Prueba de color' });
  try {
    ev.setColor(CalendarApp.EventColor.PALE_BLUE);
    log_('info', 'Evento de prueba creado y color aplicado.');
  } catch (err) {
    log_('error', 'Error aplicando color: ' + String(err));
  }
}

// Helper de logging: escribe en console (Cloud Logging) y en Logger (Apps Script)
function log_(level, message, meta) {
  const ts = new Date().toISOString();
  const payload = {
    ts,
    level,
    message: typeof message === 'string' ? message : String(message),
    meta: meta || null
  };
  try {
    // console.* va a Cloud Logging con estructura JSON si lo pasamos como string
    const json = JSON.stringify(payload);
    if (level === 'error') console.error(json);
    else if (level === 'warn') console.warn(json);
    else console.log(json);
  } catch (e) {
    // fallback sencillo
    console.log(ts + ' ' + level + ' ' + message);
  }
  try {
    // Logger también almacena (útil para ver rápidamente en View -> Logs)
    Logger.log('%s %s %s', ts, level.toUpperCase(), message);
    if (meta) Logger.log('META: %s', JSON.stringify(meta));
  } catch (e) {
    // ignore
  }
}

// WEB APP: llamar por URL para ejecutar la rutina
function doGet() {
  // ejecuta y devuelve una página simple
  try {
    generateRoutineEvents();
    return HtmlService
      .createHtmlOutput("<h3>Rutinas generadas ✅</h3><p>Puedes cerrar esta pestaña.</p>")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    return HtmlService
      .createHtmlOutput("<h3>Error ❌</h3><pre>" + String(err) + "</pre>")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
}
