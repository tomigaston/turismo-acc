# Inteligencia turística · Córdoba y Argentina

Tablero de la Agencia Competitividad Córdoba con **28 archivos estadísticos oficiales, seis informes municipales y un calendario de 70 eventos (4 con fuente oficial y 66 tomados del calendario de trabajo, sin fuente confirmada)**, gráficos Apache ECharts 6.0.0 y comparaciones integradas en cada sección.

El menú tiene **seis secciones**: Demanda hotelera, Conectividad aérea, Estacionalidad, Mercados internacionales, Turismo interno (que cierra con la calidad turística del SACT) y Fuentes y metodología.

## Cómo utilizarlo

1. Elegir una sección en el menú lateral. Córdoba permanece como referencia; los comparadores se eligen en la barra superior.
2. Seleccionar escala territorial, período e indicador. Los filtros se aplican a la sección; cada gráfico aclara las excepciones y su universo.
3. Alternar valores observados, índice base 100 o variación interanual. El índice permite comparar evolución entre ámbitos de distinto tamaño.
4. Usar la leyenda para ocultar series y el control inferior para ampliar un período. En demanda hotelera, el selector inferior del gráfico cambia el intervalo y recalcula indicadores, rankings, tablas y CSV. En otras secciones, el zoom sigue siendo visual.
5. Abrir **Tabla**, ordenar columnas o descargar **CSV / PNG** con fuente, período y criterios. **Copiar vista** conserva la selección en el enlace. **Restablecer** vuelve a los valores iniciales.

### Filtros de Demanda hotelera

La franja de la sección tiene tres controles:

- **Territorio:** Córdoba · provincia (región EOH) o uno de los siete destinos de Córdoba relevados por la EOH (Córdoba capital, Villa Carlos Paz, La Falda, Mar Chiquita, Mina Clavero, Río Cuarto y Villa General Belgrano). La escala (región o localidad) se deriva del territorio.
- **Comparar con:** el selector «Agregar comparador…» suma ámbitos, que se muestran como fichas con × para quitarlos. Hay atajos «Todas las regiones» (en escala región: las otras seis regiones y Argentina) o «Todos los destinos de Córdoba» (en escala localidad), y «Quitar todos». **Escalas comparables:** una región se compara solo con regiones y Argentina; una localidad, solo con localidades. En escala localidad, Argentina y Córdoba provincia pueden agregarse como referencias, pero solo se grafican en «Índice base 100» o «Variación interanual»; en «Valores observados» quedan excluidas de las series y se muestra un aviso. **Tope:** 9 series por gráfico, incluido el territorio.
- **Período:** año completo, últimos 12 meses, temporadas o intervalo personalizado (Desde/Hasta aparecen solo en ese caso).

Indicador, lectura y residencia de los viajeros se eligen en los controles de cada gráfico. La solapa **Ocupación por categoría** fija el territorio en Córdoba, porque las categorías EOH se publican por región, no por localidad. Los enlaces de **Copiar vista** guardados con el esquema anterior (escala, destino y dos comparadores) se convierten al esquema nuevo al abrirse.

Las vistas analíticas muestran datos, comparaciones, unidades, fuentes y fechas. Las definiciones de cálculo están en Fuentes y metodología; no se publican comentarios interpretativos junto a los gráficos. Los períodos y conteos de informes/eventos se derivan de los datos incorporados.

## Qué cambió

- **Demanda y posición:** intervalos personalizados, años completos y temporadas; viajeros, noches, estadía ponderada, participación nacional mensual y del intervalo, variaciones interanuales y rankings con cobertura completa. Cada destino se compara con Argentina u otros destinos dentro del mismo gráfico.
- **Estacionalidad dentro de demanda:** distribución mensual del intervalo, calendario de intensidad con clic para analizar un mes, rankings del período y temporadas completas. El verano cruza el año (diciembre–febrero).
- **Ocupación por categoría:** EOH permite comparar categorías agrupadas de regiones y Argentina; el territorio queda fijo en Córdoba. El Observatorio municipal aporta, por separado, hoteles de 1 a 5 estrellas, apart hoteles y hostels de Córdoba capital; seis trimestres (2025 y primer semestre de 2026), tasas trimestrales, demanda mensual, oferta anual de plazas y comparación interanual. Los totales de viajeros/noches no están desagregados por estrellas. Las diferencias entre tasas municipales redondeadas son aproximadas.
- **Eventos:** calendario de 70 eventos de 2024 y 2025: 4 con fuente oficial (Agencia Córdoba Turismo) y 66 tomados del calendario de trabajo, sin fuente confirmada. Categorías: Música y festivales (26), Feriados y fines de semana largos (16), Deportes (12), Congresos (9) y Ferias y exposiciones (7). Solo los eventos con fuente oficial muestran el enlace «Fuente oficial ↗»; en Fuentes y metodología, los demás figuran como pendientes de verificación. Las marcas ◆ sobre las series indican los meses con eventos (◆N cuando hay más de uno) y su tooltip detalla nombre, fechas, categoría y localidad. «Analizar este mes» lleva a los datos del mes frente al mismo mes del año anterior. Los eventos fuera de Córdoba capital, y los cinco sin localidad precisada, se asignan solo al ámbito provincial; los fines de semana largos, a provincia y capital. El calendario no es exhaustivo; ninguna variación se presenta como efecto causal de un evento.
- **Conectividad aérea (ANAC, Administración Nacional de Aviación Civil, procesamiento Yvera):** salidas desde Córdoba, llegadas y ambas direcciones, sin filtrar residencia.
  - **Filtros:** Sentido del trayecto, Tipo de tráfico, Aerolínea, **Comparar con** y **Período del análisis**.
    - Comparar con: aeropuertos argentinos agregados como fichas, con el atajo «Principales aeropuertos del país» (los 6 con más pasajeros del período) y hasta 9 series incluida Córdoba. El total nacional no es un aeropuerto: se puede agregar como «Argentina · total nacional (referencia)» solo para el gráfico de evolución, y se grafica únicamente en índice base 100, variación interanual o índice base 2019. En valores observados no se grafica y aparece un aviso de escala. También sigue como denominador de la participación nacional.
    - Período del análisis: último mes disponible, acumulado del año, últimos 12 meses, año completo o personalizado. Gobierna indicadores, ranking, rutas, mezcla de tráfico y aerolíneas. Si es un solo mes, el gráfico de evolución muestra los 24 meses que terminan en él.
  - **Indicador:** pasajeros, asientos, vuelos o factor de ocupación (% de asientos ocupados = pasajeros ÷ asientos). Con factor de ocupación, el ranking usa por defecto un mínimo de 100 vuelos, porque no mide tamaño.
  - **Lecturas de la evolución:** valores, índice base 100, variación interanual o índice base 2019 (mismo mes de 2019 = 100; los meses sin base quedan vacíos).
  - **Detalle de rutas:** vuelos por semana (promedio del período, sin distinguir días de la semana) y **rutas regulares ganadas y perdidas** frente al mismo período del año anterior. Ruta regular: al menos 4 vuelos en al menos la mitad de los meses (6 de 12).
  - **Conectividad internacional directa:** para Córdoba y cada comparador, destinos internacionales regulares, asientos y pasajeros internacionales del período, con la lista de destinos y sus vuelos por semana. La referencia es siempre el tráfico internacional, aunque el selector de tráfico esté en Cabotaje.
  - **Aerolíneas:**
    - Participación de cada aerolínea en el indicador del período frente al mismo período del año anterior. Se muestran las 8 principales y el resto se agrupa en «Otras»; la diferencia se expresa en puntos.
    - Evolución mensual en áreas apiladas, con las 5 principales y «Otras», en valores o participación (%).
    - Usan todas las aerolíneas. Con factor de ocupación, que no se suma, se usan pasajeros.
  - **Estacionalidad aérea:** perfil mensual del indicador en el año del período, o en el último año completo si el período no es un año completo. Lectura en peso de cada mes en el año (con «Argentina · total nacional» como referencia) o en valores observados. El cálculo de perfil mensual es el mismo que usa Demanda hotelera.
  - Un clic en una barra agrega un comparador o aplica una aerolínea. Los enlaces guardados con el esquema anterior (dos comparadores y ventana de meses) se convierten al abrirse.
- **Estacionalidad:** cuándo viaja la gente a Córdoba y cuánto se concentra la actividad en pocos meses.
  - **Preguntas que responde:** cuán estacional es Córdoba frente a otros destinos; si lo es más o menos con los años; si el aéreo sigue el patrón hotelero; cuáles son los meses valle y qué hay en el calendario esos meses.
  - **Filtros:** Territorio (Córdoba provincia o un destino de Córdoba relevado), Comparar con y Año de análisis.
    - Comparar con usa los mismos componentes y la misma regla de escalas que Demanda hotelera. Como todo se lee en porcentajes, Argentina se admite como ámbito también frente a una localidad.
    - Año de análisis: solo años con 12 meses observados, más el último año incompleto, marcado. Por defecto, el último completo.
  - **Indicador fijo:** pernoctaciones EOH, todas las residencias.
  - **Contenido:**
    - Indicadores del año (índice, mes pico, mes valle y meses debajo del promedio).
    - Índice por ámbito (territorio, comparadores y los 10 ámbitos de mayor volumen de la misma escala, hasta 14).
    - Evolución del índice por año completo desde 2007.
    - Hotelería frente a llegadas aéreas a SACO, cada una en % de su propio año (aéreo desde 2017; fuera de provincia y capital, SACO es referencia provincial).
    - Meses valle con el conteo de feriados, fines de semana largos y eventos del calendario.
    - Calendario de intensidad por destino.
  - **Índice de estacionalidad:** participación de los 3 meses con más pernoctaciones en el total anual, en %. Va de 25 % (los 12 meses iguales: sin estacionalidad) a 100 % (toda la actividad en 3 meses). Requiere los 12 meses observados; los años incompletos se omiten y el año en curso muestra «Año incompleto».
    - Mide concentración, no volumen. Los 3 meses no tienen por qué ser consecutivos.
    - Años excepcionales, como 2020 en Argentina (con los 3 meses previos a la pandemia), dan valores muy altos que no describen una temporada típica.
    - El índice no se calcula sobre localidades sumadas ni se compara con otros indicadores de concentración.
  - **Meses valle:** (mes ÷ promedio mensual del año − 1) × 100. El conteo de feriados y eventos es descriptivo: no atribuye la actividad a los eventos, y el calendario no es exhaustivo (cargado para 2024 y 2025).
- **Mercados internacionales (ETI, Encuesta de Turismo Internacional, INDEC):** el aeropuerto de Córdoba como **paso**, no como destino.
  - **Concepto de paso:**
    - Receptivo: residentes en el exterior que entraron al país por el aeropuerto de Córdoba, vayan a donde vayan.
    - Emisivo: residentes en Argentina, de cualquier provincia, que salieron del país por ese aeropuerto.
    - «Paso Córdoba» no es «turismo en Córdoba». Los títulos hablan de turistas «entrados» o «salidos» por el aeropuerto de Córdoba.
  - **Filtros:**
    - Sentido: receptivo por defecto.
    - Comparar con: fichas activables del Aeropuerto de Mendoza y de Ezeiza y Aeroparque, los dos pasos aéreos con serie.
    - Período del análisis: año completo (por defecto, el último con sus 4 trimestres), últimos 4 trimestres o último trimestre.
    - Indicador y lectura van junto al gráfico de evolución.
  - **Reglas de agregación del período:** Turistas, pernoctes y gasto total se suman; estadía media = suma de pernoctes ÷ suma de turistas; gasto por turista = suma de gasto total ÷ suma de turistas; gasto diario = suma de gasto total ÷ suma de pernoctes. Nunca se promedian promedios trimestrales, y si falta un trimestre del período el agregado queda sin dato (no se imputa).
  - **Contenido:**
    - Balanza del aeropuerto de Córdoba, independiente del sentido: ingreso de divisas (receptivo), gasto en el exterior (emisivo), saldo y relación. Incluye barras anuales 2015–2025 en dólares corrientes, sin deflactar; los años con trimestres faltantes se omiten.
    - Evolución por aeropuerto de entrada o salida.
    - Mercados de residencia o destinos del viaje, frente al mismo período del año anterior, y su evolución anual. Las agrupaciones de la ETI difieren entre sentidos y pasos y no se cruzan.
    - Motivos en participación por paso. Para Córdoba, la ETI no publica estimación de «Negocios, congresos y conferencias».
    - Estadía media y gasto por turista por paso.
    - Participación del aeropuerto de Córdoba entre los tres pasos aéreos relevados. No es participación nacional: la ETI releva también pasos terrestres y fluviales que no están en esta base.
- **Turismo interno (EVyTH, Encuesta de Viajes y Turismo de los Hogares, INDEC/Yvera):** viajes de los argentinos dentro del país, con Córdoba como región de destino.
  - **Filtros:**
    - Comparar con: fichas de las otras siete regiones de destino; por defecto, Argentina y Cuyo. Argentina es el total nacional y se grafica solo en índice base 100 y variación interanual; en valores observados aparece el aviso de escala.
    - Período del análisis: último trimestre (por defecto), últimos 4 trimestres o año completo. Con un solo trimestre, la evolución muestra 16 trimestres.
  - **Reglas de agregación del período:** las mismas que la ETI: turistas, pernoctes y gasto se suman; estadía media = suma de pernoctes ÷ suma de turistas; gasto medio = suma de gasto ÷ suma de turistas; si falta un trimestre, el agregado queda sin dato.
  - **Gasto nominal:** El gasto de la EVyTH en pesos corrientes (gasto total y gasto medio por turista) no se grafica en la evolución: solo aparece en el KPI y en el ranking de un período, con la leyenda «Pesos corrientes del período; no comparable entre años».
  - **Contenido:**
    - Aviso fijo: «Última publicación de la EVyTH incorporada: <trimestre>. La encuesta se publica con rezago».
    - KPI: turistas con destino Córdoba, participación en el turismo interno, estadía media y gasto medio frente a Argentina.
    - Evolución por región de destino (turistas, pernoctes, estadía media y gasto a pesos constantes) y ranking regional del período con todos los indicadores.
    - Participación de Córdoba en el turismo interno, por año (2012–2023; los años incompletos se omiten; Argentina = 100 %).
    - **Calidad turística · distinciones del SACT:** registros de Córdoba y su porcentaje del país, y distinciones por programa. Es un padrón histórico: una organización puede tener varias distinciones y no equivale a vigencia. Sin comparador provincial.
  - La antigua sección Calidad turística se integró aquí; los enlaces viejos que la abrían llevan a Turismo interno.
- **Fuentes y metodología:** una tarjeta por fuente (institución, qué mide, periodicidad, datos disponibles hasta y enlace al catálogo oficial), los informes municipales incorporados, el calendario de eventos con fuente oficial y «Cómo leer el tablero». Los identificadores, huellas SHA-256 y filas de cada recurso no se muestran en pantalla: quedan en `config/sources.json` y en el ETL.

## Cobertura de los archivos incorporados

| Fuente | Recursos | Último período | Alcance |
|---|---:|---|---|
| EOH / INDEC | 10 | Noviembre de 2025 | Argentina, regiones y localidades relevadas |
| ANAC / Yvera | 1 | Julio de 2026 | Aeropuertos, rutas, aerolíneas y ambos sentidos |
| ETI / INDEC | 10 | Cuarto trimestre de 2025 | Receptivo y emisivo por tres pasos aeroportuarios |
| EVyTH | 6 | Segundo trimestre de 2024 | Turismo interno; contexto histórico |
| SACT | 1 | Diciembre de 2023 | Registro histórico de distinciones |
| Observatorio municipal | 6 informes PDF | Segundo trimestre de 2026 | Córdoba capital; estrellas individuales y demanda |
| Agencia Córdoba Turismo | 2 artículos / 4 eventos | Eventos de 2024 | Fechas y localidades, sin impactos imputados |
| Calendario de trabajo ACC | 66 eventos | Eventos de 2024 y 2025 | Fechas tomadas de una lista de trabajo, sin fuente oficial confirmada |

La incorporación de estos archivos se realizó el 21 de octubre de 2026. La fecha de descarga **no** equivale al período de los datos. Los informes municipales se incorporaron el 30 de octubre de 2026 en un conjunto separado; no se empalman con EOH ni se usan para calcular participación nacional. Las transcripciones conservan URL, páginas, fecha de corte cuando es consistente, huella SHA-256 y observaciones sobre erratas de origen. Los últimos tres meses de la base aérea son provisorios.

## Abrir y poner en marcha

Para revisar sin instalar nada, abrir `offline/Tablero_turismo_Cordoba_completo.html`: incluye ECharts, estilos y datos, y funciona sin conexión. Para implementar, descomprimir `Turismo_Cordoba_GitHub_Vercel_2026-11-02.zip` y abrir `site/index.html`, o servir la carpeta `site` desde el alojamiento institucional. No hay dependencias de instalación de Node para el sitio; ECharts se distribuye localmente.

El navegador carga `data/dashboard.js`, el suplemento `data/hotel.js`, los modelos de cálculo y la interfaz. **No consulta una base de datos en tiempo real.** Los datos sí son reales: provienen de archivos oficiales descargados y procesados por el actualizador. La frecuencia de publicación de cada fuente determina cuándo aparecen nuevas observaciones.

Flujo de funcionamiento:

**CSV oficiales → descarga y validación con Python → JSON/JS agregados → tablero ECharts.**

Los enlaces directos que necesita Nahuel están en **`config/sources.json`**, campo `url` de cada recurso. Son fuentes públicas; no requieren una cadena de conexión ni credenciales de una base de datos. La sección Fuentes también enlaza cada archivo.

## Actualizar los datos manualmente

Requiere Python 3.10 o superior y Node.js 22.22.2 o superior para las comprobaciones de JavaScript (jsdom 30, usado por el smoke, lo exige). Python usa únicamente la biblioteca estándar.

```bash
python scripts/update_data.py
python -m unittest discover -s tests -v
node --check site/app.js
node --check site/model.js
node tests/test_model.cjs
node --check site/hotel.js
node --check site/hotel-model.js
node tests/test_hotel.cjs
npm ci && npm test
```

`npm test` corre `tests/test_model.cjs`, `tests/test_hotel.cjs` y `tests/smoke.cjs`, que carga la interfaz en jsdom y recorre las seis secciones: filtros y tarjetas de Demanda hotelera, Conectividad aérea, Estacionalidad, Mercados internacionales y Turismo interno (sin gasto nominal en la evolución, tarjeta del SACT, gasto a pesos constantes con un IPC sintético), la redirección de enlaces viejos y que Fuentes y metodología no muestre «SHA-256», «clúster» ni «pendientes de incorporación».

El actualizador descarga 29 archivos (28 de turismo y el IPC), procesa la base aérea en streaming y conserva todas las rutas mensuales. Esa descarga ronda los 270 MB y se realiza en el servidor de actualización, no en el navegador. Los archivos agregados se generan en `site/data/`. Un error detiene el proceso; publicar únicamente después de completar todos los controles.

Para regenerar el HTML autocontenido después de una actualización:

```bash
python scripts/build_delivery.py --output offline/Tablero_turismo_Cordoba_completo.html
```

## Informes municipales y calendario

`config/hotel_observatory.json` conserva las transcripciones verificadas; `config/hotel_events.json`, las fechas y fuentes de eventos. No existe una conexión en tiempo real a estos informes. Al incorporar un nuevo informe, revisar el PDF, registrar su huella y páginas y conciliar los totales antes de compilar:

```bash
python scripts/build_hotel_data.py
node tests/test_hotel.cjs
```

El actualizador general también valida y compila este suplemento. No lo sustituye por las series EOH. El compilador genera JSON/JS y dos CSV auditables de demanda municipal y categorías. Publicar `site/` completo, incluyendo `hotel.js`, `hotel-model.js` y `data/hotel.js`. El archivo `vercel.json` de esta entrega configura esa carpeta como salida estática.

## Workflow de actualización

El flujo `.github/workflows/actualizar-datos.yml` está incluido. **En esta copia de trabajo se ejecuta solo a pedido** (`workflow_dispatch`): los disparadores por cron (lunes 06:00 de Córdoba) y por push a `main` en scripts/configuración están comentados en el archivo, y se decidirá si se restituyen antes de pasar al repositorio institucional. El flujo descarga y procesa las fuentes, corre las pruebas de Python y JavaScript y `npm ci && npm test` (Node 22) antes de publicar los datos validados.

1. Subir el contenido del paquete a la rama `main` de un repositorio GitHub de la Agencia. Incluir `.github/workflows/actualizar-datos.yml`.
2. Habilitar Actions y permisos de escritura del workflow.
3. Ejecutar manualmente “Actualización datos turísticos” y comprobar que termine correctamente.
4. Conectar el repositorio a Vercel y utilizar la configuración de `README.md`: raíz del repositorio, preset Other y salida `site`. `vercel.json` ya contiene esa configuración.
5. Activar notificaciones de fallos. Si se restituye el disparador por cron, el flujo revisará las fuentes los lunes a las **06:00 de Córdoba** y guardará los datos validados. El alojamiento debe publicar esos cambios automáticamente.

La versión privada publicada para esta entrega contiene la carga verificada. No tiene una actualización desatendida activa. No se aprovisionó una base Neon ni se generaron credenciales.

## Gasto a precios constantes (IPC)

El gasto de la EVyTH se publica en pesos corrientes. Para graficar su evolución, el ETL lo deflacta con el **IPC nacional, nivel general, base diciembre 2016 = 100** (INDEC), serie `148.3_INIVELNAL_DICI_M_26` de la API de series de tiempo de datos.gob.ar ([catálogo](https://datos.gob.ar/dataset/sspm_145)).

1. **IPC mensual:** se lee el CSV de la API con `header=ids` (columnas `indice_tiempo` y `148.3_INIVELNAL_DICI_M_26`; también se acepta `valor`). Se exige que los valores sean mayores que cero y sin meses faltantes desde 2016-12. Un mes que no supera al anterior no detiene el proceso: solo genera un aviso en la salida.
2. **IPC trimestral:** promedio simple de los 3 meses del trimestre. Un trimestre sin sus 3 meses no tiene IPC.
3. **Base:** el último mes publicado del IPC. El tablero lo indica en el subtítulo: «a pesos de <mes año>».
4. **Fórmula**, para cada región y trimestre *t*:

   ```
   gasto_total_ars_const(t)    = gasto_total_ars(t)    × IPC(mes base) ÷ IPC trimestral(t)
   gasto_promedio_ars_const(t) = gasto_promedio_ars(t) × IPC(mes base) ÷ IPC trimestral(t)
   ```

   Si los precios del trimestre son el doble que los del mes base, el mismo gasto nominal vale la mitad a pesos constantes.
5. **Sin IPC:** antes del primer trimestre de 2017 no hay IPC nacional, y el gasto constante queda nulo; no se empalma con otros índices.

En pantalla, «Gasto total · pesos constantes» y «Gasto medio por turista · pesos constantes» son indicadores de la evolución de Turismo interno. El KPI y el ranking siguen en pesos corrientes. Si los datos publicados todavía no incluyen el IPC, la evolución queda vacía con un aviso.

**Fallas y caché.** Si la API rechaza la serie (por ejemplo, porque el id dejó de existir), el ETL se detiene con un mensaje que nombra la serie: nunca continúa sin IPC ni usa otra serie. Con `--input-dir` (caché local) sin el CSV del IPC, el resto del proceso sigue: la fuente queda «no descargada», los campos constantes quedan nulos y `validate()` avisa. El dato real lo trae el workflow de GitHub Actions.

## Si se decide utilizar una base de datos

La implementación actual puede alojarse como sitio estático. Para integrarla con la infraestructura existente de la Agencia, el mismo proceso Python puede guardar los indicadores en una base y una API puede entregarlos al tablero. Se necesitan el esquema y los accesos del backend elegido; una conexión a Neon nunca se incluye en el HTML público. Esta integración no forma parte de la versión entregada.

## Criterios para interpretar los datos

- **Desde Córdoba** significa aeropuerto de Córdoba como origen del tramo, sin exigir residencia en la provincia. Las rutas indican conexiones inmediatas; pueden ser escalas. No hay datos de otros medios de transporte incorporados.
- **Pasajeros** no equivale a turistas ni personas únicas. Se mantienen las magnitudes publicadas por Yvera, sin aplicar otra división. Al sumar llegadas y salidas, un tramo de cabotaje participa en sus dos extremos argentinos.
- **Faltantes** no se completan con cero. Los rankings estacionales exigen todos los meses de la temporada y los porcentajes mensuales exigen doce meses completos. Verano = diciembre del año anterior + enero y febrero del año elegido.
- **Promedios:** ocupación aérea = pasajeros/asientos; estadía = noches/viajeros o turistas; promedios nacionales EVyTH ponderados por turistas. Las tasas hoteleras son las oficiales para cada categoría.
- **Gasto en pesos corrientes (EVyTH):** El gasto de la EVyTH en pesos corrientes (gasto total y gasto medio por turista) no se grafica en la evolución: solo aparece en el KPI y en el ranking de un período, con la leyenda «Pesos corrientes del período; no comparable entre años».
- **ETI y pasos:** el paso Córdoba no identifica la residencia provincial de quien viaja. Turistas, pernoctes y gasto total se suman; estadía media = suma de pernoctes ÷ suma de turistas; gasto por turista = suma de gasto total ÷ suma de turistas; gasto diario = suma de gasto total ÷ suma de pernoctes. Nunca se promedian promedios trimestrales, y si falta un trimestre del período el agregado queda sin dato (no se imputa).
- **ETI emisiva:** residentes en Argentina que viajan al exterior por el paso Córdoba; no solo cordobeses. ETI receptiva mide su viaje por Argentina, sin atribuir todas las noches o gastos a Córdoba. Mercados geográficos no idénticos entre pasos se conservan separados.
- **Territorio:** EOH región Córdoba corresponde a la provincia. Cuyo comprende Mendoza, San Juan, San Luis y La Rioja. Las localidades no se suman para reconstruir provincias. En Demanda hotelera se comparan solo ámbitos de la misma escala; las referencias nacional y provincial frente a una localidad se grafican únicamente en índice o variación.

## Fuentes oficiales y pendientes

Los enlaces a los archivos específicos, identificación y licencias están en `config/sources.json`. Catálogos:

- [EOH](https://datos.yvera.gob.ar/dataset/encuesta-ocupacion-hotelera-parahotelera-eoh)
- [Conectividad aérea](https://datos.yvera.gob.ar/dataset/conectividad-aerea)
- [ETI](https://datos.yvera.gob.ar/dataset/encuesta-turismo-internacional)
- [EVyTH](https://datos.yvera.gob.ar/dataset/encuesta-viajes-turismo-hogares-evyth)
- [SACT](https://datos.yvera.gob.ar/dataset/organizaciones-distinguidas-sistema-argentino-calidad-turistica-sact)
- [IPC nacional · nivel general](https://datos.gob.ar/dataset/sspm_145)

PUNA y observatorios provincial/municipal quedan pendientes de validar recursos estructurados estables. La información propia de empresas asociadas continúa reservada para una etapa posterior. También queda pendiente conectar la actualización al alojamiento institucional.

## Verificación de esta entrega

Se comprobaron dieciséis pruebas Python (ocho de ellas sobre el IPC y dos sobre las descargas, con datos sintéticos: el IPC real lo trae el workflow), valores conocidos de EOH/ETI, faltantes, ponderaciones, índices comunes, temporadas y conciliación entre rutas, aeropuertos, sentidos y aerolíneas. Se revisó la interfaz en navegador de escritorio, el cambio de filtros, tablas y exportaciones. El diseño incluye reglas adaptables; no se realizó una prueba en un dispositivo móvil real. `tests/smoke.cjs` (jsdom, 38 casos) recorre las seis secciones; en Demanda hotelera verifica las cuatro solapas sin errores, comparadores y escalas, tope de 9 series, conversión de enlaces anteriores, etiquetas del calendario de intensidad y «Analizar este mes».

Apache ECharts 6.0.0 se incluye bajo Apache License 2.0. Los archivos LICENSE y NOTICE se conservan en `site/vendor/`.
