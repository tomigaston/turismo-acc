# Turismo Córdoba · Paquete para GitHub y Vercel

Entrega del 2 de noviembre de 2026. Contiene la misma versión y los mismos datos del HTML completo entregado: 28 recursos estadísticos oficiales, seis informes municipales y cuatro eventos documentados. Incluye Apache ECharts 6.0.0 y los filtros, tablas y exportaciones del tablero. Los bloques de notas interpretativas ya están retirados.

## 1. Subir al GitHub existente

1. Descomprimir `Turismo_Cordoba_GitHub_Vercel_2026-11-02.zip`.
2. Abrir la carpeta `turismo-acc-vercel-2026-11-02`.
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

Para publicar esta carga no hacen falta una base de datos, variables de entorno ni instalar dependencias. Vercel sirve los archivos estáticos incluidos. Los scripts Python se ejecutan al actualizar datos, fuera del proceso de publicación del sitio.

## 3. Comprobar la versión publicada

- Entrar en Demanda hotelera y recorrer Demanda y posición, Estacionalidad, Tipologías y estrellas y Eventos.
- Cambiar territorio, período y comparadores; comprobar que se actualicen los indicadores y gráficos.
- En tipologías municipales, comprobar que esté disponible el segundo trimestre de 2026 y las categorías de una a cinco estrellas, apart hoteles y hostels.
- Abrir una tabla y descargar un CSV con la selección actual.
- Verificar fuentes y fechas en el pie de los gráficos. La fecha del paquete no modifica la fecha de los datos.

Si aparece la versión anterior, revisar el commit del despliegue y la salida `site`. Si faltan gráficos, comprobar que se hayan subido todos los archivos de `site/data`, los modelos JavaScript y `site/vendor`.

## 4. Archivos incluidos

| Ruta | Uso |
|---|---|
| `site/` | Sitio publicable: HTML, estilos, JavaScript, datos JSON/JS y CSV, ECharts y su licencia |
| `config/` | Enlaces a las fuentes, transcripciones municipales verificadas y calendario de eventos |
| `scripts/` | Actualización, compilación de datos hoteleros y creación del HTML autónomo |
| `tests/` | Comprobaciones de integridad y cálculos |
| `.github/workflows/actualizar-datos.yml` | Actualizador de datos para GitHub Actions |
| `offline/Tablero_turismo_Cordoba_completo.html` | Copia autónoma para abrir sin conexión, idéntica a la entrega anterior |
| `DOCUMENTACION.md` | Cobertura, metodología, funcionamiento y actualización de fuentes |
| `VERSION.json` | Identificación de esta entrega y del código de origen |
| `SHA256SUMS.txt` | Huellas de integridad de los archivos del paquete |

## 5. Actualización de datos

El tablero contiene datos reales ya procesados. Publicarlo no lo conecta a una base en tiempo real. La actualización requiere ejecutar el proceso de descarga y validación y publicar sus resultados.

El workflow incluido puede ejecutarse manualmente en GitHub Actions, por cambios de scripts/configuración en `main` y los lunes a las 06:00 de Córdoba. **La primera incorporación del workflow y la configuración a `main` puede iniciar una actualización**, si Actions está habilitado. Necesita permiso de escritura sobre el repositorio; las reglas de protección de ramas pueden impedir el commit automático. Revisar primero el resultado de una ejecución manual y luego el despliegue correspondiente en Vercel. Descargar este ZIP no activa ni ejecuta ese proceso.

Las series oficiales se descargan desde los enlaces de `config/sources.json`. Los nuevos informes municipales y eventos requieren revisar la fuente y añadir sus registros a los archivos de configuración; el actualizador no transcribe nuevos PDF ni descubre eventos por sí solo. El detalle está en `DOCUMENTACION.md`.

Para actualizar manualmente, desde la raíz del proyecto, con Python 3.10 o superior y Node.js 20 o superior:

```bash
python3 scripts/update_data.py
python3 -m unittest discover -s tests -v
node tests/test_model.cjs
node tests/test_hotel.cjs
```

Publicar los archivos de `site/data/` únicamente después de completar los controles. La descarga original de aviación puede rondar los 270 MB; esa tarea no se ejecuta en el navegador del visitante. La copia de `offline/` no se actualiza sola: para regenerarla, ejecutar:

```bash
python3 scripts/build_delivery.py --output offline/Tablero_turismo_Cordoba_completo.html
```

## Referencias de despliegue

- [Configuración de builds de Vercel](https://vercel.com/docs/builds/configure-a-build)
- [Configuración con vercel.json](https://vercel.com/docs/project-configuration/vercel-json)
- [Integración de Vercel con GitHub](https://vercel.com/docs/git/vercel-for-github)

Este paquete está preparado para la migración. Su entrega no modifica el repositorio institucional ni el despliegue de Vercel.
