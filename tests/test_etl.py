import unittest,importlib.util,json
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
        self.assertEqual(len(data['sources']),28);self.assertIn('localidad:Carlos Paz',data['eoh']['scopes'])
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

if __name__=='__main__':unittest.main()
