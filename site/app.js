(function(){
'use strict';
const D=window.DASHBOARD_DATA,M=window.TourismModel,$=id=>document.getElementById(id);
const {valid,sum,ratio,change,at,previous,ordinal,month,months,seasonMonths,windowMonths,aggregate,transform}=M;
const model=M.create(D),colors=['#087f73','#477db1','#d49a3f','#9273ad','#729b99','#c0506a','#2e4f73','#6f8f2f','#8a5a44'];
const fmt=(x,n=0)=>valid(x)?x.toLocaleString('es-AR',{minimumFractionDigits:n,maximumFractionDigits:n}):'Sin dato';
const signed=(x,n=1)=>valid(x)?(x>0?'+':'')+fmt(x,n):'Sin dato';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const label=(p,quarter=false)=>p?(quarter?Math.ceil(+p.slice(5,7)/3)+'º trim. '+p.slice(0,4):new Date(p+'-01T12:00:00Z').toLocaleDateString('es-AR',{month:'short',year:'numeric',timeZone:'UTC'})):'Sin dato';
const loaded=new Date(D.generated_at).toLocaleString('es-AR',{timeZone:'America/Argentina/Cordoba',dateStyle:'short',timeStyle:'short'});
const monthNames=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const sources={municipal:['Observatorio Turístico · Municipalidad de Córdoba','https://turismo.cordoba.gob.ar/datos-sectoriales-observatorio/'],eoh:['INDEC · Encuesta de Ocupación Hotelera','https://datos.yvera.gob.ar/dataset/encuesta-ocupacion-hotelera-parahotelera-eoh'],air:['ANAC / SIAC · Procesamiento Yvera','https://datos.yvera.gob.ar/dataset/conectividad-aerea'],eti:['INDEC · Encuesta de Turismo Internacional','https://datos.yvera.gob.ar/dataset/encuesta-turismo-internacional'],evyth:['Encuesta de Viajes y Turismo de los Hogares','https://datos.yvera.gob.ar/dataset/encuesta-viajes-turismo-hogares-evyth'],quality:['Sistema Argentino de Calidad Turística','https://datos.yvera.gob.ar/dataset/organizaciones-distinguidas-sistema-argentino-calidad-turistica-sact']};
const specs={viajeros:['Viajeros hospedados','viajeros',0],pernoctes:['Pernoctaciones','noches',0],estadia_media:['Estadía media','noches',2],proporcion_no_residentes:['Proporción de viajeros del exterior','%',1],ocupacion:['Factor de ocupación','%',1],pasajeros:['Pasajeros','pasajeros',0],asientos:['Asientos ofrecidos','asientos',0],vuelos:['Vuelos','vuelos',0],turistas:['Turistas','turistas',0],gasto_promedio_ars:['Gasto medio por turista','ARS corrientes',0],gasto_total_ars:['Gasto total','ARS corrientes',0],gasto_diario_usd:['Gasto diario medio','USD',1],gasto_por_turista_usd:['Gasto por turista','USD',1],gasto_total_usd:['Gasto total','USD',0]};
const navs={demand:['Demanda hotelera','ACTIVIDAD Y POSICIONAMIENTO','Viajeros, pernoctaciones, ocupación y categorías de alojamiento.','M3 20V10h4v10M10 20V4h4v16M17 20V7h4v13'],air:['Conectividad aérea','CÓRDOBA COMO ORIGEN Y DESTINO','La posición del aeropuerto, sus conexiones y la evolución del cabotaje y el tráfico internacional.','M3 13l7 1 4 7 2-1-2-7 6-6c2-2 0-4-2-2l-6 6-7-2-1 2 7 4'],season:['Estacionalidad','EL RITMO DE LA ACTIVIDAD','Compará patrones mensuales y posiciones por temporada, con el mismo indicador y período.','M4 5h16v15H4zM4 9h16M8 3v4M16 3v4M8 13h2M14 13h2M8 17h2'],international:['Mercados internacionales','VIAJES A TRAVÉS DEL AEROPUERTO','Turismo receptivo y emisivo por el paso Córdoba, comparado con otros pasos aeroportuarios relevados.','M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18'],internal:['Turismo interno','DEMANDA DENTRO DEL PAÍS','Córdoba como destino de viajes internos. Estadías, gasto y contexto nacional.','M3 11l9-8 9 8M6 10v11h12V10M10 21v-7h4v7'],quality:['Calidad turística','CAPACIDADES Y DISTINCIONES','Una referencia histórica de las distinciones registradas en Córdoba y el país.','M12 3l7 3v6c0 5-7 9-7 9s-7-4-7-9V6zM8 12l3 3 5-6'],sources:['Fuentes y metodología','DATOS CON TRAZABILIDAD','Cobertura, fechas, recursos oficiales y criterios para interpretar las comparaciones.','M5 4h14v17H5zM8 8h8M8 12h8M8 16h5']};
const hotelLatest=D.eoh.scopes['Córdoba'].at(-1).period;
const hotelFullYear=String(+hotelLatest.slice(0,4)-(hotelLatest.slice(5)<='11'?1:0));
const defaults={hotelTab:'overview',hotelPreset:'year',hotelYear:hotelFullYear,hotelFrom:'',hotelTo:'',hotelView:'levels',hotelSource:'municipal',hotelQuarter:window.HOTEL_DATA.observatory.reports.slice().sort((a,b)=>a.period.localeCompare(b.period)).at(-1)?.id||'',hotelStar:'all',hotelSeasonMetric:'pernoctes',hotelProfile:'share',hotelShowEvents:'yes',hotelEventType:'all',hotelEvent:'',tab:'demand',cutoff:D.air.periods.at(-1),range:'24',view:'index',territory:'Córdoba',compare:'Argentina,Cuyo',metric:'pernoctes',residence:'total',category:'Total',occupancy:'habitaciones',direction:'salidas',kind:'all',carrier:'all',airMetric:'pasajeros',airCompare:'SAME',airPreset:'latest',airYear:D.air.periods.filter(p=>p.endsWith('-12')).at(-1)?.slice(0,4)||'',airFrom:'',airTo:'',routeSort:'metric',airCarrierView:'levels',airIntlMetric:'destinos',rankLimit:'10',minFlights:'30',routeSearch:'',seasonData:'hotel',seasonLevel:'localidad',seasonCity:'localidad:Córdoba',seasonCompare1:'localidad:Mendoza',seasonCompare2:'localidad:Bariloche',seasonYear:'2024',seasonMetric:'pernoctes',seasonView:'share',seasonPeriod:'invierno',flow:'emisivo',intlMetric:'turistas',intlCompare1:'Aep. Mendoza',intlCompare2:'Ezeiza y Aeroparque',internalMetric:'turistas',internalCompare1:'Argentina',internalCompare2:'Cuyo',qualityCompare:'Argentina'};
const unique=xs=>[...new Set(xs.filter(Boolean))];
// Límite por clave en enlaces compartidos; la lista de comparadores admite más texto.
const maxLength=k=>k==='compare'||k==='airCompare'?600:200;
function readSaved(saved){
 const s={...defaults},str=k=>typeof saved[k]==='string'&&saved[k].length<200?saved[k]:null;
 for(const k of Object.keys(defaults))if(typeof saved[k]==='string'&&saved[k].length<maxLength(k))s[k]=saved[k];
 // Enlaces anteriores: escala + destino + dos comparadores pasan a territorio + lista de comparadores.
 if(typeof saved.territory!=='string'&&['level','city','compare1','compare2'].some(k=>k in saved)){
  const city=str('city');
  s.territory=str('level')==='localidad'?(D.eoh.scope_meta[city]?.cordoba?city:'localidad:Córdoba'):'Córdoba';
  if(typeof saved.compare!=='string')s.compare=unique([str('compare1')??'Argentina',str('compare2')??'Cuyo']).join(',');
 }
 // Conectividad aérea: dos comparadores pasan a una lista (sin el total nacional, que no es un aeropuerto).
 if(typeof saved.airCompare!=='string'&&['airCompare1','airCompare2'].some(k=>k in saved))s.airCompare=unique([str('airCompare1')??'Argentina',str('airCompare2')??'SAME']).filter(k=>k!=='SACO'&&D.air.airports[k]?.domestic).join(',');
 // Ventana anterior (mes / acumulado / 12 meses sobre un mes de referencia) pasa a un período del análisis.
 if(typeof saved.airPreset!=='string'&&'airWindow' in saved){
  const w=str('airWindow'),last=D.air.periods.at(-1),c=D.air.periods.includes(str('cutoff'))?str('cutoff'):last;
  if(c===last)s.airPreset=w==='year'?'ytd':w==='12'?'12':'latest';
  else{s.airPreset='custom';s.airTo=c;s.airFrom=w==='year'?c.slice(0,4)+'-01':w==='12'?month(ordinal(c)-11):c;}
 }
 return s;
}
let state={...defaults};
try{state=readSaved(JSON.parse(new URLSearchParams(location.hash.slice(1)).get('vista')||'{}'));}catch(_){}
// Un enlace con factor de ocupación y sin mínimo de vuelos propio usa el mínimo por defecto de ese indicador.
try{const saved=JSON.parse(new URLSearchParams(location.hash.slice(1)).get('vista')||'{}');if(state.airMetric==='ocupacion'&&typeof saved.minFlights!=='string')state.minFlights='100';}catch(_){}
if(!navs[state.tab])state.tab='demand';if(!/^20\d\d-(0[1-9]|1[0-2])$/.test(state.cutoff))state.cutoff=defaults.cutoff;
let charts=new Map(),cards=new Map(),current={period:null,latest:null,family:'eoh',quarter:false},toastTimer;
const scopeLabel=k=>D.eoh.scope_meta[k]?.label||k;
const airportLabel=k=>k==='Argentina'?'Argentina · total aeroportuario':D.air.airports[k]?D.air.airports[k].city+' · '+k:k;
const airportShort=k=>k==='Argentina'?'Argentina':D.air.airports[k]?.city||k;
const gateLabel=k=>k==='Aep. Córdoba'?'Aeropuerto de Córdoba':k==='Aep. Mendoza'?'Aeropuerto de Mendoza':k;
// Demanda hotelera: un territorio de Córdoba y una lista de comparadores de la misma escala EOH.
const MAX_SERIES=9;
const hotelTerritories=()=>[['Córdoba','Córdoba · provincia (región EOH)'],...Object.entries(D.eoh.scope_meta).filter(([,m])=>m.cordoba).map(([k,m])=>[k,m.label]).sort((a,b)=>a[1].localeCompare(b[1],'es'))];
const hotelLevel=(k=state.territory)=>D.eoh.scope_meta[k]?.level==='localidad'?'localidad':'region';
const compareKeys=()=>unique(String(state.compare||'').split(',').map(k=>k.trim())).filter(k=>D.eoh.scope_meta[k]&&k!==state.territory);
const isHotelReference=k=>hotelLevel()==='localidad'&&(k==='Argentina'||k==='Córdoba');
const hotelComparable=k=>{const m=D.eoh.scope_meta[k];return !!m&&k!==state.territory&&(hotelLevel()==='region'?m.level==='region'||m.level==='pais':m.level==='localidad'||isHotelReference(k));};
const hotelCompare=()=>compareKeys().filter(hotelComparable);
const hotelName=k=>isHotelReference(k)?(k==='Argentina'?'Argentina · total nacional (referencia)':'Córdoba · provincia (referencia)'):D.eoh.scope_meta[k]?.label||k;
function setCompare(keys){
 const list=unique(keys).filter(k=>k!==state.territory);
 if(list.filter(hotelComparable).length+1>MAX_SERIES){toast('Hasta '+MAX_SERIES+' series por gráfico, incluido el territorio. Quitá un comparador para agregar otro.');return;}
 state.compare=list.join(',');render();
}
function addCompare(k){if(k&&!compareKeys().includes(k))setCompare([...compareKeys(),k]);}
// Conectividad aérea: Córdoba (SACO) y una lista de aeropuertos argentinos; Argentina no es un aeropuerto.
const airCompareKeys=()=>unique(String(state.airCompare||'').split(',').map(k=>k.trim())).filter(k=>k!=='SACO'&&D.air.airports[k]?.domestic);
const airScopes=()=>['SACO',...airCompareKeys()];
function setAirCompare(keys){
 const list=unique(keys).filter(k=>k!=='SACO'&&D.air.airports[k]?.domestic);
 if(list.length+1>MAX_SERIES){toast('Hasta '+MAX_SERIES+' series por gráfico, incluido Córdoba. Quitá un comparador para agregar otro.');return;}
 state.airCompare=list.join(',');render();
}
function addAirCompare(k){if(k&&!airCompareKeys().includes(k))setAirCompare([...airCompareKeys(),k]);}
const airYears=()=>D.air.periods.filter(p=>p.endsWith('-12')&&D.air.periods.includes(p.slice(0,4)+'-01')).map(p=>p.slice(0,4)).reverse();
// Período del análisis aéreo: gobierna indicadores, ranking, rutas, mezcla y aerolíneas.
// Etiquetas del indicador aéreo: la ocupación se nombra como factor de ocupación de asientos.
const airMetricLabel=k=>k==='ocupacion'?'Factor de ocupación (% de asientos ocupados)':specs[k][0];
function airPeriod(){
 const all=D.air.periods,latest=all.at(-1),first=all[0],ok=p=>/^20\d\d-(0[1-9]|1[0-2])$/.test(p||'');
 if(state.airPreset==='ytd')return months(latest.slice(0,4)+'-01',latest);
 if(state.airPreset==='12')return months(month(ordinal(latest)-11),latest);
 if(state.airPreset==='year'){const ys=airYears(),y=ys.includes(state.airYear)?state.airYear:ys[0];return months(y+'-01',y+'-12');}
 if(state.airPreset==='custom'){
  let a=ok(state.airFrom)?state.airFrom:latest,b=ok(state.airTo)?state.airTo:latest;
  a=a<first?first:a>latest?latest:a;b=b<first?first:b>latest?latest:b;if(a>b)[a,b]=[b,a];return months(a,b);
 }
 return [latest];
}
// Selector + fichas + atajos, con las mismas clases que el comparador de Demanda hotelera.
function chipCompare(key,options,selected,nameOf,shortcuts=[]){
 const free=options.filter(([k])=>!selected.includes(k));
 const chips=selected.map(k=>`<button class="chip" data-chip-remove="${esc(k)}" data-compare-key="${key}" aria-pressed="true" aria-label="Quitar ${esc(nameOf(k))}" title="Quitar comparador">${esc(nameOf(k))} <span aria-hidden="true">×</span></button>`).join('');
 return `<div class="compare-group"><label class="field"><span>Comparar con</span><select data-compare-add="${key}" aria-label="Agregar comparador"><option value="">Agregar comparador…</option>${free.map(([k,l])=>`<option value="${esc(k)}">${esc(l)}</option>`).join('')}</select></label><div class="compare-extras"><div class="chips" role="group" aria-label="Comparadores seleccionados: ${selected.length+1} de ${MAX_SERIES} series">${chips||'<span class="chips-empty">Sin comparadores</span>'}</div><div class="compare-shortcuts">${shortcuts.map(([l,keys])=>`<button class="button small" data-compare-set="${esc(keys.join(','))}" data-compare-key="${key}">${esc(l)}</button>`).join('')}<button class="button small subtle" data-compare-set="" data-compare-key="${key}"${selected.length?'':' disabled'}>Quitar todos</button></div></div></div>`;
}
const intlScopes=()=>unique(['Aep. Córdoba',state.intlCompare1,state.intlCompare2]);
const internalScopes=()=>unique(['Córdoba',state.internalCompare1,state.internalCompare2]);
const scopeOptions=level=>Object.entries(D.eoh.scope_meta).filter(([,m])=>m.level===level||m.level==='pais').map(([k,m])=>[k,m.label+(m.level==='pais'?' · total nacional':'')]).sort((a,b)=>a[1].localeCompare(b[1],'es'));
const airportOptions=()=>[['Argentina','Argentina · total aeroportuario'],...Object.entries(D.air.airports).filter(([,a])=>a.domestic).map(([k])=>[k,airportLabel(k)]).sort((a,b)=>a[1].localeCompare(b[1],'es'))];
function field(key,title,options,{empty=false,wide=false}={}){
 const opts=(empty?[['','Sin comparador'],...options]:options).map(o=>Array.isArray(o)?o:[o,o]);
 if(!opts.some(o=>String(o[0])===state[key]))state[key]=String(opts[0]?.[0]??'');
 return `<label class="field ${wide?'wide':''}"><span>${esc(title)}</span><select data-key="${key}" aria-label="${esc(title)}">${opts.map(([v,l])=>`<option value="${esc(v)}" ${String(v)===state[key]?'selected':''}>${esc(l)}</option>`).join('')}</select></label>`;
}
function seg(key,values){return `<div class="segments" role="group" aria-label="${esc(key==='direction'?'Sentido de los vuelos':key==='flow'?'Sentido turístico':'Tipo de vista')}">${values.map(([v,l])=>`<button data-set="${key}" data-value="${v}" class="${state[key]===v?'active':''}" aria-pressed="${state[key]===v}">${esc(l)}</button>`).join('')}</div>`;}
const metricOptions=keys=>keys.map(k=>[k,specs[k][0]]);
function selectPeriod(rows,fieldName='value'){
 const ps=unique(rows.filter(r=>valid(r[fieldName])).map(r=>r.period)).sort();
 current.latest=ps.at(-1)||latestSeries(current.family);current.period=ps.filter(p=>p<=state.cutoff).at(-1)||ps[0]||state.cutoff;return ps;
}
function dateFields(ps){
 return `<label class="field"><span>Período de referencia</span><select data-key="cutoff" aria-label="Período de referencia">${ps.slice().reverse().map(p=>`<option value="${p}" ${p===current.period?'selected':''}>${label(p,current.quarter)}</option>`).join('')}</select></label>`+field('range','Ventana de evolución',[['12','Últimos 12 meses'],['24','Últimos 24 meses'],['60','Últimos 5 años'],['all','Serie completa']]);
}
function compareFields(prefix,options,focus){return field(prefix+'1','Comparar con',options.filter(([k])=>k!==focus),{empty:true})+field(prefix+'2','Segundo comparador',options.filter(([k])=>k!==focus&&k!==state[prefix+'1']),{empty:true});}
function value(x,metric){const [,unit,digits]=specs[metric]||['','',0];return valid(x)?(unit==='USD'?'USD ':unit==='ARS corrientes'?'$ ':'')+fmt(x,digits)+(unit==='%'?' %':unit==='noches'&&metric==='estadia_media'?' noches':''):'Sin dato';}
function kpi(title,val,comparison,foot='',primary=false){return `<article class="kpi ${primary?'primary':''}"><div class="kpi-label">${esc(title)}</div><strong class="kpi-value">${esc(val)}</strong><span class="kpi-comparison">${esc(comparison)}</span><small class="kpi-foot">${esc(foot)}</small></article>`;}
function notice(text,type=''){return `<div class="notice ${type}">${esc(text)}</div>`;}
const section=(title,desc='')=>`<div class="section-title"><div><h2>${esc(title)}</h2>${desc?'<p>'+esc(desc)+'</p>':''}</div></div>`;
function dataNote(family,periodText,latest,method='',config={}){
 const src=config.source||sources[family],stamp=config.loadedAt||loaded;return `<div class="chart-foot"><span>Unidad: ${esc(config.unit||specs[config.metric]?.[1]||'registros')}${config.basePeriod?' · Base 100: '+esc(label(config.basePeriod)):''}</span><span class="coverage">Período: ${esc(periodText)} · Disponible hasta: ${esc(latest||label(current.latest,current.quarter))}</span><span>Fuente: <a href="${src[1]}" target="_blank" rel="noopener noreferrer">${src[0]} ↗</a> · Incorporación al tablero: ${esc(stamp)} (Córdoba).</span>${config.sourceReferences?'<details><summary>Fuentes complementarias del gráfico</summary><span>'+esc(config.sourceReferences)+'</span></details>':''}</div>`;
}
function card(config){
 const c={family:current.family,periodText:label(current.period,current.quarter),latest:label(current.latest,current.quarter),method:'',rows:[],columns:[],...config};cards.set(c.id,c);
 return `<article class="panel" id="panel-${c.id}"><div class="panel-header"><div class="panel-heading">${c.kicker?'<p class="panel-kicker">'+esc(c.kicker)+'</p>':''}<h2>${esc(c.title)}</h2><p class="panel-subtitle">${esc(c.subtitle||'')}</p>${c.controls?'<div class="card-controls">'+c.controls+'</div>':''}</div><div class="panel-actions"><button data-table="${c.id}" aria-expanded="false" title="Ver la tabla de datos">Tabla</button><button data-csv="${c.id}" title="Descargar datos con fuente y filtros">CSV</button><button data-png="${c.id}" title="Descargar gráfico con fuente y período">PNG</button></div></div><div id="chart-${c.id}" class="chart ${c.className||''}"${c.height?` style="height:${+c.height}px"`:''} aria-label="${esc(c.title)}"></div><div id="table-${c.id}" class="table-wrap" hidden></div>${c.extra||''}${dataNote(c.family,c.periodText,c.latest,c.method,c)}</article>`;
}
function tableHTML(c){
 return `<table><thead><tr>${c.columns.map((h,i)=>`<th scope="col"><button data-sort="${c.id}" data-column="${i}" title="Ordenar por ${esc(h)}">${esc(h)} ↕</button></th>`).join('')}</tr></thead><tbody>${c.rows.map(r=>'<tr>'+r.map((v,i)=>`<${i?'td':'th scope="row"'}>${esc(typeof v==='number'?fmt(v,c.digits?.[i]??(Number.isInteger(v)?0:2)):v??'Sin dato')}</${i?'td':'th'}>`).join('')+'</tr>').join('')}</tbody></table>`;
}
function commonOption(){return {backgroundColor:'#fff',animation:!window.matchMedia('(prefers-reduced-motion: reduce)').matches,animationDuration:350,color:colors,textStyle:{fontFamily:'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'},aria:{enabled:true,decal:{show:false}},tooltip:{trigger:'axis',confine:true,backgroundColor:'#fff',borderColor:'#d7e3e8',textStyle:{color:'#214459',fontSize:11}},legend:{type:'scroll',top:6,left:0,right:0,icon:'roundRect',itemWidth:14,itemHeight:3,textStyle:{fontSize:10,color:'#5b7586'}},grid:{left:5,right:20,top:49,bottom:65,containLabel:true}};}
function axisLabel(x){return Math.abs(x)>=1e6?fmt(x/1e6,1)+' M':Math.abs(x)>=1e4?fmt(x/1000,0)+' mil':fmt(x,Math.abs(x)<10&&x!==0?1:0);}
function tooltipRows(params,unit=''){
 const ps=Array.isArray(params)?params:[params];return '<strong>'+esc(ps[0]?.axisValueLabel||ps[0]?.name||'')+'</strong>'+ps.map(p=>'<div style="margin-top:5px">'+p.marker+' '+esc(p.seriesName)+': <strong>'+esc(valid(p.value)?fmt(p.value,unit==='%'||unit==='índice'||unit==='noches'?1:0)+(unit?' '+unit:''):'Sin dato')+'</strong></div>').join('');
}
function lineCard({id,title,subtitle,series,metric='viajeros',view=state.view,quarter=current.quarter,seasonBands=true,periods:fixed,...rest}){
 const all=unique(series.flatMap(s=>s.rows.map(r=>r.period))).sort();
 const start=state.range==='all'?all[0]:month(ordinal(current.period)-(+state.range)+1);
 // Con períodos fijos (Conectividad aérea) no se usa la ventana de evolución.
 let ps=fixed||(start&&current.period?months(start,current.period,quarter?3:1):[]);
 // Trimestres expresados por el primer mes del trimestre.
 if(quarter&&!fixed)ps=all.filter(p=>p<=current.period&&(state.range==='all'||ordinal(p)>ordinal(current.period)-(+state.range)));
 const tr=transform(series,ps,view),unit=view==='index'||view==='base2019'?'índice':view==='yoy'?'%':specs[metric]?.[1]||'';
 const opt=commonOption();
 opt.tooltip.formatter=params=>tooltipRows(params,unit);
 opt.xAxis={type:'category',boundaryGap:false,data:tr.periods,axisLabel:{formatter:p=>label(p,quarter),fontSize:9,color:'#7a8d98',hideOverlap:true},axisLine:{lineStyle:{color:'#dfe7eb'}},axisTick:{show:false}};
 opt.yAxis={type:'value',name:view==='index'?'Base 100':view==='base2019'?'Base 2019 = 100':view==='yoy'?'Var. interanual (%)':unit,nameTextStyle:{fontSize:9,color:'#82949d',align:'left'},axisLabel:{formatter:axisLabel,fontSize:9,color:'#7a8d98'},splitLine:{lineStyle:{color:'#edf1f4'}},scale:view==='index'};
 opt.dataZoom=[{type:'inside',filterMode:'none',zoomOnMouseWheel:'ctrl'},{type:'slider',bottom:6,height:16,borderColor:'#dfe8ed',fillerColor:'#dcefe8',handleStyle:{color:'#5d9b89'},textStyle:{fontSize:8},start:0,end:100}];
 opt.series=tr.series.map((s,i)=>({name:s.name,type:'line',data:s.values,connectNulls:false,showSymbol:tr.periods.length<30,symbolSize:5,lineStyle:{width:i?2:2.8},emphasis:{focus:'series'},itemStyle:{color:colors[i]},areaStyle:i?undefined:{color:'#087f73',opacity:.035}}));
 if(seasonBands&&!quarter&&opt.series.length){
  const bands=[];for(let y=+(tr.periods[0]||'2025').slice(0,4)-1;y<=+(tr.periods.at(-1)||'2025').slice(0,4);y++)for(const [ss,col] of [['verano','#f5eddc'],['invierno','#e7eff7']]){
   const dates=seasonMonths(y,ss).filter(p=>tr.periods.includes(p));if(dates.length>1)bands.push([{xAxis:dates[0],itemStyle:{color:col,opacity:.35}},{xAxis:dates.at(-1)}]);
  }
  opt.series[0].markArea={silent:true,label:{show:false},data:bands};
 }
 const note=(view==='index'?'Base 100: '+(tr.base?label(tr.base,quarter):'sin período común con valores positivos')+'. ':view==='yoy'?'Comparación con el mismo período del año anterior. ':view==='base2019'?'Mismo mes de 2019 = 100; meses sin base quedan vacíos. ':'')+(seasonBands&&!quarter?'Bandas: verano (dic.–feb.) e invierno (jun.–ago.). ':'')+'El zoom visual no cambia el período de los indicadores ni del CSV. Los faltantes interrumpen la línea.';
 return card({id,title,subtitle,metric,unit,basePeriod:tr.base,option:opt,columns:['Período',...series.map(s=>s.name)],rows:tr.periods.map((p,i)=>[label(p,quarter),...tr.series.map(s=>s.values[i])]),periodText:label(tr.periods[0],quarter)+' – '+label(tr.periods.at(-1),quarter),...rest,method:note+(rest.method?' '+rest.method:'')});
}
function barCard({id,title,subtitle,items,seriesNames=['Córdoba'],unit='',metric='viajeros',limit=10,onClick,...rest}){
 const shown=items.slice(0,limit),opt=commonOption();opt.grid={left:4,right:40,top:seriesNames.length>1?40:12,bottom:12,containLabel:true};opt.legend.show=seriesNames.length>1;opt.tooltip.formatter=p=>tooltipRows(p,unit);
 opt.xAxis={type:'value',axisLabel:{fontSize:9,color:'#7c909b',formatter:axisLabel},splitLine:{lineStyle:{color:'#edf1f4'}}};opt.yAxis={type:'category',inverse:true,data:shown.map(r=>r.name),axisLabel:{fontSize:10,color:'#4d6b7c',width:150,overflow:'truncate'},axisTick:{show:false},axisLine:{show:false}};
 opt.series=seriesNames.map((s,i)=>({name:s,type:'bar',barMaxWidth:14,data:shown.map(r=>({value:r.values[i],itemStyle:{color:r.highlight&&seriesNames.length===1?colors[0]:seriesNames.length===1?'#a3baca':colors[i],borderRadius:[0,3,3,0]}})),label:{show:seriesNames.length===1,position:'right',fontSize:9,color:'#597787',formatter:p=>valid(p.value)?fmt(p.value,unit==='%'?1:0):''},emphasis:{focus:'series'}}));
 return card({id,title,subtitle,metric,unit,option:opt,columns:['Categoría',...seriesNames],rows:items.map(r=>[r.name,...r.values]),onClick:onClick?params=>onClick(shown[params.dataIndex]):null,className:shown.length>8?'tall':'',...rest});
}
function paint(){
 for(const [id,c] of cards){
  const target=$('chart-'+id);if(!target)continue;
  const numbers=c.rows.flat().filter(valid);
  if(!numbers.length||!c.option){target.innerHTML='<div class="empty">'+esc(c.emptyText||'Sin datos comparables para esta selección. Revisá el período o los filtros.')+'</div>';continue;}
  c.option.aria={enabled:true,description:c.title+'. '+(c.subtitle||'')+'. Período: '+c.periodText+'. Unidad: '+(c.unit||specs[c.metric]?.[1]||'registros')+'. Consultá los valores con el botón Tabla.'};
  const chart=echarts.init(target,null,{renderer:'canvas'});charts.set(id,chart);chart.setOption(c.option);if(c.onClick)chart.on('click',c.onClick);if(c.onZoom)chart.on('datazoom',c.onZoom);
 }
}
function latestSeries(family){return D.sources.filter(s=>s.family===family).map(s=>s.latest_period).filter(Boolean).sort().at(-1);}
function rankItems(scopes,seriesGetter,ps,metric){return scopes.map(k=>({code:k,value:aggregate(seriesGetter(k),ps,metric)})).filter(r=>valid(r.value)).sort((a,b)=>b.value-a.value);}
function rankPosition(items,key){const item=items.find(r=>r.code===key);return item?1+items.filter(r=>r.value>item.value).length:null;}
function rangeCaption(ps){return ps.length>1?label(ps[0])+' – '+label(ps.at(-1)):label(ps[0]);}
function warnHistorical(family){const last=latestSeries(family);return last&&ordinal(new Date().toISOString().slice(0,7))-ordinal(last)>12?notice('Serie histórica · Disponible hasta: '+label(last,['eti','evyth'].includes(family)),'historical'):'';}
function renderDemand(){
 window.HotelDashboard.render({D,M,model,state,$,esc,fmt,signed,label,value,specs,field,compareFields,scopeOptions,scopeLabel,unique,section,notice,kpi,card,barCard,commonOption,axisLabel,tooltipRows,rangeCaption,render,setCurrent:c=>{current=c;},hotel:{MAX_SERIES,territories:hotelTerritories,level:hotelLevel,compare:hotelCompare,isReference:isHotelReference,name:hotelName,add:addCompare}});
}

function renderAir(){
 const selected=airPeriod(),latest=D.air.periods.at(-1);
 current={family:'air',quarter:false,period:selected.at(-1),latest};
 const data=model.air(state.direction,state.kind,state.carrier),get=k=>data[k]||[],val=k=>aggregate(get(k),selected,state.airMetric),scopes=airScopes(),caption=rangeCaption(selected);
 // Atajo: los 6 aeropuertos argentinos con más pasajeros en el período (sin Córdoba ni el total nacional).
 const top=rankItems(Object.keys(data).filter(k=>k!=='Argentina'&&k!=='SACO'&&D.air.airports[k]?.domestic),get,selected,'pasajeros').slice(0,6).map(r=>r.code);
 // 1. Franja: sentido, tráfico, aerolínea, comparadores y período.
 let controls=field('direction','Sentido del trayecto',[['salidas','Desde Córdoba · salidas'],['llegadas','Hacia Córdoba · llegadas'],['ambos','Llegadas + salidas']])+field('kind','Tipo de tráfico',[['all','Cabotaje + internacional'],['Cabotaje','Cabotaje'],['Internacional','Internacional']])+field('carrier','Aerolínea',[['all','Todas las aerolíneas'],...D.air.carriers.map((n,i)=>[String(i),n])]);
 controls+=chipCompare('airCompare',airportOptions().filter(([k])=>k!=='Argentina'&&k!=='SACO'),airCompareKeys(),airportLabel,[['Principales aeropuertos del país',top]]);
 controls+=field('airPreset','Período del análisis',[['latest','Último mes disponible'],['ytd','Acumulado del año'],['12','Últimos 12 meses'],['year','Año completo'],['custom','Personalizado']]);
 if(state.airPreset==='year')controls+=field('airYear','Año',airYears());
 if(state.airPreset==='custom')controls+=`<label class="field"><span>Desde</span><input type="month" data-key="airFrom" aria-label="Desde" min="${D.air.periods[0]}" max="${latest}" value="${selected[0]}"></label><label class="field"><span>Hasta</span><input type="month" data-key="airTo" aria-label="Hasta" min="${D.air.periods[0]}" max="${latest}" value="${selected.at(-1)}"></label>`;
 $('filters').innerHTML=controls;
 const local=field('airMetric','Indicador',['pasajeros','asientos','vuelos','ocupacion'].map(k=>[k,airMetricLabel(k)]))+field('view','Lectura de la evolución',[['index','Índice base 100'],['levels','Valores observados'],['yoy','Variación interanual (%)'],['base2019','Índice base 2019 (= 100)']]);
 const eligible=Object.keys(data).filter(k=>k!=='Argentina'&&aggregate(get(k),selected,'vuelos')>=+state.minFlights),ranking=rankItems(eligible,get,selected,state.airMetric),rank=rankPosition(ranking,'SACO'),c=val('SACO'),a=val('Argentina'),old=aggregate(get('SACO'),selected.map(previous),state.airMetric),share=state.airMetric!=='ocupacion',peer=airCompareKeys()[0];
 const coverageNote=selected.some(p=>!valid(at(get('SACO'),p).pasajeros))?' Cobertura parcial en Córdoba: el detalle suma solo los registros disponibles; los indicadores que requieren todos los meses quedan sin dato.':'';
 const denom=state.direction==='ambos'?'Llegadas + salidas en aeropuertos argentinos':state.direction==='salidas'?'Salidas desde aeropuertos argentinos':'Llegadas a aeropuertos argentinos';
 // Textos: el título nombra indicador y comparación; el subtítulo, ámbitos, período, sentido, tráfico y aerolínea.
 const ind=airMetricLabel(state.airMetric),indLow=ind.charAt(0).toLowerCase()+ind.slice(1),flowTxt={salidas:'salidas',llegadas:'llegadas',ambos:'llegadas y salidas'}[state.direction],trafficTxt=state.kind==='all'?'cabotaje + internacional':state.kind.toLowerCase(),carrierTxt=state.carrier==='all'?'todas las aerolíneas':D.air.carriers[+state.carrier],filt=flowTxt+' · '+trafficTxt+' · '+carrierTxt;
 const versus=n=>n>1?' y '+(n-1)+(n>2?' comparadores':' comparador'):'',who=keys=>keys.map(airportLabel).join(' / ');
 const kpis=kpi(airMetricLabel(state.airMetric)+' · aeropuerto de Córdoba',value(c,state.airMetric),peer?airportShort(peer)+': '+value(val(peer),state.airMetric):'Sin comparador',caption,true)+kpi('Variación interanual',valid(change(c,old))?signed(change(c,old))+' %':'Sin dato','Mismo período del año anterior',rangeCaption(selected.map(previous)))+kpi(share?'Participación nacional':'Brecha de factor de ocupación',share?value(ratio(c,a,100),'ocupacion'):valid(c)&&valid(a)?signed(c-a)+' pp':'Sin dato',denom,state.kind==='all'?'Cabotaje + internacional':state.kind)+kpi('Posición del aeropuerto',rank?rank+' de '+ranking.length:'Sin dato',airMetricLabel(state.airMetric)+' · '+(state.direction==='salidas'?'salidas':state.direction==='llegadas'?'llegadas':'ambas direcciones'),'Aeropuertos con al menos '+state.minFlights+' vuelos');
 let html=`<div class="hotel-range"><span><strong>${esc(caption)}</strong> · ${selected.length} ${selected.length>1?'meses':'mes'} · ${esc(filt)} · Fuente: ANAC (Administración Nacional de Aviación Civil), procesamiento Yvera</span></div>`+'<div class="kpis">'+kpis+'</div><div class="inline-controls">'+local+'</div>';
 // Evolución: el período elegido; si es un solo mes, los 24 meses que terminan en él.
 const trendPs=selected.length===1?months(month(ordinal(selected[0])-23),selected[0]):selected;
 html+=lineCard({id:'air-trend',title:ind+' por mes · Córdoba'+versus(scopes.length),subtitle:who(scopes)+' · '+(selected.length===1?'24 meses hasta '+label(selected[0]):caption)+' · '+filt,series:scopes.map(k=>({name:airportShort(k),rows:get(k).map(r=>({...r,value:r[state.airMetric]}))})),periods:trendPs,metric:state.airMetric,method:'Mismos sentido, tráfico y aerolínea. Últimos tres meses de la base provisorios. Los pasajeros no representan personas únicas.'});
 html+=section('Posicionamiento y red de conexiones',caption+' · '+filt);
 // 4. Frecuencia semanal: vuelos del período ÷ (días del período ÷ 7), con un decimal.
 const byWeekly=state.routeSort==='weekly',routeKey=byWeekly?'semanal':state.airMetric;
 const routes=model.routes('SACO',selected,state.direction,state.kind,state.carrier).filter(r=>{const a=D.air.airports[r.code];return (a.city+' '+a.name+' '+a.country+' '+r.code).toLowerCase().includes(state.routeSearch.toLowerCase());}).map(r=>({...r,semanal:M.weeklyFlights(r.vuelos,selected)})).sort((a,b)=>(b[routeKey]??-1)-(a[routeKey]??-1));
 const rankControls=field('minFlights','Mínimo de vuelos',[['0','Sin mínimo'],['30','30 vuelos'],['100','100 vuelos'],['500','500 vuelos']])+field('rankLimit','Cantidad visible',[['10','Primeros 10'],['20','Primeros 20'],['30','Primeros 30']]);
 const routeControls=field('routeSort','Ordenar por',[['metric',airMetricLabel(state.airMetric)],['weekly','Vuelos por semana']])+`<label class="field wide"><span>Buscar conexión</span><input data-key="routeSearch" value="${esc(state.routeSearch)}" placeholder="Destino, país o código" aria-label="Buscar conexión de Córdoba"></label>`;
 html+='<div class="grid equal">'+barCard({id:'airport-ranking',title:share?'Ranking de aeropuertos argentinos por '+indLow:'Aeropuertos según factor de ocupación',subtitle:(share?'':'pasajeros ÷ asientos ofrecidos · no mide tamaño: aeropuertos chicos con pocas frecuencias suelen ir más llenos · ')+caption+' · '+filt+(rank?' · Córdoba: '+rank+' de '+ranking.length:''),controls:rankControls,items:ranking.map(r=>({code:r.code,name:(1+ranking.filter(x=>x.value>r.value).length)+'. '+airportLabel(r.code),values:[r.value],highlight:r.code==='SACO'})),seriesNames:[airMetricLabel(state.airMetric)],metric:state.airMetric,unit:specs[state.airMetric][1],limit:+state.rankLimit,periodText:caption,method:'Universo: '+ranking.length+' aeropuertos con dato y al menos '+state.minFlights+' vuelos en el período. '+denom+'. Clic agrega un comparador.',onClick:r=>{if(r.code!=='SACO')addAirCompare(r.code);}})+barCard({id:'routes',title:(state.direction==='salidas'?'Destinos de los vuelos desde Córdoba':state.direction==='llegadas'?'Orígenes de los vuelos hacia Córdoba':'Conexiones del aeropuerto de Córdoba')+' por '+(byWeekly?'vuelos por semana':indLow),subtitle:'Córdoba · SACO · '+caption+' · '+filt+(state.routeSearch?' · búsqueda: '+state.routeSearch:''),controls:routeControls,items:routes.map(r=>({name:D.air.airports[r.code].city+' · '+r.code,values:[r[routeKey]]})),seriesNames:[byWeekly?'Vuelos por semana':airMetricLabel(state.airMetric)],metric:byWeekly?'vuelos':state.airMetric,unit:byWeekly?'vuelos por semana':specs[state.airMetric][1],limit:+state.rankLimit,periodText:caption,columns:['Conexión',airMetricLabel(state.airMetric),'Vuelos por semana'],digits:[null,state.airMetric==='ocupacion'?1:0,1],rows:routes.map(r=>[D.air.airports[r.code].city+' · '+r.code,r[state.airMetric],r.semanal]),method:'Tramos inmediatos, que pueden ser escalas. Rutas del aeropuerto de Córdoba; los comparadores aeroportuarios no se aplican a este detalle. Tabla y CSV incluyen todas las conexiones de la selección. Vuelos por semana: vuelos del período ÷ (días del período ÷ 7). Promedio del período; no distingue días de la semana.'+coverageNote})+'</div>';
 html+=routeChanges(selected,filt);
 html+=intlConnectivity(selected);
 const mix=scopes.map(k=>({name:airportShort(k),values:['Cabotaje','Internacional'].map(kind=>aggregate(model.air(state.direction,kind,state.carrier)[k]||[],selected,state.airMetric))}));
 html+='<div class="grid equal">'+barCard({id:'air-mix',title:ind+' de cabotaje e internacional · Córdoba'+versus(scopes.length),subtitle:who(scopes)+' · '+caption+' · '+flowTxt+' · '+carrierTxt+' · ambos tipos de tráfico',items:mix,seriesNames:['Cabotaje','Internacional'],metric:state.airMetric,unit:specs[state.airMetric][1],periodText:caption,method:'Los dos segmentos se muestran juntos para comparar su escala, con el mismo sentido y aerolínea. Este gráfico desagrega ambos segmentos independientemente del selector de tráfico.'})+carrierShare(selected,flowTxt,trafficTxt)+'</div>';
 html+=carrierTrend(trendPs,selected,flowTxt,trafficTxt);
 $('dashboard').innerHTML=html;
}
// 9. Conectividad internacional directa: Córdoba y comparadores, siempre con tráfico internacional.
function intlConnectivity(selected){
 const keys=airScopes(),metricKey=state.airIntlMetric,names={destinos:'Destinos internacionales regulares',asientos:'Asientos internacionales ofrecidos',pasajeros:'Pasajeros internacionales'};
 const stats=keys.map(k=>{const rs=model.routeRegularity(k,selected,state.direction,'Internacional',state.carrier),reg=rs.filter(r=>r.regular).sort((a,b)=>b.vuelos-a.vuelos);
  return {code:k,destinos:reg.length,asientos:rs.reduce((s,r)=>s+r.asientos,0),pasajeros:rs.reduce((s,r)=>s+r.pasajeros,0),reg};});
 const items=stats.slice().sort((a,b)=>b[metricKey]-a[metricKey]).map(r=>({code:r.code,name:airportLabel(r.code),values:[r[metricKey]],highlight:r.code==='SACO'}));
 const place=k=>(D.air.airports[k]?.city||k)+' · '+k+(D.air.airports[k]?.country?' ('+D.air.airports[k].country+')':'');
 const detail='<div class="intl-detail">'+stats.map(r=>`<details><summary>${esc(airportLabel(r.code))} · ${r.reg.length} ${r.reg.length===1?'destino regular':'destinos regulares'}</summary>${r.reg.length?'<ul>'+r.reg.map(d=>`<li>${esc(place(d.code))} · ${esc(fmt(M.weeklyFlights(d.vuelos,selected),1))} vuelos por semana</li>`).join('')+'</ul>':'<p>Sin destinos internacionales regulares en el período.</p>'}</details>`).join('')+'</div>';
 const hint=keys.length===1?notice('Agregá aeropuertos en Comparar con para ver la conectividad internacional de otros aeropuertos junto a Córdoba.'):'';
 const flowTxt={salidas:'salidas',llegadas:'llegadas',ambos:'llegadas y salidas'}[state.direction],carrierTxt=state.carrier==='all'?'todas las aerolíneas':D.air.carriers[+state.carrier];
 return barCard({id:'air-intl',title:names[metricKey]+' · Córdoba'+(keys.length>1?' y '+(keys.length-1)+(keys.length>2?' comparadores':' comparador'):''),subtitle:keys.map(airportLabel).join(' / ')+' · '+rangeCaption(selected)+' · '+flowTxt+' · tráfico internacional · '+carrierTxt,controls:field('airIntlMetric','Magnitud',[['destinos','Destinos regulares'],['asientos','Asientos ofrecidos'],['pasajeros','Pasajeros']]),items,seriesNames:[names[metricKey]],metric:metricKey==='destinos'?'vuelos':metricKey,unit:metricKey==='destinos'?'destinos':specs[metricKey][1],limit:MAX_SERIES,periodText:rangeCaption(selected),columns:['Aeropuerto','Destinos internacionales regulares','Asientos internacionales','Pasajeros internacionales'],rows:stats.map(r=>[airportLabel(r.code),r.destinos,r.asientos,r.pasajeros]),extra:hint+detail,method:'Calculado desde las rutas con tráfico internacional de cada aeropuerto: para esta tarjeta la referencia es siempre el tráfico internacional, aunque el selector de tráfico esté en Cabotaje. Mismo sentido y aerolínea. Destino regular: al menos 4 vuelos en al menos la mitad de los meses del período (6 de 12). Asientos y pasajeros incluyen todos los vuelos internacionales del período, regulares o no. Vuelos por semana: promedio del período; no distingue días de la semana.'});
}
// 8. Aerolíneas en Córdoba: participación (período vs. año anterior) y evolución mensual apilada.
// Las participaciones usan todas las aerolíneas; el factor de ocupación no se suma, así que esas tarjetas usan pasajeros.
const carrierMetric=()=>['pasajeros','asientos','vuelos'].includes(state.airMetric)?state.airMetric:'pasajeros';
const TOP_CARRIERS=8,TREND_CARRIERS=5;
function carrierShare(selected,flowTxt,trafficTxt){
 const metric=carrierMetric(),before=selected.map(previous);
 const now=model.routes('SACO',selected,state.direction,state.kind,'all','carrier').sort((a,b)=>b[metric]-a[metric]),old=model.routes('SACO',before,state.direction,state.kind,'all','carrier');
 const total=list=>list.reduce((s,r)=>s+r[metric],0),tn=total(now),to=total(old),top=now.slice(0,TOP_CARRIERS).map(r=>r.code);
 const pick=(list,code)=>code==='otras'?list.filter(r=>!top.includes(r.code)):list.filter(r=>r.code===code);
 const items=[...top,...(now.length>TOP_CARRIERS||old.some(r=>!top.includes(r.code))?['otras']:[])].map(code=>{
  const a=pick(now,code),b=pick(old,code),sumOf=(xs,k)=>xs.reduce((s,r)=>s+r[k],0);
  const shareNow=ratio(sumOf(a,metric),tn,100),shareOld=to>0?ratio(sumOf(b,metric),to,100)??0:null;
  return {code,name:code==='otras'?'Otras':D.air.carriers[+code],pasajeros:sumOf(a,'pasajeros'),vuelos:sumOf(a,'vuelos'),values:[shareNow,shareOld],diff:valid(shareNow)&&valid(shareOld)?shareNow-shareOld:null,highlight:code===state.carrier};
 });
 return barCard({id:'carrier-share',title:'Participación de las aerolíneas en Córdoba',subtitle:'Córdoba · SACO · % de '+specs[metric][0].toLowerCase()+' · '+rangeCaption(selected)+' frente a '+rangeCaption(before)+' · '+flowTxt+' · '+trafficTxt,items,seriesNames:['Período actual','Mismo período del año anterior'],metric:'ocupacion',unit:'%',limit:TOP_CARRIERS+1,periodText:rangeCaption(selected)+' y '+rangeCaption(before),columns:['Aerolínea','Pasajeros','Vuelos','Participación actual (%)','Participación anterior (%)','Diferencia (pp)'],rows:items.map(r=>[r.name,r.pasajeros,r.vuelos,r.values[0],r.values[1],r.diff]),digits:[null,0,0,1,1,1],method:'Participación de cada aerolínea en '+specs[metric][0].toLowerCase()+' del aeropuerto de Córdoba, con el mismo sentido y tráfico y todas las aerolíneas (el filtro de aerolínea no se aplica aquí). Las aerolíneas fuera de las '+TOP_CARRIERS+' principales del período se agrupan en «Otras». La diferencia se expresa en puntos porcentuales. Clic en una aerolínea para aplicar el filtro.'+(metric!==state.airMetric?' El factor de ocupación no se suma: estas participaciones usan pasajeros.':''),onClick:r=>{if(r.code!=='otras'){state.carrier=r.code;render();}}});
}
function carrierTrend(ps,selected,flowTxt,trafficTxt){
 const metric=carrierMetric(),share=state.airCarrierView==='share',list=model.carrierMonthly('SACO',ps,state.direction,state.kind);
 const ranked=model.carrierMonthly('SACO',selected,state.direction,state.kind).sort((a,b)=>b[metric]-a[metric]),top=ranked.slice(0,TREND_CARRIERS).map(r=>r.code);
 const valueAt=(rs,p)=>rs.reduce((s,r)=>s+(r.months[p]?.[metric]||0),0),monthTotal=p=>valueAt(list,p);
 const groups=[...top.map(code=>({name:D.air.carriers[+code],rows:list.filter(r=>r.code===code)})),{name:'Otras',rows:list.filter(r=>!top.includes(r.code))}];
 const series=groups.map(g=>({name:g.name,values:ps.map(p=>{const v=valueAt(g.rows,p),t=monthTotal(p);return share?ratio(v,t,100):t>0?v:null;})}));
 const unit=share?'%':specs[metric][1],opt=commonOption();
 opt.tooltip.formatter=p=>tooltipRows(p,unit);
 opt.xAxis={type:'category',boundaryGap:false,data:ps,axisLabel:{formatter:p=>label(p),fontSize:9,color:'#7a8d98',hideOverlap:true},axisTick:{show:false},axisLine:{lineStyle:{color:'#dfe7eb'}}};
 opt.yAxis={type:'value',max:share?100:undefined,name:share?'% del total':unit,nameTextStyle:{fontSize:9,color:'#82949d',align:'left'},axisLabel:{formatter:axisLabel,fontSize:9,color:'#7a8d98'},splitLine:{lineStyle:{color:'#edf1f4'}}};
 opt.series=series.map((s,i)=>({name:s.name,type:'line',stack:'total',data:s.values,showSymbol:false,lineStyle:{width:1},areaStyle:{opacity:.75},emphasis:{focus:'series'},itemStyle:{color:i===series.length-1?'#a3baca':colors[i]}}));
 const controls=field('airCarrierView','Lectura',[['levels','Valores'],['share','Participación (%)']]);
 return card({id:'carrier-trend',title:'Evolución mensual por aerolínea · '+specs[metric][0].toLowerCase()+' en Córdoba',subtitle:'Córdoba · SACO · '+(selected.length===1?'24 meses hasta '+label(selected[0]):rangeCaption(ps))+' · '+flowTxt+' · '+trafficTxt+' · '+TREND_CARRIERS+' principales del período y Otras',controls,option:opt,metric:share?'ocupacion':metric,unit,periodText:rangeCaption(ps),columns:['Período',...series.map(s=>s.name)],rows:ps.map((p,i)=>[label(p),...series.map(s=>s.values[i])]),digits:share?[null,...series.map(()=>1)]:null,method:'Participación sobre el total del aeropuerto de Córdoba con el mismo sentido y tráfico. Áreas apiladas: '+TREND_CARRIERS+' aerolíneas con mayor '+specs[metric][0].toLowerCase()+' en el período elegido y «Otras». El filtro de aerolínea no se aplica a este gráfico.'+(metric!==state.airMetric?' El factor de ocupación no se suma: se usan pasajeros.':'')});
}
// 3. Rutas regulares ganadas y perdidas: período elegido frente al mismo período del año anterior.
function routeChanges(selected,filt){
 const before=selected.map(previous),cmp=M.classifyRoutes(model.routeRegularity('SACO',selected,state.direction,state.kind,state.carrier),model.routeRegularity('SACO',before,state.direction,state.kind,state.carrier));
 const placeName=k=>(D.air.airports[k]?.city||k)+' · '+k,limitN=10;
 const gained=cmp.gained.sort((a,b)=>b.pasajeros-a.pasajeros),lost=cmp.lost.sort((a,b)=>b.pasajeros-a.pasajeros);
 const shown=[...gained.slice(0,limitN).map(r=>({...r,kind:'Nueva',value:r.pasajeros})),...lost.slice(0,limitN).map(r=>({...r,kind:'Perdida',value:-r.pasajeros}))];
 const opt=commonOption();opt.legend.show=false;opt.grid={left:4,right:40,top:12,bottom:12,containLabel:true};
 opt.tooltip={trigger:'item',confine:true,formatter:p=>{const r=shown[p.dataIndex];return '<strong>'+esc(placeName(r.code))+'</strong><br>'+r.kind+' · '+fmt(r.pasajeros)+' pasajeros · '+fmt(r.vuelos)+' vuelos ('+(r.kind==='Nueva'?rangeCaption(selected):rangeCaption(before))+')';}};
 opt.xAxis={type:'value',axisLabel:{fontSize:9,color:'#7c909b',formatter:x=>axisLabel(Math.abs(x))},splitLine:{lineStyle:{color:'#edf1f4'}}};
 opt.yAxis={type:'category',inverse:true,data:shown.map(r=>(r.kind==='Nueva'?'+ ':'− ')+placeName(r.code)),axisLabel:{fontSize:10,color:'#4d6b7c',width:170,overflow:'truncate'},axisTick:{show:false},axisLine:{show:false}};
 opt.series=[{type:'bar',barMaxWidth:14,data:shown.map(r=>({value:r.value,itemStyle:{color:r.kind==='Nueva'?colors[0]:'#c0506a',borderRadius:r.kind==='Nueva'?[0,3,3,0]:[3,0,0,3]}})),label:{show:true,position:'right',fontSize:9,color:'#597787',formatter:p=>fmt(Math.abs(p.value))}}];
 const rows=[...gained.map(r=>[placeName(r.code),'Nueva',r.pasajeros,r.vuelos,rangeCaption(selected)]),...lost.map(r=>[placeName(r.code),'Perdida',r.pasajeros,r.vuelos,rangeCaption(before)])];
 return card({id:'air-route-changes',title:'Rutas regulares ganadas y perdidas',subtitle:'Córdoba · SACO · '+rangeCaption(selected)+' frente a '+rangeCaption(before)+' · '+filt+' · '+gained.length+(gained.length===1?' nueva':' nuevas')+' · '+lost.length+(lost.length===1?' perdida':' perdidas')+' · '+cmp.kept.length+(cmp.kept.length===1?' se mantiene':' se mantienen'),option:shown.length?opt:null,unit:'pasajeros',metric:'pasajeros',className:shown.length>8?'tall':'',columns:['Ruta','Estado','Pasajeros','Vuelos','Período de los valores'],rows,periodText:rangeCaption(selected)+' y '+rangeCaption(before),emptyText:'Sin rutas regulares ganadas ni perdidas entre ambos períodos.',method:'Ruta regular: al menos 4 vuelos en al menos '+M.regularThreshold(selected.length)+' de los '+selected.length+' meses del período (6 de 12; en períodos más cortos, la mitad de los meses). Nueva: regular en el período y no en el mismo período del año anterior; perdida: al revés. Pasajeros y vuelos de las nuevas corresponden al período actual; los de las perdidas, al anterior. Los vuelos ocasionales no alcanzan el umbral. Mismo sentido, tráfico y aerolínea. El gráfico muestra hasta 10 de cada grupo; la tabla, todas.'});
}
function renderSeason(){
 const hotel=state.seasonData==='hotel';current={family:hotel?'eoh':'air',quarter:false};
 let controls=field('seasonData','Fuente del patrón',[['hotel','Demanda hotelera · EOH'],['air','Conectividad aérea · ANAC']]);
 let focus,scopes,universe,get,name;
 if(hotel){
  controls+=field('seasonLevel','Escala territorial',[['localidad','Localidades relevadas'],['region','Regiones turísticas']]);
  if(state.seasonLevel==='localidad')controls+=field('seasonCity','Destino de Córdoba',Object.entries(D.eoh.scope_meta).filter(([,m])=>m.cordoba).map(([k,m])=>[k,m.label]));
  focus=state.seasonLevel==='region'?'Córdoba':state.seasonCity;controls+=compareFields('seasonCompare',scopeOptions(state.seasonLevel),focus);
  scopes=unique([focus,state.seasonCompare1,state.seasonCompare2]);universe=Object.keys(D.eoh.scope_meta).filter(k=>D.eoh.scope_meta[k].level===state.seasonLevel);name=scopeLabel;
 }else{
  controls+=field('direction','Sentido del trayecto',[['salidas','Salidas'],['llegadas','Llegadas'],['ambos','Llegadas + salidas']])+field('kind','Tráfico',[['all','Cabotaje + internacional'],['Cabotaje','Cabotaje'],['Internacional','Internacional']]);
  controls+=chipCompare('airCompare',airportOptions().filter(([k])=>k!=='Argentina'&&k!=='SACO'),airCompareKeys(),airportLabel);focus='SACO';scopes=airScopes();name=airportShort;
 }
 const metricControl=field('seasonMetric','Indicador',metricOptions(hotel?['pernoctes','viajeros']:['pasajeros','asientos','vuelos']));
 if(hotel)get=k=>model.eoh(k,state.seasonMetric,'total');else{const a=model.air(state.direction,state.kind,'all');get=k=>(a[k]||[]).map(r=>({...r,value:r[state.seasonMetric]}));universe=Object.keys(a).filter(k=>k!=='Argentina');}
 current.latest=get(focus).map(r=>r.period).sort().at(-1);current.period=current.latest;
 const years=unique(get(focus).map(r=>r.period.slice(0,4))).sort().reverse();controls+=field('seasonYear','Año de análisis',years);$('filters').innerHTML=controls;
 const normalized=state.seasonView==='share',year=+state.seasonYear,ps=seasonMonths(year,state.seasonPeriod),profile=model.profile(get(focus),year,normalized),rawProfile=model.profile(get(focus),year,false),selectedValue=sum(ps.map(p=>at(get(focus),p).value));
 const rank=universe.map(k=>({code:k,value:sum(ps.map(p=>at(get(k),p).value))})).filter(r=>valid(r.value)).sort((a,b)=>b.value-a.value),pos=rankPosition(rank,focus),max=Math.max(...rawProfile.values.filter(valid)),peak=rawProfile.values.indexOf(max),seasonName={verano:'Verano '+(year-1)+'/'+year,otono:'Otoño '+year,invierno:'Invierno '+year,primavera:'Primavera '+year,year:'Año '+year}[state.seasonPeriod];
 let html='<div class="kpis">'+kpi(specs[state.seasonMetric][0]+' · '+name(focus),value(selectedValue,state.seasonMetric),seasonName,rangeCaption(ps),true)+kpi('Posición en la temporada',pos?pos+' de '+rank.length:'Sin dato',hotel?(state.seasonLevel==='region'?'Regiones turísticas':'Localidades relevadas'):'Aeropuertos argentinos','Solo ámbitos con todos los meses de la temporada')+kpi('Mes de mayor actividad',peak>=0?monthNames[peak]+' '+year:'Sin dato',peak>=0?value(max,state.seasonMetric):'Sin dato','Entre '+profile.complete+' meses con datos del año')+kpi('Concentración en el mes máximo',profile.complete===12?value(ratio(max,profile.total,100),'ocupacion'):'Año incompleto','Porcentaje del total anual de '+name(focus),'Requiere los 12 meses observados')+'</div>';
 html+='<div class="inline-controls">'+metricControl+field('seasonView','Lectura del patrón',[['share','Porcentaje del total anual'],['levels','Valores observados']])+field('seasonPeriod','Temporada del ranking',[['invierno','Invierno · junio a agosto'],['verano','Verano · diciembre a febrero'],['otono','Otoño · marzo a mayo'],['primavera','Primavera · septiembre a noviembre'],['year','Año completo']])+'</div>';
 if(normalized&&scopes.some(k=>model.profile(get(k),year,false).complete!==12))html+=notice('Año incompleto: porcentajes anuales no disponibles en las series con meses faltantes.','historical');
 const opt=commonOption(),unit=normalized?'%':specs[state.seasonMetric][1];opt.grid.bottom=35;opt.tooltip.formatter=p=>tooltipRows(p,unit);opt.xAxis={type:'category',data:monthNames,boundaryGap:false,axisLabel:{fontSize:10,color:'#758e9c'},axisTick:{show:false},axisLine:{lineStyle:{color:'#dfe8ee'}}};opt.yAxis={type:'value',name:normalized?'% del año':unit,nameTextStyle:{fontSize:9,color:'#78919f'},axisLabel:{formatter:axisLabel,fontSize:9},splitLine:{lineStyle:{color:'#edf2f5'}}};
 const profs=scopes.map(k=>model.profile(get(k),year,normalized));opt.series=scopes.map((k,i)=>({name:name(k),type:'line',data:profs[i].values,connectNulls:false,symbolSize:7,lineStyle:{width:i?2:3},emphasis:{focus:'series'}}));
 opt.series[0].markArea={silent:true,itemStyle:{opacity:.3},data:[[{xAxis:'Ene',itemStyle:{color:'#f4e8c8'}},{xAxis:'Feb'}],[{xAxis:'Jun',itemStyle:{color:'#e2ecf5'}},{xAxis:'Ago'}]]};
 html+='<div class="grid">'+card({id:'season-profile',title:'Patrón mensual de '+specs[state.seasonMetric][0].toLowerCase(),subtitle:scopes.map(name).join(' / ')+' · '+year,option:opt,metric:normalized?'ocupacion':state.seasonMetric,columns:['Mes',...scopes.map(name)],rows:monthNames.map((m,i)=>[m+' '+year,...profs.map(p=>p.values[i])]),periodText:'Enero a diciembre de '+year,method:normalized?'Cada mes se divide por el total anual de su propio destino. Permite comparar la concentración estacional entre ámbitos de distinto tamaño. Sin interpolaciones.':'Valores mensuales observados. Bandas: enero–febrero (verano) y junio–agosto (invierno). Los faltantes interrumpen la línea.'})+barCard({id:'season-ranking',title:'Ranking de '+specs[state.seasonMetric][0].toLowerCase()+' · '+seasonName,subtitle:'Suma de los meses de la temporada · '+(hotel?(state.seasonLevel==='region'?'regiones':'localidades'):'aeropuertos'),items:rank.map(r=>({code:r.code,name:(1+rank.filter(x=>x.value>r.value).length)+'. '+name(r.code),values:[r.value],highlight:r.code===focus})),seriesNames:[specs[state.seasonMetric][0]],metric:state.seasonMetric,limit:10,periodText:rangeCaption(ps),method:'Mismo indicador y mismos meses. Se excluyen ámbitos con datos incompletos. El verano cruza dos años: diciembre del anterior y enero–febrero del seleccionado. La tabla incluye todos los destinos con cobertura.'})+'</div>';
 const totalRank=universe.map(k=>({code:k,total:model.profile(get(k),year,false).total})).filter(r=>valid(r.total)).sort((a,b)=>b.total-a.total);
 const heatKeys=unique([focus,...scopes.filter(k=>k!=='Argentina'),...totalRank.slice(0,10).map(r=>r.code)]).slice(0,14),heatProfiles=heatKeys.map(k=>model.profile(get(k),year,normalized)),heatValues=heatProfiles.flatMap((r,y)=>r.values.flatMap((v,x)=>valid(v)?[[x,y,v]]:[]));
 const heat=commonOption();heat.legend.show=false;heat.grid={left:4,right:15,top:12,bottom:65,containLabel:true};heat.tooltip={position:'top',confine:true,formatter:p=>esc(name(heatKeys[p.value[1]]))+' · '+monthNames[p.value[0]]+' '+year+'<br><strong>'+fmt(p.value[2],normalized?1:0)+(normalized?' %':'')+'</strong>'};heat.xAxis={type:'category',data:monthNames,splitArea:{show:true},axisLabel:{fontSize:10},axisTick:{show:false}};heat.yAxis={type:'category',data:heatKeys.map(name),inverse:true,splitArea:{show:true},axisLabel:{fontSize:10,width:145,overflow:'truncate'},axisTick:{show:false}};heat.visualMap={min:0,max:Math.max(...heatValues.map(v=>v[2]),1),calculable:true,orient:'horizontal',left:'center',bottom:2,itemWidth:12,itemHeight:140,inRange:{color:['#eef5f2','#b8d9ce','#5aa78f','#126d58']},textStyle:{fontSize:9},formatter:v=>fmt(v,normalized?1:0)+(normalized?'%':'')};heat.series=[{type:'heatmap',data:heatValues,itemStyle:{borderColor:'#fff',borderWidth:2,borderRadius:2},label:{show:window.innerWidth>700,formatter:p=>fmt(p.value[2],normalized?1:0),fontSize:9,color:'#204e40'},emphasis:{itemStyle:{borderColor:'#163f49',borderWidth:2}}}];
 html+=card({id:'season-heat',title:'Calendario de intensidad turística',subtitle:(normalized?'Participación de cada mes en el total anual':'Valores observados por mes')+' · '+year,option:heat,metric:normalized?'ocupacion':state.seasonMetric,className:'heat',columns:['Destino',...monthNames],rows:heatKeys.map((k,i)=>[name(k),...heatProfiles[i].values]),periodText:'Enero a diciembre de '+year,method:'Córdoba, comparadores y principales destinos por volumen anual, hasta 14 filas. Celdas vacías: sin dato o año incompleto para calcular porcentajes. '+(hotel?'Las localidades no se suman para estimar provincias.':'Todas las aerolíneas; mismo sentido y tipo de tráfico.')});
 $('dashboard').innerHTML=html;
}
function renderInternational(){
 current={family:'eti',quarter:true};const gates=['Aep. Córdoba','Aep. Mendoza','Ezeiza y Aeroparque'];
 let controls=field('flow','Sentido turístico',[['emisivo','Emisivo · viajes al exterior'],['receptivo','Receptivo · visitas a Argentina']])+compareFields('intlCompare',gates.map(k=>[k,gateLabel(k)]),'Aep. Córdoba');
 const local=field('intlMetric','Indicador',metricOptions(['turistas','pernoctes','estadia_media','gasto_por_turista_usd','gasto_diario_usd']))+field('view','Lectura de la evolución',[['index','Índice base 100'],['levels','Valores observados'],['yoy','Variación interanual (%)']]);
 const get=k=>model.international(k,state.flow,state.intlMetric),ps=selectPeriod(get('Aep. Córdoba')),p=current.period,scopes=intlScopes();$('filters').innerHTML=controls+dateFields(ps);
 const totals=k=>at(model.international(k,state.flow,'turistas'),p).value,co=at(get('Aep. Córdoba'),p).value,peer=scopes[1],pc=change(co,at(get('Aep. Córdoba'),previous(p)).value),spend=at(model.international('Aep. Córdoba',state.flow,'gasto_por_turista_usd'),p).value;
 let html=warnHistorical('eti')+'<div class="kpis">'+kpi(specs[state.intlMetric][0]+' · paso Córdoba',value(co,state.intlMetric),peer?gateLabel(peer)+': '+value(at(get(peer),p).value,state.intlMetric):'Sin comparador',label(p,true),true)+kpi('Variación interanual',valid(pc)?signed(pc)+' %':'Sin dato','Mismo trimestre del año anterior',label(previous(p),true))+kpi('Turistas · paso Córdoba',fmt(totals('Aep. Córdoba')),state.flow==='emisivo'?'Residentes en Argentina que viajan al exterior':'Residentes en el exterior que visitan Argentina','Residencia provincial sin identificar')+kpi('Gasto por turista',value(spend,'gasto_por_turista_usd'),state.flow==='emisivo'?'Durante el viaje al exterior':'Durante el viaje en Argentina','USD · promedio trimestral')+'</div><div class="inline-controls">'+local+'</div>';
 const markets=D.international.markets.filter(r=>r.gateway==='Aep. Córdoba'&&r.flow===state.flow&&r.period===p).sort((a,b)=>(b.turistas??-1)-(a.turistas??-1));
 html+='<div class="grid">'+lineCard({id:'intl-trend',title:specs[state.intlMetric][0]+' · turismo '+state.flow+' por paso aeroportuario',subtitle:scopes.map(gateLabel).join(' / '),series:scopes.map(k=>({name:gateLabel(k),rows:get(k)})),metric:state.intlMetric,quarter:true,seasonBands:false,method:'Los pasos seleccionados no constituyen el total nacional.'})+barCard({id:'intl-markets',title:state.flow==='emisivo'?'Destinos de los viajes al exterior por Córdoba':'Mercados de residencia por el paso Córdoba',subtitle:'Turistas · '+label(p,true),items:markets.map(r=>({name:r.market,values:[r.turistas]})),seriesNames:['Turistas'],metric:'turistas',method:'Agrupaciones publicadas para Córdoba. Las categorías geográficas varían entre pasos; se conserva la desagregación propia de este aeropuerto. Tabla y CSV conservan los faltantes.'})+'</div>';
 const motives=unique(D.international.motives.filter(r=>r.flow===state.flow).map(r=>r.motive));
 html+='<div class="grid equal">'+barCard({id:'intl-motives',title:'Motivo principal del viaje · comparación por paso',subtitle:'Turistas · '+label(p,true),items:motives.map(m=>({name:m,values:scopes.map(g=>D.international.motives.find(r=>r.period===p&&r.gateway===g&&r.flow===state.flow&&r.motive===m)?.turistas??null)})),seriesNames:scopes.map(gateLabel),metric:'turistas',method:'Las categorías sin estimación publicada permanecen sin dato. El total de turistas se obtiene de la serie por mercados, no de sumar motivos incompletos.'})+barCard({id:'intl-spend',title:'Gasto medio por turista · comparación por paso',subtitle:'Dólares estadounidenses · '+label(p,true),items:scopes.map(g=>({name:gateLabel(g),values:[at(model.international(g,state.flow,'gasto_por_turista_usd'),p).value],highlight:g==='Aep. Córdoba'})),seriesNames:['USD por turista'],unit:'USD',metric:'gasto_por_turista_usd',method:state.flow==='emisivo'?'Gasto durante el viaje al exterior. No es gasto turístico realizado en Córdoba.':'Gasto durante el viaje en Argentina. No es gasto exclusivamente realizado en Córdoba.'})+'</div>';
 $('dashboard').innerHTML=html;
}
function renderInternal(){
 current={family:'evyth',quarter:true};
 let controls=compareFields('internalCompare',Object.keys(D.internal.scopes).map(k=>[k,k]),'Córdoba');
 const local=field('internalMetric','Indicador',metricOptions(['turistas','pernoctes','estadia_media','gasto_promedio_ars','gasto_total_ars']))+field('view','Lectura de la evolución',[['index','Índice base 100'],['levels','Valores observados'],['yoy','Variación interanual (%)']]);
 const get=k=>(D.internal.scopes[k]||[]).map(r=>({...r,value:r[state.internalMetric]})),ps=selectPeriod(get('Córdoba')),p=current.period,scopes=internalScopes();$('filters').innerHTML=controls+dateFields(ps);
 const c=at(D.internal.scopes['Córdoba'],p),a=at(D.internal.scopes.Argentina,p),peer=scopes[1];
 let html=warnHistorical('evyth')+'<div class="kpis">'+kpi(specs[state.internalMetric][0]+' · destino Córdoba',value(c[state.internalMetric],state.internalMetric),peer?peer+': '+value(at(get(peer),p).value,state.internalMetric):'Sin comparador',label(p,true),true)+kpi('Participación en turistas',value(ratio(c.turistas,a.turistas,100),'ocupacion'),'Sobre el total de destinos nacionales','Universo de la EVyTH')+kpi('Estadía media en Córdoba',value(c.estadia_media,'estadia_media'),'Argentina: '+value(a.estadia_media,'estadia_media'),'Incluye distintos tipos de alojamiento')+kpi('Gasto medio por turista',value(c.gasto_promedio_ars,'gasto_promedio_ars'),'Argentina: '+value(a.gasto_promedio_ars,'gasto_promedio_ars'),'Pesos corrientes del trimestre')+'</div><div class="inline-controls">'+local+'</div>';
 const rank=Object.keys(D.internal.scopes).filter(k=>k!=='Argentina').map(k=>({code:k,value:at(get(k),p).value})).filter(r=>valid(r.value)).sort((a,b)=>b.value-a.value);
 html+='<div class="grid">'+lineCard({id:'internal-trend',title:specs[state.internalMetric][0]+' del turismo interno · evolución por destino',subtitle:scopes.join(' / '),series:scopes.map(k=>({name:k,rows:get(k)})),metric:state.internalMetric,quarter:true,seasonBands:false,method:'Residentes de los grandes aglomerados urbanos relevados, en viajes dentro de Argentina.'})+barCard({id:'internal-ranking',title:specs[state.internalMetric][0]+' por región de destino',subtitle:label(p,true)+' · Córdoba destacada',items:rank.map(r=>({name:r.code,values:[r.value],highlight:r.code==='Córdoba'})),seriesNames:[specs[state.internalMetric][0]],metric:state.internalMetric,unit:specs[state.internalMetric][1],limit:10,method:'Ocho regiones de destino mutuamente excluyentes. Los promedios nacionales se calculan ponderando por turistas; no se promedian las tasas regionales.'})+'</div>';
 html+=barCard({id:'quintiles',title:'Turistas según quintil de ingresos del hogar · Argentina',subtitle:'Total nacional · '+label(p,true),items:D.internal.quintiles.filter(r=>r.period===p).map(r=>({name:r.group,values:[r.turistas]})),seriesNames:['Turistas'],metric:'turistas',method:'Este recurso solo tiene apertura nacional. Los comparadores territoriales no se aplican; no identifica el perfil de visitantes de Córdoba ni el mercado premium.'});
 $('dashboard').innerHTML=html;
}
function renderQuality(){
 current={family:'quality',quarter:false,period:D.quality.latest_date.slice(0,7),latest:D.quality.latest_date.slice(0,7)};
 $('filters').innerHTML=field('qualityCompare','Comparar programas de Córdoba con',Object.keys(D.quality.counts).filter(k=>k!=='Córdoba').sort().map(k=>[k,k]));
 const co=D.quality.counts['Córdoba'],ar=D.quality.counts.Argentina,peer=state.qualityCompare,programs=unique(D.quality.programs.filter(r=>['Córdoba',peer].includes(r.scope)).map(r=>r.program));
 let html=notice('Registro histórico · Última fecha: '+D.quality.latest_date.split('-').reverse().join('/'),'historical');
 html+='<div class="kpis">'+kpi('Distinciones · Córdoba',fmt(co),peer+': '+fmt(D.quality.counts[peer]),'Registros deduplicados',true)+kpi('Distinciones · Argentina',fmt(ar),'Registros de todo el país','Una organización puede tener varias')+kpi('Participación de Córdoba',value(ratio(co,ar,100),'ocupacion'),'Del total de registros argentinos','Mismo padrón histórico')+kpi('Última fecha registrada',D.quality.latest_date.split('-').reverse().join('/'),'Distinción o revalidación','No equivale a fecha de vigencia')+'</div>';
 html+='<div class="grid equal">'+barCard({id:'quality-programs',title:'Distinciones por programa · Córdoba y '+peer,subtitle:'Registros históricos deduplicados',items:programs.map(p=>({name:p,values:['Córdoba',peer].map(s=>D.quality.programs.find(r=>r.scope===s&&r.program===p)?.records||0)})).sort((a,b)=>b.values[0]-a.values[0]),seriesNames:['Córdoba',peer],unit:'distinciones',limit:10,periodText:'Padrón histórico; última fecha '+D.quality.latest_date,method:'Una organización puede recibir varias distinciones. Cero significa ausencia de registros de ese programa en el padrón para el ámbito seleccionado.'})+barCard({id:'quality-ranking',title:'Distinciones registradas por provincia',subtitle:'Distribución territorial del padrón histórico',items:Object.entries(D.quality.counts).filter(([k])=>k!=='Argentina').sort((a,b)=>b[1]-a[1]).map(([k,n])=>({name:k,values:[n],highlight:k==='Córdoba'})),seriesNames:['Distinciones'],unit:'distinciones',limit:10,periodText:'Padrón histórico; última fecha '+D.quality.latest_date,method:'Diez primeras provincias. La tabla y el CSV incluyen todos los ámbitos del registro argentino.'})+'</div>';
 $('dashboard').innerHTML=html;
}
function renderSources(){
 current={family:'eoh',period:latestSeries('eoh'),latest:latestSeries('eoh'),quarter:false};$('filters').innerHTML='<span class="panel-subtitle">'+D.sources.length+' recursos CSV de cinco fuentes estadísticas · Archivos originales con huella SHA-256 y cobertura verificada.</span>';
 let html='<div class="source-grid">';
 for(const [family,[name,url]] of Object.entries(sources).filter(([k])=>k!=='municipal')){
  const rs=D.sources.filter(s=>s.family===family),latest=rs.map(s=>s.latest_period).filter(Boolean).sort().at(-1);
  html+=`<article class="source-card"><h3>${esc(name)}</h3><p>Datos disponibles hasta</p><strong>${label(latest,['eti','evyth'].includes(family))}</strong><p>${rs.length} recursos · ${family==='eti'||family==='evyth'?'Trimestral':family==='quality'?'Padrón histórico':'Mensual'}</p><a href="${url}" target="_blank" rel="noopener noreferrer">Consultar catálogo oficial ↗</a><br><small>Incorporados al tablero: ${esc(loaded)} (Córdoba)</small></article>`;
 }
 html+='</div>'+hotelSources()+notice('La fecha de incorporación al tablero y el último período observado se muestran por separado. La verificación semanal está preparada en el paquete de implementación; la programación desatendida del alojamiento institucional sigue pendiente.');
 const methods=[['Comparación transversal','Córdoba se conserva como referencia. Las series se comparan con el mismo indicador, período y universo. El total nacional no integra los rankings de regiones, localidades ni aeropuertos. Las ausencias se muestran como “Sin dato”, sin completar con ceros.'],['Escalas territoriales','EOH: región Córdoba corresponde a la provincia; Cuyo incluye Mendoza, San Juan, San Luis y La Rioja. Las series de localidades no representan provincias completas. No se suman localidades para reconstruir la región.'],['Desde y hacia Córdoba','En conectividad aérea, “desde Córdoba” selecciona el aeropuerto de Córdoba como origen; “hacia Córdoba”, como destino. No se filtra residencia. Las rutas son tramos inmediatos y pueden ser escalas del viaje. Solo se incluye transporte aéreo: no se infieren otros medios.'],['Movimientos aeroportuarios','Se conservan las magnitudes procesadas por Yvera sobre SIAC, sin otro factor de división o multiplicación. En “llegadas + salidas”, el denominador nacional es la suma de movimientos en aeropuertos argentinos: un tramo de cabotaje interviene en sus dos extremos. No son personas únicas. Los últimos tres meses son provisorios.'],['Estacionalidad','Patrón mensual: valor del mes dividido por el total anual de su ámbito, únicamente con doce meses completos. Rankings estacionales: suma de todos los meses requeridos; verano = diciembre del año anterior, enero y febrero; invierno = junio, julio y agosto. Se excluyen períodos incompletos.'],['Índices y variaciones','En demanda hotelera, el selector inferior del gráfico recalcula el intervalo de los indicadores y las descargas. En otras secciones, el zoom es visual. Índice base 100: primer período común con valores positivos de todos los comparadores dentro de la ventana. Interanual: mismo mes o trimestre del año anterior. Bases nulas o ausentes no producen variación. Ocultar una serie en la leyenda modifica la visualización; la tabla y el CSV conservan los comparadores elegidos.'],['Ocupación y promedios','Las tasas hoteleras son las publicadas oficialmente para cada región y categoría. Ocupación aérea agregada = suma de pasajeros / suma de asientos. Estadía = noches / viajeros o turistas. Gasto medio nacional EVyTH = gasto total / turistas. No se promedian tasas simples para construir totales.'],['Turismo internacional','ETI compara pasos relevados, no el total Argentina. Emisivo incluye residentes argentinos que viajan al exterior por el paso Córdoba, sin distinguir residencia provincial. Receptivo incluye residentes del exterior: sus noches y gasto son del viaje por Argentina. Las agrupaciones geográficas varían por paso.'],['Turismo interno y calidad','EVyTH describe viajes de residentes de los grandes aglomerados urbanos relevados. Gasto en pesos corrientes: no expresa crecimiento real. SACT es un registro histórico de distinciones deduplicadas; no verifica vigencia ni pertenencia al clúster.'],['Tecnología y exportación','Los gráficos utilizan Apache ECharts 6.0.0, distribuido localmente bajo licencia Apache 2.0. CSV y PNG incluyen fuente, período, cobertura y selección. El HTML descargable incluye los datos y la biblioteca para funcionar sin conexión.']];
 html+='<article class="panel"><h2>Criterios de lectura y cálculo</h2><div class="method-grid">'+methods.map(([t,p])=>'<div><h3>'+esc(t)+'</h3><p>'+esc(p)+'</p></div>').join('')+'</div></article>';
 html+='<article class="panel"><h2>Recursos incorporados</h2>'+D.sources.map(s=>`<div class="resource"><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.name)} ↗</a><small>${sources[s.family][0]} · ${fmt(s.received_rows)} filas · Cobertura: ${label(s.first_period,['eti','evyth'].includes(s.family))} a ${label(s.latest_period,['eti','evyth'].includes(s.family))}</small><details><summary>Identificación del recurso y controles</summary><small>ID: ${esc(s.id)}<br>SHA-256: ${esc(s.sha256)}<br>Licencia declarada: ${esc(s.license||'No especificada')}<br>Modificación del catálogo al registrar el recurso: ${esc(s.metadata_modified||'Sin fecha declarada')}<br>Descarga y procesamiento: ${esc(s.checked_at)}</small></details></div>`).join('')+'</article>';
 html+='<article class="panel"><h2>Fuentes pendientes de incorporación</h2>'+D.pending_sources.filter(s=>!s.name.includes('Observatorios turísticos')).map(s=>'<div class="resource">'+(s.url?'<a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">'+esc(s.name)+' ↗</a>':esc(s.name))+'<small>'+esc(s.status)+'</small></div>').join('')+'</article>';
 $('dashboard').innerHTML=html;
}
function hotelSources(){
 const o=window.HOTEL_DATA.observatory,e=window.HOTEL_DATA.calendar;
 return '<article class="panel"><h2>Alojamiento por estrellas · Córdoba capital</h2><p class="panel-subtitle">'+o.reports.length+' informes · '+label(o.reports.map(r=>r.period).sort()[0],true)+' a '+label(o.reports.map(r=>r.period).sort().at(-1),true)+'</p>'+o.reports.map(r=>`<div class="resource"><a href="${esc(r.source_url)}" target="_blank" rel="noopener noreferrer">${esc(r.title)} ↗</a><small>Período: ${label(r.period,true)} · Ocupación y categorías: p. ${r.pages.categories} · Demanda: p. ${r.pages.demand} · Incorporación: ${esc(r.checked_at)} · ${r.data_as_of?'Datos al '+r.data_as_of:'Sin fecha de corte consistente declarada'}</small><details><summary>Trazabilidad y observaciones</summary><small>SHA-256: ${r.sha256}<br>${esc((r.notes||[]).join(' '))}</small></details></div>`).join('')+'</article><article class="panel"><h2>Calendario de eventos incorporado</h2><p class="panel-subtitle">'+e.events.length+' eventos registrados · '+e.events.filter(x=>x.source_url).length+' verificados con fuente oficial · '+e.events.filter(x=>!x.source_url).length+' pendientes de verificación</p>'+e.events.map(x=>x.source_url?`<div class="resource"><a href="${esc(x.source_url)}" target="_blank" rel="noopener noreferrer">${esc(x.name)} ↗</a><small>${esc(x.start_date)} al ${esc(x.end_date)} · ${esc(x.locality)} · ${esc(x.category)} · Fuente: ${esc(x.source_title)} · Publicación: ${esc(x.published_at)} · Verificación: ${esc(e.checked_at)}</small></div>`:`<div class="resource"><span>${esc(x.name)}</span><small>${esc(x.start_date)} al ${esc(x.end_date)} · ${esc(x.locality)} · ${esc(x.category)} · Pendiente de verificación: sin fuente oficial confirmada · ${esc(x.source_title)}</small></div>`).join('')+'</article>';
}
function context(){
 if(state.tab==='demand'&&current.family==='municipal')return ['Córdoba capital · fuente municipal',label(current.period,true),state.hotelStar==='all'?'Todas las categorías':window.HOTEL_DATA.observatory.reports.flatMap(r=>r.categories).find(c=>c.id===state.hotelStar)?.label||state.hotelStar];
 if(state.tab==='demand')return [state.territory==='Córdoba'?'Córdoba · provincia (región EOH)':scopeLabel(state.territory),rangeCaption(months(state.hotelFrom,state.hotelTo)),state.residence==='total'?'Todas las residencias':state.residence==='residentes'?'Residentes en Argentina':'Residentes en el exterior',hotelCompare().length?'Comparadores: '+hotelCompare().map(hotelName).join(' / '):'Sin comparadores'];
 if(state.tab==='air')return ['Aeropuerto de Córdoba · SACO',{salidas:'Salidas',llegadas:'Llegadas',ambos:'Llegadas + salidas'}[state.direction],state.kind==='all'?'Cabotaje + internacional':state.kind,rangeCaption(airPeriod()),state.carrier==='all'?'Todas las aerolíneas':D.air.carriers[+state.carrier]];
 if(state.tab==='season')return [state.seasonYear,state.seasonData==='hotel'?'Demanda hotelera':'Conectividad aérea',state.seasonView==='share'?'Participación mensual en el año':'Valores mensuales',state.seasonData==='hotel'?(state.seasonLevel==='region'?'Regiones':'Localidades'):state.direction];
 if(state.tab==='international')return ['Paso Aeropuerto de Córdoba','Turismo '+state.flow,label(current.period,true)];
 if(state.tab==='internal')return ['Córdoba como destino','Universo EVyTH',label(current.period,true)];
 if(state.tab==='quality')return ['Registro histórico SACT','Última fecha: '+D.quality.latest_date];
 return [D.sources.length+' recursos','Incorporación: '+loaded+' (Córdoba)'];
}
function syncURL(){try{const saved={};for(const k of Object.keys(defaults))if(state[k]!==defaults[k]&&String(state[k]).length<maxLength(k))saved[k]=state[k];const hash=Object.keys(saved).length?'#'+new URLSearchParams({vista:JSON.stringify(saved)}):'';history.replaceState(null,'',location.pathname+location.search+hash);}catch(_){} }
function render(){
 try{
  for(const c of charts.values())c.dispose();charts.clear();cards.clear();$('error').hidden=true;
  $('navigation').innerHTML=Object.entries(navs).map(([k,v])=>`${k==='sources'?'<div class="nav-divider"></div>':''}<button class="nav-item ${state.tab===k?'active':''}" data-tab="${k}" aria-current="${state.tab===k?'page':'false'}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${v[3]}"/></svg>${v[0]}</button>`).join('');
  const info=navs[state.tab];$('breadcrumb').textContent=info[0];$('page-title').textContent=info[0];$('eyebrow').textContent=info[1];$('page-description').textContent=info[2];
  ({demand:renderDemand,air:renderAir,season:renderSeason,international:renderInternational,internal:renderInternal,quality:renderQuality,sources:renderSources}[state.tab])();
  $('available-through').textContent=state.tab==='sources'?'Según cada fuente':label(current.latest,current.quarter);$('loaded-at').textContent='Incorporación: '+(current.loadedAt||loaded)+' (Córdoba)';
  $('active-filters').innerHTML=context().filter(Boolean).map(t=>'<span class="filter-tag">'+esc(t)+'</span>').join('');
  $('footer-version').textContent=D.sources.length+' archivos oficiales · '+window.HOTEL_DATA.observatory.reports.length+' informes municipales · Apache ECharts 6.0.0';
  for(const c of cards.values())c.selection=context().join(' · ');
  paint();syncURL();
 }catch(e){$('error').hidden=false;$('error').textContent='No se pudo completar esta selección: '+e.message+'. Restablecé los filtros para volver a la vista inicial.';console.error(e);}
}
function changeState(key,v){
 if(!(key in defaults))return;
 const before=state[key];state[key]=v;
 if(key==='hotelFrom'||key==='hotelTo')state.hotelPreset='custom';
 if(key==='airFrom'||key==='airTo')state.airPreset='custom';
 // Factor de ocupación: el mínimo de vuelos por defecto sube a 100 (aeropuertos con pocas frecuencias).
 if(key==='airMetric'&&v==='ocupacion'&&state.minFlights==='30')state.minFlights='100';
 if(key==='airMetric'&&v!=='ocupacion'&&before==='ocupacion'&&state.minFlights==='100')state.minFlights='30';
 // Al cambiar de escala, los comparadores vuelven a la selección inicial de esa escala.
 if(key==='territory')state.compare=hotelLevel(v)!==hotelLevel(before)?(hotelLevel(v)==='region'?'Argentina,Cuyo':'localidad:Mendoza,localidad:Bariloche'):compareKeys().join(',');
 if(key==='seasonLevel'){state.seasonCompare1=v==='region'?'Argentina':'localidad:Mendoza';state.seasonCompare2=v==='region'?'Cuyo':'localidad:Bariloche';}
 if(key==='seasonData')state.seasonMetric=v==='hotel'?'pernoctes':'pasajeros';
 render();
}
function toast(s){clearTimeout(toastTimer);$('toast').textContent=s;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,4500);}
function saveFile(name,content,type){const blob=content instanceof Blob?content:new Blob([content],{type});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function exportCSV(id){
 const c=cards.get(id);if(!c)return;
 const q=x=>'"'+String(typeof x==='number'?String(x).replace('.',','):x??'').replace(/"/g,'""')+'"';
 const meta=[['Gráfico',c.title],['Selección',c.selection],['Período',c.periodText],['Unidad',c.unit||specs[c.metric]?.[1]||'registros'],['Base 100',c.basePeriod||''],['Disponible hasta',c.latest],['Incorporación al tablero',(c.loadedAt||loaded)+' (Córdoba)'],['Fuente',(c.source||sources[c.family])[0]],['URL fuente',(c.source||sources[c.family])[1]],['Fuentes complementarias',c.sourceReferences||''],['Método',c.method],[]];
 saveFile('turismo-'+id+'.csv','\ufeff'+[...meta,c.columns,...c.rows].map(r=>r.map(q).join(';')).join('\r\n'),'text/csv;charset=utf-8');toast('CSV descargado con los datos de la selección, período y fuente.');
}
function wrap(s,n=115){const words=s.split(/\s+/),lines=[''];words.forEach(w=>{const i=lines.length-1;if((lines[i]+' '+w).length>n)lines.push(w);else lines[i]+=(lines[i]?' ':'')+w;});return lines.join('\n');}
function exportPNG(id){
 const c=cards.get(id);if(!c||!charts.has(id)){toast('No hay un gráfico con datos para exportar.');return;}
 const el=document.createElement('div');el.style.cssText='position:fixed;left:-15000px;top:0;width:1400px;height:1000px';document.body.appendChild(el);
 const exportChart=echarts.init(el,null,{width:1400,height:1000,renderer:'canvas'}),foot='Unidad: '+(c.unit||specs[c.metric]?.[1]||'registros')+(c.basePeriod?' · Base 100: '+label(c.basePeriod):'')+'\nPeríodo: '+c.periodText+' · Disponible hasta: '+c.latest+' · Incorporación: '+(c.loadedAt||loaded)+' (Córdoba)\nFuente: '+(c.source||sources[c.family])[0]+'\n'+(c.source||sources[c.family])[1],footH=foot.split('\n').length*16+38;
 const opt={...c.option,animation:false,backgroundColor:'#fff',title:{text:wrap(c.title,95),subtext:wrap(c.selection+' · '+(c.subtitle||''),140),left:32,top:25,textStyle:{fontSize:22,color:'#183c51',fontWeight:650},subtextStyle:{fontSize:12,color:'#617f8e',lineHeight:19}},legend:{...c.option.legend,top:122,left:35,right:35},grid:{...c.option.grid,left:35,right:60,top:170,bottom:footH+40},dataZoom:[],graphic:[{type:'text',left:35,bottom:24,style:{text:foot,font:'11px sans-serif',fill:'#5e7887',lineHeight:16}}]};
 if(opt.visualMap)opt.visualMap={...opt.visualMap,bottom:footH};
 exportChart.setOption(opt);const data=exportChart.getDataURL({type:'png',pixelRatio:1,backgroundColor:'#fff'}),a=document.createElement('a');a.href=data;a.download='turismo-'+id+'.png';a.click();exportChart.dispose();el.remove();toast('Gráfico descargado con la selección, período y fuente.');
}
async function share(){
 syncURL();try{await navigator.clipboard.writeText(location.href);toast(location.protocol==='file:'?'Vista copiada. Para compartirla, enviá también el archivo HTML.':'Enlace de esta vista copiado. Conserva filtros y comparadores.');}
 catch(_){const el=document.createElement('input');el.className='share-input';el.value=location.href;el.readOnly=true;el.setAttribute('aria-label','Enlace de la vista para copiar');$('filters').appendChild(el);el.select();toast('Seleccioná y copiá el enlace mostrado junto a los filtros.');}
}
document.addEventListener('change',e=>{if('compareAdd' in e.target.dataset){if(e.target.dataset.compareAdd==='airCompare')addAirCompare(e.target.value);else addCompare(e.target.value);return;}const key=e.target.dataset.key;if(key)changeState(key,e.target.value);});
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.hotelEventYear){state.hotelPreset='year';state.hotelYear=b.dataset.hotelEventYear;state.hotelEventType='all';state.territory='Córdoba';state.compare='Argentina,Cuyo';render();return;}
 if('chipRemove' in b.dataset){if(b.dataset.compareKey==='airCompare')setAirCompare(airCompareKeys().filter(k=>k!==b.dataset.chipRemove));else setCompare(compareKeys().filter(k=>k!==b.dataset.chipRemove));return;}
 if('compareSet' in b.dataset){const keys=b.dataset.compareSet.split(',').filter(Boolean);if(b.dataset.compareKey==='airCompare')setAirCompare(keys);else setCompare(keys);return;}
 if(b.dataset.tab){state.tab=b.dataset.tab;render();return;}
 if(b.dataset.set){
  changeState(b.dataset.set,b.dataset.value);
  // "Analizar este mes": llevar la vista a la sección del mes del evento.
  if(b.dataset.set==='hotelEvent')$('hotel-event-month')?.scrollIntoView?.({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  return;
 }
 if(b.dataset.table){const id=b.dataset.table,c=cards.get(id),t=$('table-'+id),show=t.hidden;t.hidden=!show;$('chart-'+id).hidden=show;b.setAttribute('aria-expanded',String(show));b.classList.toggle('active',show);b.textContent=show?'Gráfico':'Tabla';if(show)t.innerHTML=tableHTML(c);else charts.get(id)?.resize();return;}
 if(b.dataset.sort){const c=cards.get(b.dataset.sort),i=+b.dataset.column;c.sortDir=c.sortColumn===i?-c.sortDir:1;c.sortColumn=i;c.rows.sort((a,b)=>{if(a[i]==null)return 1;if(b[i]==null)return -1;return c.sortDir*(typeof a[i]==='number'&&typeof b[i]==='number'?a[i]-b[i]:String(a[i]).localeCompare(String(b[i]),'es',{numeric:true}));});$('table-'+c.id).innerHTML=tableHTML(c);return;}
 if(b.dataset.csv){exportCSV(b.dataset.csv);return;}if(b.dataset.png){exportPNG(b.dataset.png);return;}
 if(b.id==='reset'){const tab=state.tab;state={...defaults,tab};render();toast('Filtros restablecidos.');}
 if(b.id==='share')share();
 if(b.id==='method-shortcut'){state.tab='sources';render();}
});
window.addEventListener('resize',()=>charts.forEach(c=>c.resize()));
if(typeof ResizeObserver!=='undefined')new ResizeObserver(()=>charts.forEach(c=>c.resize())).observe($('dashboard'));
window.addEventListener('hashchange',()=>{try{state=readSaved(JSON.parse(new URLSearchParams(location.hash.slice(1)).get('vista')||'{}'));if(!navs[state.tab])state.tab='demand';render();}catch(_){toast('El enlace de vista no es válido.');}});
if(!D||D.schema_version!==3||!window.echarts||!window.HOTEL_DATA||!window.HotelDashboard){$('error').hidden=false;$('error').textContent='Falta un archivo del tablero. Abrí el paquete completo o la vista HTML autocontenida.';}else render();
})();
