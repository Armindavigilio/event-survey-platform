# ADR-001 — Adoptar un monolito modular como arquitectura base

## Estado

Accepted

## Fecha

2026-09-24

## Contexto

Event Survey Platform es una aplicación web reutilizable orientada inicialmente a la realización de encuestas presenciales asociadas a eventos o actividades.

El sistema contempla varias capacidades funcionales, entre ellas:

- presentación de contenido visual;
- captura y validación de encuestas;
- funcionamiento resiliente ante pérdida de conectividad;
- sincronización posterior de respuestas;
- obtención de datos para análisis.

El proyecto necesita mantener una separación clara de responsabilidades y permitir que tecnologías como Next.js, Payload, Prisma o PostgreSQL puedan evolucionar sin obligar a reescribir la lógica funcional.

Al mismo tiempo, el alcance actual no justifica la complejidad operativa de microservicios, micro-frontends o infraestructura distribuida.

## Decisión

La aplicación se implementará inicialmente como un **monolito modular**.

El sistema se desplegará como una única aplicación, pero su estructura interna estará dividida por capacidades funcionales con límites explícitos.

La organización primaria será **feature-first / domain-first**.

Dentro de los módulos que contengan lógica suficiente se podrán aplicar principios de **Ports and Adapters / Clean Architecture** para mantener el núcleo independiente de infraestructura y frameworks.

No todos los módulos están obligados a tener la misma estructura interna.

Los módulos simples permanecerán simples y únicamente adquirirán capas adicionales cuando exista una responsabilidad real que las justifique.

## Consecuencias

### Positivas

- Se conserva un modelo de despliegue sencillo.
- Las capacidades funcionales permanecen localizables.
- Se reduce el acoplamiento entre negocio e infraestructura.
- Se facilita la sustitución futura de tecnologías.
- Las reglas de negocio pueden probarse independientemente.
- Los módulos pueden evolucionar gradualmente.
- Una futura extracción de módulos será más sencilla si aparecen razones operativas reales.

### Costes y restricciones

- Los límites entre módulos deben mantenerse deliberadamente.
- Un monolito no impide por sí mismo dependencias incorrectas.
- Será necesario establecer reglas de importación y revisión arquitectónica.
- Algunas interfaces y adaptadores introducirán código adicional cuando exista una frontera tecnológica real.
- Debe evitarse convertir la arquitectura modular en una estructura ceremonial.

## Alternativas consideradas

### Aplicación monolítica organizada únicamente por tipo técnico

Ejemplo:

```text
components/
services/
repositories/
hooks/
utils/
```

No se adopta como estructura principal porque una misma capacidad funcional quedaría repartida entre múltiples ubicaciones y el eje de organización no coincidiría con el eje habitual de cambio.

### Microservicios

No se adoptan porque el proyecto no presenta actualmente necesidades de despliegue independiente, ownership independiente, escalado diferenciado o aislamiento operativo que justifiquen su coste adicional.

### Micro-frontends

No se adoptan porque existe una única superficie web y no hay equipos ni ciclos de despliegue independientes que justifiquen esa complejidad.

### Clean Architecture rígida aplicada uniformemente

No se adopta como plantilla obligatoria para todos los módulos.

Los principios de separación, inversión de dependencias y Ports and Adapters sí serán utilizados cuando exista una frontera significativa, pero no se crearán capas vacías en módulos triviales.

## Criterios de revisión

Esta decisión deberá revisarse si aparecen uno o varios de los siguientes factores:

- equipos con ownership independiente;
- necesidades de despliegue independiente;
- diferencias significativas de escalado entre capacidades;
- requisitos distintos de disponibilidad o seguridad;
- ciclos de release independientes;
- límites de negocio suficientemente maduros;
- costes operativos del monolito que superen los de su separación.

Una posible extracción futura deberá responder a una necesidad demostrable y no a una preferencia tecnológica.

## Referencias

- `docs/architecture/MASTER_ARCHITECTURE.md`
