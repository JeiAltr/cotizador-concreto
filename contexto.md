# Cotizador de Concreto Premezclado — Contexto del Proyecto

**Última actualización:** 2026-03-05 23:04 (Huancayo, Perú)

## Resumen del Proyecto

Web app profesional para calcular metrado de concreto premezclado para **losas aligeradas**, diseñada para vendedores independientes en Huancayo. Se comparte en **grupos de Facebook de construcción** para generar leads y redirigir a WhatsApp.

## Archivos del Proyecto

```
d:\PROYECTOS\OBRAS_CONCRETO\
├── index.html    → Página principal (7 pasos de metrado + resultados)
├── styles.css    → Dark theme, orange accents, responsive, animaciones
├── app.js        → Motor de cálculo + UI dinámica + WhatsApp
└── contexto.md   → Este archivo
```

## Datos del Negocio

| Dato | Valor |
|------|-------|
| WhatsApp | **51901399575** (cuñada del usuario, quien publica en Facebook) |
| Nombre comercial | **ConcreTEC** |
| Ubicación plantas | Zona de **3 de Diciembre**, Huancayo |
| Capacidad mixer | 8 m³ |
| Bomba pluma ajuste | +0.5 m³ (concreto que queda en la batea) |

### Precios por m³ (en Soles)

| Resistencia | Mínimo | Máximo | Nota |
|-------------|--------|--------|------|
| f'c 175 | S/ 280 | S/ 320 | Veredas, pisos |
| f'c 210 | S/ 310 | S/ 360 | **Popular** — losas, vigas, columnas |
| f'c 245 | S/ 350 | S/ 400 | Estructuras exigentes |
| f'c 280 | S/ 390 | S/ 450 | Alta resistencia |

> El precio varía según la distancia desde las plantas (zona 3 de Diciembre).

## Flujo de Metrado Implementado (7 pasos)

1. **Áreas de losa** — Lista dinámica de rectángulos (largo × ancho). Se suman todas.
2. **Descuentos** — Huecos de escalera, tragaluces, ductos, patios. Se restan del área bruta.
3. **Losa y Bloquetas** — Espesor de losa (default 0.20m) + bloqueta de aligeramiento (default 30×30×15 cm).
4. **Vigas peraltadas** — Lista dinámica (largo × ancho × peralte). Opcional.
5. **Escalera** — Toggle on/off. Cálculo real: losa inclinada (hipotenusa) + volumen de peldaños.
6. **Bomba pluma** — Toggle on/off. Suma +0.5 m³.
7. **Resistencia** — f'c 175, 210, 245, 280.

### Fórmulas de Cálculo

```
areaConstruida = Σ(áreas) - Σ(descuentos)
volMacizo = areaConstruida × espesorLosa
cantBloquetas = floor(areaConstruida / (0.30 × 0.30))
volBloquetas = cantBloquetas × 0.30 × 0.30 × 0.15
volLosa = volMacizo - volBloquetas
volVigas = Σ(largo × ancho × peralte)
volEscalera = (√(L² + H²) × ancho × espesor) + (contrapaso × paso / 2 × ancho × numPasos)
TOTAL = volLosa + volVigas + volEscalera + ajusteBomba
```

## Funcionalidades Clave

- **Zonas dinámicas**: Agregar/quitar áreas, descuentos y vigas sin perder valores ingresados
- **Subtotales en vivo**: Se actualizan al cambiar cualquier input
- **Panel de resultados**: Desglose completo del metrado línea por línea
- **WhatsApp**: Botón genera mensaje pre-formateado con todo el metrado → abre en nueva pestaña
- **Responsive**: Funciona en móvil (donde más se usa desde Facebook)
- **Precio estimado**: Rango min-max según resistencia y volumen total

## Bugs Corregidos (2026-03-05)

1. ✅ Valores de inputs se borraban al agregar nueva zona/descuento/viga → implementado save/restore
2. ✅ Precio f'c 210 configurado en S/ 310 mínimo
3. ✅ WhatsApp no abría en nueva pestaña → cambiado a `window.open('url', '_blank')`

## Stack Técnico

- **HTML/CSS/JS** puro (sin frameworks)
- Fuentes: Inter (UI) + JetBrains Mono (números)
- Dark theme con acentos naranja
- Sin backend, todo client-side
- Para servir localmente: `python -m http.server 8090` desde la carpeta del proyecto

## Pendientes / Próximos Pasos

- [ ] **Desplegar** en hosting (GitHub Pages, Netlify, o similar) para tener URL pública
- [ ] **Configurar precios reales** — confirmar si los rangos actuales son correctos
- [ ] **Confirmar nombre comercial** — ¿ConcreTEC es el definitivo?
- [ ] **Posts para Facebook** — crear plantillas de publicación con link al cotizador
- [ ] **Analytics** — agregar tracking para medir uso y leads generados
- [ ] **Otros tipos de estructura** — actualmente solo losa aligerada tiene metrado profesional
- [ ] **Historial de cotizaciones** — guardar en localStorage para referencia
- [ ] **PDF de cotización** — generar documento descargable con el metrado
