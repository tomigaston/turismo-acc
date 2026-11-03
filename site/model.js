(function(root){
  'use strict';
  const valid=x=>typeof x==='number'&&Number.isFinite(x);
  const sum=xs=>xs.length&&xs.every(valid)?xs.reduce((a,b)=>a+b,0):null;
  const ratio=(a,b,k=1)=>valid(a)&&valid(b)&&b>0?a/b*k:null;
  const change=(a,b)=>valid(a)&&valid(b)&&b>0?(a/b-1)*100:null;
  const at=(rows,p)=>rows.find(r=>r.period===p)||{};
  const previous=p=>(+p.slice(0,4)-1)+p.slice(4);
  const ordinal=p=>+p.slice(0,4)*12+(+p.slice(5,7)-1);
  const month=n=>Math.floor(n/12)+'-'+String(n%12+1).padStart(2,'0');
  const months=(a,b,step=1)=>{const out=[];for(let n=ordinal(a);n<=ordinal(b);n+=step)out.push(month(n));return out;};
  const seasonMonths=(year,season)=>{
    if(season==='verano')return [(year-1)+'-12',year+'-01',year+'-02'];
    const start={otono:3,invierno:6,primavera:9}[season];
    return start?[0,1,2].map(i=>year+'-'+String(start+i).padStart(2,'0')):months(year+'-01',year+'-12');
  };
  const windowMonths=(p,mode)=>mode==='year'?months(p.slice(0,4)+'-01',p):mode==='12'?months(month(ordinal(p)-11),p):[p];
  function aggregate(rows,ps,field){
    const rs=ps.map(p=>at(rows,p));
    const values=key=>sum(rs.map(r=>r[key]));
    if(field==='ocupacion')return ratio(values('pasajeros'),values('asientos'),100);
    if(field==='estadia_media')return ratio(values('pernoctes'),values(rows.some(r=>'viajeros' in r)?'viajeros':'turistas'));
    if(field==='gasto_promedio_ars')return ratio(values('gasto_total_ars'),values('turistas'));
    return values(field);
  }
  function transform(series,ps,view){
    const base=view==='index'?ps.find(p=>series.every(s=>valid(at(s.rows,p).value)&&at(s.rows,p).value>0)):null;
    const dates=base?ps.filter(p=>p>=base):ps;
    return {base,periods:dates,series:series.map(s=>({...s,values:dates.map(p=>{
      const v=at(s.rows,p).value;
      return view==='index'?ratio(v,at(s.rows,base).value,100):view==='yoy'?change(v,at(s.rows,previous(p)).value):v??null;
    })}))};
  }
  function create(D){
    const airCache=new Map();
    function eoh(scope,metric='viajeros',residence='total',category='Total',occupancy='habitaciones'){
      if(metric==='ocupacion')return D.eoh.occupancy.filter(r=>r.scope===scope&&r.category===category&&r.metric===occupancy).map(r=>({period:r.period,value:r.value,observaciones:r.observaciones}));
      const suffix=residence==='total'?'':'_'+residence;
      return (D.eoh.scopes[scope]||[]).map(r=>({...r,value:metric==='estadia_media'?ratio(r['pernoctes'+suffix],r['viajeros'+suffix]):metric==='proporcion_no_residentes'?r.proporcion_no_residentes:r[metric+suffix],observaciones:r[metric+'_observaciones']||''}));
    }
    function air(direction='salidas',kind='all',carrier='all'){
      const key=[direction,kind,carrier].join('|');if(airCache.has(key))return airCache.get(key);
      const buckets={};
      function add(scope,p,v){
        const s=buckets[scope]||(buckets[scope]={});const r=s[p]||(s[p]={period:p,pasajeros:0,asientos:0,vuelos:0});
        ['pasajeros','asientos','vuelos'].forEach((k,i)=>r[k]+=v[i]);
      }
      if(carrier==='all'){
        D.air.monthly.forEach(r=>{if((direction==='ambos'||r.direction===direction)&&(kind==='all'||r.kind===kind))add(r.scope,r.period,[r.pasajeros,r.asientos,r.vuelos]);});
      }else{
        D.air.route_rows.forEach(r=>{
          if(r[4]!==+carrier||(kind!=='all'&&r[3]!==+(kind==='Internacional')))return;
          const ends=direction==='ambos'?[1,2]:[direction==='salidas'?1:2];
          ends.forEach(i=>{if(D.air.airports[r[i]].domestic){add(r[i],r[0],r.slice(5));add('Argentina',r[0],r.slice(5));}});
        });
      }
      const out={};for(const [s,rs] of Object.entries(buckets))out[s]=Object.values(rs).sort((a,b)=>a.period.localeCompare(b.period)).map(r=>({...r,ocupacion:ratio(r.pasajeros,r.asientos,100)}));
      airCache.set(key,out);return out;
    }
    function routes(airport,ps,direction='salidas',kind='all',carrier='all',by='airport'){
      const periods=new Set(ps),groups=new Map();
      D.air.route_rows.forEach(r=>{
        if(!periods.has(r[0])||(kind!=='all'&&r[3]!==+(kind==='Internacional'))||(carrier!=='all'&&r[4]!==+carrier))return;
        const outgoing=r[1]===airport&&(direction==='salidas'||direction==='ambos'),incoming=r[2]===airport&&(direction==='llegadas'||direction==='ambos');
        if(!outgoing&&!incoming)return;
        const code=by==='carrier'?String(r[4]):outgoing?r[2]:r[1];
        const item=groups.get(code)||{code,pasajeros:0,asientos:0,vuelos:0};
        ['pasajeros','asientos','vuelos'].forEach((k,i)=>item[k]+=r[i+5]);groups.set(code,item);
      });
      return [...groups.values()].map(r=>({...r,ocupacion:ratio(r.pasajeros,r.asientos,100)}));
    }
    function international(gateway,flow,metric){
      const fields=['gasto_total_usd','gasto_diario_usd','gasto_por_turista_usd'];
      return (fields.includes(metric)?D.international.spending:D.international.series).filter(r=>r.gateway===gateway&&r.flow===flow).map(r=>({...r,value:r[metric]}));
    }
    function profile(rows,year,normalized){
      const ps=months(year+'-01',year+'-12'),values=ps.map(p=>at(rows,p).value??null),total=sum(values);
      return {values:normalized?values.map(v=>ratio(v,total,100)):values,total,complete:values.filter(valid).length};
    }
    return {eoh,air,routes,international,profile};
  }
  const api={valid,sum,ratio,change,at,previous,ordinal,month,months,seasonMonths,windowMonths,aggregate,transform,create};
  root.TourismModel=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
