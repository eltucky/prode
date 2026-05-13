# Prode Mundial 2026 — Descripción Funcional

## Resumen

Aplicación web responsive para jugar al prode del Mundial FIFA 2026 con amigos. Los usuarios se organizan en grupos, cargan pronósticos de partidos, y compiten por puntos según la precisión de sus predicciones. Los resultados se cargan automáticamente desde una API externa y pueden ajustarse manualmente por el administrador del sistema.

---

## Usuarios y autenticación

- El acceso a la aplicación es exclusivamente mediante **login con Google**. No hay registro manual ni contraseñas.
- Cualquier usuario autenticado puede crear grupos y participar en grupos de otros.
- Existe un rol especial de **super admin** con capacidades de gestión global sobre toda la plataforma.

---

## Torneo

### Datos pre-cargados

- La aplicación incluye los **48 equipos participantes** y el **calendario completo** de partidos del Mundial FIFA 2026, incluyendo todas las etapas:
  - Fase de grupos
  - Ronda de 32
  - Octavos de final
  - Cuartos de final
  - Semifinales
  - Tercer puesto
  - Final

### Resultados

- Los resultados se **cargan automáticamente** al finalizar cada partido mediante una API externa (a definir en la implementación).
- El super admin puede **ajustar o corregir manualmente** cualquier resultado cuando sea necesario.
- Si un partido es **postergado**, el sistema actualiza automáticamente el horario de cierre de pronósticos en función del nuevo horario informado por la API.

---

## Grupos

### Creación y administración

- Cualquier usuario puede **crear un grupo**, asignándole un nombre. Al crearlo, pasa a ser su **admin**.
- El admin invita a otros usuarios compartiendo un **link o código de invitación**.
- El admin puede **invitar participantes**, pero no puede removerlos del grupo.

### Ingreso tardío

- Un usuario puede unirse a un grupo **después de que el torneo haya comenzado**.
- Los partidos ya jugados antes de su ingreso **no generan puntos** para ese participante (sin puntaje retroactivo).

---

## Vista del torneo

Disponible para todos los usuarios desde el menú principal, **independientemente de los grupos** a los que pertenezcan.

- **Resultados pasados:** listado de todos los partidos ya jugados con sus marcadores finales.
- **Próximos partidos:** listado de partidos futuros donde el usuario puede ver y cargar sus pronósticos directamente.
- Filtros por etapa (fase de grupos, eliminatorias).

---

## Pronósticos

### Reglas generales

- Cada usuario puede cargar **un único pronóstico por partido**.
- El pronóstico puede **modificarse** hasta el momento de cierre.
- **Cierre:** 1 minuto antes del horario programado de inicio del partido.
- Una vez cerrado, el pronóstico queda bloqueado y no puede modificarse.

### Contenido del pronóstico

- **Fase de grupos:** el usuario pronostica la cantidad de goles de cada equipo (ej: Argentina 2 - Marruecos 0).
- **Rondas eliminatorias:** el usuario pronostica la cantidad de goles de cada equipo **a los 90 minutos** más el **ganador final del partido** (en caso de que el partido pueda resolverse en tiempo extra o penales).

---

## Puntuación

### Esquema de puntos

El puntaje se evalúa sobre el resultado a los 90 minutos (en eliminatorias, el marcador al cierre del tiempo reglamentario).

| Situación | Puntos |
|---|---|
| Resultado incorrecto (se erró el ganador o si hubo empate) | 0 pts |
| Resultado correcto, no exacto (se acertó quién ganó o que empataron) | 2 pts |
| + Marcador del equipo local coincide *(solo si se acertó el resultado)* | +1 pt |
| + Marcador del equipo visitante coincide *(solo si se acertó el resultado)* | +1 pt |
| Resultado exacto (ambos marcadores coinciden) — incluye automáticamente los +1+1 | **3 + 1 + 1 = 5 pts** |
| + Acertar el ganador final del partido en rondas eliminatorias | +2 pts |
| **Resultado exacto en eliminatoria + ganador final** | **= 7 pts** |

### Desempate en tabla de posiciones

Cuando dos o más participantes tienen la misma cantidad de puntos en un grupo, el desempate se resuelve por **cantidad total de partidos acertados** (suma de resultados exactos y no exactos).

---

## Vistas por grupo

Dentro de cada grupo, cada participante puede ver:

### Tabla de posiciones
- Ranking de todos los participantes del grupo con sus puntos acumulados y cantidad de aciertos.

### Pronósticos de los participantes
- Los pronósticos de **otros participantes** son visibles únicamente **a partir del momento de cierre** del pronóstico de cada partido (1 minuto antes del inicio).
- Antes de ese momento, cada usuario solo puede ver sus propios pronósticos.

### Lista de participantes
- Todos los miembros del grupo con su perfil de Google.

---

## Mis pronósticos

Cada usuario puede ver **el historial completo de sus propios pronósticos** a lo largo del torneo, junto con los resultados reales y los puntos obtenidos en cada partido, en todos los grupos a los que pertenece.

---

## Notificaciones por email

- **Recordatorio por partido:** se envía un aviso cuando falta 1 hora para el cierre del pronóstico de un partido, si el usuario aún no lo ha cargado.
- **Resumen diario:** cada día se envía un resumen con los partidos del día y los pronósticos pendientes del usuario.

Las notificaciones se envían al email asociado a la cuenta de Google del usuario.

---

## Panel del super admin

El super admin tiene acceso a un panel de administración con las siguientes capacidades:

### Gestión del torneo
- Ver y ajustar manualmente el resultado de cualquier partido.
- Marcar un partido como suspendido o anulado (los pronósticos de ese partido no generan puntos).

### Gestión de grupos y usuarios
- Ver todos los grupos de la plataforma.
- Eliminar usuarios de cualquier grupo.
- Eliminar grupos enteros.
- Ver todos los usuarios registrados.

### Métricas globales
- Estadísticas de uso de la plataforma: cantidad de usuarios, grupos, pronósticos cargados, participación por partido.

---

## Pendientes de definición técnica

Los siguientes aspectos se resolverán en la fase de planificación técnica:

- **API de resultados:** selección del proveedor (football-data.org, API-Football, etc.) e integración.
- **Stack tecnológico:** framework frontend, backend, base de datos y hosting.
- **Sistema de emails:** proveedor para el envío de notificaciones (SendGrid, Resend, etc.).
- **Autenticación con Google:** implementación del flujo OAuth2.
