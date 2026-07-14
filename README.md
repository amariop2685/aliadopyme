# AliadoPyme — aliadopyme.cl

Sitio web estático de AliadoPyme: asesoría en contabilidad, conciliación bancaria,
remuneraciones y recursos humanos para pymes chilenas, alojado en **GitHub Pages**
con el dominio administrado en **Cloudflare**.

## Estructura

| Archivo | Qué es |
|---|---|
| `index.html` | Página principal: servicios + **calculadora de remuneraciones** con agendamiento de reunión de 15 min |
| `legal.html` | Landing de **asesoría legal laboral** (contratos a medida, Ley Karin) con calendario del abogado |
| `js/config.js` | **Único archivo que necesitas editar**: precios, WhatsApp, correo y enlaces de agenda |
| `js/calculadora.js` | Lógica de la calculadora (no requiere edición) |
| `css/styles.css` | Estilos del sitio |
| `CNAME` | Dominio personalizado para GitHub Pages |

## Configuración (js/config.js)

1. **WhatsApp**: reemplaza `56900000000` por el número real (solo dígitos, con 56).
2. **EMAIL**: correo donde llegan las solicitudes.
3. **Precios**: todos los valores de la calculadora están en `PRECIOS` (CLP netos).
   Los valores actuales son *referenciales de ejemplo* — ajústalos a tu tarifa real.

## Calendario del abogado (Google Meet)

El abogado controla su propia disponibilidad desde Google Calendar:

1. En **Google Calendar** (cuenta del abogado) → **Crear → Horario de citas**.
2. Definir duración, días y horas disponibles (él puede cambiarlos cuando quiera).
3. En la configuración de la cita, la videollamada **Google Meet se agrega automáticamente**.
4. Abrir el horario de citas → **Compartir → Copiar enlace**.
5. Pegar ese enlace en `js/config.js` → `BOOKING_URL_LEGAL: "https://calendar.app.google/..."`.

Mientras el enlace esté vacío, la página legal muestra botones de WhatsApp/correo como
alternativa. Lo mismo aplica a `BOOKING_URL_CALCULADORA` para la reunión de 15 minutos
de la calculadora (opcional; si está vacío se usa el flujo de WhatsApp/correo con fecha
y hora propuesta).

## Publicar cambios

```bash
git add -A && git commit -m "Actualiza precios" && git push
```

GitHub Pages publica automáticamente en 1–2 minutos.

## DNS en Cloudflare (una sola vez)

En el panel de Cloudflare del dominio `aliadopyme.cl`, crear:

| Tipo | Nombre | Contenido | Proxy |
|---|---|---|---|
| CNAME | `aliadopyme.cl` (raíz/@) | `amariop2685.github.io` | DNS only (nube gris) |
| CNAME | `www` | `amariop2685.github.io` | DNS only (nube gris) |

Luego, en GitHub → repositorio → **Settings → Pages**, verificar que el *custom domain*
sea `aliadopyme.cl` y activar **Enforce HTTPS** cuando el certificado esté listo
(puede tardar unos minutos). Después de eso puedes activar el proxy naranja de
Cloudflare si lo deseas, con SSL en modo **Full**.
