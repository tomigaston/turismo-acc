(function(root){
'use strict';
function render(ctx){
 const {D,M,model,state,$,esc,fmt,signed,label,value,specs,field,compareFields,scopeOptions,scopeLabel,unique,section,notice,kpi,card,barCard,commonOption,axisLabel,tooltipRows,rangeCaption,render:refresh}=ctx;
 const H=root.HotelModel,S=root.HOTEL_DATA,obs=S.observatory,calendar=S.calendar,T=ctx.hotel,meta=D.eoh.scope_meta;
 const {valid,sum,ratio,change,at,previous,ordinal,month,months,transform}=M;
 const names=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
 // Un símbolo distinto por serie: los ámbitos no se distinguen solo por color.
 const symbols=['circle','rect','triangle','diamond','roundRect','pin','arrow','emptyCircle','emptyTriangle'];
 const tabs=[['overview','Demanda y posición'],['seasonality','Estacionalidad'],['typology','Ocupación por categoría'],['events','Eventos']];
 if(!tabs.some(([id])=>id===state.hotelTab))state.hotelTab='overview';
 const municipal=state.hotelTab==='typology'&&state.hotelSource==='municipal';
 const checked=new Date(obs.checked_at).toLocaleDateString('es-AR',{timeZone:'America/Argentina/Cordoba'});
 const subnav=`<nav class="hotel-tabs" aria-label="Análisis de demanda hotelera">${tabs.map(([id,title])=>`<button data-set="hotelTab" data-value="${id}" class="${state.hotelTab===id?'active':''}" aria-pressed="${state.hotelTab===id}">${title}</button>`).join('')}</nav>`;
 const sourceControl=()=>`<div class="hotel-source-choice">${field('hotelSource','Fuente y alcance de las categorías',[['municipal','Córdoba capital · estrellas individuales (Observatorio municipal)'],['eoh','EOH (Encuesta de Ocupación Hotelera, INDEC) · regiones y Argentina']])}</div>`;
 function line({id,title,subtitle,series,periods,metric='pernoctes',view='levels',unit,events=[],zoom=true,quarter=false,method='',...rest}){
  const tr=transform(series,periods,view),u=unit||(view==='index'?'índice':view==='yoy'?'%':specs[metric]?.[1]||''),opt=commonOption();
  opt.grid.bottom=zoom?65:35;
  const eventRows=H.eventMonths(events,tr.periods);
  opt.tooltip.formatter=p=>{
   if(!Array.isArray(p))return p.componentType==='markLine'&&opt.series[0]?.markLine?.tooltip?opt.series[0].markLine.tooltip.formatter(p):esc(p.name||'');
   const es=eventRows.find(r=>r.period===p[0]?.axisValue)?.events||[];
   return tooltipRows(p,u)+(es.length?'<div style="border-top:1px solid #ddd;margin-top:8px;padding-top:6px;color:#8c641c">'+es.map(e=>esc(e.name)+' · '+esc(eventDate(e))).join('<br>')+'</div>':'');
  };
  opt.xAxis={type:'category',data:tr.periods,boundaryGap:tr.periods.length===1,axisLabel:{formatter:p=>label(p,quarter),hideOverlap:true,fontSize:10,color:'#6d8391'},axisTick:{show:false},axisLine:{lineStyle:{color:'#dfe7eb'}}};
  opt.yAxis={type:'value',name:view==='index'?'Base 100':u,nameTextStyle:{fontSize:10,align:'left'},axisLabel:{formatter:axisLabel,fontSize:10},splitLine:{lineStyle:{color:'#edf1f4'}},scale:view==='index'};
  opt.series=tr.series.map((s,i)=>({name:s.name,type:'line',data:s.values,connectNulls:false,showSymbol:tr.periods.length<30,symbol:symbols[i%symbols.length],symbolSize:6,lineStyle:{width:i?2:3},emphasis:{focus:'series'}}));
  if(opt.series.length&&!quarter){
   const bands=[];
   for(let y=+(periods[0]||'2024').slice(0,4)-1;y<=+(periods.at(-1)||'2025').slice(0,4);y++)for(const [season,color] of [['verano','#f8edd3'],['invierno','#e5eef8']]){
    const ps=M.seasonMonths(y,season).filter(p=>tr.periods.includes(p));if(ps.length>1)bands.push([{xAxis:ps[0],itemStyle:{color,opacity:.5}},{xAxis:ps.at(-1)}]);
   }
   opt.series[0].markArea={silent:true,label:{show:false},data:bands};
   // Una marca por mes: el tooltip detalla cada evento y la etiqueta indica cuántos hay (◆N).
   const shortDate=e=>{const d=x=>x.slice(8,10)+'/'+x.slice(5,7);return e.start_date===e.end_date?d(e.start_date):d(e.start_date)+'–'+d(e.end_date);};
   const eventTip=p=>{const r=eventRows.find(x=>x.period===p.data?.period);return r?'<strong>'+esc(label(r.period))+' · '+r.events.length+(r.events.length>1?' eventos':' evento')+'</strong>'+r.events.map(e=>'<div style="margin-top:6px"><strong>'+esc(e.name)+'</strong><br>'+esc(shortDate(e))+' · '+esc(e.category)+' · '+esc(e.locality)+'</div>').join(''):'';};
   if(eventRows.length)opt.series[0].markLine={symbol:'none',lineStyle:{color:'#b58431',type:'dashed',width:1.5},label:{show:true,formatter:p=>p.data?.count>1?'◆'+p.data.count:'◆',position:'end',rotate:0,distance:4,color:'#9d7022',fontSize:12},tooltip:{show:true,trigger:'item',formatter:eventTip},data:eventRows.map(r=>({xAxis:r.period,period:r.period,count:r.events.length,name:r.events.map(e=>e.name).join(' / ')}))};
  }
  if(zoom&&tr.periods.length>1)opt.dataZoom=[{type:'slider',start:0,end:100,bottom:6,height:20,realtime:false,filterMode:'none',textStyle:{fontSize:9},borderColor:'#d9e4e7',fillerColor:'#d4eae3',handleStyle:{color:'#378d7d'}}];
  const note=(view==='index'?'Base 100 común: '+(tr.base?label(tr.base):'sin base positiva común')+'. ':view==='yoy'?'Variación frente al mismo mes del año anterior. ':'')+(quarter?'':'Bandas: verano (dic.–feb.) e invierno (jun.–ago.). ')+(zoom?'El selector inferior recalcula el período de todo este análisis. ':'')+'Faltantes sin interpolar. '+method;
  return card({id,title,subtitle,metric,unit:u,basePeriod:tr.base,option:opt,columns:['Período',...series.map(s=>s.name)],rows:tr.periods.map((p,i)=>[p,...tr.series.map(s=>s.values[i])]),periodText:rangeCaption(periods),method:note,sourceReferences:events.length?unique(events.map(e=>e.source_url)).join(' | '):'',onZoom:zoom?e=>{
   const z=e.batch?.[0]||e,ps=tr.periods;if(!ps.length)return;
   const index=(v,percent,fallback)=>typeof v==='string'?ps.indexOf(v):Number.isFinite(v)?Math.round(v):Number.isFinite(percent)?Math.round((ps.length-1)*percent/100):fallback;
   const a=Math.max(0,index(z.startValue,z.start,0)),b=Math.min(ps.length-1,index(z.endValue,z.end,ps.length-1));
   if(a<=b&&(ps[a]!==state.hotelFrom||ps[b]!==state.hotelTo)){state.hotelPreset='custom';state.hotelFrom=ps[a];state.hotelTo=ps[b];setTimeout(refresh,0);}
  }:null,onClick:events.length?p=>{if(p.componentType==='markLine'){const found=eventRows.find(r=>r.events.some(e=>p.name.includes(e.name)));if(found){state.hotelEvent=found.events[0].id;state.hotelTab='events';refresh();}}}:null,...rest});
 }
 function eventDate(e){const show=p=>p.split('-').reverse().join('/');return e.start_date===e.end_date?show(e.start_date):show(e.start_date)+'–'+show(e.end_date);}
 if(municipal){renderMunicipal();return;}
 const isCategory=state.hotelTab==='typology';
 // 1. Territorio: Córdoba provincia (región EOH) o un destino de Córdoba relevado. La escala se deriva del territorio.
 const territories=T.territories();
 if(!territories.some(([k])=>k===state.territory))state.territory='Córdoba';
 // Las categorías EOH se publican por región: en esa solapa el territorio queda fijo en Córdoba.
 if(isCategory&&state.territory!=='Córdoba'){state.territory='Córdoba';state.compare='Argentina,Cuyo';}
 const focus=state.territory,level=T.level(),name=T.name,refs=k=>T.isReference(k);
 let controls=isCategory?`<label class="field wide"><span>Territorio</span><select data-key="territory" aria-label="Territorio" disabled><option value="Córdoba" selected>Córdoba · provincia (región EOH)</option></select></label><p class="field-note">Las categorías EOH se publican por región, no por localidad</p>`:field('territory','Territorio',territories,{wide:true});
 // 2. Comparadores de la misma escala. En localidades, Argentina y Córdoba provincia entran solo como referencias en índice o variación.
 const chosen=T.compare(),relative=['index','yoy'].includes(state.hotelView)&&state.hotelTab!=='seasonality',chosenRefs=chosen.filter(refs);
 const base=unique([focus,...chosen.filter(k=>!refs(k))]),withRefs=unique([...base,...chosenRefs]);
 const scopes=relative?withRefs:base;
 controls+=compareControl();
 // 3. Período: preset y año; Desde/Hasta solo en intervalo personalizado.
 const all=(D.eoh.scopes[focus]||[]).map(r=>r.period),latest=all.at(-1),first=all[0];
 const years=unique(all.map(p=>p.slice(0,4))).reverse();
 controls+=field('hotelPreset','Período del análisis',[['year','Año completo'],['12','Últimos 12 meses'],['verano','Verano · dic. a feb.'],['otono','Otoño · mar. a may.'],['invierno','Invierno · jun. a ago.'],['primavera','Primavera · sep. a nov.'],['custom','Intervalo personalizado']]);
 if(!['12','custom'].includes(state.hotelPreset))controls+=field('hotelYear','Año / año de cierre del verano',years);
 const ps=H.selection(state,latest,first);state.hotelFrom=ps[0];state.hotelTo=ps.at(-1);
 if(state.hotelPreset==='custom')controls+=`<label class="field"><span>Desde</span><input type="month" data-key="hotelFrom" aria-label="Desde" min="${first}" max="${latest}" value="${ps[0]}"></label><label class="field"><span>Hasta</span><input type="month" data-key="hotelTo" aria-label="Hasta" min="${first}" max="${latest}" value="${ps.at(-1)}"></label>`;
 $('filters').innerHTML=subnav+controls;
 function compareControl(){return T.control({relative});}
 ctx.setCurrent({family:'eoh',period:ps.at(-1),latest,quarter:false});
 // Textos: el título nombra indicador y comparación; el subtítulo, ámbitos, período y residencia.
 const who=keys=>keys.map(name).join(' / '),versus=keys=>keys.length>1?' y '+(keys.length-1)+(keys.length>2?' comparadores':' comparador'):'';
 const caption=rangeCaption(ps),residenceLabel={total:'todas las residencias',residentes:'residentes en Argentina',no_residentes:'residentes en el exterior'}[state.residence];
 const get=(k,metric=state.metric,res=state.residence)=>model.eoh(k,metric,res);
 const records=k=>D.eoh.scopes[k]||[],val=(k,metric=state.metric,res=state.residence)=>H.total(records(k),ps,metric,res);
 const snap=H.snapshot(D,focus,ps,state.residence),ar=H.snapshot(D,'Argentina',ps,state.residence);
 const availableEvents=H.eventsFor(calendar.events,focus,ps,state.hotelTab==='events'?state.hotelEventType:'all');
 const markedEvents=state.hotelShowEvents==='yes'?availableEvents:[];
 const rangeInfo=`<div class="hotel-range"><span><strong>${esc(caption)}</strong> · ${ps.length} meses · ${esc(scopeLabel(focus))}${isCategory?'':' · '+esc(residenceLabel)} · Fuente: EOH (Encuesta de Ocupación Hotelera, INDEC)</span></div>`;
 let html=rangeInfo;
 if(!isCategory&&snap.complete!==ps.length)html+=notice('Cobertura incompleta: '+snap.complete+' de '+ps.length+' meses con datos','historical');
 if(!isCategory&&chosenRefs.length&&!relative)html+=notice('Las referencias nacionales/provinciales solo se comparan en índice o variación, por diferencia de escala');
 if(isCategory)html+=sourceControl()+renderCategories();
 else if(state.hotelTab==='seasonality')html+=renderSeasonality();
 else if(state.hotelTab==='events')html+=renderEvents();
 else html+=renderOverview();
 $('dashboard').innerHTML=html;
 function residenceControl(){return field('residence','Residencia de los viajeros',[['total','Todas las residencias'],['residentes','En Argentina'],['no_residentes','En el exterior']]);}
 function controlsForMetric(includeView=true){return `<div class="inline-controls">${field('metric','Indicador del gráfico',['viajeros','pernoctes','estadia_media','proporcion_no_residentes'].map(k=>[k,specs[k][0]]))}${includeView?field('hotelView','Lectura',[['levels','Valores observados'],['index','Índice base 100'],['yoy','Variación interanual (%)']]):''}${residenceControl()}${field('hotelShowEvents','Eventos en la serie',[['yes','Mostrar eventos registrados'],['no','Ocultar marcas']])}</div>`;}
 function metrics(){
  return '<div class="kpis">'+kpi('Pernoctaciones · '+scopeLabel(focus),fmt(snap.pernoctes),signed(snap.changes.pernoctes)+' % interanual','Noches acumuladas · '+caption,true)+kpi('Viajeros hospedados',fmt(snap.viajeros),signed(snap.changes.viajeros)+' % interanual','Registros de viajeros · '+caption)+kpi('Estadía media',value(snap.estadia_media,'estadia_media'),'Argentina: '+value(ar.estadia_media,'estadia_media'),'Noches por viajero')+kpi('Participación en noches de Argentina',value(snap.share,'ocupacion'),valid(snap.share)&&valid(snap.oldShare)?signed(snap.share-snap.oldShare)+' pp interanuales':'Sin comparación interanual','Mismo período y residencia · total nacional EOH')+'</div>';
 }
 function mainTrend(id='hotel-trend'){
  return line({id,title:specs[state.metric][0]+' por mes · '+name(focus)+versus(scopes),subtitle:who(scopes)+' · '+caption+' · '+(state.metric==='proporcion_no_residentes'?'todas las residencias':residenceLabel),series:scopes.map(k=>({name:name(k),rows:get(k)})),periods:ps,metric:state.metric,view:state.hotelView,events:markedEvents,method:(state.metric==='proporcion_no_residentes'?'Proporción de viajeros del exterior sobre todas las residencias; no se aplica el filtro de residencia.':'Residencia: '+residenceLabel+'.')+(markedEvents.length?' ◆ Eventos registrados.':'')});
 }
 function rankCard(id='hotel-ranking',metric=state.metric){
  const rank=H.ranking(D,level,ps,metric,state.residence),position=rank.find(r=>r.code===focus)?.rank;
  const shown=rank.slice(0,10);if(!shown.some(r=>r.code===focus)&&rank.some(r=>r.code===focus))shown.push(rank.find(r=>r.code===focus));
  // La tabla contiene todo el universo; el foco permanece visible aun fuera del top 10.
  return barCard({id,title:'Ranking de '+specs[metric][0].toLowerCase()+' · '+(level==='region'?'regiones EOH':'localidades relevadas'),subtitle:(position?'Posición de '+name(focus)+': '+position+' de '+rank.length+' · ':'')+caption+' · '+(metric==='proporcion_no_residentes'?'todas las residencias':residenceLabel),items:[...shown,...rank.filter(r=>!shown.includes(r))].map(r=>({code:r.code,name:r.rank+'. '+scopeLabel(r.code),values:[r.value],highlight:r.code===focus})),limit:shown.length,seriesNames:[specs[metric][0]],unit:specs[metric][1],metric,periodText:caption,method:(metric==='proporcion_no_residentes'?'Proporción sobre todas las residencias. ':'Mismo período y residencia. ')+'Solo ámbitos con dato completo; Argentina no integra el ranking. Empates comparten posición. Clic en una barra agrega ese comparador. Tabla y CSV incluyen todos los ámbitos válidos.',onClick:r=>{if(r.code!==focus)T.add(r.code);}});
 }
 function renderOverview(){
  let out=metrics()+controlsForMetric()+mainTrend();
  const volume=['viajeros','pernoctes'].includes(state.metric)?state.metric:'pernoctes',shareScopes=scopes.filter(k=>k!=='Argentina');
  const shares=shareScopes.map(k=>({name:name(k),rows:get(k,volume).map(r=>({period:r.period,value:ratio(r.value,at(get('Argentina',volume),r.period).value,100)}))}));
  out+='<div class="grid equal">'+line({id:'hotel-share',title:'Participación en las '+specs[volume][0].toLowerCase()+' de Argentina · '+name(focus)+versus(shareScopes),subtitle:who(shareScopes)+' · '+caption+' · '+residenceLabel,series:shares,periods:ps,metric:'ocupacion',unit:'%',zoom:false,method:'Cada mes se divide por el total nacional EOH del mismo mes. Una subida indica ganancia de participación, aunque el volumen pueda caer. Argentina es el denominador; no es otra línea.'})+rankCard()+'</div>';
  const growthItems=withRefs.map(k=>{const s=H.snapshot(D,k,ps,state.residence);return {name:name(k),values:[s.changes.viajeros,s.changes.estadia_media,s.changes.pernoctes]};});
  out+='<div class="grid equal">'+barCard({id:'hotel-growth',title:'Variación interanual de viajeros, estadía media y pernoctaciones · por ámbito',subtitle:who(withRefs)+' · '+caption+' frente a los mismos meses del año anterior · '+residenceLabel,items:growthItems,seriesNames:['Viajeros','Estadía media','Pernoctaciones'],metric:'ocupacion',unit:'%',periodText:caption,method:'Noches = viajeros × estadía. Las tres variaciones no se suman: (1 + variación de viajeros) × (1 + variación de estadía) = 1 + variación de noches, expresadas como proporciones.'})+barCard({id:'hotel-residence',title:'Viajeros según residencia · participación en cada ámbito',subtitle:who(scopes)+' · '+caption+' · todas las residencias',items:scopes.map(k=>({name:name(k),values:['residentes','no_residentes'].map(res=>ratio(H.total(records(k),ps,'viajeros',res),H.total(records(k),ps,'viajeros','total'),100))})),seriesNames:['Residentes en Argentina','Residentes en el exterior'],metric:'ocupacion',unit:'%',periodText:caption,method:'Usa todas las residencias para conservar el denominador. No identifica nacionalidad, medio de transporte ni motivo del viaje.'})+'</div>';

  return out;
 }
 function renderSeasonality(){
  const metric=['viajeros','pernoctes'].includes(state.hotelSeasonMetric)?state.hotelSeasonMetric:'pernoctes';
  const normalized=state.hotelProfile==='share',profs=scopes.map(k=>H.monthlyProfile(records(k),ps,metric,state.residence,normalized));
  let out='<div class="inline-controls">'+field('hotelSeasonMetric','Indicador estacional',[['pernoctes','Pernoctaciones'],['viajeros','Viajeros hospedados']])+field('hotelProfile','Lectura del patrón',[['share','Peso en el total del intervalo (%)'],['levels','Volumen acumulado por mes']])+residenceControl()+'</div>';
  const opt=commonOption();opt.grid.bottom=35;opt.tooltip.formatter=p=>tooltipRows(p,normalized?'%':specs[metric][1]);
  opt.xAxis={type:'category',data:names,boundaryGap:false,axisLabel:{fontSize:10},axisTick:{show:false}};opt.yAxis={type:'value',name:normalized?'% del intervalo':specs[metric][1],nameTextStyle:{fontSize:9,align:'left'},axisLabel:{formatter:axisLabel,fontSize:10},splitLine:{lineStyle:{color:'#edf1f4'}}};
  opt.series=scopes.map((k,i)=>({type:'line',name:name(k),data:profs[i].map(r=>r.value),connectNulls:false,symbol:symbols[i%symbols.length],symbolSize:7,lineStyle:{width:i?2:3}}));
  out+='<div class="grid equal">'+card({id:'hotel-profile',title:specs[metric][0]+' por mes del año · distribución por ámbito',subtitle:who(scopes)+' · '+caption+' · '+residenceLabel+' · '+(normalized?'cada ámbito suma 100 % en su intervalo':'volumen acumulado por mes'),option:opt,metric:normalized?'ocupacion':metric,unit:normalized?'%':specs[metric][1],periodText:caption,columns:['Mes','Cantidad de meses observados en la selección',...scopes.map(name)],rows:names.map((n,i)=>[n,profs[0][i].count,...profs.map(p=>p[i].value)]),method:'Se suman los meses homónimos incluidos en la selección. '+(normalized?'Cada suma se divide por el total del intervalo de ese mismo destino; con un año completo, es su perfil anual. Los porcentajes requieren cobertura completa. ':'No se normalizan los tamaños de los destinos. ')+'Los meses fuera de la selección quedan vacíos. Para comparar veranos e inviernos entre años, elegí años completos o la misma temporada.'})+rankCard('hotel-season-rank',metric)+'</div>';
  const years=unique(ps.map(p=>p.slice(0,4))),heat=commonOption(),hrows=years.flatMap(y=>scopes.map(k=>({year:y,scope:k,name:name(k)+' · '+y})));
  const vals=hrows.flatMap((r,y)=>names.flatMap((_,x)=>{const p=r.year+'-'+String(x+1).padStart(2,'0');if(!ps.includes(p))return [];const v=at(get(r.scope,metric),p).value;return valid(v)?[[x,y,v]]:[];}));
  // Leyenda horizontal acotada al ancho disponible; la altura crece con las filas (años × ámbitos).
  const heatWidth=Math.max(240,($('dashboard')?.clientWidth||700)-44),rowHeight=24,heatHeight=Math.max(310,hrows.length*rowHeight+120);
  heat.legend.show=false;heat.grid={left:12,right:8,top:10,bottom:70,containLabel:true};heat.xAxis={type:'category',data:names,axisLabel:{fontSize:10},axisTick:{show:false}};heat.yAxis={type:'category',data:hrows.map(r=>r.name),inverse:true,axisLabel:{fontSize:10,width:200,overflow:'truncate'},axisTick:{show:false}};heat.tooltip={confine:true,formatter:p=>esc(hrows[p.value[1]].name)+' · '+names[p.value[0]]+'<br><b>'+fmt(p.value[2])+' '+specs[metric][1]+'</b><br>Clic: analizar este mes'};heat.visualMap={min:0,max:Math.max(...vals.map(v=>v[2]),1),calculable:true,orient:'horizontal',left:'center',bottom:8,itemWidth:10,itemHeight:Math.min(130,Math.floor(heatWidth*0.45)),textGap:6,inRange:{color:['#edf6f1','#b1dacb','#50a38b','#136751']},textStyle:{fontSize:9},formatter:axisLabel};heat.series=[{type:'heatmap',data:vals,itemStyle:{borderColor:'#fff',borderWidth:2},label:{show:hrows.length<9&&window.innerWidth>800,fontSize:9,formatter:p=>axisLabel(p.value[2])},emphasis:{itemStyle:{borderColor:'#163f49',borderWidth:2}}}];
  out+=card({id:'hotel-calendar',title:specs[metric][0]+' mensuales · calendario de intensidad por ámbito y año',subtitle:who(scopes)+' · '+caption+' · '+residenceLabel,option:heat,className:hrows.length>8?'heat':'',height:heatHeight,metric,periodText:caption,columns:['Destino','Año',...names],rows:hrows.map(r=>[name(r.scope),r.year,...names.map((_,i)=>{const p=r.year+'-'+String(i+1).padStart(2,'0');return ps.includes(p)?at(get(r.scope,metric),p).value:null;})]),method:'Mismo indicador y residencia. Celdas vacías: fuera del intervalo o sin dato. El total nacional suele tener mayor volumen; la curva superior normalizada permite comparar la concentración.',onClick:p=>{const r=hrows[p.value[1]],m=r.year+'-'+String(p.value[0]+1).padStart(2,'0');state.hotelFrom=state.hotelTo=m;state.hotelPreset='custom';state.hotelTab='overview';refresh();}});
  const seasons=H.seasonTotals(records(focus),ps,metric,state.residence),seasonLabel=r=>({verano:'Verano '+(r.year-1)+'/'+r.year,otono:'Otoño '+r.year,invierno:'Invierno '+r.year,primavera:'Primavera '+r.year}[r.season]);
  if(seasons.length)out+=barCard({id:'hotel-seasons',title:specs[metric][0]+' por temporada completa · comparación entre ámbitos',subtitle:who(scopes)+' · '+caption+', solo temporadas con sus tres meses · '+residenceLabel,items:seasons.map(r=>({name:seasonLabel(r),values:scopes.map(k=>H.total(records(k),r.periods,metric,state.residence))})),seriesNames:scopes.map(name),metric,unit:specs[metric][1],periodText:caption,limit:12,method:'Verano: diciembre del año anterior + enero + febrero; otoño: marzo–mayo; invierno: junio–agosto; primavera: septiembre–noviembre. No se presenta enero–febrero solo como un verano completo. Tabla y CSV contienen todas las temporadas.'});
  return out;
 }
 function renderCategories(){
  const cats=['Total','4 y 5 estrellas','3 estrellas/boutiques/aparts','1 y 2 estrellas','Para Hoteles'];
  let out='<div class="inline-controls">'+field('category','Categoría EOH',cats)+field('occupancy','Capacidad analizada',[['habitaciones','Habitaciones / unidades'],['plazas','Plazas']])+'</div>';
  const getOcc=(k,cat=state.category)=>model.eoh(k,'ocupacion','total',cat,state.occupancy),p=ps.at(-1),a=at(getOcc(focus),p).value,b=at(getOcc('Argentina'),p).value,old=at(getOcc(focus),previous(p)).value;
  out+='<div class="kpis">'+kpi('Ocupación · Córdoba',value(a,'ocupacion'),state.category,label(p)+' · último mes seleccionado',true)+kpi('Ocupación · Argentina',value(b,'ocupacion'),'Misma categoría y capacidad',label(p))+kpi('Brecha Córdoba – Argentina',valid(a)&&valid(b)?signed(a-b)+' pp':'Sin dato','Diferencia de tasas',label(p))+kpi('Variación interanual · Córdoba',valid(a)&&valid(old)?signed(a-old)+' pp':'Sin dato','Mismo mes del año anterior',label(previous(p)))+'</div>';
  out+=line({id:'hotel-occupancy',title:'Ocupación de '+state.occupancy+' · categoría '+state.category+' · '+name(focus)+versus(scopes),subtitle:who(scopes)+' · '+caption+' · tasas mensuales publicadas',series:scopes.map(k=>({name:name(k),rows:getOcc(k)})),periods:ps,metric:'ocupacion',method:'Tasas mensuales oficiales EOH. No se promedian meses o categorías para estimar una tasa del intervalo. Las tarjetas corresponden al último mes seleccionado. No se aplica un filtro de residencia.'});
  out+=barCard({id:'hotel-category-compare',title:'Ocupación de '+state.occupancy+' por categoría EOH · comparación entre ámbitos',subtitle:who(scopes)+' · '+label(p)+' (último mes seleccionado) · clic en una barra para elegir categoría',items:cats.map(cat=>({code:cat,name:cat,values:scopes.map(k=>at(getOcc(k,cat),p).value)})),seriesNames:scopes.map(name),metric:'ocupacion',unit:'%',periodText:label(p),method:'Apertura oficial: 4 y 5 estrellas; 3 estrellas/boutiques/aparts; 1 y 2 estrellas; parahoteles. No se separan categorías que la fuente publica juntas. El total es una tasa oficial, no el promedio de las categorías.',onClick:r=>{state.category=r.code;refresh();}});
  return out;
 }
 function renderEvents(){
  const eventYear=calendar.events.map(e=>e.start_date.slice(0,4)).sort().at(-1);
  let out='<div class="inline-controls">'+field('hotelEventType','Tipo de evento',[['all','Todos los tipos'],...unique(calendar.events.map(e=>e.category)).map(x=>[x,x])])+`<button class="button" data-hotel-event-year="${esc(eventYear)}">Eventos de ${esc(eventYear)}</button></div>`;
  out+=controlsForMetric()+mainTrend('hotel-event-trend');
  out+='<div class="hotel-event-heading"><h2>Eventos registrados en la selección</h2><span>'+availableEvents.length+' eventos · '+esc(scopeLabel(focus))+'</span></div>';
  if(!availableEvents.length)out+=notice('Sin eventos registrados para esta selección.');
  else{
   if(!availableEvents.some(e=>e.id===state.hotelEvent))state.hotelEvent=availableEvents[0].id;
   out+='<div class="hotel-events">'+availableEvents.map(e=>`<article class="hotel-event ${e.id===state.hotelEvent?'selected':''}"><span>${esc(e.category)} · ${esc(eventDate(e))}</span><h3>${esc(e.name)}</h3><p>${esc(e.locality)}</p><div><button class="button small" data-set="hotelEvent" data-value="${e.id}" aria-pressed="${e.id===state.hotelEvent}">Analizar este mes</button>${e.source_url?`<a href="${esc(e.source_url)}" target="_blank" rel="noopener noreferrer">Fuente oficial ↗</a>`:''}</div></article>`).join('')+'</div>';
   // Mes analizado: el primero del evento dentro de la selección (un evento puede empezar el año anterior).
   const e=availableEvents.find(e=>e.id===state.hotelEvent),period=ps.find(p=>p>=e.start_date.slice(0,7)&&p<=e.end_date.slice(0,7))||e.start_date.slice(0,7),s=H.snapshot(D,focus,[period],state.residence);
   out+='<div id="hotel-event-month">'+section('Datos del mes · '+label(period),e.name+' · '+scopeLabel(focus))+'</div>';
   out+='<div class="kpis">'+kpi('Pernoctaciones del mes',fmt(s.pernoctes),signed(s.changes.pernoctes)+' % interanual',label(period)+' · total mensual',true)+kpi('Viajeros del mes',fmt(s.viajeros),signed(s.changes.viajeros)+' % interanual','Misma residencia seleccionada')+kpi('Estadía media',value(s.estadia_media,'estadia_media'),'Año anterior: '+value(s.old.estadia_media,'estadia_media'),'Noches / viajeros del mes')+kpi('Participación nacional en noches',value(s.share,'ocupacion'),valid(s.share)&&valid(s.oldShare)?signed(s.share-s.oldShare)+' pp interanuales':'Sin dato','Mismo mes y residencia')+'</div>';
   out+=barCard({id:'hotel-event-yoy',title:'Pernoctaciones en el mes del evento frente al mismo mes del año anterior',subtitle:who(base)+' · '+label(period)+' frente a '+label(previous(period))+' · '+residenceLabel,items:base.map(k=>({name:name(k),values:[H.total(records(k),[previous(period)],'pernoctes',state.residence),H.total(records(k),[period],'pernoctes',state.residence)]})),seriesNames:[label(previous(period)),label(period)],metric:'pernoctes',unit:'noches',periodText:label(period)+' y '+label(previous(period)),method:'Contraste descriptivo del mismo mes en dos años. Las diferencias incluyen estacionalidad, coyuntura, otros eventos y cambios de oferta; no son una estimación del impacto del evento.'});
  }
  out+=`<div class="chart-foot"><span>Calendario: ${calendar.events.length} eventos · ${calendar.events.filter(e=>e.source_url).length} con fuente oficial · ${calendar.events.filter(e=>!e.source_url).length} tomados del calendario de trabajo, sin fuente confirmada · actualizado el ${esc(new Date(calendar.checked_at).toLocaleDateString('es-AR'))}.</span><span>${calendar.events.length} eventos registrados</span></div>`;
  return out;
 }
 function renderMunicipal(){
  const reports=obs.reports.slice().sort((a,b)=>a.period.localeCompare(b.period));
  let controls=sourceControl()+field('hotelQuarter','Trimestre del análisis',reports.slice().reverse().map(r=>[r.id,label(r.period,true)]));
  const r=reports.find(r=>r.id===state.hotelQuarter)||reports.at(-1),categories=r.categories;
  controls+=field('hotelStar','Tipología / estrellas',[['all','Todas las categorías'],...categories.map(c=>[c.id,c.label])]);
  $('filters').innerHTML=subnav+controls;
  ctx.setCurrent({family:'municipal',period:r.period,latest:obs.latest_period,quarter:true,loadedAt:checked});
  const s=H.municipalSummary(r),old=r.previous_year?H.municipalSummary(r.previous_year):null;
  const sameQuarter=reports.find(x=>x.year===r.year-1&&x.quarter===r.quarter),selectedCat=categories.find(c=>c.id===state.hotelStar),selectedRate=selectedCat?.occupancy_percent??r.occupancy_percent;
  const oldRate=selectedCat?sameQuarter?.categories.find(c=>c.id===selectedCat.id)?.occupancy_percent:sameQuarter?.occupancy_percent;
  const metadata={family:'municipal',source:[obs.source.name,r.source_url],loadedAt:checked,latest:label(obs.latest_period),periodText:label(r.period,true)};
  let html=`<div class="hotel-range"><span><strong>${esc(label(r.period,true))}</strong> · Córdoba capital · ${selectedCat?esc(selectedCat.label):'Todas las categorías'}</span><span>Fuente municipal · tasas trimestrales</span></div>`;
  html+=`<div class="hotel-source-note">${esc(r.title)} · ${r.data_as_of?'Datos al '+esc(r.data_as_of.split('-').reverse().join('/')):'Fecha de corte: no informada'} · <a href="${esc(r.source_url)}" target="_blank" rel="noopener noreferrer">Consultar informe ↗</a></div>`;
  html+='<div class="kpis">'+kpi('Ocupación de plazas · '+(selectedCat?.label||'total'),value(selectedRate,'ocupacion'),valid(oldRate)?'≈ '+signed(selectedRate-oldRate)+' pp interanuales':'Sin tasa comparable el año anterior',label(r.period,true),true)+kpi('Alojados · todas las categorías',fmt(s.viajeros),old?signed(change(s.viajeros,old.viajeros))+' % interanual':'Sin comparación','Total ciudad · '+label(r.period,true))+kpi('Pernoctaciones · todas las categorías',fmt(s.pernoctes),old?signed(change(s.pernoctes,old.pernoctes))+' % interanual':'Sin comparación','Noches del trimestre · toda la ciudad')+kpi('Estadía media · todas las categorías',value(s.estadia_media,'estadia_media'),old?'Año anterior: '+value(old.estadia_media,'estadia_media'):'Sin comparación','Noches por alojado')+'</div>';
  const ordered=categories.slice().sort((a,b)=>b.occupancy_percent-a.occupancy_percent);
  html+=barCard({id:'hotel-stars',title:'Ocupación de plazas por tipología y estrellas',subtitle:label(r.period,true)+' · Córdoba capital · clic en una barra para explorar su trayectoria',items:ordered.map(c=>({code:c.id,name:c.label,values:[c.occupancy_percent,sameQuarter?.categories.find(x=>x.id===c.id)?.occupancy_percent??null],highlight:c.id===state.hotelStar})),seriesNames:[label(r.period,true),label(previous(r.period),true)],metric:'ocupacion',unit:'%',...metadata,sourceReferences:sameQuarter?label(sameQuarter.period,true)+': '+sameQuarter.source_url:'',method:'Tasas trimestrales publicadas por el Observatorio municipal (p. '+r.pages.categories+'). Se conserva cada estrella por separado. Son porcentajes de capacidad utilizada, no participación de mercado. No se promedian categorías. Las brechas se calculan con valores redondeados y son aproximadas. El año anterior queda sin dato si no existe reporte con esa apertura.',onClick:c=>{state.hotelStar=c.code;refresh();}});
  const cats=selectedCat?[selectedCat]:categories,quarters=reports.map(x=>x.period);
  const sourceList=reports.map(x=>label(x.period,true)+': '+x.source_url).join(' | ');
  html+=line({id:'hotel-stars-trend',title:'Evolución trimestral de la ocupación por categoría',subtitle:'Córdoba capital · '+label(quarters[0],true)+' – '+label(quarters.at(-1),true)+' · '+(selectedCat?.label||'todas las categorías'),series:cats.map(c=>({name:c.label,rows:reports.map(x=>({period:x.period,value:x.categories.find(y=>y.id===c.id)?.occupancy_percent??null}))})),periods:quarters,metric:'ocupacion',zoom:false,quarter:true,...metadata,periodText:label(quarters[0],true)+' – '+label(quarters.at(-1),true),method:'Ventana histórica de los informes incorporados, independiente del trimestre de las tarjetas. Las estrellas no se interpolan a meses. Fuentes por trimestre disponibles en Fuentes y metodología.',sourceReferences:sourceList});
  const oldMonths=r.previous_year?.months||[],ps=r.months.map(x=>x.period);
  html+='<div class="grid equal">'+line({id:'hotel-city-demand',title:'Pernoctaciones mensuales · trimestre seleccionado frente al mismo trimestre del año anterior',subtitle:'Córdoba capital · '+label(r.period,true)+' y '+label(previous(r.period),true)+' · todas las categorías',series:[{name:String(r.year),rows:r.months.map(x=>({period:x.period,value:x.pernoctes}))},{name:String(r.year-1),rows:r.months.map(x=>({period:x.period,value:at(oldMonths,previous(x.period)).pernoctes??null}))}],periods:ps,metric:'pernoctes',zoom:false,...metadata,method:'Fuente municipal, p. '+r.pages.demand+'. El año anterior se alinea con el mismo mes calendario. No es la serie EOH. El selector de estrellas no desagrega estas noches.'})+line({id:'hotel-city-occupancy',title:'Ocupación mensual de plazas · trimestre seleccionado frente al mismo trimestre del año anterior',subtitle:'Córdoba capital · '+label(r.period,true)+' y '+label(previous(r.period),true)+' · todas las categorías',series:[{name:String(r.year),rows:r.months.map(x=>({period:x.period,value:x.occupancy_percent}))},{name:String(r.year-1),rows:r.months.map(x=>({period:x.period,value:at(oldMonths,previous(x.period)).occupancy_percent??null}))}],periods:ps,metric:'ocupacion',zoom:false,...metadata,method:'Tasas mensuales publicadas en p. '+r.pages.occupancy+'. No son tasas mensuales por estrellas. No se promedian para reconstruir la tasa trimestral.'})+'</div>';
  html+=section('Demanda y oferta','Córdoba capital · todas las categorías');
  html+='<div class="grid equal">'+barCard({id:'hotel-city-capacity',title:'Oferta de plazas · año del trimestre frente al año anterior',subtitle:'Córdoba capital · '+r.year+' y '+(r.year-1)+' · referencia anual',items:[{name:String(r.year),values:[s.plazas],highlight:true},{name:String(r.year-1),values:[old?.plazas??null]}],seriesNames:['Plazas'],unit:'plazas',...metadata,periodText:r.year+' / '+(r.year-1)})+barCard({id:'hotel-city-changes',title:'Variación interanual de alojados, pernoctaciones y plazas',subtitle:'Córdoba capital · '+label(r.period,true)+' frente a '+label(previous(r.period),true)+' · plazas: referencia anual',items:[{name:'Alojados · trimestre',values:[old?change(s.viajeros,old.viajeros):null]},{name:'Pernoctaciones · trimestre',values:[old?change(s.pernoctes,old.pernoctes):null]},{name:'Plazas · referencia anual',values:[old?change(s.plazas,old.plazas):null]}],seriesNames:['Variación interanual'],metric:'ocupacion',unit:'%',...metadata})+'</div>';

  $('dashboard').innerHTML=html;
 }
}
root.HotelDashboard={render};
})(window);
