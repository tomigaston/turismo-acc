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
const navs={demand:['Demanda hotelera','ACTIVIDAD Y POSICIONAMIENTO','Viajeros, pernoctaciones, ocupación y categorías de alojamiento.','M3 20V10h4v10M10 20V4h4v16M17 20V7h4v13'],air:['Conectividad aérea','CÓRDOBA COMO ORIGEN Y DESTINO','La posición del aeropuerto, sus conexiones y la evolución del cabotaje y el tráfico internacional.','M3 13l7 1 4 7 2-1-2-7 6-6c2-2 0-4-2-2l-6 6-7-2-1 2 7 4'],season:['Estacionalidad','EL RITMO DE LA ACTIVIDAD','Cuándo viaja la gente a Córdoba y cuánto se concentra la actividad en pocos meses','M4 5h16v15H4zM4 9h16M8 3v4M16 3v4M8 13h2M14 13h2M8 17h2'],international:['Mercados internacionales','VIAJES A TRAVÉS DEL AEROPUERTO','Turismo receptivo y emisivo por el paso Córdoba, comparado con otros pasos aeroportuarios relevados.','M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18'],internal:['Turismo interno','DEMANDA DENTRO DEL PAÍS','Córdoba como destino de viajes internos. Estadías, gasto y contexto nacional.','M3 11l9-8 9 8M6 10v11h12V10M10 21v-7h4v7'],quality:['Calidad turística','CAPACIDADES Y DISTINCIONES','Una referencia histórica de las distinciones registradas en Córdoba y el país.','M12 3l7 3v6c0 5-7 9-7 9s-7-4-7-9V6zM8 12l3 3 5-6'],sources:['Fuentes y metodología','DATOS CON TRAZABILIDAD','Cobertura, fechas, recursos oficiales y criterios para interpretar las comparaciones.','M5 4h14v17H5zM8 8h8M8 12h8M8 16h5']};
const hotelLatest=D.eoh.scopes['Córdoba'].at(-1).period;
const hotelFullYear=String(+hotelLatest.slice(0,4)-(hotelLatest.slice(5)<='11'?1:0));
const defaults={hotelTab:'overview',hotelPreset:'year',hotelYear:hotelFullYear,hotelFrom:'',hotelTo:'',hotelView:'levels',hotelSource:'municipal',hotelQuarter:window.HOTEL_DATA.observatory.reports.slice().sort((a,b)=>a.period.localeCompare(b.period)).at(-1)?.id||'',hotelStar:'all',hotelSeasonMetric:'pernoctes',hotelProfile:'share',hotelShowEvents:'yes',hotelEventType:'all',hotelEvent:'',tab:'demand',cutoff:D.air.periods.at(-1),range:'24',view:'index',territory:'Córdoba',compare:'Argentina,Cuyo',metric:'pernoctes',residence:'total',category:'Total',occupancy:'habitaciones',direction:'salidas',kind:'all',carrier:'all',airMetric:'pasajeros',airCompare:'SAME',airPreset:'latest',airYear:D.air.periods.filter(p=>p.endsWith('-12')).at(-1)?.slice(0,4)||'',airFrom:'',airTo:'',routeSort:'metric',airCarrierView:'levels',airIntlMetric:'destinos',airSeasonView:'share',rankLimit:'10',minFlights:'30',routeSearch:'',seasonTerritory:'Córdoba',seasonCompare:'Argentina,Cuyo',seasonYear:'',flow:'receptivo',intlMetric:'turistas',intlCompare:'Aep. Mendoza,Ezeiza y Aeroparque',intlPreset:'year',intlYear:'',intlBalance:'usd',intlMarketView:'share',internalMetric:'turistas',internalCompare:'Argentina,Cuyo',internalPreset:'latest',internalYear:'',internalRankMetric:'turistas',qualityCompare:'Argentina'};
const unique=xs=>[...new Set(xs.filter(Boolean))];
// Límite por clave en enlaces compartidos; la lista de comparadores admite más texto.
const maxLength=k=>k==='compare'||k==='airCompare'||k==='seasonCompare'||k==='internalCompare'?600:200;
function readSaved(saved){
 const s={...defaults},str=k=>typeof saved[k]==='string'&&saved[k].length<200?saved[k]:null;
 for(const k of Object.keys(defaults))if(typeof saved[k]==='string'&&saved[k].length<maxLength(k))s[k]=saved[k];
 // Enlaces anteriores: escala + destino + dos comparadores pasan a territorio + lista de comparadores.
 if(typeof saved.territory!=='string'&&['level','city','compare1','compare2'].some(k=>k in saved)){
  const city=str('city');
  s.territory=str('level')==='localidad'?(D.eoh.scope_meta[city]?.cordoba?city:'localidad:Córdoba'):'Córdoba';
  if(typeof saved.compare!=='string')s.compare=unique([str('compare1')??'Argentina',str('compare2')??'Cuyo']).join(',');
 }
 // Estacionalidad: escala + destino + dos comparadores pasan a territorio + lista; fuente, indicador, lectura y
 // temporada del esquema anterior ya no existen y se ignoran.
 if(typeof saved.seasonTerritory!=='string'&&['seasonLevel','seasonCity','seasonCompare1','seasonCompare2'].some(k=>k in saved)){
  const region=str('seasonLevel')==='region',city=str('seasonCity');
  s.seasonTerritory=region?'Córdoba':(D.eoh.scope_meta[city]?.cordoba?city:'localidad:Córdoba');
  if(typeof saved.seasonCompare!=='string')s.seasonCompare=unique([str('seasonCompare1')??'localidad:Mendoza',str('seasonCompare2')??'localidad:Bariloche']).filter(k=>D.eoh.scope_meta[k]).join(',');
 }
 // Turismo interno: dos comparadores pasan a una lista; un mes de referencia de un año completo, a 'Año completo'.
 if(typeof saved.internalCompare!=='string'&&['internalCompare1','internalCompare2'].some(k=>k in saved))s.internalCompare=unique([str('internalCompare1')??'Argentina',str('internalCompare2')??'Cuyo']).filter(k=>k!=='Córdoba'&&D.internal.scopes[k]).join(',');
 if(typeof saved.internalPreset!=='string'&&saved.tab==='internal'&&str('cutoff')){
  const y=str('cutoff').slice(0,4),qs=new Set((D.internal.scopes['Córdoba']||[]).filter(r=>typeof r.turistas==='number').map(r=>r.period));
  if(['01','04','07','10'].every(m=>qs.has(y+'-'+m))){s.internalPreset='year';s.internalYear=y;}
 }
 // Mercados internacionales: dos comparadores pasan a una lista; un mes de referencia de un año completo, a 'Año completo'.
 if(typeof saved.intlCompare!=='string'&&['intlCompare1','intlCompare2'].some(k=>k in saved))s.intlCompare=unique([str('intlCompare1')??'Aep. Mendoza',str('intlCompare2')??'Ezeiza y Aeroparque']).filter(k=>k==='Aep. Mendoza'||k==='Ezeiza y Aeroparque').join(',');
 if(typeof saved.intlPreset!=='string'&&saved.tab==='international'&&str('cutoff')){
  const y=str('cutoff').slice(0,4),qs=new Set(D.international.series.filter(r=>r.gateway==='Aep. Córdoba'&&typeof r.turistas==='number').map(r=>r.period));
  if(['01','04','07','10'].every(m=>qs.has(y+'-'+m))){s.intlPreset='year';s.intlYear=y;}
 }
 // Conectividad aérea: dos comparadores pasan a una lista (sin el total nacional, que no es un aeropuerto).
 if(typeof saved.airCompare!=='string'&&['airCompare1','airCompare2'].some(k=>k in saved))s.airCompare=unique([str('airCompare1')??'Argentina',str('airCompare2')??'SAME']).filter(k=>k==='Argentina'||(k!=='SACO'&&D.air.airports[k]?.domestic)).join(',');
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
// Comparador EOH por territorio (Demanda hotelera y Estacionalidad): un territorio de Córdoba, una lista de
// comparadores de la misma escala (región con regiones y Argentina; localidad con localidades), fichas y atajos.
// refsAt(escala): ámbitos de otra escala que solo se grafican como referencia en índice o variación.
// extraAt(escala): ámbitos de otra escala admitidos como comparadores comunes.
const MAX_SERIES=9;
const eohTerritories=()=>[['Córdoba','Córdoba · provincia (región EOH)'],...Object.entries(D.eoh.scope_meta).filter(([,m])=>m.cordoba).map(([k,m])=>[k,m.label]).sort((a,b)=>a[1].localeCompare(b[1],'es'))];
function eohScopeCompare({territoryKey,compareKey,refsAt=()=>[],extraAt=()=>[],refLabel=k=>k}){
 const meta=D.eoh.scope_meta,territory=()=>state[territoryKey];
 const level=(k=territory())=>meta[k]?.level==='localidad'?'localidad':'region';
 const keys=()=>unique(String(state[compareKey]||'').split(',').map(k=>k.trim())).filter(k=>meta[k]&&k!==territory());
 const isReference=k=>refsAt(level()).includes(k),isExtra=k=>extraAt(level()).includes(k);
 const comparable=k=>{const m=meta[k];return !!m&&k!==territory()&&(level()==='region'?m.level==='region'||m.level==='pais':m.level==='localidad'||isReference(k)||isExtra(k));};
 const compare=()=>keys().filter(comparable);
 const name=k=>isReference(k)?refLabel(k):meta[k]?.label||k;
 function set(list){
  list=unique(list).filter(k=>k!==territory());
  if(list.filter(comparable).length+1>MAX_SERIES){toast('Hasta '+MAX_SERIES+' series por gráfico, incluido el territorio. Quitá un comparador para agregar otro.');return;}
  state[compareKey]=list.join(',');render();
 }
 const add=k=>{if(k&&!keys().includes(k))set([...keys(),k]);};
 // relative: si la lectura del gráfico admite las referencias (índice o variación).
 function control({relative=false}={}){
  const chosen=compare(),focus=territory(),lv=level(),opt=([k,l])=>`<option value="${esc(k)}">${esc(l)}</option>`,free=([k])=>!chosen.includes(k);
  const pool=Object.entries(meta).filter(([k,m])=>k!==focus&&(lv==='region'?m.level==='region'||m.level==='pais':m.level==='localidad')).map(([k,m])=>[k,m.level==='pais'?m.label+' · total nacional':m.label]).sort((a,b)=>a[1].localeCompare(b[1],'es'));
  const references=refsAt(lv).map(k=>[k,name(k)]),extras=extraAt(lv).map(k=>[k,meta[k].label+(meta[k].level==='pais'?' · total nacional':'')]);
  const menu=lv==='localidad'?`<optgroup label="Localidades relevadas">${pool.filter(free).map(opt).join('')}</optgroup>${extras.some(free)?`<optgroup label="Total nacional">${extras.filter(free).map(opt).join('')}</optgroup>`:''}${references.some(free)?`<optgroup label="Referencias · solo índice o variación">${references.filter(free).map(opt).join('')}</optgroup>`:''}`:pool.filter(free).map(opt).join('');
  const chips=chosen.map(k=>{const off=isReference(k)&&!relative;return `<button class="chip${off?' off':''}" data-chip-remove="${esc(k)}" data-compare-key="${compareKey}" aria-pressed="true" aria-label="Quitar ${esc(name(k))}${off?' (no se grafica en valores observados)':''}" title="Quitar comparador">${esc(name(k))}${off?' · solo en índice o variación':''} <span aria-hidden="true">×</span></button>`;}).join('');
  const others=lv==='region'?Object.keys(meta).filter(k=>meta[k].level==='region'&&k!==focus).concat('Argentina'):Object.keys(meta).filter(k=>meta[k].cordoba&&k!==focus);
  return `<div class="compare-group"><label class="field"><span>Comparar con</span><select data-compare-add="${compareKey}" aria-label="Agregar comparador"><option value="">Agregar comparador…</option>${menu}</select></label><div class="compare-extras"><div class="chips" role="group" aria-label="Comparadores seleccionados: ${chosen.length+1} de ${MAX_SERIES} series">${chips||'<span class="chips-empty">Sin comparadores</span>'}</div><div class="compare-shortcuts"><button class="button small" data-compare-set="${esc(others.join(','))}" data-compare-key="${compareKey}">${lv==='region'?'Todas las regiones':'Todos los destinos de Córdoba'}</button><button class="button small subtle" data-compare-set="" data-compare-key="${compareKey}"${chosen.length?'':' disabled'}>Quitar todos</button></div></div></div>`;
 }
 return {MAX_SERIES,territoryKey,compareKey,territories:eohTerritories,level,keys,all:keys,compare,comparable,isReference,name,set,add,control};
}
// Demanda hotelera: en escala localidad, Argentina y Córdoba provincia son referencias (solo índice o variación).
const hotelScope=eohScopeCompare({territoryKey:'territory',compareKey:'compare',refsAt:lv=>lv==='localidad'?['Argentina','Córdoba']:[],refLabel:k=>k==='Argentina'?'Argentina · total nacional (referencia)':'Córdoba · provincia (referencia)'});
const hotelLevel=hotelScope.level,hotelCompare=hotelScope.compare,hotelName=hotelScope.name,compareKeys=hotelScope.keys;
// Estacionalidad: todo se lee en porcentajes, así que Argentina se admite como ámbito también en escala localidad.
const seasonScope=eohScopeCompare({territoryKey:'seasonTerritory',compareKey:'seasonCompare',extraAt:lv=>lv==='localidad'?['Argentina']:[]});
// Conectividad aérea: Córdoba (SACO) y una lista de aeropuertos argentinos. Argentina no es un aeropuerto:
// entra solo como referencia del gráfico de evolución, y únicamente en índice o variación.
const AIR_REFERENCE='Argentina',AIR_REFERENCE_LABEL='Argentina · total nacional (referencia)';
const airAllKeys=()=>unique(String(state.airCompare||'').split(',').map(k=>k.trim())).filter(k=>k===AIR_REFERENCE||(k!=='SACO'&&D.air.airports[k]?.domestic));
const airCompareKeys=()=>airAllKeys().filter(k=>k!==AIR_REFERENCE);
const airScopes=()=>['SACO',...airCompareKeys()];
const airRelativeView=()=>['index','yoy','base2019'].includes(state.view);
const airTrendScopes=()=>airRelativeView()&&airAllKeys().includes(AIR_REFERENCE)?[...airScopes(),AIR_REFERENCE]:airScopes();
function setAirCompare(keys){
 const list=unique(keys).filter(k=>k===AIR_REFERENCE||(k!=='SACO'&&D.air.airports[k]?.domestic));
 if(list.length+1>MAX_SERIES){toast('Hasta '+MAX_SERIES+' series por gráfico, incluido Córdoba. Quitá un comparador para agregar otro.');return;}
 state.airCompare=list.join(',');render();
}
function addAirCompare(k){if(k&&!airAllKeys().includes(k))setAirCompare([...airAllKeys(),k]);}
const airYears=()=>D.air.periods.filter(p=>p.endsWith('-12')&&D.air.periods.includes(p.slice(0,4)+'-01')).map(p=>p.slice(0,4)).reverse();
// Etiquetas del indicador aéreo: la ocupación se nombra como factor de ocupación de asientos.
const airMetricLabel=k=>k==='ocupacion'?'Factor de ocupación (% de asientos ocupados)':specs[k][0];
// Período del análisis aéreo: gobierna indicadores, ranking, rutas, mezcla y aerolíneas.
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
function chipCompare(key,options,selected,nameOf,shortcuts=[],refs=[],{toggle=false}={}){
 if(toggle){
  const chips=options.map(([k,l])=>{const on=selected.includes(k);return `<button class="chip${on?'':' off'}" data-chip-toggle="${esc(k)}" data-compare-key="${key}" aria-pressed="${on}" aria-label="${on?'Quitar':'Agregar'} ${esc(l)}" title="${on?'Quitar':'Agregar'} comparador">${esc(l)} <span aria-hidden="true">${on?'×':'+'}</span></button>`;}).join('');
  return `<div class="compare-group"><div class="field"><span>Comparar con</span></div><div class="compare-extras"><div class="chips" role="group" aria-label="Comparadores: ${selected.length+1} de ${options.length+1} pasos">${chips}</div></div></div>`;
 }
 const free=options.filter(([k])=>!selected.includes(k)),freeRefs=refs.filter(([k])=>!selected.includes(k)),ref=k=>refs.find(([r])=>r===k);
 const chips=selected.map(k=>{const r=ref(k),off=r&&!r[2],name=r?r[1]:nameOf(k);return `<button class="chip${off?' off':''}" data-chip-remove="${esc(k)}" data-compare-key="${key}" aria-pressed="true" aria-label="Quitar ${esc(name)}${off?' (no se grafica en valores observados)':''}" title="Quitar comparador">${esc(name)}${off?' · solo en índice o variación':''} <span aria-hidden="true">×</span></button>`;}).join('');
 const opt=([k,l])=>`<option value="${esc(k)}">${esc(l)}</option>`,menu=refs.length?`<optgroup label="Aeropuertos">${free.map(opt).join('')}</optgroup>${freeRefs.length?`<optgroup label="Referencias · solo índice o variación">${freeRefs.map(opt).join('')}</optgroup>`:''}`:free.map(opt).join('');
 return `<div class="compare-group"><label class="field"><span>Comparar con</span><select data-compare-add="${key}" aria-label="Agregar comparador"><option value="">Agregar comparador…</option>${menu}</select></label><div class="compare-extras"><div class="chips" role="group" aria-label="Comparadores seleccionados: ${selected.length+1} de ${MAX_SERIES} series">${chips||'<span class="chips-empty">Sin comparadores</span>'}</div><div class="compare-shortcuts">${shortcuts.map(([l,keys])=>`<button class="button small" data-compare-set="${esc(keys.join(','))}" data-compare-key="${key}">${esc(l)}</button>`).join('')}<button class="button small subtle" data-compare-set="" data-compare-key="${key}"${selected.length?'':' disabled'}>Quitar todos</button></div></div></div>`;
}
// Mercados internacionales (ETI): el aeropuerto de Córdoba y los otros dos pasos aéreos con serie.
const INTL_PEERS=['Aep. Mendoza','Ezeiza y Aeroparque'];
const intlCompareKeys=()=>unique(String(state.intlCompare||'').split(',').map(k=>k.trim())).filter(k=>INTL_PEERS.includes(k)).sort((a,b)=>INTL_PEERS.indexOf(a)-INTL_PEERS.indexOf(b));
const intlScopes=()=>['Aep. Córdoba',...intlCompareKeys()];
function setIntlCompare(keys){state.intlCompare=unique(keys).filter(k=>INTL_PEERS.includes(k)).join(',');render();}
// Trimestres (primer mes) con turistas del paso Córdoba, y años con sus 4 trimestres.
const intlQuarters=()=>unique(D.international.series.filter(r=>r.gateway==='Aep. Córdoba'&&valid(r.turistas)).map(r=>r.period)).sort();
const intlYears=()=>{const qs=new Set(intlQuarters());return unique([...qs].map(p=>p.slice(0,4))).filter(y=>['01','04','07','10'].every(m=>qs.has(y+'-'+m))).sort().reverse();};
const quarterSpan=(last,n)=>months(month(ordinal(last)-3*(n-1)),last,3);
// Período del análisis: último trimestre, últimos 4 trimestres o año completo.
function intlPeriod(){
 const last=intlQuarters().at(-1);
 if(state.intlPreset==='latest')return [last];
 if(state.intlPreset==='4q')return quarterSpan(last,4);
 const ys=intlYears(),y=ys.includes(state.intlYear)?state.intlYear:ys[0];return months(y+'-01',y+'-10',3);
}
// Turismo interno (EVyTH): Córdoba como región de destino y las otras siete regiones; Argentina, solo como referencia.
const INTERNAL_REGIONS=()=>Object.keys(D.internal.scopes).filter(k=>k!=='Córdoba'&&k!=='Argentina');
const INTERNAL_REFERENCE_LABEL='Argentina · total nacional (referencia)';
const internalAllKeys=()=>unique(String(state.internalCompare||'').split(',').map(k=>k.trim())).filter(k=>k==='Argentina'||INTERNAL_REGIONS().includes(k));
const internalRelative=()=>['index','yoy'].includes(state.view);
const internalScopes=()=>['Córdoba',...internalAllKeys().filter(k=>k!=='Argentina'||internalRelative())];
const internalName=k=>k==='Argentina'?INTERNAL_REFERENCE_LABEL:k;
function setInternalCompare(keys){
 const list=unique(keys).filter(k=>k==='Argentina'||INTERNAL_REGIONS().includes(k));
 if(list.length+1>MAX_SERIES){toast('Hasta '+MAX_SERIES+' series por gráfico, incluido Córdoba. Quitá un comparador para agregar otro.');return;}
 state.internalCompare=list.join(',');render();
}
// Trimestres con turistas de Córdoba y años con sus 4 trimestres.
const internalQuarters=()=>unique((D.internal.scopes['Córdoba']||[]).filter(r=>valid(r.turistas)).map(r=>r.period)).sort();
const internalYears=()=>{const qs=new Set(internalQuarters());return unique([...qs].map(p=>p.slice(0,4))).filter(y=>['01','04','07','10'].every(m=>qs.has(y+'-'+m))).sort().reverse();};
// Período del análisis: último trimestre (por defecto), últimos 4 trimestres o año completo.
function internalPeriod(){
 const last=internalQuarters().at(-1);
 if(state.internalPreset==='4q')return months(month(ordinal(last)-9),last,3);
 if(state.internalPreset==='year'){const ys=internalYears(),y=ys.includes(state.internalYear)?state.internalYear:ys[0];return months(y+'-01',y+'-10',3);}
 return [last];
}
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
function barCard({id,title,subtitle,items,seriesNames=['Córdoba'],unit='',metric='viajeros',limit=10,onClick,labelDigits=null,...rest}){
 const shown=items.slice(0,limit),opt=commonOption();opt.grid={left:4,right:40,top:seriesNames.length>1?40:12,bottom:12,containLabel:true};opt.legend.show=seriesNames.length>1;opt.tooltip.formatter=p=>tooltipRows(p,unit);
 opt.xAxis={type:'value',axisLabel:{fontSize:9,color:'#7c909b',formatter:axisLabel},splitLine:{lineStyle:{color:'#edf1f4'}}};opt.yAxis={type:'category',inverse:true,data:shown.map(r=>r.name),axisLabel:{fontSize:10,color:'#4d6b7c',width:150,overflow:'truncate'},axisTick:{show:false},axisLine:{show:false}};
 opt.series=seriesNames.map((s,i)=>({name:s,type:'bar',barMaxWidth:14,data:shown.map(r=>({value:r.values[i],itemStyle:{color:r.highlight&&seriesNames.length===1?colors[0]:seriesNames.length===1?'#a3baca':colors[i],borderRadius:[0,3,3,0]}})),label:{show:seriesNames.length===1,position:'right',fontSize:9,color:'#597787',formatter:p=>valid(p.value)?fmt(p.value,labelDigits??(unit==='%'?1:0)):''},emphasis:{focus:'series'}}));
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
 window.HotelDashboard.render({D,M,model,state,$,esc,fmt,signed,label,value,specs,field,compareFields,scopeOptions,scopeLabel,unique,section,notice,kpi,card,barCard,commonOption,axisLabel,tooltipRows,rangeCaption,render,setCurrent:c=>{current=c;},hotel:hotelScope});
}

function renderAir(){
 const selected=airPeriod(),latest=D.air.periods.at(-1);
 current={family:'air',quarter:false,period:selected.at(-1),latest};
 const data=model.air(state.direction,state.kind,state.carrier),get=k=>data[k]||[],val=k=>aggregate(get(k),selected,state.airMetric),scopes=airScopes(),caption=rangeCaption(selected);
 // Atajo: los 6 aeropuertos argentinos con más pasajeros en el período (sin Córdoba ni el total nacional).
 const top=rankItems(Object.keys(data).filter(k=>k!=='Argentina'&&k!=='SACO'&&D.air.airports[k]?.domestic),get,selected,'pasajeros').slice(0,6).map(r=>r.code);
 // 1. Franja: sentido, tráfico, aerolínea, comparadores y período.
 let controls=field('direction','Sentido del trayecto',[['salidas','Desde Córdoba · salidas'],['llegadas','Hacia Córdoba · llegadas'],['ambos','Llegadas + salidas']])+field('kind','Tipo de tráfico',[['all','Cabotaje + internacional'],['Cabotaje','Cabotaje'],['Internacional','Internacional']])+field('carrier','Aerolínea',[['all','Todas las aerolíneas'],...D.air.carriers.map((n,i)=>[String(i),n])]);
 const refChosen=airAllKeys().includes(AIR_REFERENCE);
 controls+=chipCompare('airCompare',airportOptions().filter(([k])=>k!=='Argentina'&&k!=='SACO'),airAllKeys(),airportLabel,[['Principales aeropuertos del país',refChosen?[...top,AIR_REFERENCE]:top]],[[AIR_REFERENCE,AIR_REFERENCE_LABEL,airRelativeView()]]);
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
 const trendPs=selected.length===1?months(month(ordinal(selected[0])-23),selected[0]):selected,trendScopes=airTrendScopes(),trendName=k=>k===AIR_REFERENCE?AIR_REFERENCE_LABEL:airportShort(k),trendLabel=k=>k===AIR_REFERENCE?AIR_REFERENCE_LABEL:airportLabel(k);
 if(airAllKeys().includes(AIR_REFERENCE)&&!airRelativeView())html+=notice('Las referencias nacionales/provinciales solo se comparan en índice o variación, por diferencia de escala');
 html+=lineCard({id:'air-trend',title:ind+' por mes · Córdoba'+versus(trendScopes.length),subtitle:trendScopes.map(trendLabel).join(' / ')+' · '+(selected.length===1?'24 meses hasta '+label(selected[0]):caption)+' · '+filt,series:trendScopes.map(k=>({name:trendName(k),rows:get(k).map(r=>({...r,value:r[state.airMetric]}))})),periods:trendPs,metric:state.airMetric,method:'Mismos sentido, tráfico y aerolínea. Últimos tres meses de la base provisorios. Los pasajeros no representan personas únicas.'});
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
 html+=airSeasonality(selected,data,filt);
 $('dashboard').innerHTML=html;
}
// 10. Estacionalidad aérea: perfil mensual del indicador en el año del período (o el último año completo).
function airSeasonality(selected,data,filt){
 const metric=state.airMetric,rate=metric==='ocupacion',share=state.airSeasonView==='share'&&!rate;
 const fullYear=selected.length===12&&selected[0].endsWith('-01')&&selected[11]===selected[0].slice(0,4)+'-12',year=fullYear?selected[0].slice(0,4):airYears()[0];
 const ps=months(year+'-01',year+'-12'),keys=airScopes(),profile=k=>M.monthlyProfile(ps,q=>aggregate(data[k]||[],q,metric),share).map(r=>r.value);
 const series=keys.map(k=>({name:airportShort(k),values:profile(k)}));
 if(share)series.push({name:'Argentina · total nacional',values:profile('Argentina'),reference:true});
 const unit=share?'%':specs[metric][1],opt=commonOption();opt.grid.bottom=35;
 opt.tooltip.formatter=p=>tooltipRows(p,unit);
 opt.xAxis={type:'category',data:monthNames,boundaryGap:false,axisLabel:{fontSize:10,color:'#758e9c'},axisTick:{show:false},axisLine:{lineStyle:{color:'#dfe8ee'}}};
 opt.yAxis={type:'value',name:share?'% del año':unit,nameTextStyle:{fontSize:9,color:'#78919f'},axisLabel:{formatter:axisLabel,fontSize:9},splitLine:{lineStyle:{color:'#edf2f5'}},scale:rate};
 opt.series=series.map((s,i)=>({name:s.name,type:'line',data:s.values,connectNulls:false,symbolSize:6,lineStyle:s.reference?{width:2,type:'dashed',color:'#7d8f99'}:{width:i?2:3},itemStyle:s.reference?{color:'#7d8f99'}:{color:colors[i]},emphasis:{focus:'series'}}));
 opt.series[0].markArea={silent:true,itemStyle:{opacity:.3},data:[[{xAxis:'Ene',itemStyle:{color:'#f4e8c8'}},{xAxis:'Feb'}],[{xAxis:'Jun',itemStyle:{color:'#e2ecf5'}},{xAxis:'Ago'}]]};
 const controls=rate?'<label class="field"><span>Lectura</span><select aria-label="Lectura" disabled><option>Valores observados</option></select></label><p class="field-note">El factor de ocupación es una tasa: se muestra en valores observados.</p>':field('airSeasonView','Lectura',[['share','Peso del mes en el año (%)'],['levels','Valores observados']]);
 const ind=airMetricLabel(metric);
 return card({id:'air-season',title:ind+' por mes del año · estacionalidad de Córdoba'+(keys.length>1?' y '+(keys.length-1)+(keys.length>2?' comparadores':' comparador'):''),subtitle:keys.map(airportLabel).join(' / ')+(share?' / Argentina · total nacional (referencia)':'')+' · '+year+(fullYear?'':' (último año completo disponible; el período elegido no es un año completo)')+' · '+filt,controls,option:opt,metric:share?'ocupacion':metric,unit,periodText:'Enero a diciembre de '+year,columns:['Mes',...series.map(s=>s.name)],rows:monthNames.map((m,i)=>[m+' '+year,...series.map(s=>s.values[i])]),digits:share||rate?[null,...series.map(()=>1)]:null,method:(share?'Cada mes dividido por el total anual de su propio aeropuerto; requiere los 12 meses con dato. Argentina · total nacional se agrega solo como referencia en esta lectura. ':'Valores mensuales observados. ')+'Mismo sentido, tráfico y aerolínea. Bandas: enero–febrero (verano) y junio–agosto (invierno). Los faltantes interrumpen la línea.'});
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
// Estacionalidad: pernoctaciones EOH (todas las residencias) del territorio y sus comparadores.
const seasonRows=k=>model.eoh(k,'pernoctes','total');
// Años con 12 meses observados (más recientes primero) y el último año, si está incompleto.
function seasonYears(k){
 const rows=seasonRows(k),complete=M.seasonalitySeries(rows).map(r=>r.year).reverse(),last=rows.at(-1)?.period.slice(0,4);
 return {complete,incomplete:last&&!complete.includes(last)?last:null};
}
const yearValues=(rows,year)=>months(year+'-01',year+'-12').map(p=>at(rows,p).value??null);
function renderSeason(){
 const S=seasonScope;
 if(!S.territories().some(([k])=>k===state.seasonTerritory))state.seasonTerritory='Córdoba';
 const focus=state.seasonTerritory,level=S.level(),name=S.name,scopes=unique([focus,...S.compare()]),rows=seasonRows(focus);
 const {complete,incomplete}=seasonYears(focus);
 if(!complete.includes(state.seasonYear)&&state.seasonYear!==incomplete)state.seasonYear=complete[0]||incomplete||'';
 const year=state.seasonYear,full=complete.includes(year),latest=rows.at(-1)?.period;
 current={family:'eoh',quarter:false,period:full?year+'-12':latest,latest};
 // 1. Franja: territorio, comparadores (misma regla de escalas que Demanda hotelera) y año de análisis.
 $('filters').innerHTML=field('seasonTerritory','Territorio',S.territories(),{wide:true})+S.control()+field('seasonYear','Año de análisis',[...(incomplete?[[incomplete,incomplete+' (incompleto)']]:[]),...complete.map(y=>[y,y])]);
 const values=yearValues(rows,year),scale=level==='region'?'regiones EOH':'localidades relevadas',measure='pernoctaciones · todas las residencias';
 // Primera mención de las fuentes en la sección: EOH y ANAC con su nombre completo.
 let html=`<div class="hotel-range"><span><strong>${esc(year)}${full?'':' (incompleto)'}</strong> · ${esc(name(focus))} · pernoctaciones de la EOH (Encuesta de Ocupación Hotelera, INDEC), todas las residencias · llegadas aéreas de ANAC (Administración Nacional de Aviación Civil), procesamiento Yvera</span></div>`+seasonKpis(focus,year,values,name);
 html+='<div class="grid equal">'+seasonIndexByScope(focus,scopes,level,year,name,scale,measure)+seasonIndexTrend(scopes,name,measure)+'</div>';
 html+='<div class="grid equal">'+seasonHotelAir(focus,year,name)+seasonValleys(focus,year,values,name,measure)+'</div>';
 html+=seasonHeat(focus,scopes,level,year,name);
 $('dashboard').innerHTML=html;
}
// a) Indicadores del territorio en el año: índice, mes pico, mes valle y meses debajo del promedio.
function seasonKpis(focus,year,values,name){
 const idx=M.seasonalityIndex(values),valley=M.valleyMonths(values);
 if(idx===null||!valley){const k=t=>kpi(t,'Año incompleto','Requiere los 12 meses observados',year);return '<div class="kpis">'+kpi('Índice de estacionalidad · '+name(focus),'Año incompleto','Requiere los 12 meses observados',year,true)+k('Mes pico')+k('Mes valle')+k('Temporada baja')+'</div>';}
 const top=M.topMonths(values),peak=top[0],low=values.indexOf(Math.min(...values)),below=valley.filter(r=>r.below);
 return '<div class="kpis">'+kpi('Índice de estacionalidad · '+name(focus),fmt(idx,1)+' %','peso de los 3 meses más fuertes',top.map(i=>monthNames[i]).join(', ')+' · '+year,true)+kpi('Mes pico',monthNames[peak]+' '+year,fmt(values[peak])+' pernoctaciones',signed(valley[peak].diff)+' % frente al promedio mensual')+kpi('Mes valle',monthNames[low]+' '+year,fmt(values[low])+' pernoctaciones',signed(valley[low].diff)+' % frente al promedio mensual')+kpi('Temporada baja',below.length+(below.length===1?' mes':' meses'),'por debajo del promedio mensual del año',below.map(r=>monthNames[r.month-1]).join(', '))+'</div>';
}
// b) Índice por ámbito: territorio, comparadores y los 10 de mayor volumen de la misma escala (hasta 14).
function seasonIndexByScope(focus,scopes,level,year,name,scale,measure){
 const universe=Object.keys(D.eoh.scope_meta).filter(k=>D.eoh.scope_meta[k].level===level);
 const totalRank=universe.map(k=>({code:k,total:model.profile(seasonRows(k),+year,false).total})).filter(r=>valid(r.total)).sort((a,b)=>b.total-a.total);
 const keys=unique([focus,...scopes,...totalRank.slice(0,10).map(r=>r.code)]).slice(0,14);
 const items=keys.map(k=>({code:k,name:name(k),values:[M.seasonalityIndex(yearValues(seasonRows(k),year))],highlight:k===focus})).filter(r=>valid(r.values[0])).sort((a,b)=>b.values[0]-a.values[0]);
 return barCard({id:'season-index',title:'Índice de estacionalidad por ámbito',subtitle:scale+' · '+year+' · '+measure+' · '+name(focus)+' destacado',items,seriesNames:['Índice de estacionalidad'],metric:'ocupacion',unit:'%',limit:14,periodText:'Enero a diciembre de '+year,digits:[null,1],emptyText:'Año incompleto: el índice requiere los 12 meses observados.',method:'Participación de los 3 meses más fuertes en el total anual. 25 % = sin estacionalidad; 100 % = toda la actividad en 3 meses. Solo años con 12 meses observados. Universo: territorio, comparadores y los 10 ámbitos de mayor volumen anual de la misma escala, hasta 14.'});
}
// c) Evolución del índice: un punto por año completo y ámbito (territorio + comparadores).
function seasonIndexTrend(scopes,name,measure){
 const series=scopes.map(k=>({k,rows:M.seasonalitySeries(seasonRows(k))})),years=unique(series.flatMap(s=>s.rows.map(r=>r.year))).filter(y=>y>='2007').sort();
 const opt=commonOption();opt.grid.bottom=35;
 opt.tooltip.formatter=params=>'<strong>'+esc(params[0]?.axisValue||'')+'</strong>'+params.map(p=>{const r=series[p.seriesIndex].rows.find(x=>x.year===p.axisValue);return '<div style="margin-top:5px">'+p.marker+' '+esc(p.seriesName)+': <strong>'+(r?fmt(r.value,1)+' %':'Sin año completo')+'</strong>'+(r?' · '+r.top.map(i=>monthNames[i]).join(', '):'')+'</div>';}).join('');
 opt.xAxis={type:'category',data:years,boundaryGap:false,axisLabel:{fontSize:9,color:'#7a8d98'},axisTick:{show:false},axisLine:{lineStyle:{color:'#dfe7eb'}}};
 opt.yAxis={type:'value',name:'%',scale:true,nameTextStyle:{fontSize:9,color:'#82949d'},axisLabel:{fontSize:9,color:'#7a8d98',formatter:x=>fmt(x,0)+' %'},splitLine:{lineStyle:{color:'#edf1f4'}}};
 opt.series=series.map((s,i)=>({name:name(s.k),type:'line',data:years.map(y=>s.rows.find(r=>r.year===y)?.value??null),connectNulls:false,symbolSize:6,lineStyle:{width:i?2:3},itemStyle:{color:colors[i]},emphasis:{focus:'series'}}));
 return card({id:'season-index-trend',title:'Evolución del índice de estacionalidad',subtitle:scopes.map(name).join(' / ')+' · años completos '+(years[0]||'')+'–'+(years.at(-1)||'')+' · '+measure,option:opt,metric:'ocupacion',unit:'%',columns:['Año',...scopes.map(name)],rows:years.map(y=>[y,...series.map(s=>s.rows.find(r=>r.year===y)?.value??null)]),digits:[null,...scopes.map(()=>1)],periodText:(years[0]||'')+' – '+(years.at(-1)||''),method:'Cada punto es el índice del año; los años incompletos no se muestran. Índice: participación de los 3 meses más fuertes en el total anual (25 % = sin estacionalidad; 100 % = toda la actividad en 3 meses).'});
}
// d) Hotelería y llegadas aéreas: dos fuentes en % de su propio año, solo para el territorio.
function seasonHotelAir(focus,year,name){
 const air=(model.air('llegadas','all','all').SACO||[]).map(r=>({period:r.period,value:r.pasajeros})),cp=model.crossProfile(seasonRows(focus),air,+year);
 const airOk=cp.b.complete===12,provincial=focus!=='Córdoba'&&focus!=='localidad:Córdoba',airName='Llegadas aéreas · SACO';
 const series=[{name:'Pernoctaciones · '+name(focus),values:cp.a.values},...(airOk?[{name:airName,values:cp.b.values}]:[])];
 const opt=commonOption();opt.grid.bottom=35;opt.tooltip.formatter=p=>tooltipRows(p,'%');
 opt.xAxis={type:'category',data:monthNames,boundaryGap:false,axisLabel:{fontSize:10,color:'#758e9c'},axisTick:{show:false},axisLine:{lineStyle:{color:'#dfe8ee'}}};
 opt.yAxis={type:'value',name:'% del año',nameTextStyle:{fontSize:9,color:'#78919f'},axisLabel:{formatter:x=>fmt(x,0),fontSize:9},splitLine:{lineStyle:{color:'#edf2f5'}}};
 opt.series=series.map((s,i)=>({name:s.name,type:'line',data:s.values,connectNulls:false,symbolSize:6,lineStyle:{width:i?2:3,type:i?'dashed':'solid'},itemStyle:{color:colors[i]},emphasis:{focus:'series'}}));
 const extra=(airOk?'':notice(+year<2017?'Los datos aéreos están disponibles desde 2017: para '+year+' se muestra solo la hotelería.':'Sin los 12 meses de llegadas aéreas en '+year+': se muestra solo la hotelería.','historical'))+(cp.a.complete===12?'':notice('Año incompleto en la hotelería: '+year+' no tiene los 12 meses observados, así que su porcentaje del año no se calcula.','historical'));
 return card({id:'season-hotel-air',title:'Hotelería y llegadas aéreas · patrón mensual de Córdoba',subtitle:name(focus)+' · pernoctaciones EOH (todas las residencias) y pasajeros llegados al aeropuerto de Córdoba (SACO'+(provincial?', aeropuerto de Córdoba, referencia provincial':'')+'; cabotaje + internacional, todas las aerolíneas) · % del año · '+year,option:opt,metric:'ocupacion',unit:'%',columns:['Mes',...series.map(s=>s.name)],rows:monthNames.map((m,i)=>[m+' '+year,...series.map(s=>s.values[i])]),digits:[null,...series.map(()=>1)],periodText:'Enero a diciembre de '+year,extra,emptyText:'Año incompleto: los porcentajes del año requieren los 12 meses.',sourceReferences:'ANAC / SIAC · Procesamiento Yvera: '+sources.air[1],method:'Dos fuentes distintas superpuestas en porcentaje del año; no se suman ni se comparan en niveles. Pasajeros no equivale a turistas.'});
}
// e) Meses valle y calendario: diferencia de cada mes con el promedio y conteo de feriados y eventos.
function seasonValleys(focus,year,values,name,measure){
 const valley=M.valleyMonths(values),H=window.HotelModel,events=window.HOTEL_DATA.calendar.events,FL='Feriados y fines de semana largos';
 // Misma lógica que Demanda hotelera: provincia o capital; para otros destinos, solo feriados (nacionales).
 const scope=focus==='Córdoba'||focus==='localidad:Córdoba'?focus:null;
 const perMonth=months(year+'-01',year+'-12').map(p=>({holidays:H.eventsFor(events,scope||'Córdoba',[p],FL),events:scope?H.eventsFor(events,scope,[p]).filter(e=>e.category!==FL):[]}));
 const opt=commonOption();opt.legend.show=false;opt.grid={left:5,right:15,top:34,bottom:20,containLabel:true};
 opt.tooltip={trigger:'item',confine:true,formatter:p=>{const i=p.dataIndex,c=perMonth[i],list=xs=>xs.length?xs.map(e=>esc(e.name)).join('<br>'):'Ninguno';return '<strong>'+monthNames[i]+' '+year+'</strong><br>'+signed(valley[i].diff)+' % frente al promedio mensual<div style="margin-top:6px"><strong>Feriados y fines de semana largos ('+c.holidays.length+')</strong><br>'+list(c.holidays)+'</div>'+(scope?'<div style="margin-top:6px"><strong>Eventos ('+c.events.length+')</strong><br>'+list(c.events)+'</div>':'');}};
 opt.xAxis={type:'category',data:monthNames,axisLabel:{interval:0,fontSize:9,color:'#5b7586',lineHeight:13,formatter:(m,i)=>m+'\nFL '+perMonth[i].holidays.length+(scope?'\nEv '+perMonth[i].events.length:'')},axisTick:{show:false},axisLine:{lineStyle:{color:'#c9d5db'}}};
 opt.yAxis={type:'value',name:'% frente al promedio',nameTextStyle:{fontSize:9,color:'#82949d',align:'left'},axisLabel:{fontSize:9,color:'#7a8d98',formatter:x=>fmt(x,0)},splitLine:{lineStyle:{color:'#edf1f4'}}};
 opt.series=valley?[{type:'bar',barMaxWidth:22,data:valley.map(r=>({value:r.diff,itemStyle:{color:r.below?'#c9d5db':colors[0],borderRadius:r.below?[0,0,3,3]:[3,3,0,0]}})),label:{show:true,position:'top',fontSize:9,color:'#597787',formatter:p=>fmt(p.value,0)}}]:[];
 const years=unique(events.map(e=>e.start_date.slice(0,4))).sort();
 return card({id:'season-valleys',title:'Meses valle y calendario',subtitle:name(focus)+' · '+year+' · '+measure+' · diferencia con el promedio mensual · debajo de cada mes: FL = feriados y fines de semana largos'+(scope?', Ev = eventos del calendario':' (para este destino solo se cuentan feriados)'),option:valley?opt:null,metric:'ocupacion',unit:'%',columns:['Mes','Diferencia con el promedio (%)','Feriados y fines de semana largos','Eventos'],rows:valley?valley.map((r,i)=>[monthNames[i]+' '+year,r.diff,perMonth[i].holidays.length,perMonth[i].events.length]):[],digits:[null,1,0,0],periodText:'Enero a diciembre de '+year,emptyText:'Año incompleto: los meses valle requieren los 12 meses observados.',method:'El conteo es descriptivo: no atribuye la actividad a los eventos. Calendario no exhaustivo; cargado para '+years.join(' y ')+'. Barras: (mes ÷ promedio mensual del año − 1) × 100; en gris, los meses por debajo del promedio.'});
}
// Calendario de intensidad: % del año por mes; territorio, comparadores y principales ámbitos de la misma escala (hasta 14).
function seasonHeat(focus,scopes,level,year,name){
 const universe=Object.keys(D.eoh.scope_meta).filter(k=>D.eoh.scope_meta[k].level===level);
 const totalRank=universe.map(k=>({code:k,total:model.profile(seasonRows(k),+year,false).total})).filter(r=>valid(r.total)).sort((a,b)=>b.total-a.total);
 const keys=unique([focus,...scopes,...totalRank.slice(0,10).map(r=>r.code)]).slice(0,14),profiles=keys.map(k=>model.profile(seasonRows(k),+year,true));
 const values=profiles.flatMap((r,y)=>r.values.flatMap((v,x)=>valid(v)?[[x,y,v]]:[]));
 const width=Math.max(240,($('dashboard')?.clientWidth||700)-44),height=Math.max(310,keys.length*26+120);
 const heat=commonOption();heat.legend.show=false;heat.grid={left:12,right:15,top:12,bottom:70,containLabel:true};
 heat.tooltip={position:'top',confine:true,formatter:p=>esc(name(keys[p.value[1]]))+' · '+monthNames[p.value[0]]+' '+year+'<br><strong>'+fmt(p.value[2],1)+' %</strong>'};
 heat.xAxis={type:'category',data:monthNames,splitArea:{show:true},axisLabel:{fontSize:10},axisTick:{show:false}};
 heat.yAxis={type:'category',data:keys.map(name),inverse:true,splitArea:{show:true},axisLabel:{fontSize:10,width:200,overflow:'truncate'},axisTick:{show:false}};
 heat.visualMap={min:0,max:Math.max(...values.map(v=>v[2]),1),calculable:true,orient:'horizontal',left:'center',bottom:8,itemWidth:10,itemHeight:Math.min(130,Math.floor(width*0.45)),textGap:6,inRange:{color:['#eef5f2','#b8d9ce','#5aa78f','#126d58']},textStyle:{fontSize:9},formatter:v=>fmt(v,1)+'%'};
 heat.series=[{type:'heatmap',data:values,itemStyle:{borderColor:'#fff',borderWidth:2,borderRadius:2},label:{show:window.innerWidth>700,formatter:p=>fmt(p.value[2],1),fontSize:9,color:'#204e40'},emphasis:{itemStyle:{borderColor:'#163f49',borderWidth:2}}}];
 return card({id:'season-heat',title:'Calendario de intensidad por destino',subtitle:name(focus)+', comparadores y principales destinos de la escala · % de las pernoctaciones del año · '+year+' · todas las residencias',option:heat,metric:'ocupacion',unit:'%',height,columns:['Destino',...monthNames],rows:keys.map((k,i)=>[name(k),...profiles[i].values]),digits:[null,...monthNames.map(()=>1)],periodText:'Enero a diciembre de '+year,emptyText:'Año incompleto: los porcentajes del año requieren los 12 meses observados.',method:'Córdoba, comparadores y principales destinos por volumen anual, hasta 14 filas. Celdas vacías: sin dato o año incompleto para calcular porcentajes. Las localidades no se suman para estimar provincias.'});
}
// Dólares: en millones con un decimal desde el millón.
const usd=x=>valid(x)?(Math.abs(x)>=1e6?'USD '+fmt(x/1e6,1)+' M':'USD '+fmt(x,0)):'Sin dato';
const INTL_MARKET_METHOD='Agrupaciones de países publicadas por la ETI para este paso; difieren entre receptivo y emisivo y entre pasos: no se cruzan ni se unifican. Estimaciones muestrales: en un paso chico los trimestres sueltos son ruidosos; preferí el año completo.';
const quarterCaption=ps=>ps.length>1?label(ps[0],true)+' – '+label(ps.at(-1),true):label(ps[0],true);
// 7. Participación del aeropuerto de Córdoba entre los tres pasos aéreos con serie, por trimestre y sentido.
function intlShare(){
 const gates=['Aep. Córdoba',...INTL_PEERS],known=intlQuarters(),qs=months(known[0],known.at(-1),3);
 const rows=flow=>qs.map(p=>{const t=gates.map(g=>at(model.international(g,flow,'turistas'),p).value);return {period:p,value:ratio(t[0],sum(t),100)};});
 // Primer trimestre con los tres pasos: la serie de Mendoza empieza más tarde que las otras dos.
 const firstAll=qs.find(p=>['receptivo','emisivo'].some(f=>gates.every(g=>valid(at(model.international(g,f,'turistas'),p).value))));
 return lineCard({id:'intl-share',title:'Participación del aeropuerto de Córdoba entre los tres pasos aéreos relevados',subtitle:'Turistas del aeropuerto de Córdoba ÷ suma de Córdoba, Mendoza y Ezeiza y Aeroparque · '+label(qs[0],true)+' – '+label(qs.at(-1),true)+' · receptivo y emisivo · con los tres pasos desde '+label(firstAll,true),series:[{name:'Receptivo · entraron por el paso',rows:rows('receptivo')},{name:'Emisivo · salieron por el paso',rows:rows('emisivo')}],periods:qs,metric:'ocupacion',view:'levels',quarter:true,seasonBands:false,method:'No es participación nacional: la ETI releva también pasos terrestres y fluviales que no están en esta base. Un trimestre sin dato en alguno de los tres pasos queda vacío: la serie del Aeropuerto de Mendoza empieza en '+label(firstAll,true)+' y faltan trimestres de 2020 y 2021.'});
}
// 6. Estadía media y gasto por turista por paso, en el período (razones de sumas; Córdoba destacada).
function intlStayAndSpend(ps,caption,scopes){
 const inbound=state.flow==='receptivo',agg=Object.fromEntries(scopes.map(g=>[g,model.internationalPeriod(g,state.flow,ps)])),who='turistas '+(inbound?'entrados':'salidos')+' por cada aeropuerto';
 const trip=inbound?'Noches y gasto del viaje por Argentina, no solo en Córdoba.':'Noches y gasto del viaje al exterior. No es gasto turístico realizado en Córdoba.';
 const items=k=>scopes.map(g=>({code:g,name:gateLabel(g),values:[agg[g][k]],highlight:g==='Aep. Córdoba'}));
 return barCard({id:'intl-stay',title:'Estadía media · '+who,subtitle:scopes.map(gateLabel).join(' / ')+' · '+caption+' · noches por turista',items:items('estadia_media'),seriesNames:['Estadía media'],metric:'estadia_media',unit:'noches',labelDigits:1,digits:[null,1],periodText:caption,method:'Pernoctes del período ÷ turistas del período (no se promedian estadías trimestrales); sin dato si falta un trimestre. '+trip})+barCard({id:'intl-spend',title:'Gasto por turista · '+who,subtitle:scopes.map(gateLabel).join(' / ')+' · '+caption+' · dólares corrientes',items:items('gasto_por_turista_usd'),seriesNames:['USD por turista'],metric:'gasto_por_turista_usd',unit:'USD',digits:[null,1],periodText:caption,method:'Gasto total del período ÷ turistas del período (no se promedian gastos trimestrales); sin dato si falta un trimestre. '+(inbound?'Gasto durante el viaje en Argentina. No es gasto exclusivamente realizado en Córdoba.':'Gasto durante el viaje al exterior. No es gasto turístico realizado en Córdoba.')});
}
// 5. Motivo principal del viaje: participación (%) de cada motivo en los turistas de cada paso.
function intlMotives(ps,caption,scopes){
 const inbound=state.flow==='receptivo',motives=unique(D.international.motives.filter(r=>r.flow===state.flow).map(r=>r.motive)),BUSINESS='Negocios/congreso/conferencia';
 // El total de cada paso viene de la serie por mercados; un motivo sin estimación en algún trimestre queda sin dato.
 const totals=Object.fromEntries(scopes.map(g=>[g,sum(model.internationalMarkets(g,state.flow,ps).map(r=>r.turistas))]));
 const motiveTotal=(g,m)=>sum(ps.map(p=>D.international.motives.find(r=>r.period===p&&r.gateway===g&&r.flow===state.flow&&r.motive===m)?.turistas??null));
 const shares=Object.fromEntries(scopes.map(g=>[g,Object.fromEntries(motives.map(m=>[m,ratio(motiveTotal(g,m),totals[g],100)]))]));
 const pct=g=>valid(shares[g][BUSINESS])?fmt(shares[g][BUSINESS],1)+' %':'sin estimación publicada';
 const shortName=g=>g==='Aep. Córdoba'?'Córdoba':g==='Aep. Mendoza'?'Mendoza':'Ezeiza y Aeroparque';
 const note=`<p class="intl-note"><strong>Negocios, congresos y conferencias:</strong> ${valid(shares['Aep. Córdoba'][BUSINESS])?esc(pct('Aep. Córdoba'))+' de los':'sin estimación publicada para los'} turistas ${inbound?'entrados':'salidos'} por Córdoba${scopes.length>1?' ('+scopes.slice(1).map(g=>esc(shortName(g))+' '+esc(pct(g))).join(', ')+')':''}.</p>`;
 const html=barCard({id:'intl-motives',title:'Motivo principal del viaje · participación por paso',subtitle:scopes.map(gateLabel).join(' / ')+' · '+caption+' · % de los turistas '+(inbound?'entrados':'salidos')+' por cada aeropuerto',items:motives.map(m=>({name:m,values:scopes.map(g=>shares[g][m])})),seriesNames:scopes.map(gateLabel),metric:'ocupacion',unit:'%',limit:motives.length,columns:['Motivo',...scopes.map(gateLabel)],rows:motives.map(m=>[m,...scopes.map(g=>shares[g][m])]),digits:[null,...scopes.map(()=>1)],extra:note,method:'Las categorías sin estimación publicada permanecen sin dato. El total de turistas se obtiene de la serie por mercados, no de sumar motivos incompletos. Participación: turistas del motivo ÷ total del paso en el período.'});
 // Tooltip: participación y total de turistas de cada paso como referencia.
 cards.get('intl-motives').option.tooltip.formatter=params=>'<strong>'+esc(params[0]?.name||'')+'</strong>'+params.map(p=>{const g=scopes[p.seriesIndex];return '<div style="margin-top:5px">'+p.marker+' '+esc(p.seriesName)+': <strong>'+(valid(p.value)?fmt(p.value,1)+' %':'Sin estimación')+'</strong> de '+fmt(totals[g])+' turistas</div>';}).join('');
 return html;
}
// 4a. Mercados de residencia (receptivo) o destinos (emisivo) del aeropuerto de Córdoba: período y año anterior.
function intlMarkets(ps,caption){
 const inbound=state.flow==='receptivo',before=ps.map(previous),now=model.internationalMarkets('Aep. Córdoba',state.flow,ps),old=model.internationalMarkets('Aep. Córdoba',state.flow,before);
 const total=sum(now.map(r=>r.turistas)),rows=now.map(r=>{const o=old.find(x=>x.market===r.market);return {...r,old:o?.turistas??null,share:ratio(r.turistas,total,100),change:change(r.turistas,o?.turistas)};}).sort((a,b)=>(b.turistas??-1)-(a.turistas??-1));
 return barCard({id:'intl-markets',title:inbound?'Mercados de residencia · turistas entrados por el aeropuerto de Córdoba':'Destinos del viaje · residentes salidos por el aeropuerto de Córdoba',subtitle:'Aeropuerto de Córdoba · turistas · '+caption+' frente a '+quarterCaption(before),items:rows.map(r=>({name:r.market,values:[r.turistas,r.old]})),seriesNames:['Período actual','Mismo período del año anterior'],metric:'turistas',unit:'turistas',limit:12,periodText:caption+' y '+quarterCaption(before),columns:[inbound?'Mercado de residencia':'Destino del viaje','Turistas','Pernoctes','Participación (%)','Variación interanual (%)'],rows:rows.map(r=>[r.market,r.turistas,r.pernoctes,r.share,r.change]),digits:[null,0,0,1,1],method:INTL_MARKET_METHOD+' Participación sobre la suma de las agrupaciones del período.'});
}
// 4b. Evolución anual de los mercados del aeropuerto de Córdoba (años con sus 4 trimestres).
function intlMarketTrend(){
 const inbound=state.flow==='receptivo',share=state.intlMarketView==='share',years=[],omitted=[];
 for(let y=2014;y<=+intlYears()[0];y++){const ms=model.internationalMarkets('Aep. Córdoba',state.flow,months(y+'-01',y+'-10',3));if(ms.length&&ms.every(r=>valid(r.turistas)))years.push({year:String(y),ms});else omitted.push(String(y));}
 const order=(years.at(-1)?.ms||[]).slice().sort((a,b)=>b.turistas-a.turistas).map(r=>r.market);
 const series=order.map(m=>({name:m,values:years.map(y=>{const v=y.ms.find(r=>r.market===m)?.turistas,t=sum(y.ms.map(r=>r.turistas));return share?ratio(v,t,100):v;})}));
 const unit=share?'%':'turistas',opt=commonOption();opt.grid.bottom=35;opt.tooltip.formatter=p=>tooltipRows(p,unit);
 opt.xAxis={type:'category',data:years.map(y=>y.year),boundaryGap:false,axisLabel:{fontSize:9,color:'#7a8d98'},axisTick:{show:false},axisLine:{lineStyle:{color:'#dfe7eb'}}};
 opt.yAxis={type:'value',max:share?100:undefined,name:share?'% del año':'turistas',nameTextStyle:{fontSize:9,color:'#82949d',align:'left'},axisLabel:{formatter:axisLabel,fontSize:9,color:'#7a8d98'},splitLine:{lineStyle:{color:'#edf1f4'}}};
 opt.series=series.map((s,i)=>({name:s.name,type:'line',stack:'total',data:s.values,showSymbol:false,lineStyle:{width:1},areaStyle:{opacity:.75},itemStyle:{color:colors[i]},emphasis:{focus:'series'}}));
 return card({id:'intl-market-trend',title:'Evolución anual de los mercados · '+(inbound?'turistas entrados':'residentes salidos')+' por el aeropuerto de Córdoba',subtitle:'Aeropuerto de Córdoba · años completos '+(years[0]?.year||'')+'–'+(years.at(-1)?.year||'')+' · '+(share?'participación (%)':'turistas')+(omitted.length?' · años omitidos por trimestres faltantes: '+omitted.join(', '):''),controls:field('intlMarketView','Lectura',[['share','Participación (%)'],['levels','Turistas']]),option:opt,metric:share?'ocupacion':'turistas',unit,columns:['Año',...series.map(s=>s.name)],rows:years.map((y,i)=>[y.year,...series.map(s=>s.values[i])]),digits:share?[null,...series.map(()=>1)]:null,periodText:(years[0]?.year||'')+' – '+(years.at(-1)?.year||''),method:INTL_MARKET_METHOD+' Áreas apiladas: cada año suma sus 4 trimestres; los años con trimestres faltantes se omiten.'});
}
// 2b. Balanza anual del aeropuerto de Córdoba: receptivo y emisivo (barras) y saldo (línea), años completos.
function intlBalance(){
 const byUsd=state.intlBalance==='usd',key=byUsd?'gasto_total_usd':'turistas',years=[],omitted=[];
 for(let y=2015;y<=+intlYears()[0];y++){
  const qs=months(y+'-01',y+'-10',3),r=model.internationalPeriod('Aep. Córdoba','receptivo',qs)[key],e=model.internationalPeriod('Aep. Córdoba','emisivo',qs)[key];
  if(valid(r)&&valid(e))years.push({year:String(y),r,e,saldo:r-e});else omitted.push(String(y));
 }
 const unit=byUsd?'USD':'turistas',opt=commonOption();opt.grid.bottom=35;
 opt.tooltip.formatter=params=>'<strong>'+esc(params[0]?.axisValue||'')+'</strong>'+params.map(p=>'<div style="margin-top:5px">'+p.marker+' '+esc(p.seriesName)+': <strong>'+(byUsd?usd(p.value):fmt(p.value)+' turistas')+'</strong></div>').join('');
 opt.xAxis={type:'category',data:years.map(r=>r.year),axisLabel:{fontSize:9,color:'#7a8d98'},axisTick:{show:false},axisLine:{lineStyle:{color:'#dfe7eb'}}};
 opt.yAxis={type:'value',name:byUsd?'USD':'turistas',nameTextStyle:{fontSize:9,color:'#82949d',align:'left'},axisLabel:{formatter:axisLabel,fontSize:9,color:'#7a8d98'},splitLine:{lineStyle:{color:'#edf1f4'}}};
 opt.series=[{name:'Receptivo · entraron por el paso',type:'bar',barMaxWidth:18,data:years.map(r=>r.r),itemStyle:{color:colors[0]}},{name:'Emisivo · salieron por el paso',type:'bar',barMaxWidth:18,data:years.map(r=>r.e),itemStyle:{color:colors[1]}},{name:'Saldo (receptivo − emisivo)',type:'line',data:years.map(r=>r.saldo),symbolSize:6,lineStyle:{width:2,color:'#183c51'},itemStyle:{color:'#183c51'}}];
 return card({id:'intl-balance',title:'Balanza del turismo internacional por el aeropuerto de Córdoba',subtitle:'Aeropuerto de Córdoba · '+(years[0]?.year||'')+'–'+(years.at(-1)?.year||'')+' · '+(byUsd?'gasto en dólares corrientes':'turistas')+' · receptivo, emisivo y saldo'+(omitted.length?' · años omitidos por trimestres faltantes: '+omitted.join(', '):''),controls:field('intlBalance','Indicador',[['usd','Gasto (USD)'],['turistas','Turistas']]),option:opt,metric:byUsd?'gasto_total_usd':'turistas',unit,columns:['Año','Receptivo','Emisivo','Saldo'],rows:years.map(r=>[r.year,r.r,r.e,r.saldo]),digits:[null,0,0,0],periodText:(years[0]?.year||'')+' – '+(years.at(-1)?.year||''),method:'Gasto declarado en la ETI, en dólares corrientes. El emisivo es sensible al tipo de cambio y a la inflación en dólares; no se deflacta. El paso no identifica la residencia provincial de quien viaja. Cada año suma sus 4 trimestres; los años con trimestres faltantes se omiten.'+(omitted.length?' Omitidos: '+omitted.join(', ')+'.':'')});
}
function renderInternational(){
 const ps=intlPeriod(),scopes=intlScopes(),last=intlQuarters().at(-1),caption=ps.length>1?label(ps[0],true)+' – '+label(ps.at(-1),true):label(ps[0],true);
 current={family:'eti',quarter:true,period:ps.at(-1),latest:last};
 // 1. Franja: sentido, comparadores (fichas activables) y período del análisis.
 let controls=field('flow','Sentido',[['receptivo','Receptivo · entraron al país por el paso'],['emisivo','Emisivo · salieron del país por el paso']],{wide:true})+chipCompare('intlCompare',INTL_PEERS.map(k=>[k,gateLabel(k)]),intlCompareKeys(),gateLabel,[],[],{toggle:true});
 controls+=field('intlPreset','Período del análisis',[['year','Año completo'],['4q','Últimos 4 trimestres'],['latest','Último trimestre']]);
 if(state.intlPreset==='year')controls+=field('intlYear','Año',intlYears());
 $('filters').innerHTML=controls;
 const agg=(g,flow=state.flow,q=ps)=>model.internationalPeriod(g,flow,q),metric=state.intlMetric,co=agg('Aep. Córdoba'),old=agg('Aep. Córdoba',state.flow,ps.map(previous)),peer=scopes[1];
 const local=field('intlMetric','Indicador',metricOptions(['turistas','pernoctes','estadia_media','gasto_por_turista_usd','gasto_diario_usd']))+field('view','Lectura',[['levels','Valores observados'],['index','Índice base 100'],['yoy','Variación interanual (%)']]);
 // Concepto que gobierna la sección: el paso no es el destino.
 let html='<div class="hotel-range intl-concept"><span><strong>Paso Córdoba no es turismo en Córdoba.</strong> Receptivo: residentes en el exterior que entraron al país por el aeropuerto de Córdoba, vayan a donde vayan. Emisivo: residentes en Argentina, de cualquier provincia, que salieron del país por ese aeropuerto. Fuente: ETI (Encuesta de Turismo Internacional, INDEC).</span></div>'+warnHistorical('eti');
 // 2a. Balanza del período por el aeropuerto de Córdoba, independiente del sentido elegido.
 const rec=agg('Aep. Córdoba','receptivo').gasto_total_usd,emi=agg('Aep. Córdoba','emisivo').gasto_total_usd,saldo=valid(rec)&&valid(emi)?rec-emi:null;
 html+='<div class="kpis">'+kpi('Ingreso de divisas · receptivo',usd(rec),'gasto de los turistas entrados por el aeropuerto de Córdoba',caption,true)+kpi('Gasto en el exterior · emisivo',usd(emi),'gasto de los residentes salidos por el aeropuerto de Córdoba',caption)+kpi('Saldo',valid(saldo)?(saldo>0?'+':saldo<0?'−':'')+usd(Math.abs(saldo)):'Sin dato','receptivo − emisivo',caption)+kpi('Relación emisivo / receptivo',valid(rec)&&valid(emi)&&rec>0?fmt(emi/rec,1)+' veces':'Sin dato','dólares gastados afuera por cada dólar que ingresa por el paso',caption)+'</div>';
 html+=intlBalance();
 html+='<div class="inline-controls">'+local+'</div>';
 // Evolución: el período; si es un solo trimestre, los 16 trimestres que terminan en él.
 const trendPs=ps.length===1?quarterSpan(ps[0],16):ps,get=k=>model.international(k,state.flow,metric);
 const inbound=state.flow==='receptivo';
 html+=lineCard({id:'intl-trend',title:specs[metric][0]+' · turistas '+(inbound?'receptivos por aeropuerto de entrada':'emisivos por aeropuerto de salida'),subtitle:scopes.map(gateLabel).join(' / ')+' · '+(ps.length===1?'16 trimestres hasta '+label(ps[0],true):caption)+' · '+(inbound?'residentes en el exterior entrados por cada aeropuerto':'residentes en Argentina salidos por cada aeropuerto'),series:scopes.map(k=>({name:gateLabel(k),rows:get(k)})),periods:trendPs,metric,quarter:true,seasonBands:false,method:'Los pasos seleccionados no constituyen el total nacional.'});
 html+='<div class="grid equal">'+intlMarkets(ps,caption)+intlMarketTrend()+'</div>';
 html+=intlMotives(ps,caption,scopes);
 html+='<div class="grid equal">'+intlStayAndSpend(ps,caption,scopes)+'</div>';
 html+=intlShare();
 $('dashboard').innerHTML=html;
}
function renderInternal(){
 const ps=internalPeriod(),last=internalQuarters().at(-1),caption=ps.length>1?label(ps[0],true)+' – '+label(ps.at(-1),true):label(ps[0],true),regions=INTERNAL_REGIONS();
 current={family:'evyth',quarter:true,period:ps.at(-1),latest:last};
 // 1. Franja: comparadores (regiones de destino; Argentina como referencia) y período del análisis.
 let controls=chipCompare('internalCompare',regions.map(k=>[k,k]),internalAllKeys(),internalName,[['Todas las regiones',internalAllKeys().includes('Argentina')?[...regions,'Argentina']:regions]],[['Argentina',INTERNAL_REFERENCE_LABEL,internalRelative()]]);
 controls+=field('internalPreset','Período del análisis',[['latest','Último trimestre'],['4q','Últimos 4 trimestres'],['year','Año completo']]);
 if(state.internalPreset==='year')controls+=field('internalYear','Año',internalYears());
 $('filters').innerHTML=controls;
 const scopes=internalScopes(),agg=(k,q=ps)=>M.evythAggregate(D.internal.scopes[k]||[],q),metric=state.internalMetric,c=agg('Córdoba'),a=agg('Argentina'),peer=internalAllKeys().find(k=>k!=='Argentina');
 const local=field('internalMetric','Indicador',metricOptions(['turistas','pernoctes','estadia_media','gasto_promedio_ars','gasto_total_ars']))+field('view','Lectura de la evolución',[['index','Índice base 100'],['levels','Valores observados'],['yoy','Variación interanual (%)']]);
 const get=k=>(D.internal.scopes[k]||[]).map(r=>({...r,value:r[metric]}));
 let html=warnHistorical('evyth')+'<div class="kpis">'+kpi(specs[metric][0]+' · destino Córdoba',value(c[metric],metric),peer?peer+': '+value(agg(peer)[metric],metric):'Sin comparador',caption,true)+kpi('Participación en turistas',value(ratio(c.turistas,a.turistas,100),'ocupacion'),'Sobre el total de destinos nacionales','Universo de la EVyTH')+kpi('Estadía media en Córdoba',value(c.estadia_media,'estadia_media'),'Argentina: '+value(a.estadia_media,'estadia_media'),'Incluye distintos tipos de alojamiento')+kpi('Gasto medio por turista',value(c.gasto_promedio_ars,'gasto_promedio_ars'),'Argentina: '+value(a.gasto_promedio_ars,'gasto_promedio_ars'),'Pesos corrientes del período')+'</div><div class="inline-controls">'+local+'</div>';
 if(internalAllKeys().includes('Argentina')&&!internalRelative())html+=notice('Las referencias nacionales/provinciales solo se comparan en índice o variación, por diferencia de escala');
 const rank=regions.concat('Córdoba').map(k=>({code:k,value:agg(k)[metric]})).filter(r=>valid(r.value)).sort((x,y)=>y.value-x.value);
 const trendPs=ps.length===1?months(month(ordinal(ps[0])-45),ps[0],3):ps;
 html+='<div class="grid">'+lineCard({id:'internal-trend',title:specs[metric][0]+' del turismo interno · evolución por destino',subtitle:scopes.map(internalName).join(' / '),series:scopes.map(k=>({name:internalName(k),rows:get(k)})),periods:trendPs,metric,quarter:true,seasonBands:false,method:'Residentes de los grandes aglomerados urbanos relevados, en viajes dentro de Argentina.'})+barCard({id:'internal-ranking',title:specs[metric][0]+' por región de destino',subtitle:caption+' · Córdoba destacada',items:rank.map(r=>({name:r.code,values:[r.value],highlight:r.code==='Córdoba'})),seriesNames:[specs[metric][0]],metric,unit:specs[metric][1],limit:10,method:'Ocho regiones de destino mutuamente excluyentes. Los promedios nacionales se calculan ponderando por turistas; no se promedian las tasas regionales.'})+'</div>';
 html+=barCard({id:'quintiles',title:'Turistas según quintil de ingresos del hogar · Argentina',subtitle:'Total nacional · '+label(ps.at(-1),true),items:D.internal.quintiles.filter(r=>r.period===ps.at(-1)).map(r=>({name:r.group,values:[r.turistas]})),seriesNames:['Turistas'],metric:'turistas',method:'Este recurso solo tiene apertura nacional. Los comparadores territoriales no se aplican; no identifica el perfil de visitantes de Córdoba ni el mercado premium.'});
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
 const methods=[['Comparación transversal','Córdoba se conserva como referencia. Las series se comparan con el mismo indicador, período y universo. El total nacional no integra los rankings de regiones, localidades ni aeropuertos. Las ausencias se muestran como “Sin dato”, sin completar con ceros.'],['Escalas territoriales','EOH: región Córdoba corresponde a la provincia; Cuyo incluye Mendoza, San Juan, San Luis y La Rioja. Las series de localidades no representan provincias completas. No se suman localidades para reconstruir la región.'],['Desde y hacia Córdoba','En conectividad aérea, “desde Córdoba” selecciona el aeropuerto de Córdoba como origen; “hacia Córdoba”, como destino. No se filtra residencia. Las rutas son tramos inmediatos y pueden ser escalas del viaje. Solo se incluye transporte aéreo: no se infieren otros medios.'],['Movimientos aeroportuarios','Se conservan las magnitudes procesadas por Yvera sobre SIAC, sin otro factor de división o multiplicación. En “llegadas + salidas”, el denominador nacional es la suma de movimientos en aeropuertos argentinos: un tramo de cabotaje interviene en sus dos extremos. No son personas únicas. Los últimos tres meses son provisorios.'],['Estacionalidad','Patrón mensual: valor del mes dividido por el total anual de su ámbito, únicamente con doce meses completos. Índice de estacionalidad: participación de los 3 meses con más pernoctaciones en el total anual (25 % = sin estacionalidad; 100 % = toda la actividad en 3 meses); solo años con 12 meses observados. Meses valle: diferencia de cada mes con el promedio mensual del año. Verano = diciembre del año anterior, enero y febrero; invierno = junio, julio y agosto.'],['Índices y variaciones','En demanda hotelera, el selector inferior del gráfico recalcula el intervalo de los indicadores y las descargas. En otras secciones, el zoom es visual. Índice base 100: primer período común con valores positivos de todos los comparadores dentro de la ventana. Interanual: mismo mes o trimestre del año anterior. Bases nulas o ausentes no producen variación. Ocultar una serie en la leyenda modifica la visualización; la tabla y el CSV conservan los comparadores elegidos.'],['Ocupación y promedios','Las tasas hoteleras son las publicadas oficialmente para cada región y categoría. Ocupación aérea agregada = suma de pasajeros / suma de asientos. Estadía = noches / viajeros o turistas. Gasto medio nacional EVyTH = gasto total / turistas. No se promedian tasas simples para construir totales.'],['Turismo internacional','ETI compara pasos relevados, no el total Argentina. «Paso Córdoba» no es «turismo en Córdoba». Emisivo incluye residentes argentinos de cualquier provincia que salieron del país por el aeropuerto de Córdoba. Receptivo incluye residentes del exterior que entraron por él, vayan a donde vayan: sus noches y gasto son del viaje por Argentina. Las agrupaciones geográficas varían por paso. Agregado de un período: Turistas, pernoctes y gasto total se suman; estadía media = suma de pernoctes ÷ suma de turistas; gasto por turista = suma de gasto total ÷ suma de turistas; gasto diario = suma de gasto total ÷ suma de pernoctes. Nunca se promedian promedios trimestrales, y si falta un trimestre del período el agregado queda sin dato (no se imputa).'],['Turismo interno y calidad','EVyTH describe viajes de residentes de los grandes aglomerados urbanos relevados. Gasto en pesos corrientes: no expresa crecimiento real. SACT es un registro histórico de distinciones deduplicadas; no verifica vigencia ni pertenencia al clúster.'],['Tecnología y exportación','Los gráficos utilizan Apache ECharts 6.0.0, distribuido localmente bajo licencia Apache 2.0. CSV y PNG incluyen fuente, período, cobertura y selección. El HTML descargable incluye los datos y la biblioteca para funcionar sin conexión.']];
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
 if(state.tab==='season')return [state.seasonTerritory==='Córdoba'?'Córdoba · provincia (región EOH)':scopeLabel(state.seasonTerritory),state.seasonYear,'Pernoctaciones EOH · todas las residencias',seasonScope.compare().length?'Comparadores: '+seasonScope.compare().map(seasonScope.name).join(' / '):'Sin comparadores'];
 if(state.tab==='international')return ['Paso: aeropuerto de Córdoba','Turismo '+state.flow,(p=>p.length>1?label(p[0],true)+' – '+label(p.at(-1),true):label(p[0],true))(intlPeriod()),intlCompareKeys().length?'Comparadores: '+intlCompareKeys().map(gateLabel).join(' / '):'Sin comparadores'];
 if(state.tab==='internal')return ['Córdoba como destino',(p=>p.length>1?label(p[0],true)+' – '+label(p.at(-1),true):label(p[0],true))(internalPeriod()),internalAllKeys().length?'Comparadores: '+internalAllKeys().map(internalName).join(' / '):'Sin comparadores'];
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
 for(const S of [hotelScope,seasonScope])if(key===S.territoryKey)state[S.compareKey]=S.level(v)!==S.level(before)?(S.level(v)==='region'?'Argentina,Cuyo':'localidad:Mendoza,localidad:Bariloche'):S.keys().join(',');
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
// Comparadores con fichas, por clave de estado.
const compareRegistry=()=>({compare:hotelScope,seasonCompare:seasonScope,airCompare:{add:addAirCompare,set:setAirCompare,all:airAllKeys},intlCompare:{add:k=>setIntlCompare([...intlCompareKeys(),k]),set:setIntlCompare,all:intlCompareKeys},internalCompare:{add:k=>setInternalCompare([...internalAllKeys(),k]),set:setInternalCompare,all:internalAllKeys}});
document.addEventListener('change',e=>{if('compareAdd' in e.target.dataset){compareRegistry()[e.target.dataset.compareAdd||'compare']?.add(e.target.value);return;}const key=e.target.dataset.key;if(key)changeState(key,e.target.value);});
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.hotelEventYear){state.hotelPreset='year';state.hotelYear=b.dataset.hotelEventYear;state.hotelEventType='all';state.territory='Córdoba';state.compare='Argentina,Cuyo';render();return;}
 if('chipToggle' in b.dataset){const r=compareRegistry()[b.dataset.compareKey],k=b.dataset.chipToggle,all=r.all();r.set(all.includes(k)?all.filter(x=>x!==k):[...all,k]);return;}
 if('chipRemove' in b.dataset){const r=compareRegistry()[b.dataset.compareKey||'compare'];r?.set(r.all().filter(k=>k!==b.dataset.chipRemove));return;}
 if('compareSet' in b.dataset){compareRegistry()[b.dataset.compareKey||'compare']?.set(b.dataset.compareSet.split(',').filter(Boolean));return;}
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
