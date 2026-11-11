// Oferta de alojamiento (PUNA): totales, composición, rankings y equivalencias con la EOH sobre los datos publicados.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const P=JSON.parse(fs.readFileSync(path.join(__dirname,'..','site','data','puna.json'),'utf8'));
const U=require('../site/puna-model.js').create(P),D=JSON.parse(fs.readFileSync(path.join(__dirname,'..','site','data','dashboard.json'),'utf8'));
const sumOf=(items,k)=>items.reduce((s,r)=>s+r[k],0);
// El archivo .js es el mismo contenido que el .json.
assert.equal(fs.readFileSync(path.join(__dirname,'..','site','data','puna.js'),'utf8'),'window.PUNA_DATA='+JSON.stringify(P)+';\n');
assert.equal(P.schema_version,1);assert.equal(P.year,P.years.at(-1));assert.ok(P.availability_note.length>40);assert.match(P.source.obtained_from,/^https:\/\//);
// Cada agrupación reparte exactamente el total nacional, en las cuatro medidas.
const country=U.total();
for(const k of U.measures){
  assert.ok(country[k]>0,k);
  for(const group of [U.byRegion(),U.byProvince(),U.byLocality(),U.byClass(),U.byType()])assert.equal(sumOf(group,k),country[k],k);
}
// Regiones: las siete de la EOH, con La Rioja en Cuyo; 24 jurisdicciones.
const eohRegions=Object.keys(D.eoh.scope_meta).filter(k=>D.eoh.scope_meta[k].level==='region').sort();
assert.deepEqual(U.byRegion().map(r=>r.code).sort(),eohRegions);
assert.equal(P.provinces.length,24);assert.equal(P.provinces.find(p=>p.name==='La Rioja').region,'Cuyo');
// Córdoba: la región es la provincia; sus tipos y localidades suman su total.
const cordoba=U.total({region:'Córdoba'});
assert.deepEqual(U.total({province:U.cordoba}),cordoba);assert.deepEqual(U.total(U.scopeFilter('Córdoba')),cordoba);
assert.equal(sumOf(U.byType({region:'Córdoba'}),'plazas'),cordoba.plazas);assert.equal(sumOf(U.byLocality({region:'Córdoba'}),'establecimientos'),cordoba.establecimientos);
// Padrón 2021 incorporado: cifras de control de la base de origen.
if(P.year===2021){assert.equal(country.establecimientos,19945);assert.equal(country.plazas,783687);assert.equal(cordoba.establecimientos,2786);assert.equal(cordoba.plazas,91167);}
// Los destinos de Córdoba relevados por la EOH tienen equivalente en el padrón; los ámbitos sin equivalencia devuelven null.
const destinos=Object.keys(D.eoh.scope_meta).filter(k=>D.eoh.scope_meta[k].cordoba);
for(const k of destinos){const f=U.scopeFilter(k);assert.ok(f&&Number.isInteger(f.locality),k);assert.equal(P.provinces[P.localities[f.locality][0]].region,'Córdoba',k);assert.ok(U.total(f).plazas>0,k);}
assert.deepEqual(U.scopeFilter('Argentina'),{});assert.equal(U.scopeFilter('localidad:Bariloche'),null);
// Ranking: descendente, sin ceros y con empates en la misma posición.
const ranked=U.rank([{name:'a',plazas:5},{name:'b',plazas:9},{name:'c',plazas:5},{name:'d',plazas:0}],'plazas');
assert.deepEqual(ranked.map(r=>[r.name,r.rank]),[['b',1],['a',2],['c',2]]);
const provinces=U.rank(U.byProvince(),'plazas');assert.equal(provinces.length,24);provinces.forEach((r,i)=>{if(i)assert.ok(provinces[i-1].value>=r.value);});
console.log('OK: padrón de oferta — totales conciliados, regiones EOH, equivalencias de localidades y rankings.');
