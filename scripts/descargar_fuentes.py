#!/usr/bin/env python3
"""Prepara la carpeta de fuentes para `python scripts/update_data.py --input-dir <carpeta>`, con el mismo
cache_name que usa update_data.py. Solo biblioteca estándar.

Dos modos:
- Descarga directa (sin --desde-navegador): baja todas las entradas de config/sources.json con 3 reintentos.
- --desde-navegador CARPETA: datos.yvera.gob.ar redirige a un portal con verificación humana (Cloudflare) y
  solo un navegador puede bajar los archivos. Se toman de CARPETA (p. ej. ~/Downloads) por el nombre que trae
  cada URL; el IPC (apis.datos.gob.ar) se intenta bajar directo y, si falla, se acepta ipc.csv en CARPETA.

Uso: python scripts/descargar_fuentes.py --output <carpeta> [--desde-navegador ~/Downloads] [--intentos 3]
"""
from __future__ import annotations
import argparse, json, re, shutil, sys, time, urllib.error, urllib.parse, urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from update_data import BROWSER_USER_AGENT, CONFIG  # noqa: E402


def download(source, directory, attempts=3, wait=2.0):
    """Descarga una fuente con reintentos. Devuelve (ok, detalle): detalle es el tamaño o el error con código HTTP."""
    path = directory / source['cache_name']
    tmp = path.with_suffix(path.suffix + '.part')
    error = ''
    for attempt in range(1, attempts + 1):
        try:
            req = urllib.request.Request(source['url'], headers={'User-Agent': BROWSER_USER_AGENT})
            with urllib.request.urlopen(req, timeout=120) as res, tmp.open('wb') as out:
                shutil.copyfileobj(res, out, 1024 * 1024)
            if tmp.stat().st_size < 20:
                raise ValueError('archivo vacío')
            tmp.replace(path)
            return True, f'{path.stat().st_size:,} bytes'.replace(',', '.')
        except urllib.error.HTTPError as exc:
            error = f'HTTP {exc.code}'
        except (urllib.error.URLError, OSError, ValueError) as exc:
            error = 'sin respuesta HTTP: ' + str(getattr(exc, 'reason', exc))
        tmp.unlink(missing_ok=True)
        if attempt < attempts:
            time.sleep(wait * attempt)
    return False, error


def browser_name(source):
    """Nombre con el que el navegador guarda la fuente: el último tramo de la ruta de la URL ('' si no tiene)."""
    return urllib.parse.unquote(Path(urllib.parse.urlparse(source['url']).path).name)


def find_in_folder(folder, name):
    """Archivo `name` en la carpeta, o sus variantes «nombre (1).csv», «nombre (2).csv»…: el más reciente."""
    stem, suffix = Path(name).stem, Path(name).suffix
    pattern = re.compile(re.escape(stem) + r'( \(\d+\))?' + re.escape(suffix) + '$')
    found = [f for f in folder.iterdir() if f.is_file() and pattern.fullmatch(f.name)]
    return max(found, key=lambda f: f.stat().st_mtime) if found else None


def from_browser(sources, folder, output, attempts=3, wait=2.0):
    """Copia a `output` cada fuente bajada con el navegador. Devuelve (copiadas, faltantes) como listas de (fuente, detalle)."""
    copied, missing = [], []
    for source in sources:
        name = browser_name(source)
        if source['family'] == 'ipc' or not name:
            ok, detail = download(source, output, attempts, wait)
            if ok:
                copied.append((source, 'descargado directo de ' + urllib.parse.urlparse(source['url']).netloc + ' · ' + detail))
                continue
            name = 'ipc.csv' if source['family'] == 'ipc' else name
            fallback = f'descarga directa fallida ({detail}); '
        else:
            fallback = ''
        found = find_in_folder(folder, name) if name else None
        if found:
            shutil.copy2(found, output / source['cache_name'])
            copied.append((source, fallback + 'copiado de ' + found.name))
        else:
            missing.append((source, fallback + 'falta ' + (name or '(la URL no tiene nombre de archivo)')))
    return copied, missing


def main(argv=None):
    parser = argparse.ArgumentParser(description='Prepara las fuentes de config/sources.json para update_data.py --input-dir.')
    parser.add_argument('--output', type=Path, required=True, help='Carpeta de destino')
    parser.add_argument('--desde-navegador', type=Path, metavar='CARPETA', help='Carpeta donde el navegador guardó los archivos (p. ej. ~/Downloads)')
    parser.add_argument('--intentos', type=int, default=3, help='Intentos de descarga directa por fuente (por defecto, 3)')
    args = parser.parse_args(argv)
    args.output.mkdir(parents=True, exist_ok=True)
    sources = json.loads(CONFIG.read_text(encoding='utf-8'))
    command = f'python scripts/update_data.py --input-dir {args.output}'
    if args.desde_navegador:
        folder = args.desde_navegador.expanduser()
        if not folder.is_dir():
            print(f'No existe la carpeta {folder}.')
            return 2
        copied, missing = from_browser(sources, folder, args.output, args.intentos)
        for source, detail in copied:
            print(f"OK    {source['family']} · {source['name']} · {detail}")
        print(f'\nResumen: {len(copied)} copiadas, {len(missing)} faltantes, en {args.output}')
        for source, detail in missing:
            print(f"  FALTANTE · {detail} · {source['name']} ({source['family']}) · bajar con el navegador: {source['url']}")
        if missing:
            print(f'\nBajar los faltantes con el navegador a {folder} y volver a correr este comando.')
        else:
            print(f'Siguiente paso: {command}')
        return 1 if missing else 0
    ok, failed = [], []
    for i, source in enumerate(sources, 1):
        success, detail = download(source, args.output, args.intentos)
        print(f"[{i}/{len(sources)}] {'OK   ' if success else 'FALLA'} {source['family']} · {source['name']} · {detail}", flush=True)
        (ok if success else failed).append((source, detail))
    print(f'\nResumen: {len(ok)} descargadas, {len(failed)} fallidas, en {args.output}')
    for source, detail in failed:
        print(f"  FALLIDA · {detail} · {source['name']} ({source['family']}, {source['id']}) · {source['url']}")
    if failed:
        print('Si el portal pide verificación humana, usar --desde-navegador (ver README).')
    else:
        print(f'Siguiente paso: {command}')
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main())
