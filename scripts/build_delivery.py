#!/usr/bin/env python3
"""Compone una vista HTML descargable con los datos reales ya validados."""
from pathlib import Path
import argparse,json
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path,required=True);args=parser.parse_args()
data=(ROOT/'site/data/dashboard.json').read_text();assert json.loads(data)['schema_version']==3
html=(ROOT/'site/index.html').read_text().replace('<link rel="stylesheet" href="styles.css">','<style>'+(ROOT/'site/styles.css').read_text()+'</style>')
html=html.replace('<script src="data/dashboard.js"></script>','<script>window.DASHBOARD_DATA='+data.replace('</','<\\/')+';</script>')
for path in ['vendor/echarts-6.0.0.min.js','model.js','data/hotel.js','hotel-model.js','hotel.js']:
    html=html.replace('<script src="'+path+'"></script>','<script>'+(ROOT/'site'/path).read_text().replace('</','<\\/')+'</script>')
html=html.replace('<script src="app.js" defer></script>','<script>'+(ROOT/'site/app.js').read_text()+'</script>')
html=html.replace('</body>', '<!-- Apache ECharts 6.0.0: Apache License 2.0. Copyright The Apache Software Foundation. -->\n</body>')
args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text(html)
print('Vista HTML preparada: '+str(args.output))
