// Smoke test de Demanda hotelera y Conectividad aérea con jsdom: carga site/index.html con un stub de ECharts.
// Uso: node tests/smoke.cjs [ruta a site/]   (por defecto, la carpeta site del repositorio)
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require('jsdom');
const SITE=path.resolve(process.argv[2]||path.join(__dirname,'..','site'));
const html=fs.readFileSync(path.join(SITE,'index.html'),'utf8').replace(/<script\b[^>]*><\/script>/g,'');
const scripts=['data/dashboard.js','model.js','data/hotel.js','hotel-model.js','hotel.js','app.js'].map(f=>fs.readFileSync(path.join(SITE,f),'utf8'));
let failures=0;
const ok=(name,fn)=>{try{fn();console.log('PASS',name);}catch(e){failures++;console.log('FAIL',name,'\n  ',e.message);}};

function open(hash=''){
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
  for(const code of scripts)w.eval(code);
  const $=s=>w.document.querySelector(s),$$=s=>[...w.document.querySelectorAll(s)];
  const click=el=>el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
  const change=(el,v)=>{el.value=v;el.dispatchEvent(new w.Event('change',{bubbles:true}));};
  const series=id=>Array.from(options.get('chart-'+id)?.series||[],s=>String(s.name));
  const errorBox=()=>$('#error').hidden?'':$('#error').textContent;
  return {w,$,$$,click,change,series,errors,scrolled,errorBox,options};
}

// 1 · Las cuatro solapas de Demanda hotelera, sin errores en consola.
ok('1 · recorre las 4 solapas sin errores',()=>{
  const p=open();
  const tabs=p.$$('[data-set="hotelTab"]').map(b=>[b.dataset.value,b.textContent]);
  assert.deepEqual(tabs.map(t=>t[1]),['Demanda y posición','Estacionalidad','Ocupación por categoría','Eventos']);
  for(const [id,title] of tabs){
    p.click(p.$(`[data-set="hotelTab"][data-value="${id}"]`));
    assert.equal(p.$('[data-set="hotelTab"].active').dataset.value,id);
    assert.equal(p.errorBox(),'',title+': '+p.errorBox());
    console.log('     ',title,'·',p.$$('.panel').length,'tarjetas');
  }
  // En Ocupación por categoría, también la fuente EOH.
  p.click(p.$('[data-set="hotelTab"][data-value="typology"]'));p.change(p.$('select[data-key="hotelSource"]'),'eoh');
  assert.equal(p.errorBox(),'');assert.ok(p.$('select[data-key="territory"]').disabled,'territorio deshabilitado en categorías');
  assert.match(p.$('.field-note').textContent,/Las categorías EOH se publican por región, no por localidad/);
  assert.deepEqual(p.errors,[]);
});

// 2 · Escala región: "Todas las regiones" lleva el gráfico principal a 8 series.
ok('2 · región + "Todas las regiones" → 8 series',()=>{
  const p=open();
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
  local=open();const p=local;
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
  const p=open();p.change(p.$('select[data-key="territory"]'),'localidad:Córdoba');
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
  for(const tab of ['air','season','international','internal','quality','sources','demand']){
    p.click(p.$(`[data-tab="${tab}"]`));assert.equal(p.errorBox(),'',tab+': '+p.errorBox());
    console.log('     ',tab,'·',p.$$('.panel').length,'tarjetas');
  }
  // Estacionalidad usa el comparador EOH por territorio (ya no tiene modo aéreo).
  p.click(p.$('[data-tab="season"]'));
  assert.equal(p.errorBox(),'');assert.ok(p.$('select[data-compare-add="seasonCompare"]'),'comparador EOH en Estacionalidad');assert.ok(!p.$('select[data-key="seasonData"]'),'sin interruptor de fuente');
  p.click(p.$('[data-tab="air"]'));
  for(const k of ['airport-ranking','routes','air-route-changes','air-mix','carrier-share','carrier-trend'])assert.ok(p.$('#panel-'+k),'tarjeta '+k);
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
  assert.ok(p.$$('.kpi-label').some(k=>k.textContent==='Brecha de factor de ocupación'));
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

// 15 · Participación de las aerolíneas: renderiza, agrupa en Otras y la participación actual suma 100 %.
ok('15 · participación de las aerolíneas suma 100 %',()=>{
  for(const extra of [{},{airPreset:'12'},{airPreset:'year',airYear:'2025',airMetric:'vuelos'}]){
    const p=air(extra),o=p.options.get('chart-carrier-share');assert.ok(o,'gráfico');
    const names=Array.from(o.yAxis.data,String),now=values(p,'carrier-share',0);
    assert.ok(names.length<=9,'8 principales + Otras');
    if(names.length===9)assert.equal(names.at(-1),'Otras');
    near100(now,'participación actual '+JSON.stringify(extra));
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
  assert.equal(p.$$('#panel-air-intl details').length,3);
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

console.log(failures?`\n${failures} fallas`:'\nOK: smoke de Demanda hotelera y Conectividad aérea sin errores.');
process.exit(failures?1:0);
