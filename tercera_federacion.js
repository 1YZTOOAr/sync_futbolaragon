/**
 * =========================
 * CONFIG (EDITA ESTO)
 * =========================
 */

// URL “xls” (realmente HTML) de FutbolAragon
const SOURCE_XLS_URL =
  "https://www.futbolaragon.com/pnfg/NPcd/NFG_VisCalendario_Vis?cod_primaria=1000120&codgrupo=22379581&codcompeticion=22320180&codtemporada=21&CDetalle=1&excel=1&NPcd_File=1";

// Zona horaria España (DST automático)
const TZ = "Europe/Madrid";

// Duración del evento (minutos). Ajusta si quieres.
const DEFAULT_DURATION_MIN = 105;

// Clave estable de competición/temporada (para evitar colisiones si migras de temporada)
const COMPETITION_KEY = "codcompeticion=22320180|codtemporada=21|codgrupo=22379581";

// Tu equipo (calendario personal por defecto)
const DEFAULT_TEAM_NAME = "CALAMOCHA C.F.";

// IDs de calendarios
// - GLOBAL: calendario con TODOS los partidos
// - USER: calendario personal del usuario (solo su equipo)
const CALENDAR_ID_GLOBAL = "primary"; // <-- cambia a tu ID real si usas uno dedicado
const CALENDAR_ID_USER = "primary";   // <-- cambia a tu ID real del calendario personal (recomendado uno dedicado)

/**
 * Lista oficial (por si quieres usar índices 1..18).
 * OJO: esto lo dejaría como referencia. En tu flujo personal usas DEFAULT_TEAM_NAME.
 */
const TEAM_NAMES = [
  "LA ALMUNIA-C.D.",
  "ZUERA-C.D.",
  "EPILA-C.F.-A.D.",
  "CASETAS-U.D. Agroveco",
  "BELCHITE 97-C.D.",
  "BINEFAR-C.D.",
  "ANDORRA-C.F.",
  "CASPE-C.D.",
  "UTRILLAS-C.D.",
  "ILLUECA-C.F.",
  "TAMARITE-C.D.J.",
  "CUARTE-C.D.",
  "MONZON-ATLETICO Alumbra",
  "HUESCA-S.D.",
  "ALMUDEVAR A.D.",
  "CALAMOCHA C.F.",
  "ROBRES-C.D.",
  "CARIÑENA-C.D"
];

/**
 * =========================
 * SETUP / VALIDACIÓN
 * =========================
 *
 * Requisitos:
 * 1) Apps Script → Servicios avanzados de Google → habilitar "Calendar API"
 * 2) Ejecutar setupAndValidate()
 */
function setupAndValidate() {
  // 1) Validar que Calendar API está operativo y que hay acceso a los calendarios
  validateCalendarAccess_(CALENDAR_ID_GLOBAL, "GLOBAL");
  validateCalendarAccess_(CALENDAR_ID_USER, "USER");

  // 2) Validar que el equipo existe en el listado (opcional pero recomendable)
  validateTeamName_(DEFAULT_TEAM_NAME);

  // 3) Guardar configuración en Script Properties (útil si luego lo haces configurable por UI)
  const props = PropertiesService.getScriptProperties();
  props.setProperty("TEAM_NAME", DEFAULT_TEAM_NAME);
  props.setProperty("CALENDAR_ID_GLOBAL", CALENDAR_ID_GLOBAL);
  props.setProperty("CALENDAR_ID_USER", CALENDAR_ID_USER);

  // 4) (Opcional) primer sync manual para comprobar
  syncGlobalCalendar();
  syncUserCalendar();

  console.log("Setup OK: calendarios validados, config guardada, y sync inicial ejecutado.");
}

/**
 * =========================
 * TRIGGERS
 * =========================
 *
 * Crea triggers para:
 * - Global (todos)
 * - User (equipo preferido)
 *
 * Ajusta la frecuencia si quieres.
 */
function createTriggers_every6Hours() {
  deleteTriggers_("syncGlobalCalendar");
  deleteTriggers_("syncUserCalendar");

  ScriptApp.newTrigger("syncGlobalCalendar").timeBased().everyHours(6).create();
  ScriptApp.newTrigger("syncUserCalendar").timeBased().everyHours(6).create();

  console.log("Triggers creados: global y user cada 6 horas.");
}

function deleteAllSyncTriggers() {
  deleteTriggers_("syncGlobalCalendar");
  deleteTriggers_("syncUserCalendar");
  console.log("Triggers de sync eliminados.");
}

/**
 * =========================
 * ENTRYPOINTS SYNC
 * =========================
 */

// Sincroniza calendario global (todos los partidos)
function syncGlobalCalendar() {
  const cfg = loadConfig_();
  const matches = fetchAndParseMatches_();
  syncMatchesToCalendar_(cfg.calendarGlobalId, matches, "GLOBAL");
}

// Sincroniza calendario personal del usuario (solo su equipo)
function syncUserCalendar() {
  const cfg = loadConfig_();
  const matches = fetchAndParseMatches_().filter(m => m.home === cfg.teamName || m.away === cfg.teamName);
  syncMatchesToCalendar_(cfg.calendarUserId, matches, `USER(${cfg.teamName})`);
}

/**
 * =========================
 * CORE: Fetch + Parse
 * =========================
 */
function fetchAndParseMatches_() {
  const resp = UrlFetchApp.fetch(SOURCE_XLS_URL, {
    followRedirects: true,
    muteHttpExceptions: true,
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; GoogleAppsScript)",
      "Accept-Language": "es-ES,es;q=0.9"
    }
  });

  const code = resp.getResponseCode();
  if (code >= 300) {
    console.log(`HTTP ${code} al descargar el XLS. Revisa si hay redirecciones/bloqueos.`);
  }

  const html = resp.getContentText("ISO-8859-1");
  const rows = extractTableRows_(html);

  const jornadaRe = /^Jornada\s+(\d+)\s*\((\d{2}-\d{2}-\d{4})\)$/i;

  const matches = [];
  let currentJornada = null;

  for (const r of rows) {
    const c0 = (r[0] || "").trim();

    const jm = c0.match(jornadaRe);
    if (jm) {
      currentJornada = Number(jm[1]);
      continue;
    }
    if (!currentJornada) continue;

    // Formato: [local, "-", visitante, campo, "dd-mm-aaaa - hh:mm"]
    const home = (r[0] || "").trim();
    const sep = (r[1] || "").trim();
    const away = (r[2] || "").trim();
    const location = (r[3] || "").trim();
    const fh = (r[4] || "").trim();

    if (!(home && sep === "-" && away)) continue;

    const startDate = parseFechaHoraLocal_(fh);
    if (!startDate) continue;

    const endDate = new Date(startDate.getTime() + DEFAULT_DURATION_MIN * 60000);

    const stableKey = buildStableMatchKey_(currentJornada, home, away);
    const eventId = buildDeterministicEventId_(stableKey);

    matches.push({
      jornada: currentJornada,
      home,
      away,
      location: location || null,
      startDate,
      endDate,
      sourceText: fh || null,
      stableKey,
      eventId
    });
  }

  if (!matches.length) {
    console.log("No se han extraído partidos. Posible cambio en el HTML del XLS.");
  }

  return matches;
}

/**
 * =========================
 * CORE: Upsert en Calendar (Calendar API)
 * =========================
 */
function syncMatchesToCalendar_(calendarId, matches, label) {
  validateCalendarAccess_(calendarId, label);

  let inserted = 0;
  let updated = 0;
  let failed = 0;

  for (const m of matches) {
    const resource = buildEventResource_(m);

    try {
      // Si existe, patch
      Calendar.Events.get(calendarId, m.eventId);
      Calendar.Events.patch(resource, calendarId, m.eventId);
      updated++;
    } catch (e) {
      // Si no existe, insert con ID fijo
      try {
        Calendar.Events.insert(resource, calendarId);
        inserted++;
      } catch (e2) {
        failed++;
        console.log(`Fallo insert/patch (${label}) eventId=${m.eventId} key=${m.stableKey}: ${e2}`);
      }
    }
  }

  console.log(`[${label}] inserted=${inserted}, updated=${updated}, failed=${failed}, total=${matches.length}`);
}

function buildEventResource_(m) {
  // dateTime en formato local + timezone => DST automático
  const startLocal = formatLocalDateTime_(m.startDate);
  const endLocal = formatLocalDateTime_(m.endDate);

  return {
    id: m.eventId,
    summary: `⚽ ${m.home} vs ${m.away}`,
    location: m.location || "",
    description: [
      "Fuente: futbolaragon.com (export excel)",
      `Jornada: ${m.jornada}`,
      `StableKey: ${m.stableKey}`,
      m.sourceText ? `Fecha/hora fuente: ${m.sourceText}` : null
    ].filter(Boolean).join("\n"),
    start: { dateTime: startLocal, timeZone: TZ },
    end: { dateTime: endLocal, timeZone: TZ },
    extendedProperties: {
      private: {
        stableKey: m.stableKey,
        competitionKey: COMPETITION_KEY,
        jornada: String(m.jornada),
        home: m.home,
        away: m.away
      }
    }
  };
}

/**
 * =========================
 * IDs estables
 * =========================
 */
function buildStableMatchKey_(jornada, home, away) {
  // NO incluye fecha/hora/campo, para que cambios no cambien el ID.
  return `${COMPETITION_KEY}|J${jornada}|${home}|${away}`.toUpperCase();
}

function buildDeterministicEventId_(stableKey) {
  // Reglas eventId Google Calendar: [a-v0-9] minúsculas (base32 “google-safe”).
  // Hacemos SHA-1 del stableKey + base32 (a-v0-9).
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_1, stableKey, Utilities.Charset.UTF_8);
  const b32 = base32Google_(bytes);
  // Asegura longitud y comienzo con letra
  return ("m" + b32).slice(0, 26);
}

function base32Google_(bytes) {
  const alphabet = "abcdefghijklmnopqrstuv0123456789"; // 32 chars
  let bits = 0;
  let value = 0;
  let out = "";

  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | (bytes[i] & 0xff);
    bits += 8;
    while (bits >= 5) {
      out += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += alphabet[(value << (5 - bits)) & 31];
  return out;
}

/**
 * =========================
 * Parsing helpers
 * =========================
 */
function parseFechaHoraLocal_(fh) {
  // "dd-mm-aaaa - hh:mm"
  const m = (fh || "").match(/(\d{2})-(\d{2})-(\d{4})\s*-\s*(\d{2}):(\d{2})/);
  if (!m) return null;

  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);
  const HH = Number(m[4]);
  const MIN = Number(m[5]);

  // Date “local” del script; el envío a Calendar API se hace con timeZone Europe/Madrid
  return new Date(yyyy, mm - 1, dd, HH, MIN, 0);
}

function formatLocalDateTime_(d) {
  return Utilities.formatDate(d, TZ, "yyyy-MM-dd'T'HH:mm:ss");
}

function extractTableRows_(html) {
  const h = html.replace(/\r?\n/g, " ").replace(/\s+/g, " ");

  const rowRe = /<tr[^>]*>(.*?)<\/tr>/gi;
  const cellRe = /<t[dh][^>]*>(.*?)<\/t[dh]>/gi;

  const rows = [];
  let mRow;
  while ((mRow = rowRe.exec(h)) !== null) {
    const rowHtml = mRow[1];
    const cells = [];
    let mCell;
    while ((mCell = cellRe.exec(rowHtml)) !== null) {
      cells.push(cleanCell_(mCell[1]));
    }
    if (cells.some(c => c)) rows.push(cells);
  }
  return rows;
}

function cleanCell_(s) {
  if (!s) return "";
  return s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/\u00a0/g, " ")
    .trim();
}

/**
 * =========================
 * Validaciones / utilidades
 * =========================
 */
function validateCalendarAccess_(calendarId, label) {
  try {
    // CalendarList.get valida acceso real al calendario
    const entry = Calendar.CalendarList.get(calendarId);
    if (!entry || !entry.id) throw new Error("CalendarList.get no devolvió id");
    console.log(`[${label}] Acceso OK calendario: ${entry.id} (${entry.summary || "sin summary"})`);
  } catch (e) {
    throw new Error(
      `[${label}] No puedo acceder al calendarioId="${calendarId}". ` +
      `Revisa el ID, permisos y que tienes habilitado Calendar API. Error: ${e}`
    );
  }
}

function validateTeamName_(teamName) {
  if (!TEAM_NAMES.includes(teamName)) {
    // No lo hago fatal: puede que el fichero tenga espacios raros o que el user use otro alias.
    // Pero como tú has fijado CALAMOCHA C.F., esto debe pasar.
    throw new Error(
      `TEAM_NAME="${teamName}" no está en TEAM_NAMES. ` +
      `Revisa el nombre exacto (mayúsculas, puntos, espacios).`
    );
  }
}

function loadConfig_() {
  const props = PropertiesService.getScriptProperties();
  return {
    teamName: props.getProperty("TEAM_NAME") || DEFAULT_TEAM_NAME,
    calendarGlobalId: props.getProperty("CALENDAR_ID_GLOBAL") || CALENDAR_ID_GLOBAL,
    calendarUserId: props.getProperty("CALENDAR_ID_USER") || CALENDAR_ID_USER
  };
}

function deleteTriggers_(handlerName) {
  for (const t of ScriptApp.getProjectTriggers()) {
    if (t.getHandlerFunction() === handlerName) ScriptApp.deleteTrigger(t);
  }
}