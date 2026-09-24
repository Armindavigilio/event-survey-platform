# ADR-009 — Contratos del ciclo de encuesta

## Estado
Accepted

## Fecha
2026-09-25

## Contexto
La revisión de los cinco casos de uso reveló dos huecos: Start/Submit aceptaban
una disponibilidad OPEN previamente calculada, y Accept rechazaba después del
cierre los reintentos de respuestas que ya estaban guardadas. Esto podía impedir
recuperar una confirmación perdida, contrariando la idempotencia del documento maestro.

## Decisión
Recalcular disponibilidad en Start/Submit a partir de SurveySchedule y un `now`
aportado en cada ejecución. El origen y actualización de ese tiempo pertenece a
composición; en servidor nunca procede del cuerpo de la solicitud.
Añadir `findById` al repositorio para reconocer aceptaciones previas antes del
control temporal de una inserción nueva. Mantener `saveIfAbsent` atómico para
resolver concurrencia, comparando también su registro existente.
Exponer casos de uso, inputs/results y modelos necesarios mediante exports explícitos.
Los constructores de identificadores y tipos de dependencias son contratos de entrada
públicos; los puertos, errores internos, helpers y adaptadores no se reexportan.
Las pruebas importan internos solo para fixtures y dobles, sin ampliar la API.
Los tipos de dependencias conservan referencias estructurales a puertos: esta decisión
restringe exports directos, no crea una fachada opaca ni una frontera de seguridad.

## Consecuencias
Un reintento idéntico puede confirmar una aceptación anterior tras el cierre;
un ID nuevo continúa rechazándose. Se conserva acceptedAt original.
Los futuros adaptadores deberán implementar consulta e inserción atómica y
los consumidores deberán aportar tiempo actual en lugar de availability.
La política temporal offline requiere aún integración; sin evidencia confiable,
el servidor no puede demostrar finalización previa al cierre durante SYNC_ONLY.
Las pruebas en memoria validan contratos, no la durabilidad o atomicidad de una
base de datos todavía no seleccionada.

## Alternativas consideradas
- Mantener un OPEN cacheado: permite finalizar borradores después del cierre.
- Rechazar todos los reintentos tras el cierre: deja confirmaciones perdidas sin recuperación.
- Consultar y luego insertar sin operación atómica: permite duplicados concurrentes.
- Introducir ahora un reloj global o mecanismo de prueba offline: anticipa decisiones
  de infraestructura; se documentan sus límites en vez de fingir garantías.

## Referencias
- ../MASTER_ARCHITECTURE.md, secciones 10, 18, 19 y 43.
- ../../modules/survey/SURVEY_TECHNICAL_SPEC.md, secciones 33 y 34.
