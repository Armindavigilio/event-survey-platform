
# Event Survey Platform

## Documento Maestro de Arquitectura y Decisiones de Diseño

**Estado:** Aprobado como documento rector inicial  
**Versión:** 1.0  
**Ámbito:** Arquitectura, organización del código, responsabilidades, dependencias, seguridad, resiliencia, UI, persistencia e integración tecnológica.

---

# 1. Propósito del documento

Este documento define las decisiones de arquitectura que deben regir la ejecución completa del proyecto.

Su objetivo es permitir que cualquier desarrollador que se incorpore al proyecto pueda comprender:

- qué problema resuelve el sistema;
- cuáles son sus capacidades;
- cómo se organiza el código;
- qué responsabilidades corresponden a cada capa o módulo;
- qué dependencias están permitidas y cuáles están prohibidas;
- cómo deben integrarse tecnologías como Next.js, Payload, Prisma, PostgreSQL, Tailwind o `localStorage`;
- cómo debe mantenerse la lógica de negocio independiente de la tecnología;
- cómo deben abordarse seguridad, resiliencia, pruebas y evolución futura.

Este documento tiene prioridad sobre decisiones improvisadas durante la implementación.

Si una decisión futura contradice este documento, deberá:

1. justificarse explícitamente;
2. registrarse mediante un ADR;
3. actualizar este documento si la nueva decisión pasa a ser normativa.

---

# 2. Visión del producto

El proyecto es una aplicación web pública orientada a eventos físicos.

El visitante accede principalmente mediante un código QR y puede:

1. visualizar información e imágenes relacionadas con el evento;
2. completar una encuesta;
3. enviar sus respuestas;
4. conservar temporalmente la respuesta si se pierde la conectividad;
5. sincronizarla posteriormente;
6. recibir una pantalla de agradecimiento;
7. permitir que otra persona utilice el mismo dispositivo para responder;
8. permitir posteriormente al organizador consultar o exportar los datos obtenidos.

El sistema debe ser:

- simple;
- mantenible;
- modular;
- tolerante a fallos de conectividad;
- seguro;
- accesible;
- evolutivo;
- desacoplado de tecnologías concretas.

---

# 3. Principio arquitectónico principal

La arquitectura se diseñará desde el problema y las responsabilidades del sistema, no desde la base de datos ni desde el framework.

La dirección conceptual será:

```text
Necesidad del sistema
        ↓
Capacidades
        ↓
Responsabilidades
        ↓
Casos de uso
        ↓
Reglas y contratos
        ↓
Puertos
        ↓
Adaptadores
        ↓
Tecnologías concretas
```

Por tanto:

```text
problema → modelo → casos de uso → infraestructura
```

y nunca:

```text
base de datos → aplicación
framework → lógica de negocio
CMS → modelo de dominio
```

---

# 4. Principios obligatorios

## 4.1. Separation of Concerns

Cada parte del sistema debe encargarse de una responsabilidad claramente identificable.

Se deberán separar, como mínimo:

- presentación;
- lógica de aplicación;
- reglas de dominio;
- acceso a datos;
- integración con CMS;
- almacenamiento local;
- seguridad;
- exportación;
- observabilidad;
- configuración.

---

## 4.2. Single Responsibility Principle

Cada módulo, clase, función, componente o archivo debe tener una razón principal para cambiar.

Ejemplos:

- `SurveyForm` no persiste datos;
- `route.ts` no contiene reglas de negocio;
- `PayloadSurveyDefinitionProvider` no renderiza UI;
- `SurveySubmissionRepository` no conoce React;
- `GalleryGrid` no conoce Payload;
- `domain` no conoce Prisma.

---

## 4.3. Dependency Inversion

La lógica de aplicación dependerá de abstracciones propias del sistema.

Las implementaciones tecnológicas dependerán de esas abstracciones.

Ejemplo:

```text
SubmitSurvey
    ↓
SurveySubmissionRepository
    ↑
PrismaSurveySubmissionRepository
```

La lógica de aplicación conoce el contrato.

La infraestructura conoce la implementación.

---

## 4.4. Explicit Dependencies

Las dependencias importantes deben ser visibles.

Se evitará:

- estado global implícito;
- acceso directo a infraestructura desde cualquier parte;
- importaciones tecnológicas ocultas;
- instanciaciones arbitrarias de servicios concretos;
- utilidades compartidas sin ownership claro.

---

## 4.5. Persistence Ignorance

El dominio no debe diseñarse en función de:

- PostgreSQL;
- Prisma;
- Payload;
- estructura de tablas;
- nombres de colecciones del CMS;
- detalles de serialización.

La persistencia será una consecuencia de los casos de uso.

---

## 4.6. Arquitectura evolutiva

El diseño debe permitir sustituir tecnología sin reescribir la lógica del negocio.

Prueba conceptual obligatoria:

> Si mañana eliminamos una tecnología, ¿qué parte del sistema debería cambiar?

Resultado esperado:

| Tecnología eliminada | Parte que debería cambiar |
|---|---|
| PostgreSQL | adaptador de persistencia |
| Prisma | adaptador de persistencia |
| Payload | adaptador CMS |
| `localStorage` | adaptador browser/offline |
| Tailwind | presentación / design system |
| Next.js | delivery, composition root y adaptadores HTTP |
| proveedor de imágenes | adaptador de contenido/medios |

El dominio y los casos de uso deben permanecer estables.

---

# 5. Estilo arquitectónico adoptado

Se adopta como base:

## Monolito modular

La aplicación se desplegará inicialmente como una sola unidad.

Internamente estará dividida por capacidades funcionales.

No se adoptan microservicios ni micro-frontends mientras no existan necesidades reales de:

- despliegue independiente;
- ownership independiente;
- escalado independiente;
- límites de negocio maduros;
- requisitos operativos diferentes.

---

## Organización feature-first / dominio primero

El código se organizará principalmente por capacidad y significado funcional.

Se evitará como estructura principal:

```text
controllers/
services/
repositories/
components/
hooks/
utils/
```

cuando esto disperse una misma funcionalidad entre múltiples carpetas.

La estructura deberá permitir localizar una capacidad completa desde un único punto conceptual.

---

# 6. Capacidades iniciales del sistema

## 6.1. Gallery

Responsabilidad:

> Presentar contenido visual asociado al evento.

Incluye:

- grid de imágenes;
- imágenes optimizadas;
- zoom o modal;
- textos alternativos;
- navegación accesible;
- posible contenido administrado desde CMS.

No debe asumir que el contenido proviene de Payload.

---

## 6.2. Survey

Responsabilidad:

> Presentar, validar, enviar y conservar de forma resiliente las respuestas de una encuesta.

Incluye:

- definición de encuesta;
- presentación de preguntas;
- selección de respuestas;
- validación;
- envío;
- generación de `submissionId`;
- protección contra duplicación técnica;
- control básico de abuso;
- persistencia offline;
- sincronización posterior;
- estado de encuesta completada;
- soporte para dispositivo compartido.

Es el módulo con mayor lógica funcional.

---

## 6.3. Reporting

Responsabilidad:

> Permitir la obtención de respuestas para análisis externo.

Puede incluir:

- CSV;
- XLSX;
- filtros;
- autorización del acceso;
- transformación de datos.

Se utiliza el término `reporting` en lugar de `export` porque describe mejor la capacidad funcional.

---

# 7. Flujo funcional principal

```text
QR
↓
Landing pública
↓
Consultar estado local
↓
┌──────────────────────┐
│ ¿Encuesta completada?│
└──────────┬───────────┘
           │
     ┌─────┴─────┐
     │           │
    Sí          No
     │           │
     ▼           ▼
Agradecimiento  Galería + Encuesta
                 │
                 ▼
            Completar respuestas
                 │
                 ▼
             Validación
                 │
                 ▼
        Generar submissionId
                 │
                 ▼
            Intentar envío
           ┌─────┴─────┐
           │           │
          OK         Sin red
           │           │
           ▼           ▼
     Confirmar      Guardar en cola
     servidor       pendiente local
           │           │
           └─────┬─────┘
                 ▼
          Agradecimiento
```

---

# 8. Estados de envío

No se utilizará un único booleano para representar todos los estados.

Se distinguirán conceptualmente:

```text
idle
pending
synced
```

## `idle`

El visitante aún no ha enviado la encuesta.

## `pending`

La encuesta fue completada, pero todavía no se confirmó su persistencia en servidor.

## `synced`

El servidor confirmó la recepción.

Visualmente `pending` y `synced` pueden mostrar una pantalla similar, pero internamente son estados distintos.

---

# 9. Gestión offline

## 9.1. Cola, no registro único

No se utilizará:

```text
pending_survey_sync
```

como único objeto.

Se utilizará una cola:

```text
pending_surveys[]
```

Motivo:

un dispositivo puede ser compartido por varias personas mientras no existe conectividad.

Cada respuesta pendiente deberá poder conservarse independientemente.

---

## 9.2. Estructura conceptual de un elemento pendiente

```json
{
  "submissionId": "uuid",
  "eventId": "evento-2026",
  "createdAt": "ISO-8601",
  "answers": {}
}
```

---

## 9.3. Sincronización

Al recuperarse la conectividad:

1. leer la cola;
2. procesar cada elemento;
3. enviar al servidor;
4. eliminar únicamente los elementos confirmados;
5. conservar aquellos que sigan fallando;
6. evitar duplicación mediante `submissionId`.

---

# 10. Idempotencia

Cada respuesta deberá tener un identificador único generado antes del envío.

Ejemplo:

```ts
crypto.randomUUID()
```

Campo conceptual:

```text
submissionId
```

Debe ser único en servidor.

Objetivo:

evitar duplicados cuando:

1. el servidor guarda correctamente;
2. la conexión se pierde antes de recibir la respuesta;
3. el cliente reintenta;
4. el mismo envío llega una segunda vez.

El servidor deberá tratar un reintento del mismo `submissionId` de forma idempotente.

---

# 11. Prevención de duplicados

El sistema no intentará garantizar una identidad personal absoluta.

El objetivo será:

- evitar duplicados accidentales;
- evitar duplicados técnicos;
- mitigar spam evidente.

Capas:

```text
1. Estado local del navegador
2. submissionId único
3. idempotencia en servidor
4. rate limiting
5. validación del servidor
6. restricciones de persistencia
```

La opción:

> “¿Es otra persona en este móvil?”

debe seguir siendo posible.

Por tanto, el sistema no puede considerar el dispositivo como identidad única de una persona.

---

# 12. Dependencias permitidas

Regla de dependencias:

```text
                app
                 │
                 ▼
           presentation
                 │
                 ▼
           application
            │         │
            ▼         ▼
          domain     ports
                      ▲
                      │
                  adapters
```

---

## 12.1. Domain

Puede depender de:

- TypeScript / JavaScript estándar;
- objetos y tipos internos puros.

No puede depender de:

- React;
- Next.js;
- Payload;
- Prisma;
- PostgreSQL;
- Tailwind;
- `localStorage`;
- `window`;
- `fetch`;
- APIs HTTP;
- librerías de UI.

---

## 12.2. Application

Puede depender de:

- domain;
- ports;
- tipos internos.

No puede depender directamente de:

- Prisma;
- PostgreSQL;
- Payload;
- NextRequest;
- NextResponse;
- React;
- `localStorage`.

---

## 12.3. Ports

Definen necesidades del sistema.

Ejemplos:

```ts
interface SurveySubmissionRepository
interface SurveyDefinitionProvider
interface GalleryProvider
interface RateLimiter
interface ReportExporter
```

Los puertos pertenecen al lenguaje del sistema, no al lenguaje de la tecnología.

---

## 12.4. Adapters

Implementan los puertos.

Pueden utilizar:

- Prisma;
- PostgreSQL;
- Payload;
- APIs del navegador;
- almacenamiento local;
- servicios externos;
- librerías de exportación.

---

## 12.5. Presentation

Puede depender de:

- application;
- domain cuando sea necesario;
- shared UI.

No debe depender directamente de:

- Prisma;
- PostgreSQL;
- estructuras internas de Payload.

---

## 12.6. App

`src/app` se considera:

- capa de entrega;
- routing;
- integración HTTP;
- composition root.

No es el lugar donde reside la lógica del negocio.

---

# 13. Papel de Next.js

Next.js es una tecnología de entrega y composición.

Responsabilidades:

- rutas;
- layout;
- páginas;
- endpoints HTTP;
- rendering;
- composición de módulos;
- configuración del runtime.

Next.js no define:

- entidades;
- reglas de encuesta;
- reglas de duplicación;
- semántica de respuestas;
- contratos del dominio.

Ejemplo correcto:

```text
POST /api/survey
↓
route.ts
↓
SubmitSurvey
↓
SurveySubmissionRepository
```

`route.ts` deberá limitarse principalmente a:

1. leer request;
2. convertirlo en input;
3. ejecutar un caso de uso;
4. traducir el resultado a HTTP.

---

# 14. Papel de Payload

Payload es una tecnología posible, no una dependencia del negocio.

Puede utilizarse para:

- información del evento;
- imágenes;
- textos;
- pies de foto;
- enlaces sociales;
- configuración de preguntas;
- configuración editorial.

No debe introducirse directamente en:

- domain;
- application;
- componentes de UI.

---

## 14.1. Payload como adaptador

Ejemplo:

```text
Payload
↓
PayloadSurveyDefinitionProvider
↓
SurveyDefinitionProvider
↓
GetActiveSurvey
```

La aplicación conoce:

```text
SurveyDefinitionProvider
```

No conoce:

```text
Payload
```

---

## 14.2. Anti-corruption layer

Los documentos de Payload no se propagarán por el sistema.

Se utilizarán mappers:

```text
Payload document
↓
Mapper
↓
Modelo interno
```

Ejemplo:

```text
PayloadGalleryDocument
↓
PayloadGalleryMapper
↓
GalleryImage
```

---

# 15. Papel de Prisma y PostgreSQL

No forman parte del núcleo de negocio.

Su introducción se decidirá cuando estén definidos:

- necesidades de persistencia;
- invariantes;
- consultas necesarias;
- volumen;
- requisitos operativos.

Si se utilizan:

```text
SurveySubmissionRepository
↑
PrismaSurveySubmissionRepository
↓
Prisma
↓
PostgreSQL
```

Prisma debe permanecer confinado a infraestructura.

---

# 16. CMS y datos transaccionales

Debe mantenerse una separación conceptual entre:

## Contenido editorial

Ejemplos:

- nombre del evento;
- introducción;
- imágenes;
- textos;
- redes sociales;
- preguntas configurables.

Puede ser gestionado mediante CMS.

---

## Datos transaccionales

Ejemplos:

- envío de encuesta;
- `submissionId`;
- respuestas;
- timestamp;
- estado de procesamiento;
- auditoría mínima.

Aunque una misma tecnología pudiera almacenar ambos tipos, no se considerarán el mismo dominio.

---

# 17. Estructura física inicial

```text
src/
│
├── app/
│   ├── api/
│   │   ├── survey/
│   │   │   └── route.ts
│   │   └── reporting/
│   │       └── route.ts
│   │
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
│
├── modules/
│   │
│   ├── gallery/
│   │   ├── application/
│   │   ├── ports/
│   │   ├── adapters/
│   │   ├── presentation/
│   │   └── index.ts
│   │
│   ├── survey/
│   │   ├── domain/
│   │   ├── application/
│   │   ├── ports/
│   │   ├── adapters/
│   │   ├── presentation/
│   │   └── index.ts
│   │
│   └── reporting/
│       ├── application/
│       ├── ports/
│       ├── adapters/
│       └── index.ts
│
├── shared/
│   ├── ui/
│   ├── config/
│   └── observability/
│
└── styles/
    ├── tokens.css
    └── base.css
```

---

# 18. Regla contra carpetas ceremoniales

La estructura anterior es una guía de límites, no una obligación de crear carpetas vacías.

Si una capacidad es simple, deberá mantenerse simple.

Ejemplo:

```text
gallery/
├── presentation/
├── gallery.config.ts
└── index.ts
```

es preferible a crear artificialmente:

```text
gallery/domain/
gallery/application/
gallery/ports/
gallery/adapters/
```

sin necesidad real.

La arquitectura debe reducir complejidad, no fabricarla.

---

# 19. API pública de módulos

Cada módulo debe exponer únicamente aquello que otros módulos necesiten.

Se utilizará:

```text
index.ts
```

como API pública del módulo cuando sea conveniente.

Se evitarán imports internos como:

```ts
import x from "@/modules/survey/adapters/persistence/internal/file";
```

desde módulos externos.

Objetivo:

- encapsulación;
- menor acoplamiento;
- posibilidad de reorganización interna.

---

# 20. Shared

`shared`, `common`, `utils` o `lib` no deben convertirse en cajones de sastre.

Solo deben contener elementos genuinamente transversales.

Ejemplos válidos:

```text
shared/ui
shared/config
shared/observability
```

Ejemplos que NO deberían vivir allí:

```text
PrismaSurveyRepository
SurveySubmissionMapper
PayloadGalleryAdapter
```

Estos pertenecen a sus respectivos módulos.

---

# 21. TypeScript

El proyecto utilizará TypeScript desde el inicio.

Extensiones principales:

```text
.ts
.tsx
```

Motivos:

- contratos explícitos;
- tipos compartidos;
- reducción de errores;
- APIs de módulo más claras;
- mejor soporte para refactorización;
- mejor verificación de límites.

TypeScript no sustituye la arquitectura, pero permite hacer parte de los contratos verificables.

---

# 22. CSS y sistema visual

## 22.1. `globals.css`

`src/app/globals.css` será únicamente el punto de entrada global del CSS.

No se utilizará como archivo acumulador de estilos de todos los componentes.

Responsabilidades:

- importar Tailwind;
- importar tokens;
- importar estilos base;
- reglas globales verdaderamente globales.

Ejemplo conceptual:

```css
@import "tailwindcss";
@import "../styles/tokens.css";
@import "../styles/base.css";
```

---

## 22.2. `tokens.css`

Responsabilidad:

- color;
- tipografía;
- spacing;
- radios;
- sombras;
- estados;
- otros design tokens.

Ejemplo:

```css
:root {
  --color-background: ...;
  --color-surface: ...;
  --color-text: ...;

  --radius-sm: ...;
  --radius-md: ...;

  --space-1: ...;
  --space-2: ...;
}
```

---

## 22.3. `base.css`

Responsabilidad:

- normalización;
- `box-sizing`;
- estilos de `html` y `body`;
- tipografía base;
- focus visible;
- reduced motion;
- reglas HTML transversales.

No debe contener reglas específicas de:

- SurveyForm;
- GalleryGrid;
- OptionCard;
- ThankYouCard;
- modal.

---

## 22.4. Estilos específicos

Cuando un componente necesite CSS específico:

```text
OptionCard/
├── OptionCard.tsx
└── OptionCard.module.css
```

o mediante utilidades Tailwind junto al componente.

---

# 23. Design System

Aunque el proyecto sea pequeño, debe existir una base visual coherente.

Se utilizarán design tokens para evitar valores arbitrarios repetidos.

El sistema visual deberá contemplar:

- tipografía;
- colores;
- espaciado;
- radios;
- sombras;
- estados interactivos;
- estados de error;
- estados de loading;
- focus;
- feedback visual.

La arquitectura del design system no se confundirá con la arquitectura de negocio.

---

# 24. Accesibilidad

La accesibilidad es requisito de diseño.

Como mínimo se deberá considerar:

- navegación por teclado;
- focus visible;
- etiquetas correctas;
- textos alternativos;
- contraste suficiente;
- semántica HTML;
- modal accesible;
- cierre con teclado;
- estados de error anunciables;
- reduced motion;
- tamaño adecuado de áreas táctiles.

Referencia mínima de conformidad:

```text
WCAG 2.2
```

---

# 25. Galería

La UI no debe conocer el origen de los datos.

No:

```tsx
<GalleryGrid images={payload.docs} />
```

Sí:

```tsx
<GalleryGrid images={galleryImages} />
```

donde:

```ts
type GalleryImage = {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
};
```

Un adapter se encargará de convertir cualquier fuente externa a este modelo.

---

# 26. Optimización de imágenes

Objetivos iniciales:

- WebP y/o AVIF;
- tamaños adecuados al dispositivo;
- lazy loading cuando proceda;
- dimensiones conocidas para evitar layout shift;
- peso reducido;
- generación de thumbnails si es necesario;
- modal con imagen de mayor resolución solo al solicitarla.

El objetivo de `<100 KB` por imagen se mantendrá como referencia, no como regla absoluta si perjudica perceptiblemente la calidad.

---

# 27. Survey UI

Componentes conceptuales posibles:

```text
SurveyForm
SurveyQuestion
OptionCard
SurveyProgress
ThankYouCard
```

Las responsabilidades de presentación deberán estar separadas de:

- persistencia;
- validación de servidor;
- acceso a CMS;
- base de datos.

---

# 28. Validación

La validación ocurrirá en varios niveles.

## Cliente

Objetivo:

- feedback inmediato;
- mejor UX.

## Servidor

Objetivo:

- garantía real de integridad.

La validación del cliente nunca sustituye la validación del servidor.

Zod puede utilizarse para contratos y validación, siempre evitando que una dependencia concreta de validación contamine innecesariamente el dominio.

---

# 29. Seguridad

La seguridad se considera parte del diseño, no una fase final.

Aspectos mínimos:

- validación de entrada;
- normalización;
- rate limiting;
- control de acceso a reporting;
- HTTPS;
- protección de secretos;
- reducción de datos personales;
- logs seguros;
- protección frente a abuso;
- dependencias auditadas.

---

# 30. IP y privacidad

Si se utiliza IP para mitigación de abuso:

- evitar almacenarla en texto plano salvo necesidad justificada;
- preferir hash o mecanismo equivalente;
- documentar finalidad;
- establecer periodo de retención;
- minimizar datos.

No se utilizará la IP como identidad personal inequívoca.

---

# 31. Reporting y autorización

El endpoint de reporting no debe quedar públicamente accesible.

No se considera ideal un secreto permanente en query string:

```text
/api/reporting?token=...
```

porque puede filtrarse mediante:

- historial;
- logs;
- analytics;
- capturas;
- referrers.

Si inicialmente se utiliza por simplicidad, deberá:

- ser suficientemente aleatorio;
- vivir en variables de entorno;
- no estar embebido en frontend;
- tener posibilidad de rotación.

La autorización pertenece al borde HTTP, no al servicio que genera CSV/XLSX.

---

# 32. Separación entre autorización y exportación

Ejemplo conceptual:

```text
HTTP Request
↓
Authorization
↓
GetSurveyReport
↓
ReportExporter
↓
CSV / XLSX
```

El generador de Excel no debe decidir quién tiene permiso.

---

# 33. Observabilidad

Aunque el proyecto sea pequeño, se deberá evitar:

```text
console.log(...)
```

como estrategia operativa.

Se deberán distinguir:

- logs de aplicación;
- logs de seguridad;
- errores;
- métricas;
- eventos relevantes.

Ejemplos:

```text
survey.submission.accepted
survey.submission.duplicate
survey.submission.validation_failed
survey.sync.failed
report.exported
rate_limit.triggered
```

---

# 34. Testing

Se deberá priorizar:

## Unit tests

Para:

- reglas de dominio;
- casos de uso;
- mappers;
- validadores.

## Integration tests

Para:

- adaptadores de persistencia;
- Payload;
- Prisma;
- endpoints.

## Functional / E2E tests

Para:

- recorrido QR → formulario → envío;
- comportamiento offline;
- reintento;
- dispositivo compartido;
- reporting autorizado.

---

# 35. In-memory adapters

Los puertos importantes deberían poder tener implementaciones de prueba.

Ejemplo:

```text
SurveySubmissionRepository
↑
InMemorySurveySubmissionRepository
```

Esto permitirá probar casos de uso sin levantar PostgreSQL.

---

# 36. Composition Root

La unión entre abstracciones e implementaciones se realizará en el borde de la aplicación.

Ejemplo conceptual:

```text
SurveySubmissionRepository
=
PrismaSurveySubmissionRepository
```

Este wiring no deberá dispersarse por todo el proyecto.

---

# 37. Convenciones de naming

Se preferirá naming basado en intención.

Sí:

```text
SubmitSurvey
GetActiveSurvey
SurveySubmission
SurveyDefinitionProvider
SurveySubmissionRepository
PayloadGalleryProvider
```

Evitar nombres vagos:

```text
utils
helpers
manager
service2
dataHandler
misc
```

cuando exista un concepto funcional más preciso.

---

# 38. Casos de uso antes que tablas

Antes de modelar la base de datos se deberán definir:

1. actores;
2. capacidades;
3. casos de uso;
4. entradas;
5. salidas;
6. invariantes;
7. errores;
8. necesidades de persistencia;
9. consultas necesarias.

Solo entonces:

10. modelo de datos;
11. tecnología de persistencia;
12. schema técnico.

---

# 39. Orden de implementación recomendado

```text
1. Propósito y alcance
2. Actores
3. Capacidades
4. Casos de uso
5. Responsabilidades
6. Reglas de dominio
7. Puertos
8. Contratos
9. Estructura de módulos
10. UI base y design tokens
11. Adaptadores iniciales
12. Persistencia
13. Modelo de datos
14. API HTTP
15. Offline queue
16. Idempotencia
17. Reporting
18. Seguridad adicional
19. Testing
20. Observabilidad
21. CI/CD
22. Despliegue
```

---

# 40. Decisiones todavía NO cerradas

Las siguientes decisiones no deben asumirse como definitivas hasta ser evaluadas:

- uso final de Payload;
- uso final de Prisma;
- proveedor PostgreSQL;
- hosting;
- estrategia exacta de reporting;
- sistema definitivo de autenticación del área privada;
- proveedor de almacenamiento de imágenes;
- estrategia de observabilidad;
- plataforma de CI/CD.

Cada una debe resolverse después de definir el requisito correspondiente.

---

# 41. Architecture Decision Records

Se mantendrá:

```text
docs/
└── architecture/
    └── decisions/
```

ADRs iniciales:

```text
ADR-001-modular-monolith.md
ADR-002-domain-independent-of-framework.md
ADR-003-ports-and-adapters.md
ADR-004-feature-first-organization.md
ADR-005-offline-queue.md
ADR-006-idempotent-submissions.md
ADR-007-design-system-and-css-boundaries.md
ADR-008-cms-as-adapter.md
```

---

# 42. Regla para modificar una decisión

Una decisión arquitectónica relevante debe registrar:

```text
Context
Decision
Consequences
Alternatives considered
Status
Date
```

Estados recomendados:

```text
Proposed
Accepted
Deprecated
Superseded
```

---

# 43. Reglas automáticas de arquitectura

Siempre que sea viable, las reglas deberán comprobarse automáticamente.

Ejemplos:

```text
modules/*/domain
    ❌ next/*
    ❌ react
    ❌ payload
    ❌ @prisma/*
```

```text
modules/*/application
    ❌ next/server
    ❌ payload
    ❌ @prisma/*
```

```text
modules/*/adapters
    ✅ infraestructura
```

Pueden utilizarse:

- ESLint;
- import rules;
- dependency-cruiser;
- tests de arquitectura.

---

# 44. Criterio de calidad arquitectónica

No se evaluará la arquitectura por:

- cantidad de carpetas;
- cantidad de interfaces;
- número de patrones;
- complejidad aparente.

Se evaluará por:

- claridad de responsabilidades;
- bajo acoplamiento;
- alta cohesión;
- facilidad de prueba;
- facilidad de sustitución tecnológica;
- facilidad de localizar código;
- seguridad;
- mantenibilidad;
- trazabilidad de decisiones.

---

# 45. Regla YAGNI

No se añadirá infraestructura anticipada sin necesidad real.

Ejemplos:

- no introducir microservicios prematuramente;
- no crear colas distribuidas sin necesidad;
- no crear abstracciones vacías;
- no introducir DDD ceremonial;
- no crear carpetas sin contenido conceptual;
- no incorporar tecnologías únicamente por moda.

---

# 46. Regla DRY con cautela

Se evitará duplicar lógica conceptual.

Sin embargo:

> duplicación pequeña es preferible a una abstracción incorrecta.

No se unificarán dos conceptos únicamente porque casualmente tengan la misma implementación.

---

# 47. Definition of Done arquitectónica

Una feature no estará terminada únicamente porque funcione.

Debe verificarse:

- responsabilidad correcta;
- módulo correcto;
- dependencia correcta;
- validación;
- errores;
- accesibilidad cuando aplique;
- seguridad cuando aplique;
- tests adecuados;
- logs si procede;
- documentación si introduce una decisión;
- ausencia de dependencia tecnológica indebida.

---

# 48. Criterios para extraer un módulo en el futuro

Un módulo solo deberá considerarse para extracción a servicio independiente si aparecen necesidades como:

- ownership independiente;
- despliegue independiente;
- escalado independiente;
- ciclo de release diferente;
- aislamiento de fallos;
- límites de negocio maduros;
- seguridad diferenciada;
- justificación operativa.

La extracción no se realizará por moda.

---

# 49. Ejemplo de sustitución tecnológica

Arquitectura inicial:

```text
GetActiveSurvey
↓
SurveyDefinitionProvider
↑
PayloadSurveyDefinitionProvider
```

Cambio futuro:

```text
GetActiveSurvey
↓
SurveyDefinitionProvider
↑
StaticSurveyDefinitionProvider
```

El caso de uso no cambia.

---

# 50. Ejemplo de sustitución de persistencia

Inicial:

```text
SubmitSurvey
↓
SurveySubmissionRepository
↑
PrismaSurveySubmissionRepository
↓
PostgreSQL
```

Futuro:

```text
SubmitSurvey
↓
SurveySubmissionRepository
↑
OtroRepository
↓
Otra tecnología
```

La lógica de `SubmitSurvey` debe permanecer sin cambios.

---

# 51. Principio rector final

La arquitectura del proyecto se resume en:

```text
Dominio
↓
Casos de uso
↓
Puertos
↓
Adaptadores
↓
Tecnología
```

Las tecnologías son reemplazables.

Las reglas del sistema no deben serlo.

---

# 52. Fuentes y referencias rectoras

Este documento toma como base conceptual:

1. **Steve Smith — Architecting Modern Web Applications with ASP.NET Core and Microsoft Azure**
   - Separation of Concerns
   - Encapsulation
   - Dependency Inversion
   - Explicit Dependencies
   - Single Responsibility
   - DRY
   - Persistence Ignorance
   - Clean Architecture
   - organización por features
   - separación entre UI, application core e infrastructure

2. **Arquitectura web senior con SSD y ADN DevSecOps**
   - monolito modular por dominio;
   - ports and adapters;
   - vertical slices;
   - design system separado del dominio;
   - contratos explícitos;
   - gobierno de dependencias;
   - ADRs;
   - seguridad desde diseño;
   - observabilidad;
   - evolución tecnológica controlada.

3. Principios acordados específicamente para este proyecto durante su diseño:
   - offline queue;
   - `submissionId`;
   - idempotencia;
   - separación CMS / datos transaccionales;
   - Payload como adaptador;
   - Prisma/PostgreSQL como infraestructura;
   - `globals.css` limitado a responsabilidades globales;
   - design tokens;
   - TypeScript;
   - composición centralizada;
   - feature-first;
   - protección de la lógica de negocio frente a cambios tecnológicos.

---

# 53. Nota para futuros desarrolladores

Antes de añadir una nueva dependencia, librería, carpeta, servicio o integración, responder:

1. ¿Qué responsabilidad resuelve?
2. ¿A qué módulo pertenece?
3. ¿Es dominio, aplicación, presentación o infraestructura?
4. ¿Qué contrato necesita?
5. ¿La tecnología está entrando donde no debería?
6. ¿Podría sustituirse sin modificar el negocio?
7. ¿Estamos creando una abstracción útil o solo ceremonial?
8. ¿La decisión necesita un ADR?
9. ¿Puede verificarse automáticamente?
10. ¿Está documentada?

Si estas preguntas no tienen una respuesta clara, la implementación debe detenerse hasta aclarar el diseño.

---

# Fin del documento maestro
