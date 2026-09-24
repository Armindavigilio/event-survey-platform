# Galería del evento

Las imágenes se versionan en `public/images/gallery/` y se sirven desde el despliegue de la web.
Para añadir imágenes, registrar cada archivo en `src/modules/gallery/gallery.config.ts`
con un identificador único, ruta pública, texto alternativo descriptivo y dimensiones reales.
La previsión inicial es de unas diez imágenes; no se duplican archivos para llenar la cuadrícula.

La página compone el título y el módulo usando su API pública. La presentación recibe
modelos propios y encapsula Yet Another React Lightbox y su plugin Zoom en GalleryLightbox.
El visor se carga al abrir una imagen. Con una sola imagen se ocultan las flechas;
con varias permite navegación. Las animaciones están desactivadas para evitar movimiento.
Los originales se usan para zoom y Next Image sirve vistas previas optimizadas.

Verificación manual: abrir con Enter, ampliar/reducir, cerrar con Escape, comprobar retorno
del foco, probar gestos en móvil y navegación al añadir una segunda imagen real.
La encuesta se incorporará posteriormente debajo de la galería.
