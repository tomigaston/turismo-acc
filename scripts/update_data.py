#!/usr/bin/env python3
"""Descarga oficial, validación y publicación atómica. Solo biblioteca estándar.

Los datos se procesan en streaming. Ningún faltante se transforma en cero.
Un fallo impide sustituir la versión completa previamente publicada.
"""
from __future__ import annotations
import argparse, csv, hashlib, io, json, math, os, re, shutil, sys, tempfile, unicodedata, urllib.error, urllib.request
from collections import defaultdict, Counter
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'site/data/dashboard.json'
CONFIG=ROOT/'config/sources.json'
COUNTRY_REGIONS={'CABA','Cuyo','Córdoba','Litoral','Norte','PBA - Partidos del GBA','PBA - Resto','Patagonia'}
CITIES={'cordoba':'Córdoba capital','carlos paz':'Villa Carlos Paz','villa carlos paz':'Villa Carlos Paz','villa general belgrano':'Villa General Belgrano','rio cuarto':'Río Cuarto','la falda':'La Falda','mina clavero':'Mina Clavero','mar chiquita':'Mar Chiquita'}

def norm(x):
    return re.sub(r'\s+',' ',unicodedata.normalize('NFKD',str(x or '')).encode('ascii','ignore').decode().lower()).strip()

def number(x):
    s=str(x or '').strip()
    try:
        v=float(s.replace(',','.'))
        return v if math.isfinite(v) and v>=0 else None
    except ValueError:return None

def period(x):
    return str(x)[:7] if re.fullmatch(r'20\d{2}-(0[1-9]|1[0-2])(?:-\d{2})?',str(x)) else None

def complete_sum(values):
    vs=list(values)
    return sum(vs) if vs and all(v is not None for v in vs) else None

def ratio(a,b,scale=1):return a/b*scale if a is not None and b is not None and b>0 else None

def fetch(source,directory):
    path=directory/source['cache_name']
    req=urllib.request.Request(source['url'],headers={'User-Agent':'ACC-Turismo/2.0'})
    try:
        with urllib.request.urlopen(req,timeout=90) as res, path.open('wb') as out:
            shutil.copyfileobj(res,out,1024*1024)
    except urllib.error.HTTPError as exc:
        # El IPC es obligatorio: si la serie no existe, se detiene todo; nunca se sigue sin IPC ni con otra serie.
        if source['family']=='ipc':raise ValueError(f"IPC: la API de series de tiempo rechazó la serie {source['id']} (HTTP {exc.code}). Revisar el id en config/sources.json; no se usa otra serie ni se continúa sin IPC.") from exc
        raise
    if path.stat().st_size<20:raise ValueError('Archivo vacío: '+source['id'])
    return path

def rows(path):
    with path.open(encoding='utf-8-sig',newline='') as file:
        reader=csv.DictReader(file)
        for r in reader:yield r

def get(datasets,ident):return rows(datasets[ident])

def grouped_count(rs,measure,origin,territory=None):
    buckets=defaultdict(dict);notes=defaultdict(set)
    for r in rs:
        dt=period(r.get('indice_tiempo'))
        if not dt:continue
        scope=territory(r) if territory else 'Argentina'
        if not scope:continue
        residence=r[origin]
        if residence not in ('Total','Residentes','No residentes'):raise ValueError('Residencia desconocida: '+residence)
        key=(scope,dt)
        if residence in buckets[key]:raise ValueError('Fila duplicada de residencia')
        buckets[key][residence]=number(r[measure])
        if r.get('observaciones'):notes[key].add(r['observaciones'])
    out=defaultdict(dict)
    for (scope,dt),groups in sorted(buckets.items()):
        total=groups.get('Total')
        if total is None and {'Residentes','No residentes'}<=groups.keys():total=complete_sum([groups['Residentes'],groups['No residentes']])
        out[scope][dt]={measure:total,measure+'_residentes':groups.get('Residentes'),measure+'_no_residentes':groups.get('No residentes')}
        if notes[scope,dt]:out[scope][dt][measure+'_observaciones']=' · '.join(sorted(notes[scope,dt]))
    return out

def compile_eoh(d):
    records=defaultdict(lambda:defaultdict(dict))
    specs=[('d1624c27-4b0d-4b73-b0f8-e7db5c56386f','viajeros','origen_viajeros',None),('86098160-840e-4191-a0fc-b3923bf2b0b0','pernoctes','origen_pernoctes',None),('1f6b78aa-d3b4-440a-bd7d-30d76e1728aa','viajeros','origen_viajeros',lambda r:r['region_de_destino']),('a54e2f69-a5b1-42b4-a7bb-ead40338c28f','pernoctes','origen_pernoctes',lambda r:r['region_de_destino']),('57b5deae-026e-4413-9f90-89a428496bfb','viajeros','origen_viajeros',lambda r:'localidad:'+r['localidad']),('7b6ba47f-4aa9-4743-96be-d0e6157cfc5e','pernoctes','origen_pernoctes',lambda r:'localidad:'+r['localidad'])]
    for ident,measure,origin,territory in specs:
        for scope,series in grouped_count(get(d,ident),measure,origin,territory).items():
            for dt,vals in series.items():records[scope][dt].update(vals)
    scopes={}
    for scope,series in records.items():
        scopes[scope]=[]
        for dt,vals in sorted(series.items()):
            vals['estadia_media']=ratio(vals.get('pernoctes'),vals.get('viajeros'))
            vals['proporcion_no_residentes']=ratio(vals.get('viajeros_no_residentes'),vals.get('viajeros'),100)
            scopes[scope].append({'period':dt,**vals})
    occupancy=[]
    for ident,metric,regional in [('e465c1a9-1564-4747-9500-3bf6aa36b87a','habitaciones',True),('ffc7f951-dd04-4796-a1e9-b75908163285','plazas',True),('81cfbbee-4485-4a40-a31b-c98382100f3d','habitaciones',False),('7f68d6ee-fece-471a-b92c-5f04cd3706b1','plazas',False)]:
        for r in get(d,ident):
            dt=period(r['indice_tiempo']);v=number(r['tasa_de_ocupacion_'+metric])
            if v is not None and v>1:raise ValueError('La tasa EOH debe ser una proporción 0–1')
            if dt:occupancy.append({'period':dt,'scope':r['region_de_destino'] if regional else 'Argentina','metric':metric,'category':r['categoria_del_hotel'],'value':None if v is None else round(v*100,4),'observaciones':r.get('observaciones','')})
    if not all(scopes.get(s) for s in ['Córdoba','Argentina']):raise ValueError('Falta comparación EOH')
    meta={}
    for key in scopes:
        city=key.removeprefix('localidad:');local=key.startswith('localidad:')
        label=CITIES.get(norm(city),{'Mendoza':'Ciudad de Mendoza','Bariloche':'San Carlos de Bariloche','CABA':'Ciudad de Buenos Aires'}.get(city,city)) if local else key
        meta[key]={'label':label,'level':'localidad' if local else ('pais' if key=='Argentina' else 'region'),'cordoba':local and norm(city) in CITIES}
    return {'scopes':scopes,'scope_meta':meta,'occupancy':occupancy,'scope_note':'EOH: establecimientos hoteleros y parahoteleros. Las regiones y las localidades son escalas distintas. Región Córdoba corresponde a la provincia; Cuyo comprende Mendoza, San Juan, San Luis y La Rioja. Los registros de viajeros no son personas únicas ni todo el universo turístico.'}

def compile_internal(d):
    specs=[('b8f0f46d-eb2f-4d68-a182-e66778bbf89a','turistas','turistas'),('f19caa7c-db8e-40c4-97db-1aaceafe5672','pernoctes','pernoctes'),('9fd12924-afa0-4a0d-a829-66785414e8ba','gasto_pesos_corrientes','gasto_total_ars'),('9e4c5e37-fea0-4028-ac0f-53bd60cca9a9','gasto_promedio','gasto_promedio_ars'),('1c866310-7f11-45bd-b2b5-5f13ce1a0d46','estadia_media','estadia_media')]
    buckets=defaultdict(lambda:defaultdict(dict))
    for ident,field,target in specs:
        for r in get(d,ident):
            dt=period(r['indice_tiempo']);region=r['region_destino']
            if not dt:continue
            if region not in COUNTRY_REGIONS:raise ValueError('Cambió el universo regional EVyTH: '+region)
            if target in buckets[dt][region]:raise ValueError('Dato EVyTH duplicado')
            buckets[dt][region][target]=number(r[field])
    scopes={r:[] for r in sorted(COUNTRY_REGIONS)};scopes['Argentina']=[]
    for dt,regions in sorted(buckets.items()):
        if set(regions)!=COUNTRY_REGIONS:raise ValueError('No están las 8 regiones EVyTH')
        ar={k:complete_sum(regions[r].get(k) for r in COUNTRY_REGIONS) for k in ['turistas','pernoctes','gasto_total_ars']}
        ar['estadia_media']=ratio(ar['pernoctes'],ar['turistas'])
        ar['gasto_promedio_ars']=ratio(ar['gasto_total_ars'],ar['turistas'])
        scopes['Argentina'].append({'period':dt,**ar})
        for region,values in regions.items():scopes[region].append({'period':dt,**values})
    quintiles=[{'period':period(r['indice_tiempo']),'group':r['quintil'],'turistas':number(r['turistas'])} for r in get(d,'1c9e99b6-e5aa-44e5-80cb-52c01d8295a5')]
    return {'scopes':scopes,'quintiles':quintiles,'scope_note':'EVyTH: viajes dentro de Argentina de residentes de los grandes aglomerados urbanos relevados. Total nacional construido con las ocho regiones de destino, mutuamente excluyentes. Gasto en pesos corrientes; promedios nacionales ponderados por turistas. Quintiles disponibles solo para el total nacional.'}

def compile_international(d):
    specs=[
        ('dae8b7f8-f3dc-431b-887e-3de4b54f09a9','receptivo','Aep. Córdoba',5),
        ('c112ca01-2563-4a48-a8d6-1126af9a5f1d','receptivo','Aep. Mendoza',5),
        ('5a6eaddb-a874-4657-a184-8795e870d6b7','receptivo','Ezeiza y Aeroparque',9),
        ('badeabbe-0703-4750-b79d-bb235eb45e36','emisivo','Aep. Córdoba',6),
        ('cd2cb69a-8aaa-4570-b519-0f1f2891bb61','emisivo','Aep. Mendoza',6),
        ('6373ee50-8eea-461b-8883-caa31faf0a07','emisivo','Ezeiza y Aeroparque',9)]
    markets=[];series=[];spending=[];motives=[]
    for ident,flow,gateway,size in specs:
        bucket=defaultdict(list)
        for r in get(d,ident):
            dt=period(r['indice_tiempo']);suffix='no_residentes' if flow=='receptivo' else 'residentes'
            if not dt:raise ValueError('Fecha ETI inválida')
            item={'period':dt,'flow':flow,'gateway':gateway,'market':r['pais_de_residencia' if flow=='receptivo' else 'pais_de_destino'],'turistas':number(r['turistas_'+suffix]),'pernoctes':number(r['pernoctes_'+suffix]),'observaciones':r.get('observaciones','')}
            bucket[dt].append(item);markets.append(item)
        for dt,rs in sorted(bucket.items()):
            if len(rs)!=size or len({r['market'] for r in rs})!=size:raise ValueError('ETI: composición de mercados incompleta o duplicada')
            t=complete_sum(r['turistas'] for r in rs);n=complete_sum(r['pernoctes'] for r in rs)
            # Las ausencias se conservan incluso ante cambios de agrupación: no imputar.
            series.append({'period':dt,'flow':flow,'gateway':gateway,'turistas':t,'pernoctes':n,'estadia_media':ratio(n,t),'observaciones':' · '.join(sorted({r['observaciones'] for r in rs if r['observaciones']}))})
    for ident,flow in [('9a2c43e4-8037-4cf3-8559-bdab2a37ca94','receptivo'),('42801ab6-0fc6-476d-8f7c-9ecfc9a9e6e1','emisivo')]:
        suffix='no_residentes' if flow=='receptivo' else 'residentes';singular='no_residente' if flow=='receptivo' else 'residente'
        for r in get(d,ident):
            spending.append({'period':period(r['indice_tiempo']),'flow':flow,'gateway':r['paso'],'gasto_total_usd':number(r['gasto_total_en_usd_'+suffix]),'gasto_diario_usd':number(r['gasto_promedio_diario_en_usd_'+suffix]),'gasto_por_turista_usd':number(r['gasto_en_usd_por_turista_'+singular]),'observaciones':r.get('observaciones','')})
    for ident,flow in [('8ba3c9e8-3d57-4d31-90a7-f6a0ab5bd51b','receptivo'),('9a0dd910-3af7-41ea-aff2-cc89a2dedad3','emisivo')]:
        for r in get(d,ident):
            motives.append({'period':period(r['indice_tiempo']),'flow':flow,'gateway':r['paso'],'motive':r['motivo'],'turistas':number(r['turistas_no_residentes' if flow=='receptivo' else 'turistas_residentes']),'observaciones':r.get('observaciones','')})
    return {'series':series,'markets':markets,'spending':spending,'motives':motives,'scope_note':'ETI: pasos aeroportuarios relevados. Receptivo: turistas residentes en el exterior; noches y gasto en su viaje por Argentina. Emisivo: turistas residentes en Argentina que utilizan el paso; noches y gasto durante su viaje al exterior. El paso Córdoba no identifica residencia provincial. Ezeiza/Aeroparque y Mendoza son comparadores de paso, no el total nacional. Las agrupaciones de países varían por paso.'}


def compile_air(d):
    airport_meta={};route=defaultdict(lambda:[0.,0.,0.]);row_count=0;latest_date=''
    required={'indice_tiempo','clasificacion_vuelo','origen_pais','destino_pais','pasajeros','asientos','vuelos','origen_localidad','destino_localidad','origen_oaci','destino_oaci','aerolinea'}
    for r in get(d,'aab49234-28c9-48ab-a978-a83485139290'):
        if row_count==0 and not required<=r.keys():raise ValueError('Cambió el esquema ANAC')
        row_count+=1;dt=period(r['indice_tiempo']);latest_date=max(latest_date,r['indice_tiempo'])
        if not dt:raise ValueError('Fecha ANAC inválida')
        kind=r['clasificacion_vuelo']
        if kind not in ['Cabotaje','Internacional']:raise ValueError('Clasificación ANAC nueva')
        if 'Argentina' not in (r['origen_pais'],r['destino_pais']):continue
        for end in ['origen','destino']:
            code=r[end+'_oaci'] or 'SIN_CODIGO:'+r[end+'_aeropuerto']
            airport_meta[code]={'name':r[end+'_aeropuerto'],'city':r[end+'_localidad'],'province':r[end+'_provincia'],'country':r[end+'_pais'],'domestic':r[end+'_pais']=='Argentina'}
        origin=r['origen_oaci'] or 'SIN_CODIGO:'+r['origen_aeropuerto'];destination=r['destino_oaci'] or 'SIN_CODIGO:'+r['destino_aeropuerto']
        vals=[number(r[k]) for k in ['pasajeros','asientos','vuelos']]
        if any(v is None for v in vals):raise ValueError('Faltante ANAC sin tratamiento acordado')
        key=(dt,origin,destination,kind,r['aerolinea'])
        for i,v in enumerate(vals):route[key][i]+=v
    now=datetime.now(timezone.utc).strftime('%Y-%m')
    periods=sorted({k[0] for k in route if k[0]<now})
    if not periods:raise ValueError('No hay meses aéreos cerrados')
    last=periods[-1]
    # Formato columnar compacto. Índices estables declarados, sin truncar rutas históricas.
    airports=dict(sorted(airport_meta.items()));carriers=sorted({k[4] for k in route});carrier_id={v:i for i,v in enumerate(carriers)}
    records=[];monthly=defaultdict(lambda:[0.,0.,0.])
    for (dt,origin,destination,kind,airline),vals in sorted(route.items()):
        if dt>last:continue
        records.append([dt,origin,destination,0 if kind=='Cabotaje' else 1,carrier_id[airline],*vals])
        for direction,code in [('salidas',origin),('llegadas',destination)]:
            if not airports[code]['domestic']:continue
            for scope in [code,'Argentina']:
                for i,v in enumerate(vals):monthly[scope,dt,direction,kind][i]+=v
    totals=[{'scope':scope,'period':dt,'direction':direction,'kind':kind,'pasajeros':v[0],'asientos':v[1],'vuelos':v[2],'ocupacion':ratio(v[0],v[1],100)} for (scope,dt,direction,kind),v in sorted(monthly.items())]
    if 'SACO' not in airports:raise ValueError('No se encontró el aeropuerto de Córdoba (SACO)')
    return {'monthly':totals,'airports':airports,'carriers':carriers,'route_columns':['period','origin','destination','kind_index','carrier_index','pasajeros','asientos','vuelos'],'route_rows':records,'periods':periods,'latest_date':latest_date,'received_rows':row_count,'scope_note':'ANAC / Yvera: movimientos de vuelos comerciales regulares y no regulares. Desde Córdoba = aeropuerto de Córdoba como origen, sin filtrar residencia. Hacia Córdoba = aeropuerto de Córdoba como destino. Se conservan las magnitudes tratadas por Yvera. Pasajeros no equivale a personas únicas ni turistas; la ruta indica el tramo inmediato. En ambas direcciones, la participación nacional utiliza llegadas + salidas de aeropuertos argentinos; un tramo de cabotaje interviene en dos aeropuertos. Últimos tres meses provisorios.'}


MONTHS_ES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

def next_month(p):
    y,m=int(p[:4]),int(p[5:7]);return f'{y+(m==12)}-{1 if m==12 else m+1:02d}'

def parse_ipc(path,series_id):
    """IPC mensual: columnas indice_tiempo y la serie (con header=ids, la columna se llama como su id;
    también se acepta valor). Exige valores > 0 y sin huecos mensuales desde 2016-12; un mes que no
    supera al anterior solo genera un aviso."""
    with path.open(encoding='utf-8-sig',newline='') as file:
        reader=csv.DictReader(file);fields=reader.fieldnames or []
        values=[f for f in fields if f!='indice_tiempo']
        column=series_id if series_id in fields else 'valor' if 'valor' in fields else (values[0] if len(values)==1 else None)
        if 'indice_tiempo' not in fields or column is None:
            raise ValueError(f'IPC: la respuesta para {series_id} no es el CSV esperado (columnas: {", ".join(fields) or "ninguna"}). Se esperaba indice_tiempo y {series_id}.')
        monthly=[]
        for r in reader:
            dt=period(r.get('indice_tiempo'))
            if not dt:raise ValueError(f'IPC: fecha no reconocida {r.get("indice_tiempo")!r}')
            if dt<'2016-12':continue
            v=number(r.get(column))
            if v is None or v<=0:raise ValueError(f'IPC: valor vacío o no positivo en {dt}')
            monthly.append({'period':dt,'index':v})
    if not monthly or monthly[0]['period']!='2016-12':raise ValueError('IPC: la serie no comienza en 2016-12 (base dic-2016)')
    for a,b in zip(monthly,monthly[1:]):
        if b['period']!=next_month(a['period']):raise ValueError(f"IPC: hueco mensual entre {a['period']} y {b['period']}")
        if not b['index']>a['index']:print(f"AVISO: IPC {b['period']} ({b['index']}) no supera al mes anterior ({a['index']}).",file=sys.stderr)
    return monthly

def compile_ipc(monthly):
    """IPC trimestral = promedio simple de los 3 meses; base = último mes publicado."""
    by={r['period']:r['index'] for r in monthly}
    quarterly=[]
    for q in sorted({p[:5]+f'{(int(p[5:7])-1)//3*3+1:02d}' for p in by}):
        ms=[q,next_month(q),next_month(next_month(q))]
        if all(m in by for m in ms):quarterly.append({'period':q,'index':sum(by[m] for m in ms)/3})
    base=monthly[-1]['period']
    return {'series_id':'148.3_INIVELNAL_DICI_M_26','base_period':base,'base_label':f'pesos de {MONTHS_ES[int(base[5:7])-1]} {base[:4]}','monthly':monthly,'quarterly':quarterly}

def apply_constant_prices(internal,ipc):
    """Gasto a pesos constantes = nominal × (IPC del mes base ÷ IPC promedio del trimestre). Sin IPC, nulo."""
    by={r['period']:r['index'] for r in (ipc or {}).get('quarterly',[])}
    base=next((r['index'] for r in ipc['monthly'] if r['period']==ipc['base_period']),None) if ipc else None
    for rs in internal['scopes'].values():
        for r in rs:
            factor=base/by[r['period']] if base and r['period'] in by else None
            for k in ['gasto_total_ars','gasto_promedio_ars']:
                r[k+'_const']=r.get(k)*factor if factor is not None and r.get(k) is not None else None

def compile_quality(d):
    seen=set();counts=Counter();programs=Counter();last=''
    for r in get(d,'5c4c977c-d36c-4bda-b59f-448a17c9bc55'):
        if r['pais']!='Argentina':continue
        for t in [r['fecha_distincion'],r.get('fecha_revalidacion','')]:
            if re.fullmatch(r'20\d{2}-\d{2}-\d{2}',t):last=max(last,t)
        key=tuple(norm(r[k]) for k in ['organizacion','provincia','ciudad','programa','fecha_distincion'])
        if key in seen:continue
        seen.add(key)
        for scope in ['Argentina',r['provincia']]:counts[scope]+=1;programs[scope,r['programa']]+=1
    return {'counts':dict(counts),'programs':[{'scope':s,'program':p,'records':n} for (s,p),n in sorted(programs.items())],'latest_date':last,'scope_note':'SACT: registros históricos de distinciones, deduplicados por organización, provincia, ciudad, programa y fecha. Una organización puede tener varias distinciones. No mide certificaciones vigentes ni oferta total.'}


def validate(data):
    assert data['schema_version']==3
    for family in ['eoh','internal']:
        for scope,rs in data[family]['scopes'].items():
            assert len({r['period'] for r in rs})==len(rs),'Fechas repetidas'
            assert rs==sorted(rs,key=lambda r:r['period']),'Serie desordenada'
    a={r['period']:r for r in data['eoh']['scopes']['Argentina']}
    for r in data['eoh']['scopes']['Córdoba']:
        for measure in ['viajeros','pernoctes']:
            if r.get(measure) is not None and a[r['period']].get(measure) is not None:assert r[measure]<=a[r['period']][measure]
    assert any(r['value'] is not None for r in data['eoh']['occupancy'])
    if not data.get('ipc'):print('AVISO: IPC no descargado; el gasto a pesos constantes de la EVyTH queda vacío.',file=sys.stderr)
    else:
        ms=[r['period'] for r in data['ipc']['monthly']];assert ms==sorted(ms) and data['ipc']['base_period']==ms[-1],'IPC desordenado'
    json.dumps(data,allow_nan=False)

def main():
    from build_hotel_data import compile_data
    compile_data()  # Validar suplementos antes de actualizar el núcleo.
    parser=argparse.ArgumentParser();parser.add_argument('--input-dir',type=Path);args=parser.parse_args()
    sources=json.loads(CONFIG.read_text());temp=tempfile.TemporaryDirectory();directory=args.input_dir or Path(temp.name)
    if args.input_dir:
        # Con caché local, el IPC puede faltar: se marca «no descargada» y el gasto constante queda nulo.
        paths=[directory/s['cache_name'] for s in sources]
        missing=[s['id'] for s,p in zip(sources,paths) if not p.exists() and s['family']!='ipc']
        if missing:raise ValueError('Faltan en la caché: '+', '.join(missing))
    else:
        with ThreadPoolExecutor(max_workers=6) as pool:paths=list(pool.map(lambda s:fetch(s,directory),sources))
    d={s['id']:p for s,p in zip(sources,paths)}
    stamp=datetime.now(timezone.utc).isoformat(timespec='seconds')
    ipc_source=next((s for s in sources if s['family']=='ipc'),None)
    if ipc_source is None:raise ValueError('IPC: falta la familia ipc en config/sources.json')
    ipc_path=d[ipc_source['id']]
    ipc=compile_ipc(parse_ipc(ipc_path,ipc_source['id'])) if ipc_path.exists() else None
    data={'schema_version':3,'generated_at':stamp,'eoh':compile_eoh(d),'internal':compile_internal(d),'international':compile_international(d),'air':compile_air(d),'quality':compile_quality(d),'ipc':ipc,'sources':[],'pending_sources':[{'name':'Padrón Único Nacional de Alojamiento (PUNA)','url':'https://datos.gob.ar/dataset/turismo-padron-unico-nacional-alojamiento','status':'Identificado; descarga no disponible en esta validación. Sin cifras incorporadas.'},{'name':'Observatorios turísticos provincial y municipal','url':'https://turismo.cordoba.gob.ar/datos-sectoriales-observatorio/','status':'Pendiente validar un recurso estructurado estable y su alcance geográfico.'},{'name':'Datos propios de empresas asociadas','status':'Reservado para una etapa posterior; sin cifras ni empresas incorporadas.'}]}
    apply_constant_prices(data['internal'],ipc)
    for s,p in zip(sources,paths):
        if not p.exists():
            data['sources'].append({**{k:v for k,v in s.items() if k!='cache_name'},'sha256':None,'received_rows':None,'bytes':None,'first_period':None,'latest_period':None,'checked_at':stamp,'status':'no descargada'})
            continue
        sha=hashlib.sha256()
        with p.open('rb') as f:
            for chunk in iter(lambda:f.read(1024*1024),b''):sha.update(chunk)
        # La base aérea ya fue recorrida; no se recorre otra vez para contar.
        if s['family']=='air':count=data['air']['received_rows'];first='2017-01';last=data['air']['latest_date'][:7]
        else:
            count=0;dates=[]
            for r in rows(p):
                count+=1
                dt=period(r.get('indice_tiempo')) or period(r.get('fecha_distincion'))
                if dt:dates.append(dt)
            first=min(dates) if dates else None;last=max(dates) if dates else None
        data['sources'].append({**{k:v for k,v in s.items() if k!='cache_name'},'sha256':sha.hexdigest(),'received_rows':count,'bytes':p.stat().st_size,'first_period':first,'latest_period':last,'checked_at':stamp,'status':'validada'})
    validate(data)
    OUT.parent.mkdir(parents=True,exist_ok=True);tmp=OUT.with_suffix('.tmp')
    tmp.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'),allow_nan=False));os.replace(tmp,OUT)
    jsout=OUT.with_suffix('.js');jstmp=jsout.with_suffix('.tmp')
    jstmp.write_text('window.DASHBOARD_DATA='+OUT.read_text()+';\n',encoding='utf-8');os.replace(jstmp,jsout)
    # CSV comparables para auditoría y para compartir sin depender del navegador.
    for family in ['eoh','internal']:
        records=[{'ambito':s,**r} for s,rs in data[family]['scopes'].items() for r in rs]
        fields=['ambito','period']+sorted({k for r in records for k in r}-{'ambito','period'})
        with (OUT.parent/(family+'-comparaciones.csv')).open('w',encoding='utf-8-sig',newline='') as f:
            writer=csv.DictWriter(f,fieldnames=fields,delimiter=';');writer.writeheader();writer.writerows(records)
    from build_hotel_data import main as build_hotel
    build_hotel()
    print(json.dumps({'resources':len(sources),'output':str(OUT),'bytes':OUT.stat().st_size,'eoh_last':data['eoh']['scopes']['Córdoba'][-1]['period'],'air_last':data['air']['latest_date'],'internal_last':data['internal']['scopes']['Córdoba'][-1]['period']},ensure_ascii=False))

if __name__=='__main__':
    try:main()
    except Exception as exc:print('ERROR: '+str(exc)+' — se conserva la versión anterior.',file=sys.stderr);sys.exit(1)
