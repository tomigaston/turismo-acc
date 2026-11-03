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
        self.assertEqual(len(etl.parse_ipc(self.csv([100,101],column='148.3_INIVELNAL_DICI_M_26'),'x')),2)
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
        for values,start in [([100,101,101],(2016,12)),([100,0,102],(2016,12)),([100,101],(2017,1)),([100,'',102],(2016,12))]:
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
    def test_validate_warns_without_ipc(self):
        import io,contextlib
        data=json.loads((ROOT/'site/data/dashboard.json').read_text());data['ipc']=None;err=io.StringIO()
        with contextlib.redirect_stderr(err):etl.validate(data)
        self.assertIn('IPC no descargado',err.getvalue())

if __name__=='__main__':unittest.main()
