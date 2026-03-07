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
const CALENDAR_ID_GLOBAL = "fce3eab17979b9db84d012d11e09635a494131d4100235e23f493cd76ab3c26e@group.calendar.google.com"; // <-- cambia a tu ID real si usas uno dedicado
const CALENDAR_ID_USER = "baf0d32c488933e8418f5accae39a91272ebbf41444cd6155934d3457fa81b69@group.calendar.google.com";   // <-- cambia a tu ID real del calendario personal (recomendado uno dedicado)

// Calendario especifico por club

const CALENDAR_CLUB_CALAMOCHA = "baf0d32c488933e8418f5accae39a91272ebbf41444cd6155934d3457fa81b69@group.calendar.google.com";

// Calendarios específicos por equipo/todas las categorías (opcional, si quieres separar por categoría o equipo). Si se deja vacío, se usan los CALENDAR_ID_GLOBAL/USER por defecto.

const CALENDAR_CALAMOCHA_CF = "f8ac19be2cd4d7ac95560f1d39c71dcf0914575b4fed708b79f5befbb6218e5d@group.calendar.google.com";
const CALENDAR_CALAMOCHA_CF_B = "620cbbd7f95162907f148c414ac694e0b1005263bbee40f61f9cb910e6c707af@group.calendar.google.com";
const CALENDAR_JUVENIL = "37c7f75f79af642f4df412e321932b3e6108b53c588a9a9574690cf3b950edfd@group.calendar.google.com";
const CALENDAR_CADETE = "6c63b26f0a7a9095057861f8419d63cf38e79c331bce245f8b610dbab510c7c3@group.calendar.google.com";
const CALENDAR_INFANTIL = "2b45e8c2f2ee1571123a33831f9c21a3d1bba4a3a8e83ac970fe003d59185da0@group.calendar.google.com";
const CALENDAR_ALEVIN = "983fdf12843daca9a6e00511574d09ea3beb2dfcb1b0be9f99ea612c80f25777@group.calendar.google.com";
const CALENDAR_BENJAMIN = "35044d9d03492560e651cc5646d4929583fb9678dabb280b016c9a7c7de65884@group.calendar.google.com";

/**
 * Soporte para múltiples categorías/competiciones.
 * Rellena `sourceUrl` y `competitionKey` para cada categoría que quieras sincronizar.
 * Si `sourceUrl` está vacío se omite esa categoría (útil para copiar/pegar y completar luego).
 */
// NOTE: La definición de `CATEGORIES` se mueve más abajo, después de las constantes `SOURCE_*`
// para evitar ReferenceError por inicialización temprana.

/* ===== Constantes para rellenar manualmente =====
 * Rellena las URL y competitionKey para cada categoría. Mantén las constantes en mayúsculas.
 */
// URLs (pon la export excel/html de FutbolAragon para cada categoría)
const SOURCE_TERCERA_FEDERACION_URL = "https://www.futbolaragon.com/pnfg/NPcd/NFG_VisCalendario_Vis?cod_primaria=1000120&codgrupo=22379581&codcompeticion=22320180&codtemporada=21&CDetalle=1&excel=1&NPcd_File=1";
const SOURCE_REGIONAL_PREFERENTE_URL = "https://www.futbolaragon.com/pnfg/NPcd/NFG_VisCalendario_Vis?cod_primaria=1000120&codgrupo=22320197&codcompeticion=22320195&codtemporada=21&CodJornada=&CDetalle=1&excel=1&NPcd_File=1";
const SOURCE_JUVENIL_PREFERENTE_URL = "https://www.futbolaragon.com/pnfg/NPcd/NFG_VisCalendario_Vis?cod_primaria=1000120&codgrupo=22395204&codcompeticion=22320181&codtemporada=21&CodJornada=&CDetalle=1&excel=1&NPcd_File=1";
const SOURCE_CADETE_URL = "https://www.futbolaragon.com/pnfg/NPcd/NFG_VisCalendario_Vis?cod_primaria=1000120&codtemporada=21&codcompeticion=22320183&codgrupo=22448755&CDetalle=1&excel=1&NPcd_File=1";
const SOURCE_INFANTIL_URL = "https://www.futbolaragon.com/pnfg/NPcd/NFG_VisCalendario_Vis?cod_primaria=1000120&codgrupo=22448759&codcompeticion=22320184&codtemporada=21&CodJornada=&CDetalle=1&excel=1&NPcd_File=1";
const SOURCE_ALEVIN_URL = "https://www.futbolaragon.com/pnfg/NPcd/NFG_VisCalendario_Vis?cod_primaria=1000120&codgrupo=23074348&codcompeticion=23074335&codtemporada=21&CodJornada=&CDetalle=1&excel=1&NPcd_File=1";
const SOURCE_BENJAMIN_URL = "https://www.futbolaragon.com/pnfg/NPcd/NFG_VisCalendario_Vis?cod_primaria=1000120&codgrupo=23074332&codcompeticion=23074329&codtemporada=21&CodJornada=&CDetalle=1&excel=1&NPcd_File=1";

// Competition keys (cadenas que identifiquen competencia/temporada/grupo en FutbolAragon)
const COMP_TERCERA_FEDERACION_KEY = "codcompeticion=22320180|codtemporada=21|codgrupo=22379581";
const COMP_REGIONAL_PREFERENTE_KEY = "codcompeticion=22320195|codtemporada=21|codgrupo=22320197";
const COMP_JUVENIL_PREFERENTE_KEY = "codcompeticion=22320181|codtemporada=21|codgrupo=22395204";
const COMP_CADETE_KEY = "codcompeticion=22320183|codtemporada=21|codgrupo=22448755";
const COMP_INFANTIL_KEY = "codcompeticion=22320184|codtemporada=21|codgrupo=22448759";
const COMP_ALEVIN_KEY = "codcompeticion=23074335|codtemporada=21|codgrupo=23074348";
const COMP_BENJAMIN_KEY = "codcompeticion=23074329|codtemporada=21|codgrupo=23074332";

/**
 * Soporte para múltiples categorías/competiciones.
 * Rellena `sourceUrl` y `competitionKey` para cada categoría que quieras sincronizar.
 * Si `sourceUrl` está vacío se omite esa categoría (útil para copiar/pegar y completar luego).
 */
const CATEGORIES = [
  {
    key: "TERCERA_FEDERACION",
    displayName: "Primer Equipo - Tercera Federación",
    sourceUrl: SOURCE_TERCERA_FEDERACION_URL,
    competitionKey: COMP_TERCERA_FEDERACION_KEY,
    // opcional: nombre del equipo en esa categoría (por si usas alias distinto)
    teamName: "CALAMOCHA C.F."
  },
  {
    key: "REGIONAL_PREFERENTE",
    displayName: "Filial - Regional Preferente",
    sourceUrl: SOURCE_REGIONAL_PREFERENTE_URL,
    competitionKey: COMP_REGIONAL_PREFERENTE_KEY,
    teamName: "CALAMOCHA C.F. B"
  },
  {
    key: "JUVENIL_PREFERENTE",
    displayName: "Juvenil - Juvenil Preferente",
    sourceUrl: SOURCE_JUVENIL_PREFERENTE_URL,
    competitionKey: COMP_JUVENIL_PREFERENTE_KEY,
    teamName: "CALAMOCHA C.F."
  },
  {
    key: "CADETE",
    displayName: "Cadete - 1ª Cadete",
    sourceUrl: SOURCE_CADETE_URL,
    competitionKey: COMP_CADETE_KEY,
    teamName: "CALAMOCHA C.F."
  },
  {
    key: "INFANTIL",
    displayName: "Infantil - 1ª Infantil",
    sourceUrl: SOURCE_INFANTIL_URL,
    competitionKey: COMP_INFANTIL_KEY,
    teamName: "CALAMOCHA C.F."
  },
  {
    key: "ALEVIN",
    displayName: "Alevín - Alevín Fútbol 8",
    sourceUrl: SOURCE_ALEVIN_URL,
    competitionKey: COMP_ALEVIN_KEY,
    teamName: "CALAMOCHA C.F."
  },
  {
    key: "BENJAMIN",
    displayName: "Benjamín - 2ª Benjamín",
    sourceUrl: SOURCE_BENJAMIN_URL,
    competitionKey: COMP_BENJAMIN_KEY,
    teamName: "CALAMOCHA C.F."
  }
];

// Calendarios específicos por categoría (si quieres tener calendarios separados por club/categoría)
const CALENDAR_TERCERA_GLOBAL = "1e06809f8891a6c237506df93722e5d9f8581a7d771bbccc7d69bbf8c9bb8ff5@group.calendar.google.com";
const CALENDAR_TERCERA_USER = CALENDAR_CALAMOCHA_CF; // <-- ejemplo: calendario específico para el equipo de tercera federación (opcional)
const CALENDAR_REGIONAL_GLOBAL = "ac8137c38bf7319b3a9dd9c888862e134daa9c042fa5f4d8994c2f363794ac08@group.calendar.google.com";
const CALENDAR_REGIONAL_USER = CALENDAR_CALAMOCHA_CF_B; // <-- ejemplo: calendario específico para el equipo de regional preferente (opcional)
const CALENDAR_JUVENIL_GLOBAL = "09b841f45fff8cbf2834676c9c65b72e82c2c461de913bcd9d6e0513413ba559@group.calendar.google.com";
const CALENDAR_JUVENIL_USER = CALENDAR_JUVENIL; // <-- ejemplo: calendario específico para el equipo juvenil (opcional)
const CALENDAR_CADETE_GLOBAL = "f9a645ae8cdc2a2511720168d80efe1e0637276da9b54c0b3a533f7f589a7fe5@group.calendar.google.com";
const CALENDAR_CADETE_USER = CALENDAR_CADETE; // <-- ejemplo: calendario específico para el equipo cadete (opcional)
const CALENDAR_INFANTIL_GLOBAL = "44cee6ef5b3b93b88a74db1d788383a67f6dd1888c6b541105d2c675d043aef2@group.calendar.google.com";
const CALENDAR_INFANTIL_USER = CALENDAR_INFANTIL; // <-- ejemplo: calendario específico para el equipo infantil (opcional)
const CALENDAR_ALEVIN_GLOBAL = "be3bc9776f06f55533cf40fa8530f3cbce734fc5f89b0ec0029de467366c1e3a@group.calendar.google.com";
const CALENDAR_ALEVIN_USER = CALENDAR_ALEVIN; // <-- ejemplo: calendario específico para el equipo alevín (opcional)
const CALENDAR_BENJAMIN_GLOBAL = "cd97882149b4677b9d80dfda6e0b5bcde0d61f407c86fc8534cfedb1c4f81e90@group.calendar.google.com";
const CALENDAR_BENJAMIN_USER = CALENDAR_BENJAMIN; // <-- ejemplo: calendario específico para el equipo benjamín (opcional)

// Ahora usamos las constantes anteriores en la configuración `CATEGORIES` y `CALENDARS_BY_CATEGORY`.

// Constantes por categoría (útiles como referencias desde otros scripts)
const CAT_TERCERA_FEDERACION = "TERCERA_FEDERACION";
const CAT_REGIONAL_PREFERENTE = "REGIONAL_PREFERENTE";
const CAT_JUVENIL_PREFERENTE = "JUVENIL_PREFERENTE";
const CAT_CADETE = "CADETE";
const CAT_INFANTIL = "INFANTIL";
const CAT_ALEVIN = "ALEVIN";
const CAT_BENJAMIN = "BENJAMIN";

/*
 * Calendarios por categoría.
 * Rellena `calendarGlobalId` y `calendarUserId` por categoría si quieres calendarios separados.
 * Si se deja vacío, se usará `CALENDAR_ID_GLOBAL`/`CALENDAR_ID_USER` por defecto.
 */
const CALENDARS_BY_CATEGORY = {
  [CAT_TERCERA_FEDERACION]: { calendarGlobalId: CALENDAR_TERCERA_GLOBAL, calendarUserId: CALENDAR_TERCERA_USER },
  [CAT_REGIONAL_PREFERENTE]: { calendarGlobalId: CALENDAR_REGIONAL_GLOBAL,calendarUserId: CALENDAR_REGIONAL_USER },
  [CAT_JUVENIL_PREFERENTE]: { calendarGlobalId: CALENDAR_JUVENIL_GLOBAL, calendarUserId: CALENDAR_JUVENIL_USER },
  [CAT_CADETE]: { calendarGlobalId: CALENDAR_CADETE_GLOBAL, calendarUserId: CALENDAR_CADETE_USER },
  [CAT_INFANTIL]: { calendarGlobalId: CALENDAR_INFANTIL_GLOBAL, calendarUserId: CALENDAR_INFANTIL_USER },
  [CAT_ALEVIN]: { calendarGlobalId: CALENDAR_ALEVIN_GLOBAL, calendarUserId: CALENDAR_ALEVIN_USER },
  [CAT_BENJAMIN]: { calendarGlobalId: CALENDAR_BENJAMIN_GLOBAL, calendarUserId: CALENDAR_BENJAMIN_USER }
};

// Colores para el calendario del club: asigna un `colorId` de Google Calendar por categoría
// Puedes ajustar los valores ('1'..'11') según tus preferencias de color en Google Calendar.
const CLUB_COLOR_BY_CATEGORY = {
  [CAT_TERCERA_FEDERACION]: "9",
  [CAT_REGIONAL_PREFERENTE]: "11",
  [CAT_JUVENIL_PREFERENTE]: "5",
  [CAT_CADETE]: "6",
  [CAT_INFANTIL]: "7",
  [CAT_ALEVIN]: "2",
  [CAT_BENJAMIN]: "3"
};

// Duraciones por categoría (minutos). Si una categoría no está, se usa DEFAULT_DURATION_MIN
const DURATION_BY_CATEGORY_MIN = {
  [CAT_TERCERA_FEDERACION]: 105,
  [CAT_REGIONAL_PREFERENTE]: 90,
  [CAT_JUVENIL_PREFERENTE]: 90,
  [CAT_CADETE]: 80,
  [CAT_INFANTIL]: 70,
  [CAT_ALEVIN]: 60,
  [CAT_BENJAMIN]: 60
};

function getCategoryDurationMinutes(categoryKey) {
  if (!categoryKey) return DEFAULT_DURATION_MIN;
  return DURATION_BY_CATEGORY_MIN[categoryKey] || DEFAULT_DURATION_MIN;
}

/**
 * Construye parámetros de evento a partir de un objeto `m` (match)
 * Devuelve: { startLocal, endLocal, location, mapsUrl, description }
 */
function buildEventParamsFromMatch_(m) {
  const duration = getCategoryDurationMinutes(m.categoryKey);
  const startDate = m.startDate instanceof Date ? m.startDate : new Date(m.startDate);
  const endDate = new Date(startDate.getTime() + duration * 60000);

  const startLocal = formatLocalDateTime_(startDate);
  const endLocal = formatLocalDateTime_(endDate);

  const datePretty = Utilities.formatDate(startDate, TZ, "dd-MM-yyyy");
  const startPretty = Utilities.formatDate(startDate, TZ, "HH:mm");
  const endPretty = Utilities.formatDate(endDate, TZ, "HH:mm");

  const place = m.location || "";
  const mapsUrl = place ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}` : "";

  const lines = [];
  lines.push(`Fecha: ${datePretty}`);
  lines.push(`Hora inicio: ${startPretty}`);
  lines.push(`Hora fin: ${endPretty}`);
  lines.push(`Local: ${m.home || ''}`);
  lines.push(`Visitante: ${m.away || ''}`);
  if (place) lines.push(`Lugar: ${place}` + (mapsUrl ? ` (${mapsUrl})` : ""));
  if (m.sourceText || m.competitionKey) {
    const src = m.sourceText ? m.sourceText : (m.competitionKey || "");
    lines.push(`Fuente: ${src}`);
  }
  lines.push(`Jornada: ${m.jornada || ''}`);
  lines.push(`ID evento: ${m.eventId || ''}`);
  lines.push(`StableKey: ${m.stableKey || ''}`);

  const description = lines.join('\n');

  return {
    startDateObj: startDate,
    endDateObj: endDate,
    startLocal,
    endLocal,
    location: place,
    mapsUrl,
    description
  };
}

/**
 * Lista oficial (por si quieres usar índices 1..18).
 * OJO: esto lo dejaría como referencia. En tu flujo personal usas DEFAULT_TEAM_NAME.
 */
const TERCERA_FEDERACION_TEAM_NAMES = [
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
  // Validar calendario del club (agregador de todos los equipos Calamocha)
  if (typeof CALENDAR_CLUB_CALAMOCHA !== 'undefined' && CALENDAR_CLUB_CALAMOCHA) {
    try {
      validateCalendarAccess_(CALENDAR_CLUB_CALAMOCHA, "CLUB_CALAMOCHA");
    } catch (e) {
      console.log(`Aviso: no se pudo validar CLUB_CALAMOCHA: ${e}`);
    }
  }

  // 1.b) Validar calendarios específicos por categoría (si están configurados)
  for (const [catKey, cal] of Object.entries(CALENDARS_BY_CATEGORY || {})) {
    if (cal && cal.calendarGlobalId) {
      try {
        validateCalendarAccess_(cal.calendarGlobalId, `GLOBAL(${catKey})`);
      } catch (e) {
        console.log(`Aviso: no se pudo validar GLOBAL(${catKey}): ${e}`);
      }
    }
    if (cal && cal.calendarUserId) {
      try {
        validateCalendarAccess_(cal.calendarUserId, `USER(${catKey})`);
      } catch (e) {
        console.log(`Aviso: no se pudo validar USER(${catKey}): ${e}`);
      }
    }
  }

  // 2) Validar que el equipo existe en los listados conocidos (opcional pero recomendable)
  validateTeamName_(DEFAULT_TEAM_NAME);

  // 3) Guardar configuración en Script Properties (útil si luego lo haces configurable por UI)
  const props = PropertiesService.getScriptProperties();
  props.setProperty("TEAM_NAME", DEFAULT_TEAM_NAME);
  props.setProperty("CALENDAR_ID_GLOBAL", CALENDAR_ID_GLOBAL);
  props.setProperty("CALENDAR_ID_USER", CALENDAR_ID_USER);

  // 3.b) Guardar calendarios por categoría en propiedades (si están presentes)
  for (const [catKey, cal] of Object.entries(CALENDARS_BY_CATEGORY || {})) {
    if (cal && cal.calendarGlobalId) props.setProperty(`CALENDAR_${catKey}_GLOBAL`, cal.calendarGlobalId);
    if (cal && cal.calendarUserId) props.setProperty(`CALENDAR_${catKey}_USER`, cal.calendarUserId);
  }
  // Guardar calendar del club si existe
  if (typeof CALENDAR_CLUB_CALAMOCHA !== 'undefined' && CALENDAR_CLUB_CALAMOCHA) props.setProperty('CALENDAR_CLUB_CALAMOCHA', CALENDAR_CLUB_CALAMOCHA);

  // 3.c) Guardar competition keys por categoría si existen
  const compMap = {
    TERCERA_FEDERACION: typeof COMP_TERCERA_FEDERACION_KEY !== 'undefined' ? COMP_TERCERA_FEDERACION_KEY : null,
    REGIONAL_PREFERENTE: typeof COMP_REGIONAL_PREFERENTE_KEY !== 'undefined' ? COMP_REGIONAL_PREFERENTE_KEY : null,
    JUVENIL_PREFERENTE: typeof COMP_JUVENIL_PREFERENTE_KEY !== 'undefined' ? COMP_JUVENIL_PREFERENTE_KEY : null,
    CADETE: typeof COMP_CADETE_KEY !== 'undefined' ? COMP_CADETE_KEY : null,
    INFANTIL: typeof COMP_INFANTIL_KEY !== 'undefined' ? COMP_INFANTIL_KEY : null,
    ALEVIN: typeof COMP_ALEVIN_KEY !== 'undefined' ? COMP_ALEVIN_KEY : null,
    BENJAMIN: typeof COMP_BENJAMIN_KEY !== 'undefined' ? COMP_BENJAMIN_KEY : null
  };
  for (const [cat, key] of Object.entries(compMap)) {
    if (key) props.setProperty(`COMP_${cat}_KEY`, key);
  }

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
  const allMatches = [];

  for (const cat of CATEGORIES) {
    if (!cat.sourceUrl) {
      console.log(`Omitiendo categoría ${cat.key} sin sourceUrl configurada.`);
      continue;
    }
    const matches = fetchAndParseMatches_(cat.sourceUrl, cat.competitionKey);
    for (const m of matches) {
      m.categoryKey = cat.key;
      m.categoryDisplay = cat.displayName || cat.key;
      m.categoryTeamName = cat.teamName || null;
    }

    // Determina el calendario global para esta categoría (si existe uno específico)
    const calForCat = (CALENDARS_BY_CATEGORY[cat.key] && CALENDARS_BY_CATEGORY[cat.key].calendarGlobalId) || cfg.calendarGlobalId;
    syncMatchesToCalendar_(calForCat, matches, `GLOBAL(${cat.key})`);
  }
}

// Sincroniza calendario personal del usuario (solo su equipo)
function syncUserCalendar() {
  const cfg = loadConfig_();
  const team = cfg.teamName;
  const matchesAll = [];

  for (const cat of CATEGORIES) {
    if (!cat.sourceUrl) continue;
    const matches = fetchAndParseMatches_(cat.sourceUrl, cat.competitionKey);
    for (const m of matches) {
      m.categoryKey = cat.key;
      m.categoryDisplay = cat.displayName || cat.key;
      m.categoryTeamName = cat.teamName || null;
      matchesAll.push(m);
    }
  }

  // Agrupa todos los partidos del club (todos los equipos Calamocha) para sincronizar al calendario del club
  const matchesClub = matchesAll.filter(m => isClubTeam(m.home) || isClubTeam(m.away) || (m.categoryTeamName && isClubTeam(m.categoryTeamName)));

  // Agrupa por categoría y sincroniza al calendario de usuario por categoría (si existe),
  // o al `CALENDAR_ID_USER` por defecto.
  const matchesByCategory = {};
  for (const m of matchesAll) {
    if (m.home === team || m.away === team || (m.categoryTeamName && (m.home === m.categoryTeamName || m.away === m.categoryTeamName))) {
      matchesByCategory[m.categoryKey] = matchesByCategory[m.categoryKey] || [];
      matchesByCategory[m.categoryKey].push(m);
    }
  }

  for (const catKey of Object.keys(matchesByCategory)) {
    const catCalUser = (CALENDARS_BY_CATEGORY[catKey] && CALENDARS_BY_CATEGORY[catKey].calendarUserId) || cfg.calendarUserId;
    syncMatchesToCalendar_(catCalUser, matchesByCategory[catKey], `USER(${cfg.teamName}|${catKey})`);
  }

  // Sincroniza también al calendario del club (agregador) si hay partidos del club
  if (matchesClub && matchesClub.length) {
    try {
      const clubCal = CALENDAR_CLUB_CALAMOCHA || cfg.calendarClubId || CALENDAR_CLUB_CALAMOCHA;
      syncMatchesToCalendar_(clubCal, matchesClub, `CLUB(CALAMOCHA)`);
    } catch (e) {
      console.log(`Aviso: no se pudo sincronizar al calendario del club: ${e}`);
    }
  }
}

function isClubTeam(name) {
  return !!(name && String(name).toUpperCase().includes("CALAMOCHA"));
}

/**
 * =========================
 * CORE: Fetch + Parse
 * =========================
 */
function fetchAndParseMatches_(sourceUrl, competitionKey) {
  sourceUrl = sourceUrl || SOURCE_XLS_URL;
  competitionKey = competitionKey || COMPETITION_KEY;

  const resp = UrlFetchApp.fetch(sourceUrl, {
    followRedirects: true,
    muteHttpExceptions: true,
    headers: {
      "Host": "www.futbolaragon.com",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Connection": "keep-alive",
      "Cookie": "JSESSIONID=779D4DA06CF0BBBB06F37FC0520CA389",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Priority": "u=0, i"
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

    const stableKey = buildStableMatchKey_(competitionKey, currentJornada, home, away);
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
      competitionKey: competitionKey,
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
    const resource = buildEventResource_(m, calendarId);

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

// Añadir colorId al recurso si el destino es el calendario del club
function buildEventResource_(m, targetCalendarId) {
  // reutilizamos la función previa para construir la base
  // Construir parámetros de evento (start,end,location,description) a partir del match
  const params = buildEventParamsFromMatch_(m);
  const base = {
    id: m.eventId,
    summary: `⚽ ${m.home} vs ${m.away}${m.categoryDisplay ? ' — ' + m.categoryDisplay : ''}`,
    location: params.location || "",
    description: params.description,
    start: { dateTime: params.startLocal, timeZone: TZ },
    end: { dateTime: params.endLocal, timeZone: TZ },
    extendedProperties: {
      private: {
        stableKey: m.stableKey,
        competitionKey: m.competitionKey || COMPETITION_KEY,
        categoryKey: m.categoryKey || null,
        categoryDisplay: m.categoryDisplay || null,
        jornada: String(m.jornada),
        home: m.home,
        away: m.away
      }
    }
  };

  // Si sincronizamos al calendario club, aplica color por categoría si está definido
  try {
    const clubId = (typeof CALENDAR_CLUB_CALAMOCHA !== 'undefined' && CALENDAR_CLUB_CALAMOCHA) ? CALENDAR_CLUB_CALAMOCHA : null;
    if (clubId && targetCalendarId === clubId) {
      const color = CLUB_COLOR_BY_CATEGORY[m.categoryKey];
      if (color) base.colorId = String(color);
    }
  } catch (e) {
    // si algo falla, no bloqueamos la creación del recurso
    console.log(`Aviso: fallo al asignar color de evento: ${e}`);
  }

  return base;
}

/**
 * =========================
 * IDs estables
 * =========================
 */
function buildStableMatchKey_(competitionKey, jornada, home, away) {
  // NO incluye fecha/hora/campo, para que cambios no cambien el ID.
  const comp = competitionKey || COMPETITION_KEY;
  return `${comp}|J${jornada}|${home}|${away}`.toUpperCase();
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
  // Soporte para listas con nombre distinto: intenta `TERCERA_FEDERACION_TEAM_NAMES` y `TEAM_NAMES`
  const candidateLists = [];
  if (typeof TERCERA_FEDERACION_TEAM_NAMES !== 'undefined') candidateLists.push(TERCERA_FEDERACION_TEAM_NAMES);
  if (typeof TEAM_NAMES !== 'undefined') candidateLists.push(TEAM_NAMES);

  const found = candidateLists.some(list => Array.isArray(list) && list.includes(teamName));
  if (!found) {
    throw new Error(
      `TEAM_NAME="${teamName}" no está en los listados conocidos. ` +
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

/**
 * Dry-run helper para Apps Script: descarga partidos de las categorías configuradas
 * y registra en `Logger` los parámetros y el recurso que se crearía (sin insertar).
 * Ejecuta esto desde el editor de Apps Script para revisar descripciones, horarios y colorId.
 */
function dryRunPrintEventDescriptions() {
  for (const cat of CATEGORIES) {
    if (!cat.sourceUrl) continue;
    Logger.log('--- Categoría: %s (%s)', cat.key, cat.displayName || '');
    try {
      const matches = fetchAndParseMatches_(cat.sourceUrl, cat.competitionKey);
      Logger.log('Matches obtenidos: %s', matches.length);
      for (let i = 0; i < Math.min(matches.length, 10); i++) {
        const m = matches[i];
        m.categoryKey = cat.key;
        m.categoryDisplay = cat.displayName || cat.key;
        m.categoryTeamName = cat.teamName || null;

        const params = buildEventParamsFromMatch_(m);
        const resourceClub = buildEventResource_(m, CALENDAR_CLUB_CALAMOCHA);

        Logger.log('--- Partido %s: %s vs %s', i + 1, m.home, m.away);
        Logger.log('StartLocal=%s endLocal=%s', params.startLocal, params.endLocal);
        Logger.log('Location=%s', params.location || '(sin ubicación)');
        Logger.log('Maps=%s', params.mapsUrl || '(sin maps)');
        Logger.log('ColorId (club)=%s', resourceClub.colorId || '(ninguno)');
        Logger.log('Descripción:\n%s', params.description);
      }
    } catch (e) {
      Logger.log('Error al procesar categoría %s: %s', cat.key, e);
    }
  }
  Logger.log('Dry-run finalizado. Revisa View -> Logs en el editor de Apps Script.');
}

/**
 * Debug: descarga la URL o toma una categoría y registra un snippet del HTML
 * y cuántas filas encuentra el parser `extractTableRows_`.
 * Uso:
 *   debugFetchHtmlSample('TERCERA_FEDERACION', 8000);
 *   debugFetchHtmlSample(SOURCE_TERCERA_FEDERACION_URL, 8000);
 *   // Si el sitio exige consentimiento/cookies, puedes pasar la cabecera Cookie:
 *   // debugFetchHtmlSample(SOURCE_TERCERA_FEDERACION_URL, 8000, 'cookie_name=valor; otro=valor');
 */
function debugFetchHtmlSample(categoryOrUrl, maxChars, cookieHeader) {
  maxChars = Number(maxChars) || 4000;
  let url = categoryOrUrl;
  if (!url) {
    Logger.log('debugFetchHtmlSample: falta parámetro categoryOrUrl');
    return;
  }

  // Si pasaron la key de categoría, resolver la URL
  if (typeof url === 'string' && /^[A-Z0-9_]+$/.test(url)) {
    const cat = (CATEGORIES || []).find(c => c.key === url);
    if (cat && cat.sourceUrl) url = cat.sourceUrl;
  }

  try {
    const baseHeaders = { 'User-Agent': 'Mozilla/5.0 (compatible; GoogleAppsScript)', 'Accept-Language': 'es-ES,es;q=0.9' };
    if (cookieHeader) baseHeaders['Cookie'] = cookieHeader;
    const resp = UrlFetchApp.fetch(url, { followRedirects: true, muteHttpExceptions: true, headers: baseHeaders });
    const code = resp.getResponseCode();
    const headersObj = resp.getHeaders ? resp.getHeaders() : {};
    const contentType = headersObj['Content-Type'] || headersObj['content-type'] || '';
    Logger.log('debugFetchHtmlSample: HTTP %s - url=%s - Content-Type=%s', code, url, contentType);
    Logger.log('debugFetchHtmlSample: Response headers: %s', JSON.stringify(headersObj));

    // Intentar obtener texto directamente. Si no hay tablas, intentar leer blob como ISO-8859-1 (caso .xls)
    let content = '';
    try {
      content = resp.getContentText('ISO-8859-1');
    } catch (e) {
      // getContentText puede fallar si es binario
      Logger.log('debugFetchHtmlSample: getContentText fallo: %s', e);
      try {
        content = resp.getBlob().getDataAsString('ISO-8859-1');
        Logger.log('debugFetchHtmlSample: obtenido blob->string (ISO-8859-1) len=%s', content.length);
      } catch (e2) {
        Logger.log('debugFetchHtmlSample: fallo al obtener blob as string: %s', e2);
      }
    }

    Logger.log('--- START HTML/BLOB SNIPPET ---');
    Logger.log((content || '').substring(0, maxChars));
    Logger.log('---  END HTML/BLOB SNIPPET  ---');
    Logger.log('debugFetchHtmlSample: contenido longitud=%s', (content || '').length);

    // Ejecutar el parser actual y mostrar conteos; si no encuentra filas, intentar fallback
    try {
      let rows = extractTableRows_(content || '');
      Logger.log('extractTableRows_: filas encontradas=%s', rows.length);
      if (rows && rows.length) Logger.log('Primera fila: %s', JSON.stringify(rows[0]));

      // Si no encuentra filas, intentar extraer del blob crudo buscando '<tr'
      if ((!rows || rows.length === 0) && resp.getBlob) {
        try {
          const raw = resp.getBlob().getDataAsString('ISO-8859-1');
          const foundTr = (raw || '').indexOf('<tr') !== -1;
          Logger.log('Fallback: raw contains <tr> ? %s', foundTr);
          if (foundTr) {
            rows = extractTableRows_(raw);
            Logger.log('Fallback extractTableRows_: filas encontradas=%s', rows.length);
            if (rows && rows.length) Logger.log('Primera fila (fallback): %s', JSON.stringify(rows[0]));
          }
        } catch (e3) {
          Logger.log('Fallback blob parse fallo: %s', e3);
        }
      }

      // Heurística rápida para contar jornadas y partidos
      const jornadaRe = /^Jornada\s*(\d+)/i;
      let currentJ = null;
      let matches = 0;
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const c0 = (r[0] || '').trim();
        const jm = c0.match(jornadaRe);
        if (jm) { currentJ = Number(jm[1]); continue; }
        if (!currentJ) continue;
        if (r.length >= 5) {
          const home = (r[0] || '').trim();
          const sep = (r[1] || '').trim();
          const away = (r[2] || '').trim();
          const campo = (r[3] || '').trim();
          const fh = (r[4] || '').trim();
          if (home && sep === '-' && away && fh) matches++;
        }
      }
      Logger.log('Matches heurísticos detectados: %s', matches);
    } catch (e) {
      Logger.log('debugFetchHtmlSample: fallo al parsear filas: %s', e);
    }
  } catch (e) {
    Logger.log('debugFetchHtmlSample: error al descargar URL: %s', e);
  }
}

/**
 * Debug: parsea un string HTML ya disponible (útil si pegas el HTML en el editor)
 * y muestra filas + partidos extraídos por la heurística.
 * Uso: pega el contenido en la variable y llama `debugParseHtmlString(htmlText)`.
 */
function debugParseHtmlString(htmlText) {
  if (!htmlText) { Logger.log('debugParseHtmlString: falta htmlText'); return; }
  try {
    const rows = extractTableRows_(htmlText);
    Logger.log('debugParseHtmlString: filas encontradas=%s', rows.length);
    if (rows && rows.length) Logger.log('Primera fila: %s', JSON.stringify(rows[0]));

    const jornadaRe = /^Jornada\s*(\d+)/i;
    let currentJ = null;
    const matchesList = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const c0 = (r[0] || '').trim();
      const jm = c0.match(jornadaRe);
      if (jm) { currentJ = Number(jm[1]); continue; }
      if (!currentJ) continue;
      if (r.length >= 5) {
        const home = (r[0] || '').trim();
        const sep = (r[1] || '').trim();
        const away = (r[2] || '').trim();
        const campo = (r[3] || '').trim();
        const fh = (r[4] || '').trim();
        if (home && sep === '-' && away && fh) {
          matchesList.push({ jornada: currentJ, home, away, campo, fh });
        }
      }
    }
    Logger.log('debugParseHtmlString: matches extraídos=%s', matchesList.length);
    if (matchesList.length) Logger.log('Primer match: %s', JSON.stringify(matchesList[0]));
  } catch (e) {
    Logger.log('debugParseHtmlString: error: %s', e);
  }
}

function runDebugFetch_URL() {
  debugFetchHtmlSample(SOURCE_TERCERA_FEDERACION_URL, 20000);
}