import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
import build_puna_data as puna

HEADER='anio,region,ruta_natural,provincia,departamento_partido,localidad,clasificacion_mintur,tipo,establecimientos,unidades,habitaciones,plazas\n'

class PunaBuildTest(unittest.TestCase):
    def test_published_data_matches_source_file(self):
        compiled=puna.compile_data()
        published=json.loads((ROOT/'site/data/puna.json').read_text(encoding='utf-8'))
        self.assertEqual(compiled,published)
        self.assertEqual((ROOT/'site/data/puna.js').read_text(encoding='utf-8'),'window.PUNA_DATA='+json.dumps(published,ensure_ascii=False,separators=(',',':'))+';\n')

    def test_split_rows_are_added_and_regions_follow_eoh(self):
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/'puna.csv'
            path.write_text(HEADER+'2021,Cordoba,Sierras,Cordoba,Punilla,La Falda,Hosteria,Parahoteleros,2,0,10,25\n'
                '2021,Cordoba,Otra,Cordoba,Punilla,La Falda,Hosteria,Parahoteleros,1,0,4,9\n'
                '2021,Norte,Puna,La Rioja,Capital,La Rioja,Hotel 3 estrellas,Hoteleros,1,0,30,60\n'
                '2022,Cordoba,Sierras,Cordoba,Punilla,La Falda,Camping,Otros colectivos,1,40,,\n',encoding='utf-8')
            meta=json.loads((ROOT/'config/puna.json').read_text(encoding='utf-8'));meta['eoh_localities']={'localidad:La Falda':'La Falda'}
            meta_path=Path(folder)/'puna.json';meta_path.write_text(json.dumps(meta),encoding='utf-8')
            data=puna.compile_data(path,meta_path)
        self.assertEqual(data['years'],[2021,2022]);self.assertEqual(data['year'],2022)
        hosteria=next(i for i,c in enumerate(data['classes']) if c['name']=='Hostería')
        row=next(r for r in data['rows'] if r[0]==0 and r[2]==hosteria)
        self.assertEqual(row[3:],[3,0,14,34])
        self.assertEqual(next(p for p in data['provinces'] if p['name']=='La Rioja')['region'],'Cuyo')
        camping=next(r for r in data['rows'] if r[0]==1)
        self.assertEqual(camping[3:],[1,40,0,0])
        self.assertEqual(data['localities'][data['eoh_localities']['localidad:La Falda']][2],'La Falda')

    def test_unknown_province_is_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/'puna.csv'
            path.write_text(HEADER+'2021,X,Y,Atlantida,Depto,Lugar,Hosteria,Parahoteleros,1,0,1,2\n',encoding='utf-8')
            with self.assertRaises(AssertionError):puna.compile_data(path)

if __name__=='__main__':unittest.main()
