// Smoke test de Demanda hotelera con jsdom: carga site/index.html con un stub de ECharts.
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

console.log(failures?`\n${failures} fallas`:'\nOK: smoke de Demanda hotelera sin errores.');
process.exit(failures?1:0);
