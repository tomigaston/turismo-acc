#!/usr/bin/env python3
"""Compila la base agrupada del Padrón Único Nacional de Alojamiento (PUNA) para la solapa Oferta.

Lee config/puna_base_agregada.csv (mismas columnas que el recurso «Base agrupada» del portal oficial) y
config/puna.json (fuente, leyenda de disponibilidad y equivalencias con la EOH). No empalma la oferta con
la demanda: solo ordena el padrón por año, provincia, localidad y clasificación.
"""
import csv
import json
from collections import defaultdict
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
# El archivo oficial puede traer nombres de columna levemente distintos según el año de publicación.
ALIASES={'anio':['anio','año','indice_tiempo'],'provincia':['provincia','provincia_nombre'],
    'departamento':['departamento_partido','departamento','departamento_nombre'],'localidad':['localidad','localidad_nombre'],
    'clase':['clasificacion_mintur','clasificacion_minturdep','clasificacion'],'tipo':['tipo'],
    'establecimientos':['establecimientos'],'unidades':['unidades'],'habitaciones':['habitaciones'],'plazas':['plazas']}
TYPES=['Hoteleros','Parahoteleros','Otros colectivos']
MEASURES=['establecimientos','unidades','habitaciones','plazas']

def number(text):
    text=(text or '').strip()
    if text in ('','NA','NaN'):return 0
    value=float(text.replace(',','.'))
    assert value>=0 and value==int(value),text
    return int(value)

def compile_data(csv_path=None,meta_path=None):
    meta=json.loads((meta_path or ROOT/'config/puna.json').read_text(encoding='utf-8'))
    with (csv_path or ROOT/'config/puna_base_agregada.csv').open(encoding='utf-8-sig',newline='') as f:
        reader=csv.DictReader(f);header=reader.fieldnames;raw=list(reader)
    col={}
    for key,names in ALIASES.items():
        found=[n for n in names if n in header]
        assert found,'Falta la columna '+key+' ('+' / '.join(names)+')'
        col[key]=found[0]
    regions=meta['eoh_regions'];shown=meta['display']
    totals=defaultdict(lambda:[0,0,0,0]);class_type={}
    for r in raw:
        year=int(str(r[col['anio']])[:4]);province=r[col['provincia']].strip()
        if province=='Ciudad Autonoma de Buenos Aires':province='CABA'
        assert province in regions,'Provincia sin región EOH: '+province
        kind=r[col['tipo']].strip();cls=r[col['clase']].strip()
        assert kind in TYPES,kind
        assert class_type.setdefault(cls,kind)==kind,cls
        key=(year,province,r[col['departamento']].strip(),r[col['localidad']].strip(),cls)
        for i,m in enumerate(MEASURES):totals[key][i]+=number(r[col[m]])
    years=sorted({k[0] for k in totals})
    provinces=sorted(regions)
    classes=sorted(class_type,key=lambda c:(TYPES.index(class_type[c]),c))
    places=sorted({(k[1],k[2],k[3]) for k in totals})
    place_index={p:i for i,p in enumerate(places)}
    rows=[[years.index(k[0]),place_index[(k[1],k[2],k[3])],classes.index(k[4]),*v] for k,v in sorted(totals.items())]
    assert all(r[3]>0 for r in rows),'Fila sin establecimientos'
    eoh_localities={}
    for scope,name in meta['eoh_localities'].items():
        found=[i for i,p in enumerate(places) if p[0]=='Cordoba' and p[2]==name]
        assert len(found)==1,'Localidad EOH sin equivalente único en el padrón: '+name
        eoh_localities[scope]=found[0]
    return {'schema_version':1,'checked_at':meta['checked_at'],'year':years[-1],'years':years,'source':meta['source'],
        'availability_note':meta['availability_note'],'notes':meta['notes'],'types':TYPES,
        'provinces':[{'name':shown['provinces'].get(p,p),'region':regions[p]} for p in provinces],
        'classes':[{'name':shown['classes'].get(c,c),'type':TYPES.index(class_type[c])} for c in classes],
        'localities':[[provinces.index(p[0]),p[1],shown['localities'].get(p[0]+'|'+p[2],shown['localities'].get(p[2],p[2]))] for p in places],
        'eoh_localities':eoh_localities,'columns':['year','locality','class',*MEASURES],'rows':rows}

def main():
    data=compile_data()
    directory=ROOT/'site/data';directory.mkdir(exist_ok=True)
    encoded=json.dumps(data,ensure_ascii=False,separators=(',',':'),allow_nan=False)
    (directory/'puna.json').write_text(encoded,encoding='utf-8')
    (directory/'puna.js').write_text('window.PUNA_DATA='+encoded+';\n',encoding='utf-8')
    last=[r for r in data['rows'] if r[0]==len(data['years'])-1]
    print(f"PUNA {data['year']}: {sum(r[3] for r in last):,} establecimientos y {sum(r[6] for r in last):,} plazas en {len(data['localities']):,} localidades.".replace(',','.'))

if __name__=='__main__':main()
