/* ============================================================
   Aviso de cookies — AliadoPyme

   El sitio no carga NINGÚN rastreador hasta que la persona acepta.
   El píxel de Meta (js/meta-pixel.js) queda a la espera y solo se
   inicia cuando aquí se guarda el consentimiento, o si ya estaba
   guardado de una visita anterior.

   La decisión se guarda en el almacenamiento local del navegador,
   no en una cookie, así que no sale del equipo de la persona.

   Expone:
   - window.cookiesAceptadas()        → true / false
   - window.abrirPreferenciasCookies() → vuelve a mostrar el aviso
   ============================================================ */
(function () {
  "use strict";

  var CLAVE = "aliadopyme_cookies";
  var ACEPTADAS = "aceptadas";
  var RECHAZADAS = "rechazadas";
  var URL_PRIVACIDAD = "privacidad.html";

  /* Dentro de un iframe (la demo embebida en el landing) no se muestra:
     el aviso ya está en la página que la contiene. */
  var enIframe = window.self !== window.top;

  function leer() {
    try { return localStorage.getItem(CLAVE); } catch (e) { return null; }
  }
  function guardar(valor) {
    try { localStorage.setItem(CLAVE, valor); } catch (e) {}
  }

  window.cookiesAceptadas = function () { return leer() === ACEPTADAS; };

  /* ---------- aviso ---------- */
  var aviso = null;

  function construir() {
    if (aviso) return aviso;

    aviso = document.createElement("div");
    aviso.className = "aviso-cookies";
    aviso.setAttribute("role", "dialog");
    aviso.setAttribute("aria-label", "Aviso de cookies");
    aviso.innerHTML =
      '<div class="aviso-cookies-texto">' +
        '<b>Este sitio usa cookies de medición.</b> ' +
        'Nos sirven para saber qué contenido funciona y para mostrar publicidad en redes. ' +
        'No se cargan hasta que las aceptes y puedes usar todo el sitio sin ellas. ' +
        '<a href="' + URL_PRIVACIDAD + '">Ver política de privacidad</a>.' +
      '</div>' +
      '<div class="aviso-cookies-botones">' +
        '<button type="button" class="btn btn-chico" data-cookies="aceptar">Aceptar</button>' +
        '<button type="button" class="btn btn-secundario btn-chico" data-cookies="rechazar">Rechazar</button>' +
      '</div>';

    aviso.addEventListener("click", function (e) {
      var boton = e.target.closest("[data-cookies]");
      if (!boton) return;
      decidir(boton.getAttribute("data-cookies") === "aceptar");
    });

    document.body.appendChild(aviso);
    return aviso;
  }

  function mostrar() {
    construir();
    /* Se fuerza un reflujo para que la transición de entrada se vea. No se usa
       requestAnimationFrame porque no corre mientras la pestaña está en
       segundo plano, y el aviso quedaría sin aparecer. */
    void aviso.offsetHeight;
    aviso.classList.add("visible");
    /* El botón flotante de WhatsApp se corre hacia arriba mientras el aviso
       esté en pantalla, para que no queden uno encima del otro. */
    document.body.classList.add("cookies-visibles");
  }

  function ocultar() {
    if (aviso) aviso.classList.remove("visible");
    document.body.classList.remove("cookies-visibles");
  }

  function decidir(acepta) {
    guardar(acepta ? ACEPTADAS : RECHAZADAS);
    ocultar();
    /* Al aceptar, el píxel arranca de inmediato, sin recargar la página.
       Al rechazar no se hace nada: nunca llegó a cargarse. */
    if (acepta && typeof window.iniciarPixel === "function") window.iniciarPixel();
    pintarEstado();
  }

  window.abrirPreferenciasCookies = function () {
    mostrar();
    if (aviso) aviso.scrollIntoView({ block: "nearest" });
  };

  /* ---------- estado en la página de privacidad ---------- */
  function pintarEstado() {
    var el = document.getElementById("estado-cookies");
    if (!el) return;
    var v = leer();
    el.textContent =
      v === ACEPTADAS ? "Actualmente las tienes aceptadas." :
      v === RECHAZADAS ? "Actualmente las tienes rechazadas: no se carga ningún rastreador." :
      "Todavía no has elegido.";
  }

  /* ---------- inicio ---------- */
  function iniciar() {
    pintarEstado();
    if (enIframe) return;
    if (leer()) return;      /* ya decidió en una visita anterior */
    mostrar();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
