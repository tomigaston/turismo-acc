/* Cálculos compartidos por filtros, tarjetas, rankings y exportaciones. */
const assert=require('node:assert/strict'),fs=require('node:fs');
const M=require('../site/model.js'),D=JSON.parse(fs.readFileSync(__dirname+'/../site/data/dashboard.json','utf8')),m=M.create(D);
const near=(a,b)=>assert(Math.abs(a-b)<1e-7,`${a} != ${b}`);
assert.equal(M.sum([3,null]),null);assert.equal(M.sum([]),null);assert.equal(M.sum([0,3]),3);
assert.equal(M.ratio(1,0),null);assert.equal(M.change(1,null),null);
assert.deepEqual(M.seasonMonths(2024,'verano'),['2023-12','2024-01','2024-02']);
assert.deepEqual(M.seasonMonths(2024,'invierno'),['2024-06','2024-07','2024-08']);
assert.equal(M.windowMonths('2024-02','12')[0],'2023-03');
const rs=[{period:'2024-01',pasajeros:10,asientos:10},{period:'2024-02',pasajeros:10,asientos:100}];
near(M.aggregate(rs,['2024-01','2024-02'],'ocupacion'),20/110*100);
assert.equal(M.aggregate(rs,['2024-01','2024-03'],'pasajeros'),null);
const profile=m.profile(m.eoh('Córdoba','pernoctes'),2024,true);assert.equal(profile.complete,12);near(M.sum(profile.values),100);
assert(m.profile(m.eoh('Córdoba','pernoctes'),2025,true).values.every(v=>v===null));
const indexed=M.transform([{rows:[{period:'2024-01',value:null},{period:'2024-02',value:20}]},{rows:[{period:'2024-01',value:10},{period:'2024-02',value:30}]}],['2024-01','2024-02'],'index');
assert.equal(indexed.base,'2024-02');assert(indexed.series.every(s=>s.values[0]===100));
// La suma de rutas debe reconciliar con los movimientos del aeropuerto para cada sentido.
const p=D.air.periods.at(-1);
for(const dir of ['salidas','llegadas','ambos'])for(const kind of ['all','Cabotaje','Internacional']){
 const data=m.air(dir,kind),co=M.at(data.SACO||[],p),routes=m.routes('SACO',[p],dir,kind);
 if(co.pasajeros!==undefined){near(M.sum(routes.map(r=>r.pasajeros)),co.pasajeros);near(M.sum(routes.map(r=>r.vuelos)),co.vuelos);}
 const airportTotal=Object.entries(data).filter(([k])=>k!=='Argentina').reduce((s,[,rows])=>s+(M.at(rows,p).pasajeros||0),0);
 near(airportTotal,M.at(data.Argentina,p).pasajeros);
}
const out=m.air('salidas'),inc=m.air('llegadas'),both=m.air('ambos');
near(M.at(both.SACO,p).pasajeros,M.at(out.SACO,p).pasajeros+M.at(inc.SACO,p).pasajeros);
const active=m.routes('SACO',[p],'salidas','all','all','carrier');
for(const carrier of active){near(M.at(m.air('salidas','all',carrier.code).SACO,p).pasajeros,carrier.pasajeros);}
assert.equal(M.at(m.international('Aep. Córdoba','emisivo','turistas'),'2025-10').value,105494);
assert.equal(M.at(m.international('Aep. Córdoba','receptivo','turistas'),'2025-10').value,22913);
// Índice base 2019: cada mes sobre el mismo mes de 2019; sin base (faltante o 0) queda nulo, sin imputar.
{
 const rows=[{period:'2019-01',value:200},{period:'2019-02',value:0},{period:'2025-01',value:150},{period:'2025-02',value:90},{period:'2025-03',value:80}];
 const t=M.transform([{name:'A',rows}],['2025-01','2025-02','2025-03'],'base2019');
 assert.deepEqual(t.series[0].values,[75,null,null]);assert.equal(t.base,null);
 assert.equal(M.transform([{name:'A',rows}],['2019-01'],'base2019').series[0].values[0],100);
}
// Rutas regulares: umbral (4 vuelos en la mitad de los meses) y clasificación nueva / perdida / se mantiene.
assert.equal(M.regularThreshold(12),6);assert.equal(M.regularThreshold(1),1);assert.equal(M.regularThreshold(5),3);
assert.equal(M.isRegular([4,4,4,4,4,4,0,0,0,0,0,0]),true);
assert.equal(M.isRegular([4,4,4,4,4,3,9,0,0,0,0,0]),true);
assert.equal(M.isRegular([4,4,4,4,4,3,3,3,3,3,3,3]),false,'5 meses con 4 vuelos no alcanzan el umbral de 6');
assert.equal(M.isRegular([4]),true);assert.equal(M.isRegular([3]),false);
{
 const year=y=>M.months(y+'-01',y+'-12'),rows=[];
 // AAAA→BBBB regular en ambos años; AAAA→CCCC solo en 2025 (nueva); AAAA→DDDD solo en 2024 (perdida); AAAA→EEEE nunca regular.
 for(const p of year(2024)){rows.push([p,'AAAA','BBBB',0,0,100,120,8]);rows.push([p,'AAAA','DDDD',0,0,50,60,4]);}
 for(const p of year(2025)){rows.push([p,'AAAA','BBBB',0,0,100,120,8]);rows.push([p,'AAAA','EEEE',0,0,10,20,2]);}
 for(const p of year(2025).slice(0,6))rows.push([p,'AAAA','CCCC',0,0,70,80,5]);
 rows.push(['2024-03','EEEE','AAAA',0,0,10,20,30]);
 const airports=Object.fromEntries(['AAAA','BBBB','CCCC','DDDD','EEEE'].map(k=>[k,{city:k,domestic:true}]));
 const s=M.create({air:{route_rows:rows,airports,monthly:[]}});
 const now=s.routeRegularity('AAAA',year(2025)),before=s.routeRegularity('AAAA',year(2024));
 assert.deepEqual(now.filter(r=>r.regular).map(r=>r.code).sort(),['BBBB','CCCC']);
 assert.equal(now.find(r=>r.code==='EEEE').regular,false);
 const c=M.classifyRoutes(now,before);
 assert.deepEqual(c.gained.map(r=>r.code),['CCCC']);assert.deepEqual(c.lost.map(r=>r.code),['DDDD']);assert.deepEqual(c.kept.map(r=>r.code),['BBBB']);
 assert.equal(c.gained[0].pasajeros,420);assert.equal(c.lost[0].vuelos,48);
 // Las llegadas a AAAA no cuentan como salidas.
 assert.equal(s.routeRegularity('AAAA',year(2024),'llegadas').map(r=>r.code).join(),'EEEE');
}
console.log('OK: faltantes, ponderación, índice común, temporadas, conciliación de rutas, aeropuertos, sentidos y aerolíneas, y rutas regulares.');
