#!/usr/bin/env python3
"""Compone una vista HTML descargable con los datos reales ya validados."""
from pathlib import Path
import argparse,json
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path,required=True);args=parser.parse_args()
data=(ROOT/'site/data/dashboard.json').read_text();assert json.loads(data)['schema_version']==3
html=(ROOT/'site/index.html').read_text().replace('<link rel="stylesheet" href="styles.css">','<style>'+(ROOT/'site/styles.css').read_text()+'</style>')
html=html.replace('<script src="data/dashboard.js"></script>','<script>window.DASHBOARD_DATA='+data.replace('</','<\\/')+';</script>')
for path in ['vendor/echarts-6.0.0.min.js','model.js','data/hotel.js','hotel-model.js','data/puna.js','puna-model.js','hotel.js']:
    html=html.replace('<script src="'+path+'"></script>','<script>'+(ROOT/'site'/path).read_text().replace('</','<\\/')+'</script>')
# Panorama por tipo: demanda.html viaja como srcdoc del marco y toma los datos del tablero.
css=(ROOT/'site/panorama.css').read_text()
embed=lambda name:(ROOT/'site'/name).read_text().replace('<link rel="stylesheet" href="panorama.css">','<style>'+css+'</style>')
aloj=embed('demanda.html').replace('<script src="vendor/echarts-6.0.0.min.js"></script>','<script>'+(ROOT/'site/vendor/echarts-6.0.0.min.js').read_text().replace('</','<\\/')+'</script>')
interno=embed('interno.html').replace('<script src="vendor/echarts-6.0.0.min.js"></script>','<script>'+(ROOT/'site/vendor/echarts-6.0.0.min.js').read_text().replace('</','<\\/')+'</script>')
html=html.replace('<script src="app.js" defer></script>','<script>window.INTERNO_SRCDOC='+json.dumps(interno).replace('</','<\\/')+';</script><script src="app.js" defer></script>',1)
mercados=embed('mercados.html').replace('<script src="vendor/echarts-6.0.0.min.js"></script>','<script>'+(ROOT/'site/vendor/echarts-6.0.0.min.js').read_text().replace('</','<\\/')+'</script>')
html=html.replace('<script src="app.js" defer></script>','<script>window.MERCADOS_SRCDOC='+json.dumps(mercados).replace('</','<\\/')+';</script><script src="app.js" defer></script>',1)
aereo=embed('aereo.html').replace('<script src="vendor/echarts-6.0.0.min.js"></script>','<script>'+(ROOT/'site/vendor/echarts-6.0.0.min.js').read_text().replace('</','<\\/')+'</script>')
html=html.replace('<script src="app.js" defer></script>','<script>window.AEREO_SRCDOC='+json.dumps(aereo).replace('</','<\\/')+';</script><script src="app.js" defer></script>',1)
html=html.replace('<script src="app.js" defer></script>','<script>window.ALOJ_SRCDOC='+json.dumps(aloj).replace('</','<\\/')+';</script><script src="app.js" defer></script>',1)
html=html.replace('<script src="app.js" defer></script>','<script>'+(ROOT/'site/app.js').read_text()+'</script>')
html=html.replace('</body>', '<!-- Apache ECharts 6.0.0: Apache License 2.0. Copyright The Apache Software Foundation. -->\n</body>')
args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text(html)
print('Vista HTML preparada: '+str(args.output))
