# Rediseño visual — Dark Mode + Nuevo input de pronóstico

**Fecha:** 2026-06-05
**Referencia visual:** https://www.lanacion.com.ar/deportes/futbol/prode-mundial-2026-nid14052026/#/

## Objetivo

Rediseñar la estética completa de la aplicación a dark mode, inspirada en el prode de La Nacion. El cambio más significativo en UX es el mecanismo de carga de pronósticos: elimina el botón "Guardar" y reemplaza los inputs numéricos por steppers con auto-save.

## Scope

Todas las páginas de usuario: Torneo, Grupos, Reglas, Perfil, Login. **No incluye** páginas de admin.

## Enfoque elegido: Híbrido (C)

- Dark mode global aplicado en `globals.css` y layouts
- Nuevo componente `MatchCard` extraído de `torneo/page.tsx`
- Nuevo componente `PredictionInput` en reemplazo de `prediction-form.tsx`
- Sin cambios en routing, actions, ni lógica de negocio

---

## Sistema de color

| Token CSS | Valor | Uso |
|---|---|---|
| `--bg` | `#0d0d0d` | Fondo de página |
| `--surface` | `#1a1a1a` | Cards, navbar, bottom nav |
| `--surface-raised` | `#242424` | Inputs, botones secundarios |
| `--border` | `#2a2a2a` | Bordes |
| `--accent` | `#22c55e` | Verde — activo, guardado, tab seleccionado |
| `--text-primary` | `#f0f0f0` | Texto principal |
| `--text-muted` | `#666` | Metadatos, labels secundarios |
| `--text-dimmed` | `#3a3a3a` | Placeholders, disabled |

Fuente: Inter (sin cambio).

Los tokens se definen en `:root` en `globals.css` y se referencian desde Tailwind via `@theme inline`.

---

## Componente: `PredictionInput`

Reemplaza a `prediction-form.tsx`. Mismo contrato de props, misma lógica de save/delete, nueva UI.

### Comportamiento

- **Sin botón "Guardar"**: el save se dispara automáticamente con `debounce(500ms)` cada vez que cambia el score.
- **Estado inicial vacío**: los scores muestran `—` y no se guarda nada hasta que el usuario toca una flecha por primera vez.
- **Save parcial bloqueado**: si solo uno de los dos scores tiene valor (el otro sigue en `—`), el save no se dispara. El indicador muestra `Completá el otro score` en gris tenue.
- **Indicador de estado** (bajo el score, centrado):
  - `Guardando...` (gris) — durante el debounce o el transition
  - `✓ Guardado` (verde, fade out a 2s) — tras save exitoso
  - `Sin pronóstico` (gris tenue) — cuando ningún score está cargado
  - `Completá el otro score` (gris tenue) — cuando solo un score tiene valor
- **Eliminación**: ícono 🗑 pequeño en la esquina superior derecha de la card, visible solo cuando hay un pronóstico cargado. Al tocar/clickear, muestra confirmación inline debajo del score: "¿Borrar pronóstico? Sí / No" — mismos estilos dark, sin modal.
- **Lock**: cuando el partido está bloqueado (`isLocked`), el componente no se renderiza; la card muestra el pronóstico guardado en modo lectura.

### Layout mobile

```
      [▲]           [▲]
  🇦🇷              🇧🇷
      [▼]    2—1   [▼]
```

Flechas ▲▼ encima y debajo de cada bandera. Score grande centrado entre ambas banderas.

- Las flechas son botones de 28×22px, border-radius 6px, con `var(--surface-raised)` de fondo.
- Al presionar: incrementa/decrementa el score de ese equipo. Mínimo: 0. No tiene máximo visible (internamente max 99).
- El score arranca en `—` si no hay pronóstico, y pasa a `0` al primer toque de ▲.

### Layout desktop (≥768px)

Misma disposición pero los scores son `<input type="number">` editables por teclado. Las flechas ▲▼ se muestran igualmente encima y debajo de cada input (no se ocultan como en el spinner nativo del browser). El input tiene `appearance: textfield` para ocultar el spinner nativo.

- Al hacer foco en el input: borde verde (`var(--accent)`), fondo ligeramente más claro.
- Tab entre inputs funciona con orden natural (home → away).

### Knockout (eliminación directa)

Si `isKnockout === true` y el resultado es empate, aparece un selector de ganador debajo del score — mismo estilo dark, sin cambio en lógica.

---

## Componente: `MatchCard`

Extraído de `torneo/page.tsx`. Recibe todos los datos de un partido + el pronóstico como props.

### Estados visuales

| Estado del partido | Card |
|---|---|
| Programado, sin pronóstico | Border `var(--border)` |
| Programado, con pronóstico | Border `var(--accent)` al 25% de opacidad (`#22c55e40`) |
| En juego | Badge amarillo `En juego` |
| Finalizado | Sin steppers; score oficial en texto grande; pronóstico + puntos en fila inferior |
| Cancelado | Card deshabilitada, texto tachado |

### Estructura de la card

```
[ Grupo A  ·  Hoy 15:00           Programado ]
[  ▲  🇦🇷  ▲     2 — 1     ▲  🇧🇷  ▲  ]   ← mobile
[  ▼        ▼               ▼        ▼  ]
[              ✓ Guardado               ]
```

Desktop agrega nombre del equipo bajo la bandera.

---

## Navbar

- Fondo: `var(--surface)`, border-bottom `var(--border)`
- Logo: `⚽ Prode 2026` + badge verde `FIFA` (pequeño, fondo `var(--accent)`, texto negro)
- Derecha: avatar del usuario (foto de Google, 30px, border `var(--border)`) o links si no hay sesión
- Links sin sesión: `Torneo`, `Reglas`, `Iniciar sesión` — color `var(--text-muted)`, hover `var(--text-primary)`

---

## Bottom Nav (mobile)

- Fondo: `var(--surface)`, border-top `var(--border)`
- Tab activo: ícono + label en `var(--accent)` + punto verde de 4px debajo del label
- Tab inactivo: `var(--text-muted)`
- Sin cambios funcionales

---

## Login

- Fondo: `var(--bg)` directo (sin card exterior)
- Contenido centrado verticalmente: emoji ⚽ grande, título "Prode Mundial 2026", subtítulo
- Card interior (`var(--surface)`, border `var(--border)`, border-radius 14px):
  - Botón Google (ícono SVG real + "Continuar con Google")
  - Divisor "o"
  - Input email + botón primario verde "Continuar con email →"
- Pie: texto legal en `var(--text-muted)`

---

## Perfil

- Hero: card con avatar (borde verde 2px), nombre, email
- Stats grid 2×2: Puntos, Posición, Pronósticos, Exactos — valor en `var(--accent)` grande
- Menú lista: Mis grupos, Reglas, Cerrar sesión (rojo `#ef4444`)
- Bottom nav presente con tab Perfil activo

---

## globals.css

Agregar variables CSS al `:root` y cambiar:
- `background` del body a `var(--bg)`
- `color` a `var(--text-primary)`

`bg-gray-50` en los layouts reemplazado por `bg-[var(--bg)]` o clase Tailwind equivalente.

---

## Archivos afectados

| Archivo | Cambio |
|---|---|
| `src/app/globals.css` | Tokens CSS, fondo dark |
| `src/app/layout.tsx` | Sin cambio (Inter ya cargado) |
| `src/app/(protected)/layout.tsx` | `bg-gray-50` → `bg-[#0d0d0d]` |
| `src/app/(shell)/layout.tsx` | Ídem |
| `src/components/navbar.tsx` | Dark mode clases |
| `src/components/bottom-nav.tsx` | Dark mode clases + punto activo |
| `src/components/prediction-form.tsx` | Reemplazado por `prediction-input.tsx` |
| `src/components/match-card.tsx` | **Nuevo** — extraído de torneo/page.tsx |
| `src/components/prediction-input.tsx` | **Nuevo** — reemplaza prediction-form |
| `src/app/(shell)/torneo/page.tsx` | Usa `MatchCard` |
| `src/app/login/page.tsx` | Dark mode |
| `src/app/(protected)/perfil/page.tsx` | Dark mode + stats grid |
| `src/app/(protected)/grupos/page.tsx` | Dark mode clases |
| `src/app/(shell)/reglas/page.tsx` | Dark mode clases |

---

## Fuera de scope

- Páginas de admin
- Cambios en lógica de scoring, actions, o base de datos
- Modo claro (no hay toggle dark/light — la app es dark-only)
- Animaciones complejas más allá del fade del indicador de guardado
