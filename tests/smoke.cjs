// Smoke test de las cinco secciones del tablero con jsdom: carga site/index.html con un stub de ECharts.
// Uso: node tests/smoke.cjs [ruta a site/]   (por defecto, la carpeta site del repositorio)
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require('jsdom');
const SITE=path.resolve(process.argv[2]||path.join(__dirname,'..','site'));
const html=fs.readFileSync(path.join(SITE,'index.html'),'utf8').replace(/<script\b[^>]*><\/script>/g,'');
const scripts=['data/dashboard.js','model.js','data/hotel.js','hotel-model.js','data/puna.js','puna-model.js','hotel.js','app.js'].map(f=>fs.readFileSync(path.join(SITE,f),'utf8'));
let failures=0;
const ok=(name,fn)=>{try{fn();console.log('PASS',name);}catch(e){failures++;console.log('FAIL',name,'\n  ',e.message);}};

// prepare(data): permite modificar DASHBOARD_DATA antes de cargar el tablero (p. ej., un IPC sintético).
function open(hash='',prepare){
  const errors=[],scrolled=[],vc=new VirtualConsole();
  vc.on('error',(...a)=>errors.push(a.map(String).join(' ')));
  vc.on('jsdomError',e=>errors.push('jsdomError: '+e.message));
  // URL http: jsdom no aplica history.replaceState sobre file://.
  const dom=new JSDOM(html,{url:'http://localhost/index.html'+hash,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
  const w=dom.window,options=new Map();
  // Stubs: echarts registra la última opción por contenedor; matchMedia, ResizeObserver y scrollIntoView mínimos.
  w.echarts={init(el){return {setOption(o){options.set(el.id,o);},resize(){},dispose(){},on(){},off(){},getDataURL(){return 'data:,';},getOption(){return options.get(el.id);},dispatchAction(){},clear(){}};}};
  w.matchMedia=q=>({matches:false,media:q,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});
  w.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};
  w.Element.prototype.scrollIntoView=function(opts){scrolled.push({id:this.id,opts});};
  scripts.forEach((code,i)=>{w.eval(code);if(i===0&&prepare)prepare(w.DASHBOARD_DATA);});
  const $=s=>w.document.querySelector(s),$$=s=>[...w.document.querySelectorAll(s)];
  const click=el=>el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
  const change=(el,v)=>{el.value=v;el.dispatchEvent(new w.Event('change',{bubbles:true}));};
  const series=id=>Array.from(options.get('chart-'+id)?.series||[],s=>String(s.name));
  const errorBox=()=>$('#error').hidden?'':$('#error').textContent;
  return {w,$,$$,click,change,series,errors,scrolled,errorBox,options};
}

// Hotelería abre en Oferta; las pruebas de demanda parten de la solapa Demanda con un enlace del esquema vigente.
const demand=(extra={})=>open('#vista='+encodeURIComponent(JSON.stringify({hotelTab:'overview',v:'2',...extra})));

// 1 · Las cinco solapas de Hotelería, sin errores en consola.
ok('1 · recorre las 5 solapas sin errores',()=>{
  const p=open();
  const tabs=p.$$('[data-set="hotelTab"]').map(b=>[b.dataset.value,b.textContent]);
  assert.deepEqual(tabs.map(t=>t[1]),['Oferta','Demanda','Ocupación','Estacionalidad','Eventos']);
  for(const [id,title] of tabs){
    p.click(p.$(`[data-set="hotelTab"][data-value="${id}"]`));
    assert.equal(p.$('[data-set="hotelTab"].active').dataset.value,id);
    assert.equal(p.errorBox(),'',title+': '+p.errorBox());
    console.log('     ',title,'·',p.$$('.panel').length,'tarjetas');
  }
  // En Ocupación, la fuente inicial es la EOH (territorio fijo en Córdoba) y hay una sola tasa: la de plazas.
  p.click(p.$('[data-set="hotelTab"][data-value="typology"]'));
  assert.equal(p.$('select[data-key="hotelSource"]').value,'eoh');assert.ok(p.$('select[data-key="territory"]').disabled,'territorio deshabilitado en categorías');
  assert.match(p.$('.field-note').textContent,/Las categorías EOH se publican por región, no por localidad/);
  assert.ok(!p.$('select[data-key="occupancy"]'),'sin selector de habitaciones / plazas');assert.match(p.$('#panel-hotel-occupancy h2').textContent,/^Ocupación de plazas/);
  p.change(p.$('select[data-key="hotelSource"]'),'municipal');assert.equal(p.errorBox(),'');
  assert.deepEqual(p.errors,[]);
});

// 2 · Escala región: "Todas las regiones" lleva el gráfico principal a 8 series.
ok('2 · región + "Todas las regiones" → 8 series',()=>{
  const p=demand();
  const btn=p.$$('.compare-shortcuts button').find(b=>b.textContent==='Todas las regiones');assert.ok(btn,'atajo presente');
  p.click(btn);
  const s=p.series('hotel-trend');console.log('     ',s.join(' / '));
  assert.equal(s.length,8);assert.deepEqual(p.errors,[]);
});

// 3 · Escala localidad, valores observados: Argentina no entra y aparece el aviso.
const AVISO='Las referencias nacionales/provinciales solo se comparan en índice o variación, por diferencia de escala';
const REF='Argentina · total nacional (referencia)';
let local;
ok('3 · localidad + valores observados + Argentina → excluida con aviso',()=>{
  local=demand();const p=local;
  p.change(p.$('select[data-key="territory"]'),'localidad:Carlos Paz');
  assert.equal(p.$('select[data-key="hotelView"]').value,'levels');
  p.change(p.$('select[data-compare-add]'),'Argentina');
  const s=p.series('hotel-trend');console.log('     ',s.join(' / '));
  assert.ok(!s.includes(REF),'Argentina no debe graficarse');
  assert.ok(p.$$('.chip').some(c=>c.textContent.includes(REF)),'Argentina queda en el estado');
  assert.ok(p.$$('.notice').some(n=>n.textContent===AVISO),'aviso visible');
  assert.deepEqual(p.errors,[]);
});

// 4 · Índice base 100: ahora sí entra.
ok('4 · lectura índice base 100 → Argentina entra',()=>{
  const p=local;p.change(p.$('select[data-key="hotelView"]'),'index');
  const s=p.series('hotel-trend');console.log('     ',s.join(' / '));
  assert.ok(s.includes(REF));assert.ok(!p.$$('.notice').some(n=>n.textContent===AVISO),'sin aviso');
  assert.deepEqual(p.errors,[]);
});

// 5 · Hash anterior (level/city/compare1/compare2) se convierte al esquema nuevo.
ok('5 · hash anterior → territory Carlos Paz, compare Ciudad de Mendoza',()=>{
  const old={level:'localidad',city:'localidad:Carlos Paz',compare1:'localidad:Mendoza',compare2:''};
  const p=open('#vista='+encodeURIComponent(JSON.stringify(old)));
  assert.equal(p.$('select[data-key="territory"]').value,'localidad:Carlos Paz');
  const chips=p.$$('.chip').map(c=>c.textContent.replace('×','').trim());console.log('      fichas:',chips.join(', '));
  assert.deepEqual(chips,['Ciudad de Mendoza']);
  assert.deepEqual(p.series('hotel-trend'),['Villa Carlos Paz','Ciudad de Mendoza']);
  const saved=JSON.parse(new p.w.URLSearchParams(p.w.location.hash.slice(1)).get('vista'));console.log('      hash reescrito:',JSON.stringify(saved));
  assert.equal(saved.territory,'localidad:Carlos Paz');assert.equal(saved.compare,'localidad:Mendoza');assert.ok(!('level' in saved)&&!('compare1' in saved));
  assert.deepEqual(p.errors,[]);
});

// 6 · Tope de 9 series.
ok('6 · tope de 9 series con aviso',()=>{
  const p=demand();p.change(p.$('select[data-key="territory"]'),'localidad:Córdoba');
  for(const k of ['localidad:Rosario','localidad:Salta','localidad:Mar del Plata','localidad:Ushuaia','localidad:Tandil','localidad:Merlo','localidad:Posadas'])p.change(p.$('select[data-compare-add]'),k);
  assert.equal(p.series('hotel-trend').length,9);
  p.change(p.$('select[data-compare-add]'),'localidad:Neuquén');
  assert.equal(p.series('hotel-trend').length,9);assert.ok(!p.$('#toast').hidden);console.log('      toast:',p.$('#toast').textContent);
  assert.deepEqual(p.errors,[]);
});

// 7 · Calendario de intensidad: la etiqueta del eje vertical entra completa.
// jsdom no dibuja: se verifica la configuración (margen izquierdo real, containLabel y ancho de etiqueta)
// y que cada etiqueta, con un ancho de carácter conservador para 10 px, quepa en ese ancho sin truncarse.
ok('7 · calendario de intensidad: etiquetas del eje completas',()=>{
  const p=open('#vista='+encodeURIComponent(JSON.stringify({hotelTab:'seasonality',compare:'Argentina,Cuyo',hotelPreset:'custom',hotelFrom:'2023-01',hotelTo:'2024-12'})));
  let o=p.options.get('chart-hotel-calendar');assert.ok(o,'mapa de calor presente');
  assert.ok(o.grid.containLabel&&o.grid.left>=12,'grid.left >= 12 con containLabel');
  assert.ok(o.yAxis.axisLabel.width>=200&&o.yAxis.axisLabel.overflow==='truncate','ancho de etiqueta >= 200 con truncate');
  const labels=Array.from(o.yAxis.data,String);console.log('     ',labels.join(' | '));
  assert.ok(labels.some(l=>l.startsWith('Argentina · 2024')),'la etiqueta empieza con "Argentina"');
  // Nombre más largo posible: San Carlos de Bariloche · año.
  p.change(p.$('select[data-key="territory"]'),'localidad:Córdoba');p.change(p.$('select[data-compare-add]'),'localidad:Bariloche');
  o=p.options.get('chart-hotel-calendar');
  const longest=Array.from(o.yAxis.data,String).sort((a,b)=>b.length-a.length)[0];console.log('      más larga:',longest);
  assert.ok(longest.startsWith('San Carlos de Bariloche'));
  assert.ok(longest.length*6.2<=o.yAxis.axisLabel.width,`"${longest}" cabe en ${o.yAxis.axisLabel.width}px`);
  assert.deepEqual(p.errors,[]);
});

// 8 · "Analizar este mes" cambia el evento seleccionado y lleva a Datos del mes.
ok('8 · Analizar este mes → cambia el evento y desplaza a Datos del mes',()=>{
  const p=open('#vista='+encodeURIComponent(JSON.stringify({hotelTab:'events'})));
  const before=p.$('.hotel-event.selected h3').textContent;
  const target=p.$$('.hotel-event').find(a=>!a.classList.contains('selected'));
  const name=target.querySelector('h3').textContent;
  p.click(target.querySelector('[data-set="hotelEvent"]'));
  const after=p.$('.hotel-event.selected h3').textContent;console.log('     ',before,'→',after);
  assert.notEqual(after,before);assert.equal(after,name);
  assert.ok(p.$('#hotel-event-month'),'sección con id estable');
  assert.ok(p.$('#hotel-event-month').textContent.includes(name),'Datos del mes corresponde al evento elegido');
  assert.equal(p.scrolled.at(-1)?.id,'hotel-event-month');assert.equal(p.scrolled.at(-1).opts.behavior,'smooth');
  assert.ok(!p.$('.hotel-events').textContent.includes('Pendiente de verificación'),'sin rótulo de pendiente en las tarjetas');
  assert.deepEqual(p.errors,[]);
});

// ---- Conectividad aérea ----
const air=(extra={})=>open('#vista='+encodeURIComponent(JSON.stringify({tab:'air',...extra})));
const subtitle=(p,id)=>p.$('#panel-'+id+' .panel-subtitle').textContent,title=(p,id)=>p.$('#panel-'+id+' h2').textContent;

// 9 · La sección y las demás que comparten app.js renderizan sin errores.
ok('9 · Conectividad aérea y demás secciones sin errores',()=>{
  const p=open();
  for(const tab of ['air','international','internal','sources','demand']){
    p.click(p.$(`[data-tab="${tab}"]`));assert.equal(p.errorBox(),'',tab+': '+p.errorBox());
    console.log('     ',tab,'·',p.$$('.panel').length,'tarjetas');
  }
  // Estacionalidad ya no es una sección: es una solapa de Hotelería y usa su territorio y sus comparadores.
  assert.ok(!p.$('[data-tab="season"]'),'sin sección Estacionalidad');
  p.click(p.$('[data-set="hotelTab"][data-value="seasonality"]'));
  assert.equal(p.errorBox(),'');assert.ok(p.$('select[data-compare-add="compare"]'),'comparador de Hotelería en Estacionalidad');assert.ok(p.$('#panel-season-index'),'medición de estacionalidad en la solapa');
  p.click(p.$('[data-tab="air"]'));
  for(const k of ['airport-ranking','routes','air-route-changes','air-mix','carrier-ranking','carrier-trend'])assert.ok(p.$('#panel-'+k),'tarjeta '+k);
  assert.match(p.$('.hotel-range').textContent,/ANAC \(Administración Nacional de Aviación Civil\)/);
  assert.deepEqual(p.errors,[]);
});

// 10 · "Principales aeropuertos del país" → Córdoba + 6 aeropuertos = 7 series.
ok('10 · "Principales aeropuertos del país" → 7 series',()=>{
  const p=air();
  const btn=p.$$('.compare-shortcuts button').find(b=>b.textContent==='Principales aeropuertos del país');assert.ok(btn,'atajo presente');
  p.click(btn);
  const s=p.series('air-trend');console.log('     ',s.join(' / '));
  assert.equal(s.length,7);assert.ok(!s.includes('Argentina'),'Argentina no es un aeropuerto');
  assert.deepEqual(p.errors,[]);
});

// 11 · Año completo 2025 cambia el subtítulo del ranking.
ok('11 · preset "Año completo 2025" cambia el subtítulo del ranking',()=>{
  const p=air();const before=subtitle(p,'airport-ranking');
  p.change(p.$('select[data-key="airPreset"]'),'year');p.change(p.$('select[data-key="airYear"]'),'2025');
  const after=subtitle(p,'airport-ranking');console.log('     ',before,'→',after);
  assert.notEqual(after,before);assert.match(after,/ene 2025 – dic 2025/);
  assert.deepEqual(p.errors,[]);
});

// 12 · Con factor de ocupación cambia el título del ranking (y el mínimo de vuelos pasa a 100).
ok('12 · factor de ocupación → título del ranking y mínimo de vuelos',()=>{
  const p=air();const before=title(p,'airport-ranking');
  p.change(p.$('select[data-key="airMetric"]'),'ocupacion');
  const after=title(p,'airport-ranking');console.log('     ',before,'→',after);
  assert.equal(after,'Aeropuertos según factor de ocupación');
  assert.equal(p.$('select[data-key="minFlights"]').value,'100');
  assert.deepEqual(p.$$('.kpi-label').map(k=>k.textContent),['Pasajeros','Vuelos','Asientos ofrecidos','Factor de ocupación','Destinos regulares','Aerolíneas']);
  assert.equal(p.$('.kpi.primary .kpi-label').textContent,'Factor de ocupación','la variable elegida queda destacada');
  assert.deepEqual(p.errors,[]);
});

// 13 · Rutas regulares ganadas y perdidas: se renderiza (con datos o con su aviso) sin errores.
ok('13 · rutas regulares ganadas y perdidas sin errores',()=>{
  for(const extra of [{},{airPreset:'12'},{airPreset:'year',airYear:'2025',kind:'Internacional'}]){
    const p=air(extra),o=p.options.get('chart-air-route-changes'),empty=p.$('#chart-air-route-changes .empty');
    assert.ok(o||empty,'gráfico o aviso');assert.equal(p.errorBox(),'');assert.deepEqual(p.errors,[]);
    console.log('     ',JSON.stringify(extra),'·',subtitle(p,'air-route-changes'));
  }
});

// 14 · Hash viejo con airCompare1/airCompare2/airWindow se convierte sin error.
ok('14 · hash viejo de Conectividad aérea → esquema nuevo',()=>{
  const p=air({airCompare1:'SAEZ',airCompare2:'Argentina',airWindow:'12',cutoff:'2025-06'});
  assert.equal(p.errorBox(),'');
  const chips=p.$$('.chip').map(c=>c.textContent.replace('×','').trim());console.log('      fichas:',chips.join(', '));
  // Argentina, que antes era comparador, se conserva como referencia del gráfico de evolución.
  assert.deepEqual(chips,['Ezeiza · SAEZ','Argentina · total nacional (referencia)']);
  assert.equal(p.$('select[data-key="airPreset"]').value,'custom');
  assert.equal(p.$('input[data-key="airFrom"]').value,'2024-07');assert.equal(p.$('input[data-key="airTo"]').value,'2025-06');
  const saved=JSON.parse(new p.w.URLSearchParams(p.w.location.hash.slice(1)).get('vista'));console.log('      hash reescrito:',JSON.stringify(saved));
  assert.ok(!('airCompare1' in saved)&&!('airWindow' in saved));assert.equal(saved.airCompare,'SAEZ,Argentina');
  assert.deepEqual(p.errors,[]);
});

const near100=(xs,msg)=>{const t=xs.filter(v=>typeof v==='number').reduce((a,b)=>a+b,0);assert.ok(Math.abs(t-100)<1e-6,msg+': '+t);};
const values=(p,id,i=0)=>Array.from(p.options.get('chart-'+id).series[i].data,d=>typeof d==='object'&&d!==null?d.value:d);

// 15 · Ranking de aerolíneas: ordenado de mayor a menor, agrupa en Otras y los pesos suman 100 %.
ok('15 · ranking de aerolíneas: ordenado y con pesos que suman 100 %',()=>{
  for(const extra of [{},{airPreset:'12'},{airPreset:'year',airYear:'2025',airMetric:'vuelos'}]){
    const p=air(extra),o=p.options.get('chart-carrier-ranking');assert.ok(o,'gráfico');
    const names=Array.from(o.yAxis.data,String),now=values(p,'carrier-ranking',0);
    assert.ok(names.length<=9,'8 principales + Otras');
    const others=names.at(-1).startsWith('Otras'),ranked=others?now.slice(0,-1):now;
    if(names.length===9)assert.ok(others,'la última fila agrupa Otras');
    ranked.forEach((v,i)=>{if(i)assert.ok(ranked[i-1]>=v,'orden descendente');assert.ok(names[i].startsWith((i+1)+'. '),'posición en el nombre');});
    const weights=names.map(n=>+n.split(' · ').at(-1).replace(' %','').replace(',','.'));
    assert.ok(Math.abs(weights.reduce((a,b)=>a+b,0)-100)<0.5,'pesos '+JSON.stringify(extra));
    console.log('     ',JSON.stringify(extra),'·',names.length,'filas ·',names.slice(0,3).join(', '),'…');
    assert.deepEqual(p.errors,[]);
  }
});

// 16 · Evolución mensual por aerolínea: áreas apiladas; en participación cada mes suma 100 %.
ok('16 · evolución mensual por aerolínea (valores y participación)',()=>{
  const p=air({airPreset:'12'});let o=p.options.get('chart-carrier-trend');
  assert.ok(o.series.every(s=>s.stack==='total'),'stack');assert.equal(o.series.at(-1).name,'Otras');assert.equal(o.series.length,6);
  p.change(p.$('select[data-key="airCarrierView"]'),'share');o=p.options.get('chart-carrier-trend');
  for(let i=0;i<o.xAxis.data.length;i++)near100(o.series.map(s=>s.data[i]),'mes '+o.xAxis.data[i]);
  console.log('     ',o.xAxis.data.length,'meses ·',o.series.map(s=>s.name).join(' / '));
  assert.deepEqual(p.errors,[]);
});

// 17 · Conectividad internacional directa: sugerencia sin comparadores; una barra por aeropuerto con comparadores.
ok('17 · conectividad internacional directa',()=>{
  let p=air({airCompare:''});
  assert.match(p.$('#panel-air-intl').textContent,/Agregá aeropuertos en Comparar con/);
  assert.equal(p.options.get('chart-air-intl').yAxis.data.length,1);
  p=air({airCompare:'SAME,SAEZ',kind:'Cabotaje',airPreset:'year',airYear:'2025'});
  const o=p.options.get('chart-air-intl');assert.equal(o.yAxis.data.length,3);
  assert.equal(p.$$('#panel-air-intl details:not(.method-note)').length,3);
  assert.match(subtitle(p,'air-intl'),/tráfico internacional/,'aun con Cabotaje en el selector');
  p.change(p.$('select[data-key="airIntlMetric"]'),'pasajeros');
  console.log('     ',Array.from(p.options.get('chart-air-intl').yAxis.data,String).join(' / '),'·',title(p,'air-intl'));
  assert.deepEqual(p.errors,[]);
});

// 18 · Estacionalidad aérea: año completo o último año completo; participación suma 100 %, con Argentina solo en esa lectura.
ok('18 · estacionalidad aérea',()=>{
  let p=air();
  assert.match(subtitle(p,'air-season'),/último año completo disponible/);
  let o=p.options.get('chart-air-season'),names=o.series.map(s=>s.name);
  assert.ok(names.includes('Argentina · total nacional'),'referencia en participación');
  near100(values(p,'air-season',0),'Córdoba');
  p.change(p.$('select[data-key="airSeasonView"]'),'levels');
  names=p.options.get('chart-air-season').series.map(s=>s.name);assert.ok(!names.includes('Argentina · total nacional'),'sin referencia en valores');
  p=air({airPreset:'year',airYear:'2024'});assert.doesNotMatch(subtitle(p,'air-season'),/último año completo/);assert.match(subtitle(p,'air-season'),/2024/);
  console.log('     ',title(p,'air-season'));
  assert.deepEqual(p.errors,[]);
});

// 19 · Argentina como referencia en la evolución: no en valores observados (con aviso), sí en índice.
const AIR_REF='Argentina · total nacional (referencia)';
ok('19 · Argentina como referencia del gráfico de evolución',()=>{
  const p=air({view:'levels'});
  p.change(p.$('select[data-compare-add="airCompare"]'),'Argentina');
  let s=p.series('air-trend');console.log('     ','valores:',s.join(' / '));
  assert.ok(!s.includes(AIR_REF),'no se grafica en valores observados');
  assert.ok(p.$$('.notice').some(n=>n.textContent===AVISO),'aviso de escala');
  assert.ok(p.$$('.chip').some(c=>c.textContent.includes(AIR_REF)&&c.classList.contains('off')),'ficha punteada');
  for(const view of ['index','yoy','base2019']){
    p.change(p.$('select[data-key="view"]'),view);s=p.series('air-trend');
    assert.ok(s.includes(AIR_REF),view);assert.ok(!p.$$('.notice').some(n=>n.textContent===AVISO),'sin aviso en '+view);
  }
  console.log('     ','índice/variación:',s.join(' / '));
  // El resto de la sección sigue usando solo aeropuertos.
  assert.ok(!Array.from(p.options.get('chart-air-intl').yAxis.data,String).some(n=>n.includes('Argentina')));
  assert.ok(!Array.from(p.options.get('chart-air-mix').yAxis.data,String).some(n=>n.includes('Argentina')));
  assert.deepEqual(p.errors,[]);
});

// ---- Estacionalidad ----
const season=(extra={})=>open('#vista='+encodeURIComponent(JSON.stringify({tab:'season',...extra})));
// Los enlaces viejos de la sección Estacionalidad abren la solapa homónima de Hotelería.
const SEASON_CARDS=['season-index','season-index-trend','season-hotel-air','season-valleys','hotel-profile','hotel-calendar'];

// 20 · La sección renderiza sin errores con el año por defecto (último año completo).
ok('20 · Estacionalidad con el año por defecto',()=>{
  const p=season();
  assert.equal(p.errorBox(),'');assert.equal(p.$('select[data-key="seasonYear"]').value,'2024');
  assert.match(p.$('select[data-key="seasonYear"]').textContent,/2025 \(incompleto\)/);
  for(const k of SEASON_CARDS)assert.ok(p.$('#panel-'+k),'tarjeta '+k);
  for(const k of ['season-profile','season-ranking'])assert.ok(!p.$('#panel-'+k),'ya no existe '+k);
  assert.ok(!p.$('select[data-key="seasonData"]')&&!p.$('select[data-key="seasonMetric"]'),'sin interruptor de fuente ni selector de indicador');
  const kpis=p.$$('.kpi-label').map(k=>k.textContent);console.log('     ',kpis.join(' | '));
  assert.deepEqual(kpis,['Pico frente a valle · Córdoba','Mes pico','Mes valle','Temporada baja']);
  assert.match(p.$('.kpi-value').textContent,/^\d+,\d veces$/);assert.equal(p.$('[data-set="hotelTab"].active').dataset.value,'seasonality');
  assert.match(p.$('.hotel-range').textContent,/EOH \(Encuesta de Ocupación Hotelera, INDEC\)/);
  assert.deepEqual(p.errors,[]);
});

// 21 · Con 2025 (incompleto) los cuatro KPI dicen "Sin medición".
ok('21 · 2025 → KPI "Sin medición"',()=>{
  const p=season();p.change(p.$('select[data-key="seasonYear"]'),'2025');
  const values=p.$$('.kpi-value').map(k=>k.textContent);console.log('     ',values.join(' | '));
  assert.deepEqual(values,Array(4).fill('Sin medición'));
  assert.equal(p.errorBox(),'');assert.deepEqual(p.errors,[]);
});

// 22 · "Todas las regiones" → 8 series en la evolución del índice.
ok('22 · "Todas las regiones" → 8 series en la evolución del índice',()=>{
  const p=season();
  p.click(p.$$('.compare-shortcuts button').find(b=>b.textContent==='Todas las regiones'));
  const s=p.series('season-index-trend');console.log('     ',s.join(' / '));
  assert.equal(s.length,8);assert.deepEqual(p.errors,[]);
});

// 23 · Hotelería y llegadas aéreas: 2 series en 2024; 1 en 2015, con aviso (aéreo desde 2017).
ok('23 · hotelería/aéreo: 2 series en 2024, 1 en 2015 con aviso',()=>{
  let p=season();assert.equal(p.series('season-hotel-air').length,2);console.log('      2024:',p.series('season-hotel-air').join(' / '));
  p=season({seasonYear:'2015'});assert.equal(p.series('season-hotel-air').length,1);
  const aviso=p.$('#panel-season-hotel-air .notice');assert.ok(aviso,'aviso');assert.match(aviso.textContent,/desde 2017/);console.log('      2015:',aviso.textContent);
  assert.deepEqual(p.errors,[]);
});

// 24 · Meses valle y calendario: 12 barras.
ok('24 · meses valle: 12 barras',()=>{
  const p=season(),o=p.options.get('chart-season-valleys');
  assert.equal(o.series[0].data.length,12);assert.equal(o.xAxis.data.length,12);
  console.log('     ',Array.from(o.series[0].data,d=>Math.round(d.value)).join(' '));
  assert.deepEqual(p.errors,[]);
});

// 25 · Hash viejo con seasonCity/seasonCompare1 carga sin error.
ok('25 · hash viejo de Estacionalidad → esquema nuevo',()=>{
  const p=season({seasonLevel:'localidad',seasonCity:'localidad:Carlos Paz',seasonCompare1:'localidad:Mendoza',seasonData:'air',seasonView:'levels',seasonPeriod:'verano'});
  assert.equal(p.errorBox(),'');
  assert.equal(p.$('select[data-key="territory"]').value,'localidad:Carlos Paz');assert.equal(p.$('[data-set="hotelTab"].active').dataset.value,'seasonality');
  const chips=p.$$('.chip').map(c=>c.textContent.replace('×','').trim());console.log('      fichas:',chips.join(', '));
  assert.ok(chips.includes('Ciudad de Mendoza'));
  const saved=JSON.parse(new p.w.URLSearchParams(p.w.location.hash.slice(1)).get('vista'));console.log('      hash reescrito:',JSON.stringify(saved));
  assert.ok(!('seasonCity' in saved)&&!('seasonData' in saved)&&!('seasonCompare1' in saved));
  assert.deepEqual(p.errors,[]);
});

// ---- Mercados internacionales ----
const intl=(extra={})=>open('#vista='+encodeURIComponent(JSON.stringify({tab:'international',...extra})));
const INTL_CARDS=['intl-balance','intl-trend','intl-markets','intl-market-trend','intl-motives','intl-stay','intl-spend','intl-share'];
const kpiValues=p=>p.$$('.kpi').map(k=>k.querySelector('.kpi-value').textContent);

// 26 · La sección renderiza con el período por defecto (año completo, último año con 4 trimestres).
ok('26 · Mercados internacionales con el período por defecto',()=>{
  const p=intl();
  assert.equal(p.errorBox(),'');assert.equal(p.$('select[data-key="intlPreset"]').value,'year');assert.equal(p.$('select[data-key="flow"]').value,'receptivo');
  for(const k of INTL_CARDS)assert.ok(p.$('#panel-'+k),'tarjeta '+k);
  assert.ok(!p.$('select[data-key="cutoff"]')&&!p.$('select[data-key="intlCompare1"]'),'sin dateFields ni dos comparadores');
  assert.deepEqual(p.$$('[data-chip-toggle]').map(b=>b.getAttribute('aria-pressed')),['true','true'],'comparadores activos por defecto');
  assert.ok(!p.$('select[data-compare-add="intlCompare"]'),'sin selector de agregar');
  assert.match(p.$('.intl-concept').textContent,/ETI \(Encuesta de Turismo Internacional, INDEC\)/);
  console.log('     ','año',p.$('select[data-key="intlYear"]').value,'·',p.$$('.panel').length,'tarjetas');
  assert.deepEqual(p.errors,[]);
});

// 27 · Los 4 KPI de balanza tienen valor con el último año completo.
ok('27 · KPI de balanza con valor',()=>{
  const p=intl(),labels=p.$$('.kpi-label').map(k=>k.textContent),values=kpiValues(p);console.log('     ',values.join(' | '));
  assert.deepEqual(labels,['Ingreso de divisas · receptivo','Gasto en el exterior · emisivo','Saldo','Relación emisivo / receptivo']);
  assert.ok(values.every(v=>v&&v!=='Sin dato'),'sin "Sin dato"');
  assert.deepEqual(p.errors,[]);
});

// 28 · Emisivo no cambia la balanza pero sí la evolución y los mercados.
ok('28 · emisivo: balanza igual, evolución y mercados distintos',()=>{
  const p=intl(),kpis=kpiValues(p),trend=JSON.stringify(p.options.get('chart-intl-trend').series.map(s=>s.data)),marketTitle=title(p,'intl-markets'),markets=Array.from(p.options.get('chart-intl-markets').yAxis.data,String);
  p.change(p.$('select[data-key="flow"]'),'emisivo');
  assert.deepEqual(kpiValues(p),kpis,'KPI de balanza');
  assert.notEqual(JSON.stringify(p.options.get('chart-intl-trend').series.map(s=>s.data)),trend,'evolución');
  assert.notEqual(title(p,'intl-markets'),marketTitle);assert.notDeepEqual(Array.from(p.options.get('chart-intl-markets').yAxis.data,String),markets);
  console.log('     ',title(p,'intl-trend'),'·',title(p,'intl-markets'));
  assert.deepEqual(p.errors,[]);
});

// 29 · "Último trimestre" muestra 16 trimestres en la evolución.
ok('29 · último trimestre → 16 trimestres en la evolución',()=>{
  const p=intl();p.change(p.$('select[data-key="intlPreset"]'),'latest');
  const x=Array.from(p.options.get('chart-intl-trend').xAxis.data,String);console.log('     ',x[0],'→',x.at(-1),'·',x.length,'trimestres');
  assert.equal(x.length,16);assert.match(subtitle(p,'intl-trend'),/16 trimestres hasta/);
  assert.deepEqual(p.errors,[]);
});

// 30 · Motivos: la participación suma 100 % por paso (±0,1), en ambos sentidos.
ok('30 · motivos suma 100 % por paso',()=>{
  for(const flow of ['receptivo','emisivo']){
    const p=intl({flow}),o=p.options.get('chart-intl-motives');
    for(const sr of o.series){const t=Array.from(sr.data,d=>d.value).filter(v=>typeof v==='number').reduce((a,b)=>a+b,0);assert.ok(Math.abs(t-100)<=0.1,flow+' '+sr.name+': '+t);}
    console.log('     ',flow,'·',p.$('.intl-note').textContent);
    assert.deepEqual(p.errors,[]);
  }
});

// 31 · Hash viejo con intlCompare1/cutoff carga sin error.
ok('31 · hash viejo de Mercados internacionales → esquema nuevo',()=>{
  const p=intl({intlCompare1:'Aep. Mendoza',intlCompare2:'',cutoff:'2024-07',flow:'emisivo'});
  assert.equal(p.errorBox(),'');
  assert.deepEqual(p.$$('[data-chip-toggle]').map(b=>b.getAttribute('aria-pressed')),['true','false']);
  assert.equal(p.$('select[data-key="intlYear"]').value,'2024');
  const saved=JSON.parse(new p.w.URLSearchParams(p.w.location.hash.slice(1)).get('vista'));console.log('      hash reescrito:',JSON.stringify(saved));
  assert.ok(!('intlCompare1' in saved));assert.equal(saved.intlCompare,'Aep. Mendoza');
  assert.deepEqual(p.errors,[]);
});

// ---- Navegación, Turismo interno y Fuentes y metodología ----
const view=(v,prepare)=>open('#vista='+encodeURIComponent(JSON.stringify(v)),prepare);

// 32 · La navegación tiene 5 secciones.
ok('32 · navegación con 5 secciones',()=>{
  const p=open(),tabs=p.$$('#navigation .nav-item').map(b=>b.dataset.tab);console.log('     ',tabs.join(' / '));
  assert.deepEqual(tabs,['demand','air','international','internal','sources']);assert.equal(p.$('#page-title').textContent,'Hotelería');
  assert.deepEqual(p.errors,[]);
});

// 33 · Un hash viejo con tab=quality abre Turismo interno.
ok('33 · tab=quality → Turismo interno',()=>{
  const p=view({tab:'quality'});
  assert.equal(p.errorBox(),'');assert.equal(p.$('#page-title').textContent,'Turismo interno');
  assert.equal(p.$('.nav-item.active').dataset.tab,'internal');
  const saved=JSON.parse(new p.w.URLSearchParams(p.w.location.hash.slice(1)).get('vista'));console.log('      hash reescrito:',JSON.stringify(saved));
  assert.equal(saved.tab,'internal');assert.deepEqual(p.errors,[]);
});

// 34 · En Turismo interno, el selector de la evolución no ofrece gasto en pesos corrientes.
ok('34 · evolución sin gasto en pesos corrientes',()=>{
  const p=view({tab:'internal',internalMetric:'gasto_total_ars'}),opts=p.$$('select[data-key="internalMetric"] option').map(o=>o.value);console.log('     ',opts.join(' / '));
  assert.ok(!opts.includes('gasto_total_ars')&&!opts.includes('gasto_promedio_ars'),'sin gasto nominal');
  assert.equal(p.$('select[data-key="internalMetric"]').value,'turistas','un hash con gasto nominal vuelve a turistas');
  const rank=p.$$('select[data-key="internalRankMetric"] option').map(o=>o.value);assert.ok(rank.includes('gasto_total_ars'),'el ranking sí ofrece gasto');
  assert.deepEqual(p.errors,[]);
});

// 35 · La tarjeta de calidad turística (SACT) se renderiza en Turismo interno.
ok('35 · tarjeta de calidad turística',()=>{
  const p=view({tab:'internal'});
  assert.ok(p.$('#panel-quality-programs'),'tarjeta presente');assert.equal(title(p,'quality-programs'),'Calidad turística · distinciones del SACT');
  const names=Array.from(p.options.get('chart-quality-programs').yAxis.data,String);console.log('     ',names.length,'programas ·',p.$$('#panel-quality-programs .mini-kpis div').map(d=>[...d.children].map(c=>c.textContent).join(' ')).join(' · '));
  assert.ok(names.length>0);assert.match(p.$('#panel-quality-programs').textContent,/no equivale a vigencia/);
  assert.deepEqual(p.errors,[]);
});

// 36 · Fuentes y metodología: sin SHA-256, clúster ni fuentes pendientes; con las cinco frases de lectura.
ok('36 · Fuentes y metodología sin trazabilidad técnica en pantalla',()=>{
  const p=view({tab:'sources'}),text=p.$('#dashboard').textContent+p.$('#filters').textContent;
  for(const w of ['SHA-256','clúster','pendientes de incorporación'])assert.ok(!text.includes(w),'contiene '+w);
  assert.equal(p.$$('.reading-guide li').length,8);assert.equal(p.$('#footer-version').textContent,'Fuentes oficiales · Apache ECharts');
  console.log('     ',p.$$('.source-card h3').map(h=>h.textContent.split(' · ')[0]).join(' / '));
  assert.deepEqual(p.$$('.source-card h3').map(h=>h.textContent.split(' · ')[0]),['EOH','Conectividad aérea','ETI','EVyTH','SACT','IPC','Observatorio Turístico','PUNA']);
  assert.deepEqual(p.errors,[]);
});

// ---- Relato: oferta, valores iniciales, filtros visibles y stock de eventos ----
// 39 · Hotelería abre en Oferta (padrón PUNA): tarjetas de stock, rankings y leyenda de disponibilidad.
ok('39 · Oferta por defecto: stock, rankings y leyenda del padrón',()=>{
  const p=open(),year=p.w.PUNA_DATA.year;
  assert.equal(p.$('[data-set="hotelTab"].active').dataset.value,'supply');assert.equal(p.errorBox(),'');
  assert.deepEqual(p.$$('.kpi-label').map(k=>k.textContent),['Plazas · Córdoba','Establecimientos','Habitaciones','Plazas por establecimiento']);
  const last=p.w.PUNA_DATA.rows.filter(r=>r[0]===p.w.PUNA_DATA.years.length-1&&p.w.PUNA_DATA.provinces[p.w.PUNA_DATA.localities[r[1]][0]].region==='Córdoba');
  assert.equal(p.$('.kpi-value').textContent,last.reduce((s,r)=>s+r[6],0).toLocaleString('es-AR'),'plazas de Córdoba = suma del padrón');
  assert.equal(p.$('#available-through').textContent,'Foto '+year);
  assert.match(p.$('.story-note').textContent,/último padrón de oferta disponible/);
  for(const k of ['supply-rank-regions','supply-rank-provinces','supply-classes','supply-types','supply-localities'])assert.ok(p.$('#panel-'+k),'tarjeta '+k);
  assert.deepEqual(p.$$('#active-filters .filter-tag').map(t=>t.textContent),['Córdoba · provincia (región EOH)','Oferta · foto '+year,'Indicador: plazas']);
  assert.equal(values(p,'supply-rank-regions').length,7,'siete regiones EOH');
  assert.deepEqual(p.$$('#dashboard .section-title h2').map(h=>h.textContent),['¿Cuánta oferta de alojamiento hay?','¿Es mucho o poco?','¿De qué tipo es la oferta?','¿Dónde está la oferta dentro de Córdoba?']);
  p.change(p.$('select[data-key="supplyMetric"]'),'establecimientos');assert.equal(title(p,'supply-rank-provinces'),'Ranking de provincias por establecimientos');
  console.log('     ',p.$$('.kpi').map(k=>k.querySelector('.kpi-label').textContent+': '+k.querySelector('.kpi-value').textContent).join(' | '));
  assert.deepEqual(p.errors,[]);
});

// 40 · Oferta de una localidad: rankings provincial y nacional, con la localidad visible.
ok('40 · Oferta en escala localidad',()=>{
  const p=open();p.change(p.$('select[data-key="territory"]'),'localidad:Río Cuarto');
  assert.equal(p.errorBox(),'');assert.ok(!p.$('#panel-supply-localities')&&!p.$('#panel-supply-rank-regions'));
  for(const k of ['supply-rank-cordoba','supply-rank-country']){
    const names=Array.from(p.options.get('chart-'+k).yAxis.data,String);assert.ok(names.some(n=>n.includes('Río Cuarto')),'Río Cuarto visible en '+k);
    assert.match(subtitle(p,k),/^Posición de Río Cuarto/);
  }
  assert.equal(p.series('supply-types').length,3,'localidad, provincia y país');
  assert.deepEqual(p.errors,[]);
});

// 41 · Conectividad aérea: por defecto, todos los sentidos y últimos 12 meses; seis tarjetas de stock y bloques por corte.
ok('41 · aéreo: valores iniciales y relato por aeropuerto, aerolínea, tráfico y destino',()=>{
  const p=view({tab:'air',v:'2'});
  assert.equal(p.$('select[data-key="direction"]').value,'ambos');assert.equal(p.$('select[data-key="kind"]').value,'all');assert.equal(p.$('select[data-key="carrier"]').value,'all');assert.equal(p.$('select[data-key="airPreset"]').value,'12');
  assert.equal(p.$$('.kpis.six .kpi').length,6);assert.equal(p.$('.kpi.primary .kpi-label').textContent,'Pasajeros');
  const heads=p.$$('#dashboard .section-title h2').map(h=>h.textContent);console.log('     ',heads.join(' | '));
  assert.deepEqual(heads.map(h=>h.split(' · ')[0]),['¿Cuánto mueve el aeropuerto de Córdoba?','Por aeropuerto','Por aerolínea','Por cabotaje e internacional','Por destino']);
  assert.match(title(p,'carrier-ranking'),/^Ranking de aerolíneas por pasajeros/);
  assert.deepEqual(p.errors,[]);
});

// 42 · Filtros activos siempre a la vista y marca de «Filtro propio» solo donde corresponde.
ok('42 · franja de filtros activos y marca de filtro propio',()=>{
  const p=view({tab:'air',v:'2'});
  assert.ok(p.$('.context-line .context-label'),'rótulo de la franja');assert.equal(p.$$('#active-filters .filter-tag').length,5);
  for(const k of ['air-mix','air-intl','carrier-ranking','carrier-trend'])assert.ok(p.$('#panel-'+k+' .panel-fixed'),'marca en '+k);
  for(const k of ['air-trend','airport-ranking','routes','air-route-changes'])assert.ok(!p.$('#panel-'+k+' .panel-fixed'),'sin marca en '+k);
  // Con un año completo, la estacionalidad aérea sigue el período y pierde la marca.
  assert.ok(p.$('#panel-air-season .panel-fixed'));p.change(p.$('select[data-key="airPreset"]'),'year');assert.ok(!p.$('#panel-air-season .panel-fixed'));
  assert.match(fs.readFileSync(path.join(SITE,'styles.css'),'utf8'),/\.context-line\{position:sticky;top:0/);
  assert.deepEqual(p.errors,[]);
});

// 43 · Eventos: primero el stock (cuántos y de qué tipo) y la aclaración sobre la asistencia.
ok('43 · Eventos: stock por tipo y por mes',()=>{
  const p=demand({hotelTab:'events'});
  assert.equal(p.errorBox(),'');assert.equal(p.$('.kpi-label').textContent,'Eventos registrados');
  const total=+p.$('.kpi-value').textContent,byType=values(p,'hotel-event-types').reduce((a,b)=>a+b,0);
  assert.ok(total>0);assert.equal(byType,total,'los tipos suman el total');
  assert.equal(p.options.get('chart-hotel-event-months').series.length,5,'una serie por tipo');
  assert.match(p.$('.story-note').textContent,/no se puede ordenar los eventos por convocatoria/);
  assert.deepEqual(p.errors,[]);
});

// 44 · Los enlaces guardados antes de la reorganización conservan su vista (Demanda, salidas, último mes).
ok('44 · enlaces anteriores conservan los valores iniciales de entonces',()=>{
  let p=view({territory:'localidad:Carlos Paz'});assert.equal(p.$('[data-set="hotelTab"].active').dataset.value,'overview');
  p=view({tab:'air'});assert.equal(p.$('select[data-key="direction"]').value,'salidas');assert.equal(p.$('select[data-key="airPreset"]').value,'latest');
  const saved=JSON.parse(new p.w.URLSearchParams(p.w.location.hash.slice(1)).get('vista'));assert.equal(saved.v,'2','el enlace se reescribe con la marca vigente');
  assert.deepEqual(p.errors,[]);
});

// IPC sintético: índice trimestral que se duplica cada 4 trimestres desde 1T-2017; base = último trimestre.
function syntheticIpc(D){
  const qs=[...new Set(Object.values(D.internal.scopes).flatMap(rs=>rs.map(r=>r.period)))].filter(p=>p>='2017-01').sort();
  const quarterly=qs.map((period,i)=>({period,index:100*2**(i/4)})),base=quarterly.at(-1);
  D.ipc={base_period:base.period,base_label:'pesos de junio 2024',monthly:[{period:base.period,index:base.index}],quarterly};
  const by=Object.fromEntries(quarterly.map(r=>[r.period,r.index]));
  for(const rs of Object.values(D.internal.scopes))for(const r of rs)for(const k of ['gasto_total_ars','gasto_promedio_ars'])r[k+'_const']=by[r.period]&&r[k]!=null?r[k]*base.index/by[r.period]:null;
}

// 37 · Gasto a pesos constantes: dos indicadores en la evolución; KPI y ranking siguen en pesos corrientes.
ok('37 · evolución del gasto a pesos constantes (IPC sintético)',()=>{
  const p=view({tab:'internal',internalMetric:'gasto_promedio_ars_const',internalPreset:'4q'},syntheticIpc),opts=p.$$('select[data-key="internalMetric"] option').map(o=>o.textContent);
  assert.ok(opts.includes('Gasto total · pesos constantes')&&opts.includes('Gasto medio por turista · pesos constantes'),opts.join(' / '));
  assert.match(subtitle(p,'internal-trend'),/a pesos de junio 2024$/);
  assert.match(p.$('#panel-internal-trend').textContent,/Deflactado con el IPC nacional nivel general \(INDEC\) promedio del trimestre; antes de 2017 no hay IPC nacional y la serie queda vacía/);
  const data=Array.from(p.options.get('chart-internal-trend').series[0].data,d=>d&&typeof d==='object'?d.value:d);console.log('     ',title(p,'internal-trend'),'·',data.filter(v=>typeof v==='number').length,'valores');
  assert.ok(data.some(v=>typeof v==='number'),'la serie tiene valores');
  assert.match(p.$$('.kpi')[3].textContent,/Pesos corrientes del período/);
  assert.deepEqual(p.errors,[]);
});

// 38 · Sin IPC en los datos publicados: aviso y evolución vacía, sin errores.
ok('38 · gasto a pesos constantes sin IPC → aviso',()=>{
  const p=view({tab:'internal',internalMetric:'gasto_total_ars_const'},D=>{delete D.ipc;});
  assert.equal(p.errorBox(),'');assert.match(p.$('#dashboard').textContent,/El IPC todavía no se incorporó/);
  assert.deepEqual(p.errors,[]);
});

console.log(failures?`\n${failures} fallas`:'\nOK: smoke de las cinco secciones sin errores.');
process.exit(failures?1:0);
