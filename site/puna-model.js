/* Oferta de alojamiento (PUNA): totales, composición y rankings de una foto anual. No cruza oferta con demanda. */
(function(root){
  'use strict';
  const MEASURES=['establecimientos','unidades','habitaciones','plazas'];
  function create(P,year=P.year){
    const y=P.years.indexOf(year),rows=P.rows.filter(r=>r[0]===y);
    const province=i=>P.provinces[P.localities[i][0]];
    // Filtro: región EOH, provincia (índice), localidad (índice) y tipo (índice); todos opcionales.
    const match=f=>r=>(f.region===undefined||province(r[1]).region===f.region)&&(f.province===undefined||P.localities[r[1]][0]===f.province)&&(f.locality===undefined||r[1]===f.locality)&&(f.type===undefined||P.classes[r[2]].type===f.type);
    const add=(acc,r)=>{MEASURES.forEach((m,i)=>{acc[m]+=r[3+i];});return acc;};
    const zero=()=>({establecimientos:0,unidades:0,habitaciones:0,plazas:0});
    const total=(f={})=>rows.filter(match(f)).reduce(add,zero());
    function group(f,keyOf,describe){
      const map=new Map();
      for(const r of rows.filter(match(f))){const k=keyOf(r);if(!map.has(k))map.set(k,zero());add(map.get(k),r);}
      return [...map].map(([k,v])=>({...describe(k),...v}));
    }
    const byClass=(f={})=>group(f,r=>r[2],k=>({code:k,name:P.classes[k].name,type:P.types[P.classes[k].type]}));
    const byType=(f={})=>P.types.map((name,i)=>({code:i,name,...total({...f,type:i})}));
    const byRegion=(f={})=>group(f,r=>province(r[1]).region,k=>({code:k,name:k}));
    const byProvince=(f={})=>group(f,r=>P.localities[r[1]][0],k=>({code:k,name:P.provinces[k].name}));
    const byLocality=(f={})=>group(f,r=>r[1],k=>({code:k,name:P.localities[k][2],province:province(k).name,department:P.localities[k][1]}));
    // Ranking descendente; los empates comparten posición.
    function rank(items,measure){
      const sorted=items.filter(r=>r[measure]>0).sort((a,b)=>b[measure]-a[measure]||String(a.name).localeCompare(String(b.name),'es'));
      return sorted.map(r=>({...r,value:r[measure],rank:1+sorted.filter(x=>x[measure]>r[measure]).length}));
    }
    // Ámbito EOH → filtro del padrón. Las localidades de otras provincias no tienen equivalencia cargada.
    function scopeFilter(scope){
      if(scope==='Argentina')return {};
      if(scope in P.eoh_localities)return {locality:P.eoh_localities[scope]};
      if(P.provinces.some(p=>p.region===scope))return {region:scope};
      return null;
    }
    const cordoba=P.provinces.findIndex(p=>p.region==='Córdoba');
    return {year,measures:MEASURES,total,byClass,byType,byRegion,byProvince,byLocality,rank,scopeFilter,cordoba};
  }
  const api={create,MEASURES};
  root.PunaModel=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
