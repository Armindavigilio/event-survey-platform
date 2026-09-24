# ADR-002 — Dirección de dependencias y Ports & Adapters

## Estado

Accepted

## Fecha

2026-09-24

## Contexto

El `MASTER_ARCHITECTURE.md` establece que Event Survey Platform debe proteger la lógica de negocio frente a cambios de framework, CMS, persistencia, almacenamiento del navegador y otras tecnologías de infraestructura.

La arquitectura debe permitir que decisiones tecnológicas como Next.js, Payload, Prisma, PostgreSQL, Tailwind CSS o `localStorage` puedan evolucionar sin obligar a reescribir las reglas del sistema.

Para conseguirlo no basta con organizar el repositorio por carpetas. Es necesario definir de forma explícita:

- la dirección permitida de las dependencias;
- dónde se expresan las reglas del dominio;
- dónde se orquestan los casos de uso;
- dónde se definen los contratos que la aplicación necesita;
- dónde viven las implementaciones tecnológicas;
- cómo se conectan las implementaciones con el núcleo;
- qué dependencias están prohibidas.

Esta decisión formaliza las reglas ya establecidas en el documento maestro. No introduce un cambio de arquitectura. Cualquier modificación futura de estas reglas deberá estar justificada y registrarse mediante la actualización o sustitución de este ADR y, cuando corresponda, del documento maestro.

## Decisión

Event Survey Platform aplicará **Dependency Inversion** y **Ports & Adapters** en aquellas capacidades donde exista una frontera significativa entre lógica propia de la aplicación y tecnología externa.

La dirección conceptual de dependencias será:

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

La regla fundamental es:

> La lógica interna define lo que necesita; la infraestructura implementa esas necesidades.

Las tecnologías externas no definirán el modelo ni los casos de uso del sistema.

---

## 1. Domain

`domain` contiene conceptos y reglas propias del problema que resuelve el módulo.

Puede contener, cuando sean necesarios:

- entidades;
- value objects;
- invariantes;
- reglas de dominio;
- servicios de dominio puros;
- errores de dominio;
- tipos propios del dominio.

### Dependencias permitidas

El dominio puede depender únicamente de:

- JavaScript / TypeScript estándar;
- tipos y conceptos internos que pertenezcan al propio dominio.

### Dependencias prohibidas

El dominio no deberá depender de:

- Next.js;
- React;
- Payload;
- Prisma;
- PostgreSQL ni clientes de base de datos;
- Tailwind CSS;
- `fetch`;
- `window`;
- `localStorage`;
- objetos HTTP;
- SDKs externos;
- librerías cuya finalidad sea resolver infraestructura.

Ejemplos prohibidos:

```text
domain → Prisma
domain → Payload
domain → Next.js
domain → React
```

El dominio debe permanecer independiente del mecanismo utilizado para almacenarlo, mostrarlo o transportarlo.

---

## 2. Application

`application` contiene los casos de uso y la orquestación del comportamiento del sistema.

Ejemplos conceptuales:

```text
SubmitSurvey
GetActiveSurvey
GetSurveyReport
```

La capa de aplicación decide **qué debe ocurrir** para completar un caso de uso, pero no debe conocer los detalles concretos de infraestructura mediante los cuales se realiza.

### Dependencias permitidas

`application` puede depender de:

- `domain`;
- `ports`;
- tipos internos de entrada y salida;
- lógica de aplicación independiente de infraestructura.

### Dependencias prohibidas

`application` no deberá depender directamente de:

- Prisma;
- Payload;
- clientes PostgreSQL;
- `NextRequest`;
- `NextResponse`;
- React;
- `localStorage`;
- implementaciones concretas de servicios externos.

Ejemplos prohibidos:

```text
application → Prisma
application → Payload
application → NextRequest
application → localStorage
```

Cuando un caso de uso necesite interactuar con infraestructura, deberá hacerlo mediante un puerto.

---

## 3. Ports

Los `ports` son contratos definidos desde las necesidades del sistema.

Un puerto expresa **qué capacidad externa necesita la aplicación**, sin decidir cómo se implementa.

Ejemplos conceptuales:

```ts
interface SurveySubmissionRepository {
  save(submission: SurveySubmission): Promise<void>;
}
```

```ts
interface SurveyDefinitionProvider {
  getActiveSurvey(eventId: string): Promise<SurveyDefinition>;
}
```

```ts
interface RateLimiter {
  consume(key: string): Promise<RateLimitResult>;
}
```

Los nombres de los puertos deben utilizar lenguaje propio de la aplicación.

Se evitarán contratos tecnológicos como:

```text
PrismaService
PayloadService
PostgresManager
LocalStorageHelper
```

cuando el contrato pueda expresarse mediante la responsabilidad real que necesita el sistema.

### Ownership

Los puertos pertenecen al lado interno de la arquitectura.

Por tanto:

```text
application/domain define la necesidad
                ↓
               port
                ↑
            adapter
```

La infraestructura implementa el contrato; el contrato no se diseña alrededor de la infraestructura.

---

## 4. Adapters

Los `adapters` contienen las implementaciones concretas que conectan el sistema con tecnologías externas.

Ejemplos:

```text
PayloadSurveyDefinitionProvider
PrismaSurveySubmissionRepository
BrowserSurveyQueue
XlsxReportExporter
```

Aquí sí pueden aparecer dependencias de:

- Payload;
- Prisma;
- PostgreSQL;
- APIs del navegador;
- almacenamiento local;
- proveedores externos;
- librerías de generación de archivos;
- otros SDKs de infraestructura.

Los adaptadores pueden depender de los puertos y modelos internos que necesitan implementar.

La dirección inversa no está permitida.

Correcto:

```text
adapter → port
adapter → application/domain types
```

Incorrecto:

```text
domain → adapter
application → adapter concreto
```

---

## 5. Anti-corruption boundary

Los modelos externos no deberán propagarse directamente hacia el núcleo o la presentación.

Cuando una tecnología externa utilice su propio modelo de datos, el adaptador deberá traducirlo al modelo interno adecuado.

Ejemplo:

```text
Payload document
      │
      ▼
PayloadSurveyMapper
      │
      ▼
SurveyDefinition
```

No se permitirá que detalles tecnológicos como los siguientes se propaguen sin necesidad fuera de su adaptador:

```text
Payload collection documents
Prisma-generated records
database-specific field conventions
CMS-specific status fields
SDK-specific response objects
```

El objetivo es impedir que la semántica de una herramienta externa se convierta accidentalmente en la semántica del sistema.

---

## 6. Presentation

`presentation` contiene la interfaz que interactúa con el usuario.

Puede depender de:

- casos de uso o interfaces de aplicación apropiadas;
- modelos internos diseñados para presentación;
- componentes compartidos de UI cuando exista una responsabilidad transversal real.

No debe acceder directamente a persistencia ni a modelos específicos de infraestructura.

Ejemplos prohibidos:

```text
React component → Prisma
React component → PostgreSQL
GalleryGrid → Payload document
```

Ejemplo correcto:

```text
Payload
   ↓
adapter
   ↓
GalleryImage[]
   ↓
GalleryGrid
```

La presentación debe recibir información expresada en términos que tengan sentido para la aplicación, no para la tecnología que la originó.

---

## 7. `src/app` como delivery y composition root

El directorio `src/app` de Next.js se utilizará como:

- entrada HTTP;
- routing;
- composición de la aplicación;
- integración con el runtime del framework.

No será el lugar donde residan las reglas del negocio.

Los route handlers deberán mantenerse delgados.

Su responsabilidad principal será:

```text
HTTP request
     ↓
traducir entrada
     ↓
ejecutar caso de uso
     ↓
traducir resultado
     ↓
HTTP response
```

Un `route.ts` no deberá contener:

- consultas Prisma directas que sustituyan un caso de uso;
- reglas funcionales de encuesta;
- lógica propia de Payload;
- decisiones de dominio;
- comportamiento reutilizable de aplicación.

---

## 8. Composition Root

La asociación entre puertos e implementaciones concretas se realizará en los límites de la aplicación.

Conceptualmente:

```text
SurveySubmissionRepository
            =
PrismaSurveySubmissionRepository
```

La creación y conexión de implementaciones concretas no debe quedar dispersa por el código.

El composition root es el punto autorizado para conocer simultáneamente:

- abstracciones internas;
- implementaciones de infraestructura necesarias para ejecutar la aplicación.

Esto constituye una excepción deliberada a la separación, porque su responsabilidad es precisamente componer el sistema.

---

## 9. Persistencia

La necesidad de persistir información se expresará desde la aplicación mediante contratos.

La elección de:

- Prisma;
- PostgreSQL;
- Payload;
- otra base de datos;
- otra tecnología de almacenamiento;

será una decisión de infraestructura posterior.

Los modelos de dominio no deberán modificarse únicamente para satisfacer requisitos accidentales del mecanismo de persistencia.

Esta regla materializa el principio de **Persistence Ignorance** definido en el documento maestro.

---

## 10. Browser APIs

APIs como:

```text
window
localStorage
navigator
online/offline events
```

son detalles del entorno del navegador.

Cuando participen en comportamiento relevante, deberán mantenerse fuera del dominio y de la lógica de aplicación independiente.

Por ejemplo, la cola offline puede tener una implementación basada inicialmente en `localStorage`, pero la aplicación no deberá definir el concepto de “cola pendiente” en términos de `localStorage`.

Conceptualmente:

```text
PendingSurveyStore
        ↑
BrowserLocalStoragePendingSurveyStore
```

Si en el futuro cambia el mecanismo del navegador, el comportamiento funcional no debería necesitar ser rediseñado.

---

## 11. Framework independence

Next.js y React son herramientas de implementación del producto web.

No forman parte del modelo de dominio.

En consecuencia, un cambio futuro de framework podrá implicar cambios importantes en:

```text
src/app
presentation
adaptadores HTTP
composition root
```

pero el objetivo arquitectónico es preservar, en la medida razonable:

```text
domain
application
ports
reglas funcionales
```

La independencia no significa que sustituir un framework sea gratuito, sino que el coste del cambio no debe propagarse innecesariamente a la lógica del negocio.

---

## 12. Aplicación proporcional

Ports & Adapters no se aplicará de forma ceremonial.

No se crearán:

- interfaces sin una frontera real;
- adaptadores para lógica puramente interna;
- capas vacías;
- wrappers cuya única finalidad sea ocultar una llamada sin aportar desacoplamiento significativo.

Ejemplo: si `gallery` utiliza inicialmente un archivo de configuración estático y no existe una frontera tecnológica significativa, no será obligatorio crear:

```text
gallery/domain/
gallery/application/
gallery/ports/
gallery/adapters/
```

solo para imitar la estructura de módulos más complejos.

La profundidad arquitectónica debe ser proporcional a la responsabilidad y al riesgo de cambio.

---

## Consecuencias

### Positivas

- La lógica de negocio queda protegida frente a cambios tecnológicos.
- Los casos de uso pueden probarse sin infraestructura real.
- Payload, Prisma, PostgreSQL u otras herramientas podrán sustituirse con menor impacto.
- Las dependencias del sistema se vuelven explícitas.
- Se reduce el riesgo de que modelos externos contaminen el lenguaje interno.
- Los límites tecnológicos son más fáciles de localizar y auditar.
- Facilita la creación de adaptadores in-memory para pruebas.
- Favorece módulos más cohesionados y mantenibles.

### Costes y restricciones

- Algunas fronteras requerirán interfaces, mappers y adaptadores adicionales.
- Los desarrolladores deberán respetar activamente la dirección de dependencias.
- Será necesario evitar abstracciones prematuras.
- La estructura puede parecer más compleja que una implementación directa cuando existe infraestructura real.
- Las reglas deberán reforzarse progresivamente mediante linting, tests de arquitectura o análisis de dependencias.

---

## Alternativas consideradas

### Dependencia directa de infraestructura

Ejemplo:

```text
SubmitSurvey → Prisma → PostgreSQL
```

No se adopta porque convierte la persistencia en parte estructural del caso de uso y dificulta sustitución, pruebas y evolución.

### Acceso directo a Payload desde UI

Ejemplo:

```text
GalleryGrid → Payload SDK
```

No se adopta porque acopla presentación y CMS y permite que modelos específicos de Payload se propaguen por el producto.

### Arquitectura tradicional descendente UI → Service → Repository → Database

No se adopta como regla arquitectónica general porque puede provocar que las capas internas dependan de detalles inferiores de infraestructura.

Podrán existir flujos de ejecución que visualmente se parezcan a esta secuencia, pero las **dependencias de código** deberán apuntar hacia abstracciones internas, no hacia implementaciones externas.

### Abstraer absolutamente todas las dependencias

No se adopta porque produciría arquitectura ceremonial y violaría la regla YAGNI.

Solo se introducirán puertos cuando exista una frontera significativa, una dependencia externa, una necesidad de sustitución/testabilidad o una responsabilidad que justifique el contrato.

---

## Verificación

Estas reglas deberán comprobarse progresivamente mediante:

- revisión de código;
- APIs públicas de módulo;
- ESLint y restricciones de imports cuando los módulos empiecen a existir;
- tests de arquitectura si aportan valor;
- tests unitarios sin infraestructura para domain/application;
- revisión de ADRs cuando se introduzcan nuevas tecnologías.

Ejemplos de restricciones futuras esperadas:

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

Estas reglas automáticas se introducirán cuando exista código real sobre el que aplicarlas; no se crearán configuraciones vacías anticipadamente.

---

## Criterios de revisión

Este ADR deberá revisarse si:

- el documento maestro modifica la dirección de dependencias;
- aparece un caso real en el que la regla impida una solución significativamente más simple y segura;
- el proyecto evoluciona hacia múltiples procesos o servicios con contratos remotos;
- nuevas restricciones operativas o de despliegue modifican los límites actuales;
- la experiencia acumulada demuestra que alguna frontera está ubicada incorrectamente.

Una excepción puntual no deberá introducirse silenciosamente.

Si una necesidad real entra en conflicto con este ADR, deberá documentarse:

1. el problema;
2. la alternativa propuesta;
3. el impacto sobre la arquitectura;
4. la justificación;
5. la decisión resultante.

---

## Relación con otras decisiones

Este ADR complementa:

- `ADR-001-modular-monolith.md`

ADR-001 establece la forma general de la aplicación como monolito modular.

ADR-002 establece cómo deben dirigirse las dependencias dentro de ese monolito y cómo deben aislarse las tecnologías concretas.

---

## Referencias

- `docs/architecture/MASTER_ARCHITECTURE.md`
- `docs/architecture/decisions/ADR-001-modular-monolith.md`
