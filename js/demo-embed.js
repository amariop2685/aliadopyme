/* ============================================================
   Arranque de la demo interactiva embebida — AliadoPyme

   La demo (conciliago-extension.html) va dentro de un iframe. Ese
   iframe puede cargarse mucho antes de que la persona llegue a esa
   altura de la página, y entonces la demostración se reproduciría
   a sus espaldas. Por eso aquí se espera a que el marco entre en
   pantalla y recién ahí se le avisa que empiece.

   Funciona en cualquier página que tenga un .demo-ventana con un
   iframe dentro; sirve igual para la portada y para el landing.
   ============================================================ */
(function () {
  "use strict";

  var marco = document.querySelector(".demo-ventana");
  var frame = marco && marco.querySelector("iframe");
  if (!marco || !frame || !("IntersectionObserver" in window)) return;

  var visible = false, avisado = false;

  function avisar() {
    if (avisado || !visible) return;
    var w = frame.contentWindow;
    /* El iframe puede no haber terminado de cargar: se reintenta. */
    if (!w || typeof w.iniciarDemostracion !== "function") {
      setTimeout(avisar, 300);
      return;
    }
    avisado = true;
    setTimeout(function () {
      w.postMessage({ conciliago: "iniciar" }, location.origin);
    }, 900);
  }

  frame.addEventListener("load", avisar);

  var io = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (e) {
      if (e.isIntersecting) { visible = true; io.disconnect(); avisar(); }
    });
  }, { threshold: 0.4 });

  io.observe(marco);
})();
