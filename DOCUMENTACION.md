# Inteligencia turística · Córdoba y Argentina

Tablero de la Agencia Competitividad Córdoba con **28 archivos estadísticos oficiales, seis informes municipales y cuatro eventos documentados**, gráficos Apache ECharts 6.0.0 y comparaciones integradas en cada sección. La información propia del clúster queda pendiente.

## Cómo utilizarlo

1. Elegir una sección en el menú lateral. Córdoba permanece como referencia; los comparadores se eligen en la barra superior.
2. Seleccionar escala territorial, período e indicador. Los filtros se aplican a la sección; cada gráfico aclara las excepciones y su universo.
3. Alternar valores observados, índice base 100 o variación interanual. El índice permite comparar evolución entre ámbitos de distinto tamaño.
4. Usar la leyenda para ocultar series y el control inferior para ampliar un período. En demanda hotelera, el selector inferior del gráfico cambia el intervalo y recalcula indicadores, rankings, tablas y CSV. En otras secciones, el zoom sigue siendo visual.
5. Abrir **Tabla**, ordenar columnas o descargar **CSV / PNG** con fuente, período y criterios. **Copiar vista** conserva la selección en el enlace. **Restablecer** vuelve a los valores iniciales.

Las vistas analíticas muestran datos, comparaciones, unidades, fuentes y fechas. Las definiciones de cálculo están en Fuentes y metodología; no se publican comentarios interpretativos junto a los gráficos. Los períodos y conteos de informes/eventos se derivan de los datos incorporados.

## Qué cambió

- **Demanda y posición:** intervalos personalizados, años completos y temporadas; viajeros, noches, estadía ponderada, participación nacional mensual y del intervalo, variaciones interanuales y rankings con cobertura completa. Cada destino se compara con Argentina u otros destinos dentro del mismo gráfico.
- **Estacionalidad dentro de demanda:** distribución mensual del intervalo, calendario de intensidad con clic para analizar un mes, rankings del período y temporadas completas. El verano cruza el año (diciembre–febrero).
- **Tipologías y estrellas:** EOH permite comparar categorías agrupadas de regiones y Argentina. El Observatorio municipal aporta, por separado, hoteles de 1 a 5 estrellas, apart hoteles y hostels de Córdoba capital; seis trimestres (2025 y primer semestre de 2026), tasas trimestrales, demanda mensual, oferta anual de plazas y comparación interanual. Los totales de viajeros/noches no están desagregados por estrellas. Las diferencias entre tasas municipales redondeadas son aproximadas.
- **Eventos:** cuatro eventos de 2024 documentados por la Agencia Córdoba Turismo, marcas sobre las series, filtros por tipo y territorio y lectura del mes frente al mismo mes del año anterior. Cosquín Rock se ubica en Santa María de Punilla, sin asignarlo a capital. El calendario es inicial y no exhaustivo; ninguna variación se presenta como efecto causal de un evento.
- **Conectividad aérea:** salidas desde Córdoba, llegadas y ambas direcciones, sin filtrar residencia. Comparación con otros aeropuertos y el total argentino, cabotaje/internacional, aerolínea, período mensual/acumulado/12 meses, destinos y orígenes, ranking y mínimo de vuelos. Un clic en una barra permite elegir comparador o aerolínea.
- **Estacionalidad:** curvas mensuales, porcentaje del total anual, calendario de intensidad y rankings de verano/invierno/otras temporadas. Córdoba capital puede compararse con Ciudad de Mendoza; región Córdoba, con Cuyo. No se presenta Cuyo como si fuera Mendoza provincia.
- **Mercados internacionales:** ETI emisiva y receptiva por Córdoba, Mendoza y Ezeiza/Aeroparque; turistas, noches, estadía, mercados, motivos y gasto. Los pasos relevados no equivalen al total nacional.
- **Turismo interno:** Córdoba, Argentina y las ocho regiones de destino de la EVyTH. Quintiles únicamente nacionales y gasto en pesos corrientes.
- **Calidad turística:** distinciones históricas por provincia y programa. No se presentan como certificaciones vigentes ni como empresas del clúster.
- **Fuentes y metodología:** enlaces a los 28 archivos originales, cobertura, fecha de incorporación, huella SHA-256 y criterios de cálculo.

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

La incorporación de estos archivos se realizó el 21 de octubre de 2026. La fecha de descarga **no** equivale al período de los datos. Los informes municipales se incorporaron el 30 de octubre de 2026 en un conjunto separado; no se empalman con EOH ni se usan para calcular participación nacional. Las transcripciones conservan URL, páginas, fecha de corte cuando es consistente, huella SHA-256 y observaciones sobre erratas de origen. Los últimos tres meses de la base aérea son provisorios.

## Abrir y poner en marcha

Para revisar sin instalar nada, abrir `offline/Tablero_turismo_Cordoba_completo.html`: incluye ECharts, estilos y datos, y funciona sin conexión. Para implementar, descomprimir `Turismo_Cordoba_GitHub_Vercel_2026-11-02.zip` y abrir `site/index.html`, o servir la carpeta `site` desde el alojamiento institucional. No hay dependencias de instalación de Node para el sitio; ECharts se distribuye localmente.

El navegador carga `data/dashboard.js`, el suplemento `data/hotel.js`, los modelos de cálculo y la interfaz. **No consulta una base de datos en tiempo real.** Los datos sí son reales: provienen de archivos oficiales descargados y procesados por el actualizador. La frecuencia de publicación de cada fuente determina cuándo aparecen nuevas observaciones.

Flujo de funcionamiento:

**CSV oficiales → descarga y validación con Python → JSON/JS agregados → tablero ECharts.**

Los enlaces directos que necesita Nahuel están en **`config/sources.json`**, campo `url` de cada recurso. Son fuentes públicas; no requieren una cadena de conexión ni credenciales de una base de datos. La sección Fuentes también enlaza cada archivo.

## Actualizar los datos manualmente

Requiere Python 3.10 o superior y Node.js 20 o superior para las comprobaciones de JavaScript. Python usa únicamente la biblioteca estándar.

```bash
python scripts/update_data.py
python -m unittest discover -s tests -v
node --check site/app.js
node --check site/model.js
node tests/test_model.cjs
node --check site/hotel.js
node --check site/hotel-model.js
node tests/test_hotel.cjs
```

El actualizador descarga 28 archivos, procesa la base aérea en streaming y conserva todas las rutas mensuales. Esa descarga ronda los 270 MB y se realiza en el servidor de actualización, no en el navegador. Los archivos agregados se generan en `site/data/`. Un error detiene el proceso; publicar únicamente después de completar todos los controles.

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

## Activar la actualización semanal

El flujo `.github/workflows/actualizar-datos.yml` está incluido. Descargar el ZIP no lo ejecuta. Al incorporarlo a `main`, con GitHub Actions habilitado y permisos de escritura, puede ejecutarse por cambios de configuración/scripts, manualmente o los lunes a las 06:00 de Córdoba. El primer ingreso de esos archivos puede disparar una actualización.

1. Subir el contenido del paquete a la rama `main` de un repositorio GitHub de la Agencia. Incluir `.github/workflows/actualizar-datos.yml`.
2. Habilitar Actions y permisos de escritura del workflow.
3. Ejecutar manualmente “Actualización datos turísticos” y comprobar que termine correctamente.
4. Conectar el repositorio a Vercel y utilizar la configuración de `README.md`: raíz del repositorio, preset Other y salida `site`. `vercel.json` ya contiene esa configuración.
5. Activar notificaciones de fallos. El flujo revisa las fuentes los lunes a las **06:00 de Córdoba** y guarda los datos validados. El alojamiento debe publicar esos cambios automáticamente.

La versión privada publicada para esta entrega contiene la carga verificada. No tiene una actualización desatendida activa. No se aprovisionó una base Neon ni se generaron credenciales.

## Si se decide utilizar una base de datos

La implementación actual puede alojarse como sitio estático. Para integrarla con la infraestructura existente de la Agencia, el mismo proceso Python puede guardar los indicadores en una base y una API puede entregarlos al tablero. Se necesitan el esquema y los accesos del backend elegido; una conexión a Neon nunca se incluye en el HTML público. Esta integración no forma parte de la versión entregada.

## Criterios para interpretar los datos

- **Desde Córdoba** significa aeropuerto de Córdoba como origen del tramo, sin exigir residencia en la provincia. Las rutas indican conexiones inmediatas; pueden ser escalas. No hay datos de otros medios de transporte incorporados.
- **Pasajeros** no equivale a turistas ni personas únicas. Se mantienen las magnitudes publicadas por Yvera, sin aplicar otra división. Al sumar llegadas y salidas, un tramo de cabotaje participa en sus dos extremos argentinos.
- **Faltantes** no se completan con cero. Los rankings estacionales exigen todos los meses de la temporada y los porcentajes mensuales exigen doce meses completos. Verano = diciembre del año anterior + enero y febrero del año elegido.
- **Promedios:** ocupación aérea = pasajeros/asientos; estadía = noches/viajeros o turistas; promedios nacionales EVyTH ponderados por turistas. Las tasas hoteleras son las oficiales para cada categoría.
- **ETI emisiva:** residentes en Argentina que viajan al exterior por el paso Córdoba; no solo cordobeses. ETI receptiva mide su viaje por Argentina, sin atribuir todas las noches o gastos a Córdoba. Mercados geográficos no idénticos entre pasos se conservan separados.
- **Territorio:** EOH región Córdoba corresponde a la provincia. Cuyo comprende Mendoza, San Juan, San Luis y La Rioja. Las localidades no se suman para reconstruir provincias.

## Fuentes oficiales y pendientes

Los enlaces a los archivos específicos, identificación y licencias están en `config/sources.json`. Catálogos:

- [EOH](https://datos.yvera.gob.ar/dataset/encuesta-ocupacion-hotelera-parahotelera-eoh)
- [Conectividad aérea](https://datos.yvera.gob.ar/dataset/conectividad-aerea)
- [ETI](https://datos.yvera.gob.ar/dataset/encuesta-turismo-internacional)
- [EVyTH](https://datos.yvera.gob.ar/dataset/encuesta-viajes-turismo-hogares-evyth)
- [SACT](https://datos.yvera.gob.ar/dataset/organizaciones-distinguidas-sistema-argentino-calidad-turistica-sact)

PUNA y observatorios provincial/municipal quedan pendientes de validar recursos estructurados estables. La información propia del clúster continúa reservada para una etapa posterior. También queda pendiente conectar la actualización al alojamiento institucional.

## Verificación de esta entrega

Se comprobaron seis pruebas de integridad Python, valores conocidos de EOH/ETI, faltantes, ponderaciones, índices comunes, temporadas y conciliación entre rutas, aeropuertos, sentidos y aerolíneas. Se revisó la interfaz en navegador de escritorio, el cambio de filtros, tablas y exportaciones. El diseño incluye reglas adaptables; no se realizó una prueba en un dispositivo móvil real.

Apache ECharts 6.0.0 se incluye bajo Apache License 2.0. Los archivos LICENSE y NOTICE se conservan en `site/vendor/`.
