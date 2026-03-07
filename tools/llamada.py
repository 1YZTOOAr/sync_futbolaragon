import requests

url = "https://www.futbolaragon.com/pnfg/NPcd/NFG_VisCalendario_Vis"

querystring = {
    "cod_primaria": "1000120",
    "codgrupo": "22379581",
    "codcompeticion": "22320180",
    "codtemporada": "21",
    "CDetalle": "1",
    "excel": "1",
    "NPcd_File": "1"
}

headers = {
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

response = requests.get(url, headers=headers, params=querystring)

print(response.text)