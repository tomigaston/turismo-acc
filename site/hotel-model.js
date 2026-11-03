/* Cálculos hoteleros: una selección temporal, denominadores explícitos y faltantes estrictos. */
(function(root){
  'use strict';
  const M=typeof module!=='undefined'&&module.exports?require('./model.js'):root.TourismModel;
  const {valid,sum,ratio,change,at,months,previous,ordinal,month,seasonMonths}=M;
  function total(rows,periods,metric,residence='total'){
    const suffix=residence==='total'?'':'_'+residence;
    const count=k=>sum(periods.map(p=>at(rows,p)[k]));
    if(metric==='estadia_media')return ratio(count('pernoctes'+suffix),count('viajeros'+suffix));
    if(metric==='proporcion_no_residentes')return ratio(count('viajeros_no_residentes'),count('viajeros'),100);
    return count(metric+suffix);
  }
  function selection(state,latest,first){
    let periods;
    if(state.hotelPreset==='12')periods=months(month(ordinal(latest)-11),latest);
    else if(state.hotelPreset==='custom'){
      const validDate=p=>/^20\d\d-(0[1-9]|1[0-2])$/.test(p||'');
      let from=validDate(state.hotelFrom)?state.hotelFrom:first,to=validDate(state.hotelTo)?state.hotelTo:latest;
      from=from<first?first:from>latest?latest:from;to=to<first?first:to>latest?latest:to;
      if(from>to)[from,to]=[to,from];periods=months(from,to);
    }else periods=seasonMonths(+state.hotelYear,state.hotelPreset);
    return periods;
  }
  function snapshot(D,scope,periods,residence='total'){
    const rows=D.eoh.scopes[scope]||[],prior=periods.map(previous),ar=D.eoh.scopes.Argentina||[];
    const values=Object.fromEntries(['viajeros','pernoctes','estadia_media','proporcion_no_residentes'].map(k=>[k,total(rows,periods,k,residence)]));
    const old=Object.fromEntries(Object.keys(values).map(k=>[k,total(rows,prior,k,residence)]));
    return {...values,old,changes:Object.fromEntries(Object.keys(values).map(k=>[k,change(values[k],old[k])])),share:ratio(values.pernoctes,total(ar,periods,'pernoctes',residence),100),oldShare:ratio(old.pernoctes,total(ar,prior,'pernoctes',residence),100),complete:periods.filter(p=>valid(at(rows,p)['pernoctes'+(residence==='total'?'':'_'+residence)])&&valid(at(rows,p)['viajeros'+(residence==='total'?'':'_'+residence)])).length};
  }
  function ranking(D,level,periods,metric,residence){
    const rows=Object.keys(D.eoh.scope_meta).filter(k=>D.eoh.scope_meta[k].level===level).map(code=>({code,value:total(D.eoh.scopes[code]||[],periods,metric,residence)})).filter(r=>valid(r.value)).sort((a,b)=>b.value-a.value);
    return rows.map(r=>({...r,rank:1+rows.filter(x=>x.value>r.value).length}));
  }
  function monthlyProfile(rows,periods,metric,residence='total',normalized=true){
    const denominator=total(rows,periods,metric,residence);
    return Array.from({length:12},(_,i)=>{
      const selected=periods.filter(p=>+p.slice(5,7)===i+1),amount=total(rows,selected,metric,residence);
      return {month:i+1,count:selected.length,value:normalized?ratio(amount,denominator,100):amount};
    });
  }
  function seasonTotals(rows,periods,metric,residence='total'){
    const selected=new Set(periods),years=[...new Set(periods.map(p=>+p.slice(0,4)))];
    return years.flatMap(year=>['verano','otono','invierno','primavera'].flatMap(season=>{
      const ps=seasonMonths(year,season);return ps.every(p=>selected.has(p))?[{year,season,periods:ps,value:total(rows,ps,metric,residence)}]:[];
    })).sort((a,b)=>a.periods[0].localeCompare(b.periods[0]));
  }
  function eventsFor(events,scope,periods,category='all'){
    return events.filter(e=>(e.scopes||[]).includes(scope)&&(category==='all'||category===e.category)&&periods.some(p=>p>=e.start_date.slice(0,7)&&p<=e.end_date.slice(0,7)));
  }
  function eventMonths(events,periods){return periods.map(period=>({period,events:events.filter(e=>period>=e.start_date.slice(0,7)&&period<=e.end_date.slice(0,7))})).filter(r=>r.events.length);}
  function municipalSummary(report){
    const rows=report.months,viajeros=sum(rows.map(r=>r.viajeros)),pernoctes=sum(rows.map(r=>r.pernoctes));
    return {viajeros,pernoctes,estadia_media:ratio(pernoctes,viajeros),ocupacion:report.occupancy_percent,plazas:report.beds};
  }
  const api={total,selection,snapshot,ranking,monthlyProfile,seasonTotals,eventsFor,eventMonths,municipalSummary};
  root.HotelModel=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
