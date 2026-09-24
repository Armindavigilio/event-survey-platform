# ADR-010 — Encuesta temporal con Google Forms

## Estado
Accepted — excepción temporal solicitada por el responsable del proyecto.

## Fecha
2026-09-25

## Contexto
El plazo del evento exige publicar una encuesta antes de completar el módulo
propio. Se preserva el trabajo original en el commit `e66caa8`, anterior al embed.
La solución temporal no sustituye la arquitectura objetivo del documento maestro.

## Decisión
Incrustar el formulario facilitado por el responsable mediante un iframe en
`src/app/_components/TemporarySurveyEmbed`, compuesto por la página después de
la galería. El componente pertenece a entrega y no se exporta desde survey.
La URL pública del formulario está centralizada en ese componente.
No se añaden dependencias, puertos ni adaptadores ficticios al módulo original.

## Consecuencias
Las respuestas se envían a Google Forms. La vinculación con Google Sheets debe
realizarse y verificarse desde la configuración de respuestas de Google Forms;
no está implementada ni verificada por el iframe.
La validación, agradecimiento, disponibilidad y almacenamiento pertenecen a Google.
El flujo temporal no ofrece las garantías del núcleo propio de survey: cola offline,
idempotencia por submissionId, horarios propios o sincronización local.
Las fuentes y estilos del sitio solo afectan al contenedor; el documento externo
conserva el diseño configurado en Google Forms.
La altura inicial de 3271 px procede del embed proporcionado. El ancho es adaptable;
se conserva el desplazamiento interno del navegador y un enlace externo visible.
No se puede medir ni cambiar automáticamente el contenido de otro origen desde la web.

## Alternativas consideradas
- Terminar primero el formulario propio: incompatible con el plazo comunicado.
- Mostrar solo un enlace: no cumple la solicitud de responder dentro de la página.

## Retirada
Eliminar el import y el uso de TemporarySurveyEmbed en page.tsx y retirar su carpeta.
Integrar después la presentación del módulo survey mediante su API pública.
No revertir el repositorio completo: conservar el desarrollo posterior que corresponda.
Marcar este ADR como Superseded cuando el formulario propio esté operativo.

## Verificación antes de publicar
Comprobar apertura sin sesión, preguntas y envío desde móvil con una respuesta de
prueba autorizada, y confirmar que aparece en la hoja vinculada. No se han enviado
respuestas de prueba ni se ha verificado la configuración privada del formulario.
