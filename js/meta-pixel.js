/* ============================================================
   Meta Pixel (publicidad en Facebook e Instagram) — AliadoPyme

   Para activarlo:
   1. Meta Business Suite → Administrador de eventos → Conectar
      orígenes de datos → Web → Píxel de Meta.
   2. Copia el ID del píxel (solo números) y pégalo en META_PIXEL_ID.
   Mientras esté vacío no se carga nada ni se instalan cookies de Meta,
   pero el resto del sitio puede seguir llamando a mpEvento() sin error.

   Eventos que registra:
   - PageView en todas las páginas públicas.
   - ViewContent al abrir una app o el landing de conciliación.
   - Lead al enviar la solicitud de reunión de la calculadora por WhatsApp.
   - Contact en cualquier otro clic a WhatsApp o correo.
   - ClicCotizar (personalizado) al ir desde una página a la calculadora.
   - UsoApp (personalizado) al conciliar, imprimir, guardar o exportar.
   - DemoIniciada / DemoCompletada / DemoTomaControl / DemoAccion
     (personalizados) en la demostración de depósitos y caja.

   La demo va embebida en un iframe dentro del landing. Ahí NO se inicia
   un segundo píxel (duplicaría las visitas): el iframe le pasa sus
   eventos a la página que lo contiene y esa los reporta.

   CONSENTIMIENTO: el píxel NO se carga hasta que la persona acepta las
   cookies en el aviso de js/cookies.js. Hasta entonces no se descarga
   nada de Meta ni se instala ninguna cookie suya. Si ya había aceptado
   en una visita anterior, arranca solo.
   ============================================================ */
(function () {
  "use strict";

  const META_PIXEL_ID = "1288186794371285";

  const enIframe = window.self !== window.top;
  const pagina = (location.pathname.split("/").pop() || "index.html").replace(".html", "");
  const ESTANDAR = ["PageView", "ViewContent", "Lead", "Contact", "Schedule", "CompleteRegistration"];

  function reportar(nombre, datos) {
    if (typeof fbq !== "function") return;
    fbq(ESTANDAR.indexOf(nombre) >= 0 ? "track" : "trackCustom", nombre, datos || {});
  }

  /* API única para el resto del sitio. Funciona con el píxel activo o sin él,
     y desde dentro o fuera del iframe de la demo. */
  window.mpEvento = function (nombre, datos) {
    if (!nombre) return;
    datos = datos || {};
    if (enIframe) {
      try { parent.postMessage({ mpEvento: nombre, mpDatos: datos }, location.origin); } catch (e) {}
      return;
    }
    reportar(nombre, datos);
  };

  /* La página contenedora recibe los eventos de la demo embebida. */
  if (!enIframe) {
    window.addEventListener("message", function (e) {
      if (e.origin !== location.origin) return;
      if (!e.data || !e.data.mpEvento) return;
      reportar(e.data.mpEvento, e.data.mpDatos || {});
    });
  }

  /* Dentro del iframe no se carga el píxel: solo se reenvían los eventos. */
  if (enIframe || !META_PIXEL_ID) return;

  const esApp = /^(liquidago|conciliago)$/.test(pagina);
  const esContenido = esApp || /^(conciliacion-bancaria|conciliago-extension)$/.test(pagina);

  /* Arranca el píxel. Lo llama js/cookies.js cuando la persona acepta, y se
     llama solo más abajo si el consentimiento ya estaba guardado. Es
     idempotente: llamarlo dos veces no duplica la visita. */
  let iniciado = false;
  window.iniciarPixel = function () {
    if (iniciado) return;
    iniciado = true;

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
    if (esContenido) fbq("track", "ViewContent", { content_name: pagina });
  };

  /* Si ya aceptó en una visita anterior, arranca sin preguntar de nuevo.
     Se lee el mismo registro que escribe js/cookies.js, para no depender
     del orden en que se carguen los dos archivos. */
  try {
    if (localStorage.getItem("aliadopyme_cookies") === "aceptadas") window.iniciarPixel();
  } catch (e) {}

  /* Los clics se escuchan siempre; reportar() no hace nada mientras no
     exista fbq, así que sin consentimiento no se envía ni se guarda nada. */
  document.addEventListener("click", function (e) {
    if (!e.target.closest) return;

    const enlace = e.target.closest("a[href]");
    if (enlace) {
      const href = enlace.getAttribute("href") || "";
      if (/wa\.me|^mailto:/.test(href)) {
        reportar(enlace.id === "btn-enviar-whatsapp" ? "Lead" : "Contact", { content_name: pagina });
      } else if (/#calculadora$/.test(href) && pagina !== "index") {
        reportar("ClicCotizar", { origen: pagina });
      }
    }

    const boton = esApp && e.target.closest("#btn-conciliar, #btn-imprimir, #btn-guardar, #btn-exportar");
    if (boton) reportar("UsoApp", { app: pagina, accion: boton.id.replace("btn-", "") });
  });
})();
