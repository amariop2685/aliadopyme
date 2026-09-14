/* ============================================================
   Meta Pixel (publicidad en Facebook e Instagram) — AliadoPyme

   Para activarlo:
   1. Meta Business Suite → Administrador de eventos → Conectar
      orígenes de datos → Web → Píxel de Meta.
   2. Copia el ID del píxel (solo números) y pégalo en META_PIXEL_ID.
   Mientras esté vacío no se carga nada ni se instalan cookies de Meta.

   Eventos que registra:
   - PageView en todas las páginas públicas.
   - ViewContent al abrir LiquidaGO o ConciliaGO.
   - Lead al enviar la solicitud de reunión de la calculadora por WhatsApp.
   - Contact en cualquier otro clic a WhatsApp o correo.
   - UsoApp (personalizado) al conciliar, imprimir, guardar o exportar.
   ============================================================ */
(function () {
  "use strict";

  const META_PIXEL_ID = "";
  if (!META_PIXEL_ID) return;

  /* Código base oficial de Meta */
  !function (f, b, e, v, n, t, s) {
    if (f.fbq) return; n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = [];
    t = b.createElement(e); t.async = !0; t.src = v;
    s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

  fbq("init", META_PIXEL_ID);
  fbq("track", "PageView");

  const pagina = (location.pathname.split("/").pop() || "index.html").replace(".html", "");
  const esApp = /^(liquidago|conciliago)$/.test(pagina);
  if (esApp) fbq("track", "ViewContent", { content_name: pagina });

  document.addEventListener("click", (e) => {
    if (!e.target.closest) return;
    const enlace = e.target.closest("a[href]");
    if (enlace && /wa\.me|^mailto:/.test(enlace.getAttribute("href"))) {
      fbq("track", enlace.id === "btn-enviar-whatsapp" ? "Lead" : "Contact", { content_name: pagina });
    }
    const boton = esApp && e.target.closest("#btn-conciliar, #btn-imprimir, #btn-guardar, #btn-exportar");
    if (boton) fbq("trackCustom", "UsoApp", { app: pagina, accion: boton.id.replace("btn-", "") });
  });
})();
