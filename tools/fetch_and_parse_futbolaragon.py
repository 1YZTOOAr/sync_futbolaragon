#!/usr/bin/env python3
"""
fetch_and_parse_futbolaragon.py

Descarga las "export excel" (que son HTML dentro de .xls) de FutbolAragon
usando las fuentes definidas en `tercera_federacion.js`, las parsea y produce
un JSON con partidos por categoría.

Uso:
  python tools/fetch_and_parse_futbolaragon.py --js-file ../tercera_federacion.js --output out.json

Opciones relevantes:
  --js-file  : ruta al fichero JS que contiene `CATEGORIES` (por defecto busca `tercera_federacion.js` en repo)
  --output   : fichero JSON de salida (por defecto stdout)
  --cookie   : cabecera Cookie a usar en las peticiones (útil si el site exige consentimiento)
  --timeout  : timeout en segundos para requests (por defecto 15)

Requiere: requests, beautifulsoup4

El JSON generado tiene la forma:
{
  "TERCERA_FEDERACION": {
    "sourceUrl": "...",
    "competitionKey": "...",
    "teamName": "...",
    "matches": [ { jornada, home, away, location, start_iso, sourceText, stableKey, eventId }, ... ]
  }, ...
}

"""
import re
import sys
import json
import argparse
import hashlib
import logging
import requests
from bs4 import BeautifulSoup
from datetime import datetime

# Alphabet usado en Apps Script (a..v + 0..9)
B32_ALPHABET = "abcdefghijklmnopqrstuv0123456789"


def find_categories_from_js(js_text):
    # Extrae bloques de CATEGORIES entre "const CATEGORIES = [" y "];"
    m = re.search(r"const\s+CATEGORIES\s*=\s*\[(.*?)\];", js_text, re.S)
    if not m:
        raise RuntimeError('No se encontró la definición CATEGORIES en el JS')
    block = m.group(1)

    # Regex para cada objeto de categoría (bastante tolerante)
    obj_re = re.compile(r"\{(.*?)\}\s*,?", re.S)
    items = []
    for om in obj_re.finditer(block):
        obj_text = om.group(1)
        key_m = re.search(r"key\s*:\s*['\"]([^'\"]+)['\"]", obj_text)
        src_m = re.search(r"sourceUrl\s*:\s*([A-Z0-9_]+)", obj_text)
        comp_m = re.search(r"competitionKey\s*:\s*([A-Z0-9_]+)", obj_text)
        team_m = re.search(r"teamName\s*:\s*['\"]([^'\"]+)['\"]", obj_text)
        if not key_m:
            continue
        items.append({
            'key': key_m.group(1),
            'sourceConst': src_m.group(1) if src_m else None,
            'compConst': comp_m.group(1) if comp_m else None,
            'teamName': team_m.group(1) if team_m else None
        })
    return items


def find_constant_map(js_text, const_prefix):
    # Encuentra constantes del tipo: const NAME = "...";
    pattern = re.compile(r"const\s+([A-Z0-9_]+)\s*=\s*['\"](.*?)['\"];")
    mapping = {}
    for m in pattern.finditer(js_text):
        name = m.group(1)
        val = m.group(2)
        if name.startswith(const_prefix):
            mapping[name] = val
    return mapping


def download_url(url, timeout=15, cookie_header=None):
    headers = {
        'User-Agent': 'Mozilla/5.0 (compatible; fetch_and_parse_futbolaragon/1.0)',
        'Accept-Language': 'es-ES,es;q=0.9'
    }
    if cookie_header:
        headers['Cookie'] = cookie_header
    logging.debug('GET %s headers=%s timeout=%s', url, headers, timeout)
    resp = requests.get(url, headers=headers, timeout=timeout)
    logging.debug('Response status=%s', resp.status_code)
    # Intenta establecer la codificación a la detectada, con fallback a iso-8859-1
    resp.encoding = resp.apparent_encoding or 'iso-8859-1'
    logging.debug('Response apparent_encoding=%s final_encoding=%s', resp.apparent_encoding, resp.encoding)
    return resp.text, resp.headers


def extract_rows_from_html(html):
    # Usa BeautifulSoup para extraer <tr> y sus celdas
    soup = BeautifulSoup(html, 'html.parser')
    rows = []
    for tr in soup.find_all('tr'):
        cells = []
        for cell in tr.find_all(['td', 'th']):
            text = cell.get_text(separator=' ', strip=True)
            # normalizar NBSP
            text = text.replace('\xa0', ' ')
            cells.append(text)
        if any(cells):
            rows.append(cells)
    logging.debug('extract_rows_from_html: filas extraidas=%d', len(rows))
    return rows


def parse_matches_from_rows(rows, competitionKey=None):
    jornada_re = re.compile(r'^Jornada\s*(\d+)', re.I)
    matches = []
    current_j = None
    for r in rows:
        if not r:
            continue
        c0 = r[0].strip()
        jm = jornada_re.search(c0)
        if jm:
            current_j = int(jm.group(1))
            continue
        if current_j is None:
            continue
        # heurística: filas con al menos 5 columnas: [home, '-', away, campo, 'dd-mm-aaaa - hh:mm']
        if len(r) >= 5:
            home, sep, away = r[0].strip(), r[1].strip(), r[2].strip()
            campo = r[3].strip() if len(r) > 3 else ''
            fh = r[4].strip() if len(r) > 4 else ''
            if home and sep == '-' and away and fh:
                dt = parse_fecha_hora_local(fh)
                start_iso = dt.isoformat() if dt else None
                stable = build_stable_match_key(competitionKey or '', current_j, home, away)
                event_id = build_deterministic_event_id(stable)
                matches.append({
                    'jornada': current_j,
                    'home': home,
                    'away': away,
                    'location': campo or None,
                    'start_iso': start_iso,
                    'sourceText': fh,
                    'stableKey': stable,
                    'eventId': event_id
                })
    logging.info('parse_matches_from_rows: partidos detectados=%d (competitionKey=%s)', len(matches), competitionKey)
    return matches


def parse_fecha_hora_local(fh):
    # formato dd-mm-aaaa - hh:mm
    m = re.search(r"(\d{2})-(\d{2})-(\d{4})\s*-\s*(\d{2}):(\d{2})", fh)
    if not m:
        return None
    dd, mm, yyyy, hh, mi = map(int, m.groups())
    try:
        return datetime(yyyy, mm, dd, hh, mi, 0)
    except Exception:
        return None


def build_stable_match_key(competitionKey, jornada, home, away):
    comp = competitionKey or ''
    return f"{comp}|J{jornada}|{home}|{away}".upper()


def build_deterministic_event_id(stableKey):
    h = hashlib.sha1(stableKey.encode('utf-8')).digest()
    return 'm' + base32_google(h)[:25]


def base32_google(b):
    # Convierte bytes a base32 usando el alfabeto custom (a..v0..9)
    bits = 0
    value = 0
    out = []
    for byte in b:
        value = (value << 8) | (byte & 0xff)
        bits += 8
        while bits >= 5:
            index = (value >> (bits - 5)) & 31
            out.append(B32_ALPHABET[index])
            bits -= 5
    if bits > 0:
        out.append(B32_ALPHABET[(value << (5 - bits)) & 31])
    return ''.join(out)


def main():
    p = argparse.ArgumentParser(description='Descarga y parsea export XLS (HTML) de FutbolAragon a JSON')
    p.add_argument('--js-file', default='tercera_federacion.js', help='Ruta al JS con CATEGORIES')
    p.add_argument('--output', default='-', help='Fichero JSON de salida ("-" stdout)')
    p.add_argument('--verbose', action='store_true', help='Activa logging DEBUG a stderr')
    p.add_argument('--log-file', default=None, help='Fichero para volcar logs (opcional)')
    p.add_argument('--cookie', default=None, help='Cabecera Cookie a usar en las peticiones')
    p.add_argument('--timeout', type=int, default=15, help='Timeout en segundos para requests')
    args = p.parse_args()

    # Configura logging
    log_level = logging.DEBUG if args.verbose else logging.INFO
    handlers = [logging.StreamHandler(sys.stderr)]
    if args.log_file:
        handlers.append(logging.FileHandler(args.log_file, encoding='utf-8'))
    logging.basicConfig(level=log_level, format='%(asctime)s %(levelname)s %(message)s', handlers=handlers)

    logging.info('Inicio: js_file=%s timeout=%s verbose=%s', args.js_file, args.timeout, args.verbose)

    js_path = args.js_file
    try:
        with open(js_path, 'r', encoding='utf-8') as f:
            js_text = f.read()
    except Exception as e:
        logging.exception('ERROR leyendo %s', js_path)
        sys.exit(2)

    cats = find_categories_from_js(js_text)
    source_map = find_constant_map(js_text, 'SOURCE_')
    comp_map = find_constant_map(js_text, 'COMP_')

    output = {}

    for c in cats:
        source_url = None
        comp_key = None
        if c['sourceConst'] and c['sourceConst'] in source_map:
            source_url = source_map[c['sourceConst']]
        if c['compConst'] and c['compConst'] in comp_map:
            comp_key = comp_map[c['compConst']]
        if not source_url:
            # intentar si la constante source contiene URL literal en JS (rare)
            logging.warning('categoria %s no tiene sourceUrl resuelta, se omite', c['key'])
            continue

        try:
            html, headers = download_url(source_url, timeout=args.timeout, cookie_header=args.cookie)
            logging.debug('Headers recibidos: %s', dict(headers))
        except Exception as e:
            logging.exception('ERROR descargando %s', source_url)
            continue

        rows = extract_rows_from_html(html)
        logging.info('categoria=%s rows_count=%d', c['key'], len(rows))
        matches = parse_matches_from_rows(rows, competitionKey=comp_key)

        output[c['key']] = {
            'sourceUrl': source_url,
            'competitionKey': comp_key,
            'teamName': c.get('teamName'),
            'matches': matches,
            'rows_count': len(rows)
        }

    json_text = json.dumps(output, indent=2, ensure_ascii=False)
    if args.output == '-' or not args.output:
        print(json_text)
    else:
        try:
            with open(args.output, 'w', encoding='utf-8') as fo:
                fo.write(json_text)
            logging.info('Wrote %s', args.output)
        except Exception:
            logging.exception('Fallo al escribir %s', args.output)


if __name__ == '__main__':
    main()
