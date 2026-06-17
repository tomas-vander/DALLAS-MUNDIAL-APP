# 🇦🇷 Mundial 2026 Dallas — App de Transporte Público

**Guía offline para ir del Hilton Richardson al AT&T Stadium en transporte público.**

---

## 📱 Cómo instalar en el celular

### Android (Chrome)
1. Abrir Chrome y entrar a la app (abrí el archivo `index.html` desde un servidor o compartilo por Drive/WhatsApp)
2. Tocar el menú (⋮) en la esquina superior derecha
3. Seleccionar **"Agregar a pantalla de inicio"**
4. Confirmar → la app aparece como ícono en el escritorio

### iPhone (Safari)
1. Abrir Safari (no Chrome — en iOS solo Safari puede instalar PWAs)
2. Ir a la URL de la app
3. Tocar el botón **Compartir** (cuadrado con flecha hacia arriba)
4. Scroll hacia abajo → **"Agregar a inicio"**
5. Confirmar → ícono en pantalla de inicio

> ⚠️ **IMPORTANTE**: En iPhone, abrir SIEMPRE desde Safari, no desde Chrome.

---

## 🗺 Cómo usar el mapa offline

1. **Antes de viajar** (con WiFi): Abrir el tab **Mapa** y tocar **"Pre-cachear"**
2. La app descarga los tiles del mapa de Dallas (zoom 8–14)
3. Una vez descargado, el mapa funciona sin internet

---

## 🚉 La ruta (8 paradas)

| # | Parada | Acción |
|---|--------|--------|
| 1 | 🏨 Hilton Richardson | Punto de partida |
| 2 | 🚉 Galatyn Park Station | **EMBARCAR** DART Red Line → Sur |
| 3 | 🔄 Victory Station | **TRASBORDO** → TRE Fort Worth |
| 4 | 🚂 Market Center | No bajar |
| 5 | 🚂 Downtown Irving | No bajar |
| 6 | 🚂 West Irving | No bajar |
| 7 | 🏁 CentrePort/DFW | **BAJAR** → bus charter |
| 8 | 🏟️ AT&T Stadium | **DESTINO** 🎉 |

---

## 🎟 Tickets

- **Recomendado**: TRE Regional Day Pass **$9** → cubre DART + TRE en ambos sentidos
- Comprar en app **GoPass** ANTES de viajar (App Store / Google Play)
- No hay venta a bordo

---

## 📅 Partidos de Argentina

- **Partido 1**: 22 de junio 2026 — 15:00h Dallas (CDT) — Argentina vs Austria
- **Partido 2**: 27 de junio 2026 — horario a confirmar — Argentina vs Jordania

---

## 🛠 Estructura del proyecto

```
dallas-mundial-app/
├── index.html          ← App principal (todo el código inline)
├── manifest.json       ← Configuración PWA
├── sw.js               ← Service Worker (caché offline)
├── icon-192.png        ← Ícono PWA pequeño
├── icon-512.png        ← Ícono PWA grande
├── README.md           ← Este archivo
└── agents/
    ├── ingeniero_sistemas.md   ← Agente: arquitectura y PWA
    ├── disenador_grafico.md    ← Agente: diseño visual
    └── programador.md          ← Agente: lógica y features
```

---

## 🤖 Agentes disponibles

Para mejorar la app, cargá archivos junto con el agente correspondiente en Claude Code:

| Agente | Archivo | Cuándo usarlo |
|--------|---------|---------------|
| Ingeniero en Sistemas | `agents/ingeniero_sistemas.md` | Problemas de PWA, Service Worker, rendimiento offline |
| Diseñador Gráfico | `agents/disenador_grafico.md` | Cambios visuales, nuevos íconos, paleta de colores |
| Programador | `agents/programador.md` | Nuevas features, bugs, datos de paradas/horarios |

---

## 🏁 Grupo

- **Hotel**: Hilton Richardson — 701 E Campbell Rd, Richardson TX 75081
- **Destino**: AT&T Stadium, Arlington TX
- **Fechas**: 22 y 27 de junio 2026
- **Grupo**: 5 personas

¡Vamos Argentina! 🏆🇦🇷
