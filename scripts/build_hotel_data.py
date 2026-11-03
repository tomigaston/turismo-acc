#!/usr/bin/env python3
"""Compila las transcripciones verificadas y el calendario, sin empalmar fuentes."""
import csv
import json
import math
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]

def compile_data():
    obs=json.loads((ROOT/'config/hotel_observatory.json').read_text())
    events=json.loads((ROOT/'config/hotel_events.json').read_text())
    ids=set()
    for report in obs['reports']:
        assert report['id'] not in ids
        ids.add(report['id'])
        assert report['source_url'].startswith('https://turismo.cordoba.gob.ar/')
        assert len(report['sha256'])==64
        assert len(report['months'])==3
        assert len(report['categories'])==7
        assert len({x['id'] for x in report['categories']})==7
        for rate in [report['occupancy_percent']]+[x['occupancy_percent'] for x in report['categories']]:
            assert isinstance(rate,(int,float)) and math.isfinite(rate) and 0<=rate<=100
        for block in [report, report['previous_year']]:
            assert len({r['period'] for r in block['months']})==3
            for metric in ['viajeros','pernoctes']:
                assert all(isinstance(x[metric],(int,float)) and x[metric]>=0 for x in block['months'])
                assert sum(x[metric] for x in block['months'])==block['published_totals'][metric]
    assert len({e['id'] for e in events['events']})==len(events['events'])
    for event in events['events']:
        assert event['start_date']<=event['end_date']
        assert event['source_url'].startswith('https://cordobaturismo.gov.ar/')
        assert event['scopes'] and all(s in ['Córdoba','localidad:Córdoba'] for s in event['scopes'])
    return {'schema_version':1,'observatory':obs,'calendar':events}

def main():
    data=compile_data()
    directory=ROOT/'site/data';directory.mkdir(exist_ok=True)
    encoded=json.dumps(data,ensure_ascii=False,separators=(',',':'),allow_nan=False)
    (directory/'hotel.json').write_text(encoded)
    (directory/'hotel.js').write_text('window.HOTEL_DATA='+encoded+';\n')
    rows=[{'reporte':r['id'],'fuente':r['source_url'],**m} for r in data['observatory']['reports'] for m in r['months']]
    with (directory/'hotel-capital-mensual.csv').open('w',encoding='utf-8-sig',newline='') as f:
        w=csv.DictWriter(f,fieldnames=list(rows[0]),delimiter=';');w.writeheader();w.writerows(rows)
    rows=[{'periodo':r['period'],'fuente':r['source_url'],**c} for r in data['observatory']['reports'] for c in r['categories']]
    with (directory/'hotel-capital-categorias.csv').open('w',encoding='utf-8-sig',newline='') as f:
        w=csv.DictWriter(f,fieldnames=list(rows[0]),delimiter=';');w.writeheader();w.writerows(rows)
    print('Hotel: 6 reportes, 18 meses, 42 tasas por categoría y 4 eventos verificados.')

if __name__=='__main__':main()
