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
console.log('OK: faltantes, ponderación, índice común, temporadas y conciliación de rutas, aeropuertos, sentidos y aerolíneas.');
