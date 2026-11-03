import unittest,importlib.util,json,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('etl',ROOT/'scripts/update_data.py');etl=importlib.util.module_from_spec(spec);spec.loader.exec_module(etl)

class IntegrityTests(unittest.TestCase):
    def test_unknown_not_zero(self):
        self.assertIsNone(etl.number(''));self.assertIsNone(etl.number('...'));self.assertEqual(etl.number('0'),0)
        self.assertIsNone(etl.complete_sum([1,None]));self.assertEqual(etl.complete_sum([0,2]),2)
        self.assertIsNone(etl.ratio(1,0))
    def test_total_not_double_counted(self):
        rs=[{'indice_tiempo':'2025-01-01','residencia':g,'viajeros':v} for g,v in [('Total','100'),('Residentes','75'),('No residentes','25')]]
        result=etl.grouped_count(rs,'viajeros','residencia');self.assertEqual(result['Argentina']['2025-01']['viajeros'],100)
    def test_incomplete_residence_not_imputed(self):
        rs=[{'indice_tiempo':'2025-01-01','residencia':g,'viajeros':v} for g,v in [('Residentes','75'),('No residentes','')]]
        self.assertIsNone(etl.grouped_count(rs,'viajeros','residencia')['Argentina']['2025-01']['viajeros'])
    def test_duplicate_rejected(self):
        r={'indice_tiempo':'2025-01-01','residencia':'Residentes','viajeros':'75'}
        with self.assertRaises(ValueError):etl.grouped_count([r,r],'viajeros','residencia')
    def test_delivered_data(self):
        data=json.loads((ROOT/'site/data/dashboard.json').read_text());etl.validate(data)
        config=json.loads((ROOT/'config/sources.json').read_text())
        # Todas las fuentes de config/sources.json, salvo el IPC si todavía no se descargó.
        self.assertLessEqual({s['id'] for s in config if s['family']!='ipc'},{s['id'] for s in data['sources']})
        self.assertLessEqual({s['id'] for s in data['sources']},{s['id'] for s in config});self.assertIn('localidad:Carlos Paz',data['eoh']['scopes'])
        self.assertIn('localidad:Mendoza',data['eoh']['scopes'])
        self.assertEqual(data['eoh']['scope_meta']['Cuyo']['level'],'region')
        self.assertTrue({'Córdoba','Argentina'}<=data['internal']['scopes'].keys())
        for r in data['eoh']['occupancy']:
            if r['value'] is not None:self.assertTrue(0<=r['value']<=100)
        for r in data['internal']['scopes']['Argentina']:
            if r['turistas'] and r['gasto_total_ars'] is not None:self.assertAlmostEqual(r['gasto_promedio_ars'],r['gasto_total_ars']/r['turistas'])
        ar={(r['period'],r['kind'],r['direction']):r for r in data['air']['monthly'] if r['scope']=='Argentina'}
        for r in data['air']['monthly']:
            if r['scope']!='Argentina':self.assertLessEqual(r['pasajeros'],ar[r['period'],r['kind'],r['direction']]['pasajeros'])
        flows={(r['gateway'],r['flow']) for r in data['international']['series']}
        self.assertEqual(len(flows),6)
    def test_known_source_observations(self):
        data=json.loads((ROOT/'site/data/dashboard.json').read_text())
        co=next(r for r in data['eoh']['scopes']['Córdoba'] if r['period']=='2025-11')
        self.assertEqual(co['viajeros'],228719);self.assertEqual(co['pernoctes'],526049)
        expected={('Aep. Córdoba','emisivo'):105494,('Aep. Córdoba','receptivo'):22913,('Aep. Mendoza','emisivo'):36498,('Aep. Mendoza','receptivo'):37182}
        for (gateway,flow),v in expected.items():
            row=next(r for r in data['international']['series'] if r['gateway']==gateway and r['flow']==flow and r['period']=='2025-10')
            self.assertEqual(row['turistas'],v)

class IpcTests(unittest.TestCase):
    """IPC sintético: el dato real lo trae el workflow de GitHub Actions."""
    def write(self,text):
        d=tempfile.TemporaryDirectory();self.addCleanup(d.cleanup)
        p=Path(d.name)/'ipc.csv';p.write_text(text,encoding='utf-8');return p
    def csv(self,values,column='valor',start=(2016,12)):
        y,m=start;lines=['indice_tiempo,'+column]
        for v in values:
            lines.append(f'{y}-{m:02d}-01,{v}');y,m=(y+1,1) if m==12 else (y,m+1)
        return self.write('\n'.join(lines)+'\n')
    def test_quarterly_average_and_base(self):
        ipc=etl.compile_ipc(etl.parse_ipc(self.csv([100,101,102,103,104,105,106]),'x'))
        self.assertEqual([r['period'] for r in ipc['quarterly']],['2017-01','2017-04'],'dic-2016 solo no forma trimestre')
        self.assertAlmostEqual(ipc['quarterly'][0]['index'],102);self.assertAlmostEqual(ipc['quarterly'][1]['index'],105)
        self.assertEqual(ipc['base_period'],'2017-06');self.assertEqual(ipc['base_label'],'pesos de junio 2017')
    def test_column_named_after_series(self):
        # header=ids: la columna se llama como el id de la serie, aunque haya otras columnas.
        sid='148.3_INIVELNAL_DICI_M_26'
        self.assertEqual(len(etl.parse_ipc(self.csv([100,101],column=sid),sid)),2)
        p=self.write(f'indice_tiempo,otra,{sid}\n2016-12-01,1,100\n2017-01-01,1,101\n')
        self.assertEqual([r['index'] for r in etl.parse_ipc(p,sid)],[100,101])
    def test_non_increasing_only_warns(self):
        import io,contextlib
        err=io.StringIO()
        with contextlib.redirect_stderr(err):monthly=etl.parse_ipc(self.csv([100,101,101,100.5,102]),'x')
        self.assertEqual(len(monthly),5,'la serie se conserva completa')
        self.assertIn('AVISO: IPC 2017-02',err.getvalue());self.assertIn('AVISO: IPC 2017-03',err.getvalue())
    def test_doubling_prices_halves_constant_spending(self):
        # Mismo gasto nominal en dos trimestres; en el segundo los precios se duplican.
        ipc=etl.compile_ipc(etl.parse_ipc(self.csv([98,99,100,101,198,200,202]),'x'))
        internal={'scopes':{'Córdoba':[{'period':'2017-01','gasto_total_ars':1000.0,'gasto_promedio_ars':10.0},{'period':'2017-04','gasto_total_ars':1000.0,'gasto_promedio_ars':10.0}]}}
        etl.apply_constant_prices(internal,ipc);a,b=internal['scopes']['Córdoba']
        self.assertAlmostEqual(b['gasto_total_ars_const'],a['gasto_total_ars_const']/2)
        self.assertAlmostEqual(b['gasto_promedio_ars_const'],a['gasto_promedio_ars_const']/2)
        self.assertAlmostEqual(b['gasto_total_ars_const'],1000*202/200,msg='nominal × IPC base ÷ IPC del trimestre')
    def test_no_ipc_is_null(self):
        ipc=etl.compile_ipc(etl.parse_ipc(self.csv([100,101,102,103]),'x'))
        internal={'scopes':{'Córdoba':[{'period':'2016-10','gasto_total_ars':500.0,'gasto_promedio_ars':5.0},{'period':'2017-01','gasto_total_ars':None,'gasto_promedio_ars':None}]}}
        etl.apply_constant_prices(internal,ipc);old,missing=internal['scopes']['Córdoba']
        self.assertIsNone(old['gasto_total_ars_const'],'antes de 1T-2017 no hay IPC');self.assertIsNone(old['gasto_promedio_ars_const'])
        self.assertIsNone(missing['gasto_total_ars_const'],'gasto nominal ausente')
        etl.apply_constant_prices(internal,None);self.assertIsNone(internal['scopes']['Córdoba'][1]['gasto_total_ars_const'],'sin IPC descargado')
    def test_invalid_series_rejected(self):
        for values,start in [([100,0,102],(2016,12)),([100,101],(2017,1)),([100,'',102],(2016,12))]:
            with self.assertRaises(ValueError):etl.parse_ipc(self.csv(values,start=start),'x')
        with self.assertRaises(ValueError):etl.parse_ipc(self.write('indice_tiempo,2016-12-01\n'),'x')
        with self.assertRaises(ValueError):etl.parse_ipc(self.write('{"errors":[{"error":"Serie inválida"}]}\n'),'x')
        gap=self.write('indice_tiempo,valor\n2016-12-01,100\n2017-02-01,102\n')
        with self.assertRaisesRegex(ValueError,'hueco'):etl.parse_ipc(gap,'x')
    def test_missing_series_id_fails_clearly(self):
        import urllib.request,urllib.error
        source={'id':'148.3_INIVELNAL_DICI_M_26','family':'ipc','url':'https://example.invalid/','cache_name':'ipc.csv'}
        def refuse(*a,**k):raise urllib.error.HTTPError(source['url'],400,'Bad Request',None,None)
        original=urllib.request.urlopen;urllib.request.urlopen=refuse
        try:
            d=tempfile.TemporaryDirectory();self.addCleanup(d.cleanup)
            with self.assertRaisesRegex(ValueError,'rechazó la serie 148.3_INIVELNAL_DICI_M_26'):etl.fetch(source,Path(d.name))
        finally:urllib.request.urlopen=original
    def test_download_error_names_source_and_url(self):
        import urllib.request,urllib.error
        source={'id':'d1624c27','family':'eoh','name':'Viajeros hospedados','url':'https://datos.yvera.gob.ar/x.csv','cache_name':'eoh.csv'}
        seen=[]
        def refuse(req,*a,**k):seen.append(req.get_header('User-agent'));raise urllib.error.HTTPError(source['url'],403,'Forbidden',None,None)
        original=urllib.request.urlopen;urllib.request.urlopen=refuse
        try:
            d=tempfile.TemporaryDirectory();self.addCleanup(d.cleanup)
            with self.assertRaises(ValueError) as ctx:etl.fetch(source,Path(d.name))
        finally:urllib.request.urlopen=original
        self.assertEqual(str(ctx.exception),'Descarga fallida: Viajeros hospedados (eoh, d1624c27) · HTTP 403 · https://datos.yvera.gob.ar/x.csv')
        self.assertEqual(seen,[etl.BROWSER_USER_AGENT]);self.assertIn('Chrome/',seen[0]);self.assertIn('Windows NT',seen[0])
    def test_descargar_fuentes_retries_and_reports_http_code(self):
        import urllib.request,urllib.error,io,contextlib,sys
        sys.path.insert(0,str(ROOT/'scripts'))
        spec2=importlib.util.spec_from_file_location('descargar',ROOT/'scripts/descargar_fuentes.py');dl=importlib.util.module_from_spec(spec2);spec2.loader.exec_module(dl)
        calls=[]
        class Ok(io.BytesIO):
            def __enter__(self):return self
            def __exit__(self,*a):return False
        def fake(req,*a,**k):
            calls.append(req.full_url)
            if 'bad' in req.full_url:raise urllib.error.HTTPError(req.full_url,403,'Forbidden',None,None)
            return Ok(b'indice_tiempo,valor\n2016-12-01,100\n')
        original=urllib.request.urlopen;urllib.request.urlopen=fake
        try:
            d=tempfile.TemporaryDirectory();self.addCleanup(d.cleanup);out=Path(d.name)
            good={'id':'g','family':'ipc','name':'IPC','url':'https://ok/ipc','cache_name':'ipc.csv'}
            bad={'id':'b','family':'eoh','name':'EOH','url':'https://bad/eoh','cache_name':'eoh.csv'}
            self.assertEqual(dl.download(good,out,3,0),(True,'35 bytes'));self.assertTrue((out/'ipc.csv').exists())
            self.assertEqual(dl.download(bad,out,3,0),(False,'HTTP 403'));self.assertFalse((out/'eoh.csv').exists())
            self.assertEqual(calls.count('https://bad/eoh'),3,'3 intentos')
        finally:urllib.request.urlopen=original
    def test_descargar_fuentes_desde_navegador(self):
        """Carpeta Descargas simulada: 28 archivos con el nombre de la URL, una variante «(1)» más reciente,
        IPC sin red (se toma ipc.csv) y un faltante que se informa con su nombre exacto y sale con código 1."""
        import urllib.request,urllib.error,io,contextlib,sys,os,time
        sys.path.insert(0,str(ROOT/'scripts'))
        spec2=importlib.util.spec_from_file_location('descargar',ROOT/'scripts/descargar_fuentes.py');dl=importlib.util.module_from_spec(spec2);spec2.loader.exec_module(dl)
        sources=json.loads((ROOT/'config/sources.json').read_text())
        names=[dl.browser_name(s) for s in sources if s['family']!='ipc']
        self.assertEqual(len(names),28);self.assertEqual(len(set(names)),28,'28 nombres únicos')
        self.assertEqual(names[0],'viajeros-hospedados-residentes-y-no-residentes.csv')
        d=tempfile.TemporaryDirectory();self.addCleanup(d.cleanup);down=Path(d.name)/'Descargas';out=Path(d.name)/'fuentes';down.mkdir()
        lost=names[5]
        for n in names:
            if n!=lost:(down/n).write_text('indice_tiempo,x\n2025-01-01,1\n')
        old=down/names[0];os.utime(old,(time.time()-100,time.time()-100))
        (down/names[0].replace('.csv',' (1).csv')).write_text('indice_tiempo,x\n2025-01-01,2\n')
        (down/'ipc.csv').write_text('indice_tiempo,148.3_INIVELNAL_DICI_M_26\n2016-12-01,100\n')
        def offline(*a,**k):raise urllib.error.URLError('sin red')
        original=urllib.request.urlopen;urllib.request.urlopen=offline;err=io.StringIO()
        try:
            with contextlib.redirect_stdout(err):code=dl.main(['--output',str(out),'--desde-navegador',str(down),'--intentos','1'])
        finally:urllib.request.urlopen=original
        text=err.getvalue()
        self.assertEqual(code,1,'falta un archivo: código distinto de cero')
        self.assertIn('Resumen: 28 copiadas, 1 faltantes',text);self.assertIn('falta '+lost,text)
        first=sources[0]
        self.assertIn(',2',(out/first['cache_name']).read_text(),'se toma la variante más reciente')
        ipc=next(s for s in sources if s['family']=='ipc')
        self.assertIn('148.3_INIVELNAL_DICI_M_26',(out/ipc['cache_name']).read_text());self.assertIn('copiado de ipc.csv',text)
        # Con el faltante bajado, todo se copia, sale con 0 e indica el comando siguiente.
        (down/lost).write_text('indice_tiempo,x\n2025-01-01,1\n');err=io.StringIO();urllib.request.urlopen=offline
        try:
            with contextlib.redirect_stdout(err):code=dl.main(['--output',str(out),'--desde-navegador',str(down),'--intentos','1'])
        finally:urllib.request.urlopen=original
        self.assertEqual(code,0);self.assertIn('Resumen: 29 copiadas, 0 faltantes',err.getvalue())
        self.assertIn('python scripts/update_data.py --input-dir '+str(out),err.getvalue())
    def test_validate_warns_without_ipc(self):
        import io,contextlib
        data=json.loads((ROOT/'site/data/dashboard.json').read_text());data['ipc']=None;err=io.StringIO()
        with contextlib.redirect_stderr(err):etl.validate(data)
        self.assertIn('IPC no descargado',err.getvalue())

if __name__=='__main__':unittest.main()
