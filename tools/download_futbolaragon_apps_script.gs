// Apps Script: descarga las exportaciones de FutbolAragon y las guarda en una carpeta de Drive
// Pegar este archivo en el editor de Apps Script (Google Workspace) y ejecutar `downloadAllCategoriesToFolder('FutbolAragon')`

const AS_CATEGORIES = [
  {
    key: 'tercera_federacion',
    name: 'Tercera_Federacion',
    url: 'https://www.futbolaragon.com/pnfg/NPcd/NFG_VisCalendario_Vis',
    params: {
      cod_primaria: '1000120',
      codgrupo: '22379581',
      codcompeticion: '22320180',
      codtemporada: '21',
      CDetalle: '1',
      excel: '1',
      NPcd_File: '1'
    }
  },
  {
    key: 'regional_preferente',
    name: 'Regional_Preferente',
    url: 'https://www.futbolaragon.com/pnfg/NPcd/NFG_VisCalendario_Vis',
    params: { cod_primaria: '1000120', codgrupo: '22320197', codcompeticion: '22320195', codtemporada: '21', CodJornada: '', CDetalle: '1', excel: '1', NPcd_File: '1' }
  },
  {
    key: 'juvenil_preferente',
    name: 'Juvenil_Preferente',
    url: 'https://www.futbolaragon.com/pnfg/NPcd/NFG_VisCalendario_Vis',
    params: { cod_primaria: '1000120', codgrupo: '22395204', codcompeticion: '22320181', codtemporada: '21', CodJornada: '', CDetalle: '1', excel: '1', NPcd_File: '1' }
  },
  {
    key: 'cadete',
    name: 'Cadete',
    url: 'https://www.futbolaragon.com/pnfg/NPcd/NFG_VisCalendario_Vis',
    params: { cod_primaria: '1000120', codtemporada: '21', codcompeticion: '22320183', codgrupo: '22448755', CDetalle: '1', excel: '1', NPcd_File: '1' }
  },
  {
    key: 'infantil',
    name: 'Infantil',
    url: 'https://www.futbolaragon.com/pnfg/NPcd/NFG_VisCalendario_Vis',
    params: { cod_primaria: '1000120', codgrupo: '22448759', codcompeticion: '22320184', codtemporada: '21', CodJornada: '', CDetalle: '1', excel: '1', NPcd_File: '1' }
  },
  {
    key: 'alevin',
    name: 'Alevin',
    url: 'https://www.futbolaragon.com/pnfg/NPcd/NFG_VisCalendario_Vis',
    params: { cod_primaria: '1000120', codgrupo: '23074348', codcompeticion: '23074335', codtemporada: '21', CodJornada: '', CDetalle: '1', excel: '1', NPcd_File: '1' }
  },
  {
    key: 'benjamin',
    name: 'Benjamin',
    url: 'https://www.futbolaragon.com/pnfg/NPcd/NFG_VisCalendario_Vis',
    params: { cod_primaria: '1000120', codgrupo: '23074332', codcompeticion: '23074329', codtemporada: '21', CodJornada: '', CDetalle: '1', excel: '1', NPcd_File: '1' }
  }
];

// Cabeceras por defecto (las del ejemplo)
const AS_DEFAULT_HEADERS = {
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
};

function buildQuery(params) {
  return Object.keys(params)
    .map(function(k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); })
    .join('&');
}

function getOrCreateFolder(folderName) {
  var it = DriveApp.getFoldersByName(folderName);
  if (it.hasNext()) return it.next();
  return DriveApp.createFolder(folderName);
}

function downloadCategoryToFolder(cat, folder, optCookie) {
  var url = cat.url + '?' + buildQuery(cat.params);
  var headers = Object.assign({}, AS_DEFAULT_HEADERS);
  if (optCookie) headers['Cookie'] = optCookie;

  var options = {
    method: 'get',
    headers: headers,
    muteHttpExceptions: true,
    followRedirects: true
  };

  var resp = UrlFetchApp.fetch(url, options);
  var code = resp.getResponseCode();
  if (code >= 200 && code < 300) {
    var blob = resp.getBlob();
    // For FutbolAragon the content is often HTML but named .xls; keep that extension
    var name = (cat.name || cat.key) + '.xls';
    blob.setName(name);
    folder.createFile(blob);
    Logger.log('Guardado: %s (%s bytes)', name, blob.getBytes().length);
    return { ok: true, name: name, size: blob.getBytes().length };
  } else {
    var text = resp.getContentText().slice(0, 1000);
    Logger.log('Error %s al descargar %s: %s', code, cat.key, text);
    return { ok: false, status: code, snippet: text };
  }
}

/**
 * Descarga todas las categorías y las guarda en la carpeta indicada (la crea si no existe).
 * folderName: nombre de la carpeta en Drive
 * optCookie: cadena de cookie si se necesita sesión/consentimiento (opcional)
 */
function downloadAllCategoriesToFolder(folderName, optCookie) {
  var folder = getOrCreateFolder(folderName || 'FutbolAragon');
  var results = [];
  AS_CATEGORIES.forEach(function(cat) {
    var r = downloadCategoryToFolder(cat, folder, optCookie);
    results.push({ key: cat.key, result: r });
  });
  return results;
}

// Helper de debug: ejecuta descarga en una categoría y escribe Logger
function downloadOneExample() {
  var folder = getOrCreateFolder('FutbolAragon');
  var cat = AS_CATEGORIES[0];
  var res = downloadCategoryToFolder(cat, folder);
  Logger.log(res);
}
