# Turismo Córdoba · Paquete para GitHub y Vercel

Versión del 16 de noviembre de 2026. Mismos datos que la entrega del 11 de noviembre: 28 recursos estadísticos oficiales, el padrón de alojamiento (PUNA, foto 2021), seis informes municipales y 70 eventos en el calendario (4 con fuente oficial y 66 tomados del calendario de trabajo, sin fuente confirmada). Cinco secciones: Hotelería, Conectividad aérea, Mercados internacionales, Turismo interno y Fuentes y metodología.

**Novedad de esta versión: panoramas interactivos.** Cada sección de datos abre en un **Panorama**: una página descriptiva con lecturas analíticas que cruzan fuentes (se recalculan con cada selección) y gráficos que se filtran entre sí tocándolos, casi sin menús. El análisis anterior, con sus filtros, sigue disponible en cada sección como **Análisis detallado** (en Hotelería, en las solapas Oferta, Demanda, Ocupación, Estacionalidad y Eventos). Incluye Apache ECharts 6.0.0. La copia autónoma de `offline/` está regenerada con esta versión e incluye los cuatro panoramas.

## 1. Subir al GitHub existente

1. Descomprimir `Turismo_Cordoba_paquete_2026-11-16.zip`.
2. Abrir la carpeta `turismo-acc`.
3. Copiar **su contenido** a la raíz del repositorio `holacompetitividad2025/turismo-acc`, conservando los nombres y la estructura. `vercel.json` y la carpeta `site` deben quedar directamente en la raíz del repositorio, sin una carpeta envolvente adicional.
4. Reemplazar los archivos del tablero anterior que tengan los mismos nombres. Si ya existe otro `vercel.json`, usar el incluido en esta entrega para este tablero. Conservar configuraciones ajenas al tablero que necesite el equipo.
5. Confirmar los cambios mediante un commit, preferentemente en una rama para revisar el Preview antes de incorporarla a la rama de producción.

Con GitHub Desktop, copiar el contenido a la carpeta local del repositorio, revisar los cambios y hacer Commit / Push. Desde GitHub web, usar **Add file → Upload files** y subir los archivos descomprimidos. Subir únicamente el ZIP al repositorio no instala el tablero. Verificar que se haya incluido `.github` si se desea utilizar el actualizador; en macOS las carpetas que empiezan con punto pueden estar ocultas.

## 2. Configurar el proyecto de Vercel

Si el repositorio ya alimenta un proyecto de Vercel, usar ese mismo proyecto y conservar su dominio. En Settings → Build and Deployment, verificar:

| Campo | Valor para este paquete |
|---|---|
| Root Directory | Raíz del repositorio: `./`, sin subcarpeta |
| Framework Preset | `Other` |
| Build Command | Vacío; omitir compilación |
| Install Command | Vacío; omitir instalación |
| Output Directory | `site` |

`vercel.json` ya declara el framework, los comandos vacíos y la carpeta de salida. Root Directory se configura desde el proyecto de Vercel. No apuntarlo a `site`: el archivo de configuración está en la raíz y ya establece la salida `site`.

En Settings → Git, comprobar que el proyecto esté conectado al repositorio correcto y cuál es su rama de producción. Si todavía no existe proyecto, importar el repositorio desde Vercel con los valores anteriores. La integración de Git puede generar un despliegue con cada push; la rama configurada como producción actualiza el sitio principal. Después de cambiar opciones del proyecto, generar un nuevo despliegue del commit que contiene esta entrega.

Para publicar esta carga no hacen falta una base de datos, variables de entorno ni instalar dependencias. Vercel sirve los archivos estáticos incluidos. `package.json` solo declara jsdom para las pruebas; `vercel.json` deja vacío el comando de instalación. Los scripts Python se ejecutan al actualizar datos, fuera del proceso de publicación del sitio.

## 3. Comprobar la versión publicada

**Panoramas** (vista inicial de cada sección):

- Hotelería abre en «Panorama por tipo»: elegir un tipo de alojamiento en la barra o tocando el mapa de categorías, el calendario o la brecha; cambiar el año; tocar un destino con ● en «Qué tipo de alojamiento tiene cada destino» y ver su demanda. Las lecturas de la Radiografía deben cambiar con el año.
- Conectividad aérea abre en «Panorama»: cambiar Todo / Cabotaje / Internacional, tocar una aerolínea (filtra la red) y una ruta (abre su detalle); quitar los filtros con la × de cada ficha. El año en curso se analiza contra los mismos meses del año anterior.
- Mercados internacionales abre en «Panorama»: cambiar entre extranjeros que entran y residentes que salen, tocar un mercado para ver su evolución y un año en cualquier gráfico.
- Turismo interno abre en «Panorama»: tocar una región del ranking para compararla con Córdoba.
- En cualquier panorama, «Ver gráfico ↓» desplaza la página hasta el gráfico, y «Copiar vista» guarda la selección hecha dentro del panorama.
- Los enlaces guardados antes de esta versión siguen abriendo el análisis que mostraban.

**Análisis detallado** (las vistas anteriores, con filtros):

- Entrar en Demanda hotelera y recorrer Demanda y posición, Estacionalidad, Ocupación por categoría y Eventos.
- Cambiar Territorio, agregar y quitar comparadores en Comparar con y cambiar el Período; comprobar que se actualicen los indicadores y gráficos.
- En Eventos, pulsar «Analizar este mes» en una tarjeta: la página baja a «Datos del mes» de ese evento.
- En Conectividad aérea, agregar aeropuertos en Comparar con (o «Principales aeropuertos del país») y cambiar el Período del análisis; comprobar que cambien indicadores, ranking, rutas, rutas regulares ganadas y perdidas, conectividad internacional, aerolíneas y estacionalidad aérea. Con lectura en índice, agregar «Argentina · total nacional (referencia)» y ver la comparación de Córdoba con el país.
- En Mercados internacionales, tener presente que el aeropuerto de Córdoba es un **paso**: receptivo son residentes en el exterior que entraron al país por él, vayan a donde vayan; emisivo, residentes en Argentina de cualquier provincia que salieron por él. Cambiar Sentido, comparadores y Período del análisis. La balanza (ingreso de divisas, gasto en el exterior, saldo) no depende del sentido elegido. Turistas, pernoctes y gasto total se suman; estadía media = suma de pernoctes ÷ suma de turistas; gasto por turista = suma de gasto total ÷ suma de turistas; gasto diario = suma de gasto total ÷ suma de pernoctes. Nunca se promedian promedios trimestrales, y si falta un trimestre del período el agregado queda sin dato (no se imputa).
- En Estacionalidad, cambiar Territorio, comparadores y Año de análisis. El índice de estacionalidad es la participación de los 3 meses con más pernoctaciones en el total anual, en %. Va de 25 % (los 12 meses iguales: sin estacionalidad) a 100 % (toda la actividad en 3 meses). Con un año incompleto, los indicadores dicen «Año incompleto».
- En Turismo interno (EVyTH), agregar y quitar regiones en Comparar con y cambiar el Período del análisis. El gasto de la EVyTH en pesos corrientes (gasto total y gasto medio por turista) no se grafica en la evolución: solo aparece en el KPI y en el ranking de un período, con la leyenda «Pesos corrientes del período; no comparable entre años». Al final de la sección está la tarjeta «Calidad turística · distinciones del SACT». Un enlace viejo con la sección Calidad turística abre Turismo interno.
- En Fuentes y metodología, comprobar una tarjeta por fuente con «Datos disponibles hasta», los informes municipales, el calendario de eventos y «Cómo leer el tablero».
- En tipologías municipales, comprobar que esté disponible el segundo trimestre de 2026 y las categorías de una a cinco estrellas, apart hoteles y hostels.
- Abrir una tabla y descargar un CSV con la selección actual.
- Verificar fuentes y fechas en el pie de los gráficos. La fecha del paquete no modifica la fecha de los datos.

Si aparece la versión anterior, revisar el commit del despliegue y la salida `site`. Si faltan gráficos, comprobar que se hayan subido todos los archivos de `site/data`, los modelos JavaScript y `site/vendor`.

## 4. Archivos incluidos

| Ruta | Uso |
|---|---|
| `site/` | Sitio publicable: HTML, estilos, JavaScript, datos JSON/JS y CSV, ECharts y su licencia |
| `config/` | Enlaces a las fuentes, transcripciones municipales verificadas, calendario de eventos y base del padrón de alojamiento (PUNA) |
| `site/demanda.html`, `site/aereo.html`, `site/mercados.html`, `site/interno.html` | Panoramas de Hotelería (por tipo de alojamiento), Conectividad aérea, Mercados internacionales y Turismo interno. El tablero los incrusta y les pasa sus datos; también se pueden abrir solos |
| `site/panorama.css` | Estilos compartidos de los panoramas |
| `scripts/` | Actualización, compilación de datos hoteleros y del padrón de alojamiento (`build_puna_data.py`) y creación del HTML autónomo |
| `tests/` | Comprobaciones de integridad y cálculos, y smoke de las cinco secciones y de los cuatro panoramas con jsdom (`tests/smoke.cjs`) |
| `package.json`, `package-lock.json` | jsdom (versión exacta) como dependencia de desarrollo; `npm test` corre las cuatro pruebas de JavaScript |
| `.github/workflows/actualizar-datos.yml` | «Verificación del tablero»: pruebas, `node --check` y smoke en cada push y pull request; no descarga ni publica datos |
| `offline/Tablero_turismo_Cordoba_completo.html` | Copia autónoma para abrir sin conexión, regenerada con esta versión; incluye los panoramas (cada uno lleva su copia de ECharts, por eso pesa unos 16 MB) |
| `DOCUMENTACION.md` | Cobertura, metodología, funcionamiento y actualización de fuentes |
| `VERSION.json` | Identificación de esta entrega y del código de origen |
| `SHA256SUMS.txt` | Huellas de integridad de los archivos del paquete |

## 5. Actualización de datos

El tablero contiene datos reales ya procesados. Publicarlo no lo conecta a una base en tiempo real. El portal datos.yvera.gob.ar ahora redirige a data-turismo.jefatura.gob.ar, protegido por Cloudflare con verificación humana: ningún script (ni GitHub Actions ni una PC) puede descargar esos archivos, solo un navegador; por eso la actualización ya no puede ser automática.

La actualización se hace a mano desde una PC con Python 3.10 o superior, en tres pasos:

1. **Verificar en el navegador.** Abrir en Chrome, Edge o Firefox cualquier enlace de `config/sources.json` (por ejemplo, el primero) y completar la verificación humana del portal.
2. **Bajar los 28 enlaces.** Abrir, en ese mismo navegador, cada `url` de las 28 entradas de turismo de `config/sources.json`, dejando que se guarden en la carpeta Descargas con el nombre que trae cada URL (por ejemplo, `viajeros-hospedados-residentes-y-no-residentes.csv`). Si un archivo se baja dos veces, el navegador lo guarda como «nombre (1).csv» y se toma el más reciente. El IPC no hace falta: se baja directo de apis.datos.gob.ar; si eso falla, guardar su enlace como `ipc.csv` en Descargas.
3. **Correr los dos comandos**, desde la raíz del proyecto:

```bash
python3 scripts/descargar_fuentes.py --desde-navegador ~/Downloads --output fuentes
```

```bash
python3 scripts/update_data.py --input-dir fuentes
```

El primero copia cada archivo a `fuentes/` con el nombre que espera el actualizador y termina con un resumen: copiadas, faltantes (con el nombre exacto que falta y su enlace) y el comando siguiente; si falta alguno, sale con error y no hay que seguir. El segundo valida, procesa y escribe `site/data/`.

Después, comprobar con Node.js 22.22.2 o superior (jsdom 30 lo requiere para el smoke) y commitear `site/data/`:

```bash
python3 -m unittest discover -s tests -v
```

```bash
npm ci && npm test
```

El workflow de GitHub Actions («Verificación del tablero») ya no descarga ni publica datos: en cada push y pull request corre las pruebas de Python, `node --check` y el smoke sobre los datos commiteados. Los nuevos informes municipales y eventos requieren revisar la fuente y añadir sus registros a los archivos de configuración; el detalle está en `DOCUMENTACION.md`.

Publicar los archivos de `site/data/` únicamente después de completar los controles. La base de aviación ronda los 270 MB: conviene bajarla con una buena conexión. La copia de `offline/` no se actualiza sola: para regenerarla, ejecutar:

```bash
python3 scripts/build_delivery.py --output offline/Tablero_turismo_Cordoba_completo.html
```

## Referencias de despliegue

- [Configuración de builds de Vercel](https://vercel.com/docs/builds/configure-a-build)
- [Configuración con vercel.json](https://vercel.com/docs/project-configuration/vercel-json)
- [Integración de Vercel con GitHub](https://vercel.com/docs/git/vercel-for-github)

Este paquete está preparado para la migración. Su entrega no modifica el repositorio institucional ni el despliegue de Vercel.

## 6. Cómo funcionan los panoramas

- Cada panorama es una página HTML propia (`site/*.html`) con su lógica y sus textos. Dentro del tablero se muestra en un marco que toma los datos ya cargados (`DASHBOARD_DATA`, `PUNA_DATA`, `HOTEL_DATA`), así que no se descargan dos veces. Abierta sola, la página carga `site/data/` por su cuenta.
- Las lecturas de la Radiografía se calculan en el navegador con los mismos datos de los gráficos. Las comparaciones se hacen siempre contra un período equivalente: el año anterior, los mismos meses o trimestres, 2019, Argentina u otra categoría o región. Cuando falta un período, el resultado queda «sin dato»: no se imputa.
- Los cruces entre fuentes de distinto universo (EVyTH × EOH, ETI × pasajeros aéreos, SACT × turistas) se presentan como órdenes de magnitud, con su advertencia en la página.
- La selección de cada panorama se guarda en el enlace del tablero (`alojView`, `aereoView`, `mercadosView`, `internoView`).
- `scripts/build_delivery.py` incrusta los cuatro panoramas en la copia autónoma (como `srcdoc` de sus marcos), con `panorama.css` y ECharts en línea.
