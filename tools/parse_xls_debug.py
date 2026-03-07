#!/usr/bin/env python3
import re
import sys
from pathlib import Path

p = Path(__file__).resolve().parent.parent / 'tercera_federacion.xls'
if not p.exists():
    print('ERROR: no se encuentra el archivo', p)
    sys.exit(1)

text = p.read_text(encoding='ISO-8859-1')
# normalize
h = re.sub(r"\r?\n", " ", text)
h = re.sub(r"\s+", " ", h)

row_re = re.compile(r'<tr[^>]*>(.*?)</tr>', re.I)
cell_re = re.compile(r'<t[dh][^>]*>(.*?)</t[dh]>', re.I)

def clean_cell(s):
    if not s:
        return ''
    s = s.replace('&nbsp;', ' ')
    s = s.replace('&amp;', '&')
    s = re.sub(r'<br\s*/?>', ' ', s, flags=re.I)
    s = re.sub(r'<[^>]*>', '', s)
    s = s.replace('\u00a0', ' ')
    return s.strip()

rows = []
for m in row_re.finditer(h):
    row_html = m.group(1)
    cells = [clean_cell(c) for c in cell_re.findall(row_html)]
    if any(c for c in cells):
        rows.append(cells)

print('Rows parsed:', len(rows))
for i, r in enumerate(rows[:30], start=1):
    print(f'Row {i}:', r)

# find Jornada header rows
jornada_re = re.compile(r'Jornada\s*(\d+)', re.I)
j_rows = [r for r in rows if any(jornada_re.search(c) for c in r)]
print('Jornada rows found:', len(j_rows))
if j_rows:
    print('Sample jornada row:', j_rows[0])

# Quick match extraction heuristic similar to fetchAndParseMatches_
matches = []
current_j = None
for r in rows:
    c0 = r[0] if len(r)>0 else ''
    jm = jornada_re.search(c0)
    if jm:
        current_j = jm.group(1)
        continue
    if not current_j:
        continue
    # expecting at least 5 columns: home, sep, away, campo, fecha/hora
    if len(r) < 5:
        continue
    home = r[0].strip()
    sep = r[1].strip()
    away = r[2].strip()
    campo = r[3].strip()
    fh = r[4].strip()
    if not (home and sep == '-' and away):
        continue
    matches.append((current_j, home, away, campo, fh))

print('Matches extracted (sample):', len(matches))
for m in matches[:10]:
    print(m)
