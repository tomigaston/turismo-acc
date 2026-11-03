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
  // Días calendario de un conjunto de meses (para promedios semanales).
  const daysInPeriod=ps=>ps.reduce((n,p)=>n+new Date(Date.UTC(+p.slice(0,4),+p.slice(5,7),0)).getUTCDate(),0);
  const weeklyFlights=(flights,ps)=>valid(flights)&&ps.length?Math.round(flights/(daysInPeriod(ps)/7)*10)/10:null;
  // Ruta regular: al menos 4 vuelos en al menos la mitad de los meses del período (6 de 12).
  const regularThreshold=n=>Math.max(1,Math.ceil(n/2));
  function isRegular(monthlyFlights,n=monthlyFlights.length,minFlights=4){return monthlyFlights.filter(v=>valid(v)&&v>=minFlights).length>=regularThreshold(n);}
  // Compara dos listas {code,regular}: nuevas (regulares ahora y no antes), perdidas (al revés) y mantenidas.
  function classifyRoutes(now,before){
    const a=new Map(now.map(r=>[r.code,r])),b=new Map(before.map(r=>[r.code,r]));
    return {gained:now.filter(r=>r.regular&&!b.get(r.code)?.regular),lost:before.filter(r=>r.regular&&!a.get(r.code)?.regular),kept:now.filter(r=>r.regular&&b.get(r.code)?.regular)};
  }
  // Estacionalidad: participación de los 3 meses de mayor valor en la suma anual (%).
  // 25 = sin estacionalidad; 100 = toda la actividad en 3 meses. Requiere 12 valores válidos.
  const complete12=v=>Array.isArray(v)&&v.length===12&&v.every(valid);
  const topMonths=(values12,n=3)=>complete12(values12)?values12.map((v,i)=>[v,i]).sort((a,b)=>b[0]-a[0]||a[1]-b[1]).slice(0,n).map(([,i])=>i):null;
  function seasonalityIndex(values12){
    if(!complete12(values12))return null;
    const total=values12.reduce((a,b)=>a+b,0);if(!(total>0))return null;
    return topMonths(values12).reduce((s,i)=>s+values12[i],0)/total*100;
  }
  // Índice por año, solo para los años con 12 meses observados (los incompletos se omiten).
  function seasonalitySeries(rows){
    const years=[...new Set(rows.map(r=>r.period.slice(0,4)))].sort();
    return years.flatMap(y=>{const v=months(y+'-01',y+'-12').map(p=>at(rows,p).value??null),value=seasonalityIndex(v);return value===null?[]:[{year:y,value,top:topMonths(v)}];});
  }
  // Meses valle: diferencia porcentual de cada mes respecto del promedio mensual del año.
  function valleyMonths(values12){
    if(!complete12(values12))return null;
    const mean=values12.reduce((a,b)=>a+b,0)/12;if(!(mean>0))return null;
    return values12.map((v,i)=>({month:i+1,value:v,diff:(v/mean-1)*100,below:v<mean}));
  }
  // Perfil mensual: suma de los meses homónimos del período; normalizado, cada mes como % del total del período.
  // amountOf(periodos) devuelve el agregado del ámbito (null si falta algún mes).
  function monthlyProfile(periods,amountOf,normalized=true){
    const denominator=amountOf(periods);
    return Array.from({length:12},(_,i)=>{
      const selected=periods.filter(p=>+p.slice(5,7)===i+1),amount=amountOf(selected);
      return {month:i+1,count:selected.length,value:normalized?ratio(amount,denominator,100):amount};
    });
  }
  function transform(series,ps,view){
    const base=view==='index'?ps.find(p=>series.every(s=>valid(at(s.rows,p).value)&&at(s.rows,p).value>0)):null;
    const dates=base?ps.filter(p=>p>=base):ps;
    return {base,periods:dates,series:series.map(s=>({...s,values:dates.map(p=>{
      const v=at(s.rows,p).value;
      // base2019: cada mes sobre el mismo mes de 2019 del mismo ámbito; sin base (faltante o 0) queda nulo.
      return view==='index'?ratio(v,at(s.rows,base).value,100):view==='yoy'?change(v,at(s.rows,previous(p)).value):view==='base2019'?ratio(v,at(s.rows,'2019'+p.slice(4)).value,100):v??null;
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
    // Rutas de un aeropuerto con sus vuelos por mes y su condición de regular en el período.
    function routeRegularity(airport,ps,direction='salidas',kind='all',carrier='all'){
      const periods=new Set(ps),groups=new Map();
      D.air.route_rows.forEach(r=>{
        if(!periods.has(r[0])||(kind!=='all'&&r[3]!==+(kind==='Internacional'))||(carrier!=='all'&&r[4]!==+carrier))return;
        const outgoing=r[1]===airport&&(direction==='salidas'||direction==='ambos'),incoming=r[2]===airport&&(direction==='llegadas'||direction==='ambos');
        if(!outgoing&&!incoming)return;
        const code=outgoing?r[2]:r[1],item=groups.get(code)||{code,monthly:{},pasajeros:0,asientos:0,vuelos:0};
        ['pasajeros','asientos','vuelos'].forEach((k,i)=>item[k]+=r[i+5]);item.monthly[r[0]]=(item.monthly[r[0]]||0)+r[7];groups.set(code,item);
      });
      return [...groups.values()].map(r=>({...r,regular:isRegular(ps.map(p=>r.monthly[p]||0),ps.length)}));
    }
    function carrierMonthly(airport,ps,direction='salidas',kind='all'){
      const periods=new Set(ps),out=new Map();
      D.air.route_rows.forEach(r=>{
        if(!periods.has(r[0])||(kind!=='all'&&r[3]!==+(kind==='Internacional')))return;
        const outgoing=r[1]===airport&&(direction==='salidas'||direction==='ambos'),incoming=r[2]===airport&&(direction==='llegadas'||direction==='ambos');
        if(!outgoing&&!incoming)return;
        const code=String(r[4]),item=out.get(code)||{code,pasajeros:0,asientos:0,vuelos:0,months:{}};
        const m=item.months[r[0]]||(item.months[r[0]]={pasajeros:0,asientos:0,vuelos:0});
        ['pasajeros','asientos','vuelos'].forEach((k,i)=>{item[k]+=r[i+5];m[k]+=r[i+5];});out.set(code,item);
      });
      return [...out.values()];
    }
    // Dos series cualesquiera en % de su propio total del mismo año: no se suman ni se dividen entre sí.
    function crossProfile(rowsA,rowsB,year){return {a:profile(rowsA,year,true),b:profile(rowsB,year,true)};}
    function international(gateway,flow,metric){
      const fields=['gasto_total_usd','gasto_diario_usd','gasto_por_turista_usd'];
      return (fields.includes(metric)?D.international.spending:D.international.series).filter(r=>r.gateway===gateway&&r.flow===flow).map(r=>({...r,value:r[metric]}));
    }
    function profile(rows,year,normalized){
      const ps=months(year+'-01',year+'-12'),values=ps.map(p=>at(rows,p).value??null),total=sum(values);
      return {values:normalized?values.map(v=>ratio(v,total,100)):values,total,complete:values.filter(valid).length};
    }
    return {eoh,air,routes,routeRegularity,carrierMonthly,international,profile,crossProfile};
  }
  const api={valid,sum,ratio,change,at,previous,ordinal,month,months,seasonMonths,windowMonths,aggregate,monthlyProfile,seasonalityIndex,seasonalitySeries,valleyMonths,topMonths,daysInPeriod,weeklyFlights,regularThreshold,isRegular,classifyRoutes,transform,create};
  root.TourismModel=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
