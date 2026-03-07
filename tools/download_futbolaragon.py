import os
import argparse
from dataclasses import dataclass
from typing import List

try:
    import requests
except Exception:  # pragma: no cover - handled at runtime
    requests = None

try:
    from curl_cffi import requests as curl_requests
except Exception:  # pragma: no cover - handled at runtime
    curl_requests = None
    
    # Prefer curl_cffi's requests (faster/modern curl backend) when available
if curl_requests is not None:
    requests = curl_requests


@dataclass
class Category:
    key: str
    name: str
    url: str


DEFAULT_CATEGORIES: List[Category] = [
    Category("tercera_federacion", "Tercera_Federacion", "https://www.futbolaragon.com/pnfg/NPcd/NFG_VisCalendario_Vis?cod_primaria=1000120&codgrupo=22379581&codcompeticion=22320180&codtemporada=21&CDetalle=1&excel=1&NPcd_File=1"),
    Category("regional_preferente", "Regional_Preferente", "https://www.futbolaragon.com/pnfg/NPcd/NFG_VisCalendario_Vis?cod_primaria=1000120&codgrupo=22320197&codcompeticion=22320195&codtemporada=21&CodJornada=&CDetalle=1&excel=1&NPcd_File=1"),
    Category("juvenil_preferente", "Juvenil_Preferente", "https://www.futbolaragon.com/pnfg/NPcd/NFG_VisCalendario_Vis?cod_primaria=1000120&codgrupo=22395204&codcompeticion=22320181&codtemporada=21&CodJornada=&CDetalle=1&excel=1&NPcd_File=1"),
    Category("cadete", "Cadete", "https://www.futbolaragon.com/pnfg/NPcd/NFG_VisCalendario_Vis?cod_primaria=1000120&codtemporada=21&codcompeticion=22320183&codgrupo=22448755&CDetalle=1&excel=1&NPcd_File=1"),
    Category("infantil", "Infantil", "https://www.futbolaragon.com/pnfg/NPcd/NFG_VisCalendario_Vis?cod_primaria=1000120&codgrupo=22448759&codcompeticion=22320184&codtemporada=21&CodJornada=&CDetalle=1&excel=1&NPcd_File=1"),
    Category("alevin", "Alevin", "https://www.futbolaragon.com/pnfg/NPcd/NFG_VisCalendario_Vis?cod_primaria=1000120&codgrupo=23074348&codcompeticion=23074335&codtemporada=21&CodJornada=&CDetalle=1&excel=1&NPcd_File=1"),
    Category("benjamin", "Benjamin", "https://www.futbolaragon.com/pnfg/NPcd/NFG_VisCalendario_Vis?cod_primaria=1000120&codgrupo=23074332&codcompeticion=23074329&codtemporada=21&CodJornada=&CDetalle=1&excel=1&NPcd_File=1"),
]


# Default headers taken from your example call (helps mimic a browser)
DEFAULT_HEADERS = {
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

class FutbolAragonDownloader:
    def __init__(self, output_dir: str = "downloads"):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)

    def list_targets(self) -> List[str]:
        return [c.key for c in DEFAULT_CATEGORIES]

    def category_by_key(self, key: str) -> Category:
        for c in DEFAULT_CATEGORIES:
            if c.key == key:
                return c
        raise KeyError(f"Unknown category: {key}")

    def download_category(self, category: Category, fetch: bool = False) -> str:
        safe_name = category.name.replace(" ", "_")
        # Default extension for FutbolAragon excel export
        out_path = os.path.join(self.output_dir, f"{safe_name}.xls")

        if not fetch:
            return out_path

        if requests is None:
            raise RuntimeError("The 'requests' package is required to fetch files. Install with 'pip install requests'.")

        resp = requests.get(category.url, headers=DEFAULT_HEADERS, stream=True, timeout=30)
        resp.raise_for_status()

        with open(out_path, "wb") as fh:
            for chunk in resp.iter_content(chunk_size=8192):
                if chunk:
                    fh.write(chunk)

        return out_path

    def download_category_with_curl(self, category: Category, fetch: bool = False) -> str:
        """Download a category using curl_cffi.requests as the HTTP backend.

        Returns the path where the file is (or would be in dry-run).
        """
        safe_name = category.name.replace(" ", "_")
        out_path = os.path.join(self.output_dir, f"{safe_name}.xls")

        if not fetch:
            return out_path

        if curl_requests is None:
            raise RuntimeError("The 'curl_cffi' package is required to fetch files with curl_cffi. Install with 'pip install curl-cffi'")

        resp = curl_requests.get(category.url, headers=DEFAULT_HEADERS, stream=True, timeout=30)
        resp.raise_for_status()

        with open(out_path, "wb") as fh:
            for chunk in resp.iter_content(chunk_size=8192):
                if chunk:
                    fh.write(chunk)

        return out_path

    def download_all(self, fetch: bool = False) -> List[str]:
        results = []
        for cat in DEFAULT_CATEGORIES:
            path = self.download_category(cat, fetch=fetch)
            results.append(path)
        return results


def main():
    p = argparse.ArgumentParser(description="Descarga exportaciones Excel/HTML desde FutbolAragon por categoría")
    p.add_argument("--output", "-o", default="downloads", help="Carpeta de salida")
    p.add_argument("--category", "-c", help="Clave de categoría para descargar (ej. 'tercera_federacion')")
    p.add_argument("--fetch", action="store_true", help="Realizar la descarga. Si no se especifica, se hace dry-run")
    p.add_argument("--backend", choices=["auto", "requests", "curl"], default="auto", help="Backend HTTP a usar: 'curl' usa curl_cffi, 'requests' usa requests, 'auto' elige curl si está disponible")
    args = p.parse_args()

    dl = FutbolAragonDownloader(output_dir=args.output)

    # decide backend to use for actual fetches
    backend = args.backend
    if backend == "auto":
        backend = "curl" if curl_requests is not None else "requests"

    # If user requested a real fetch, validate backend availability early
    if args.fetch and backend == "curl" and curl_requests is None:
        print("El backend 'curl' no está disponible. Instala curl-cffi: pip install curl-cffi")
        raise SystemExit(2)
    if args.fetch and backend == "requests" and requests is None:
        print("El backend 'requests' no está disponible. Instala requests: pip install requests")
        raise SystemExit(2)

    if args.category:
        try:
            cat = dl.category_by_key(args.category)
        except KeyError as e:
            print(e)
            print("Claves válidas:", ", ".join(dl.list_targets()))
            return

        if backend == "curl":
            out = dl.download_category_with_curl(cat, fetch=args.fetch)
        else:
            out = dl.download_category(cat, fetch=args.fetch)
        if args.fetch:
            print(f"Descargado: {out}")
        else:
            print(f"Dry-run: se generaría -> {out}")
        return

    # default: list all and show where they would go / download if requested
    # download_all with selected backend
    results = []
    for cat in DEFAULT_CATEGORIES:
        if backend == "curl":
            results.append(dl.download_category_with_curl(cat, fetch=args.fetch))
        else:
            results.append(dl.download_category(cat, fetch=args.fetch))

    if args.fetch:
        print("Descargados:")
        for r in results:
            print(" -", r)
    else:
        print("Dry-run. Archivos que se generarían:")
        for r in results:
            print(" -", r)


if __name__ == "__main__":
    main()
