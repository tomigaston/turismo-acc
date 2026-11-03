#!/usr/bin/env python3
"""Plan B de descarga: baja todas las entradas de config/sources.json (incluido el IPC) a una carpeta,
con el mismo cache_name que usa update_data.py, para luego correr
    python scripts/update_data.py --input-dir <carpeta>
desde una PC con acceso a las fuentes. Solo biblioteca estándar.

Uso: python scripts/descargar_fuentes.py --output <carpeta> [--intentos 3]
"""
from __future__ import annotations
import argparse, json, shutil, sys, time, urllib.error, urllib.request
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


def main(argv=None):
    parser = argparse.ArgumentParser(description='Descarga las fuentes de config/sources.json para update_data.py --input-dir.')
    parser.add_argument('--output', type=Path, required=True, help='Carpeta de destino')
    parser.add_argument('--intentos', type=int, default=3, help='Intentos por fuente (por defecto, 3)')
    args = parser.parse_args(argv)
    args.output.mkdir(parents=True, exist_ok=True)
    sources = json.loads(CONFIG.read_text(encoding='utf-8'))
    ok, failed = [], []
    for i, source in enumerate(sources, 1):
        success, detail = download(source, args.output, args.intentos)
        print(f"[{i}/{len(sources)}] {'OK   ' if success else 'FALLA'} {source['family']} · {source['name']} · {detail}", flush=True)
        (ok if success else failed).append((source, detail))
    print(f'\nResumen: {len(ok)} descargadas, {len(failed)} fallidas, en {args.output}')
    for source, detail in failed:
        print(f"  FALLIDA · {detail} · {source['name']} ({source['family']}, {source['id']}) · {source['url']}")
    if not failed:
        print(f'Siguiente paso: python scripts/update_data.py --input-dir {args.output}')
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main())
