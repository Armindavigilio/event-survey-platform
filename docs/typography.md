# Tipografía

Poppins es la tipografía de contenido: título, galería, explicaciones, navegación
y controles del futuro cuestionario. Satoshi se reserva al nombre OnlyCode en
el copyright y el crédito del footer.

La carga de fuentes corresponde a `src/app/layout.tsx` mediante next/font.
Poppins se descarga durante la compilación y se sirve desde el propio despliegue.
Satoshi se conserva localmente, sin modificar, junto con la licencia oficial FFL
obtenida de https://www.fontshare.com/fonts/satoshi.

`src/styles/tokens.css` define los roles `--font-content` y `--font-brand`.
`src/styles/base.css` establece la herencia del documento y controles de formulario.
Los componentes usan roles semánticos; la galería no decide qué fuente cargar.
`globals.css` se limita a importaciones e integración con Tailwind.

Los textos dentro de Cartel_evento.webp son píxeles: este cambio afecta al texto
HTML de la web, no modifica la imagen original.
