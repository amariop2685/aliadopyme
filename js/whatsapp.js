/* ============================================================
   Botón flotante de WhatsApp — AliadoPyme

   Aparece en todas las páginas, con un mensaje distinto según
   dónde esté la persona: no es lo mismo quien venía probando
   LiquidaGO que quien estaba leyendo sobre Ley Karin.

   El número sale de js/config.js, así que se cambia en un solo
   lugar. Requiere que config.js se cargue antes.
   ============================================================ */
(function () {
  "use strict";

  /* Dentro de un iframe (la demo embebida) no se muestra:
     ya está en la página que la contiene. */
  if (window.self !== window.top) return;
  if (typeof CONFIG === "undefined" || !CONFIG.WHATSAPP) return;

  var pagina = (location.pathname.split("/").pop() || "index.html").replace(".html", "");

  var MENSAJES = {
    "liquidago":
      "Hola AliadoPyme, estuve probando LiquidaGO y quiero consultar por el servicio de remuneraciones para mi empresa.",
    "conciliacion-bancaria":
      "Hola AliadoPyme, vi la demo de ConciliaGO y quiero activar la prueba gratis de 15 días para mi empresa.",
    "conciliago-extension":
      "Hola AliadoPyme, vi la demo de ConciliaGO y quiero activar la prueba gratis de 15 días para mi empresa.",
    "legal":
      "Hola AliadoPyme, necesito asesoría legal laboral. Mi consulta es sobre: ",
    "prevencion":
      "Hola AliadoPyme, necesito un prevencionista de riesgos para mi empresa. Somos ",
    "tecnologia":
      "Hola AliadoPyme, quiero consultar por servicios de tecnología. Lo que necesito es: ",
    "pagina-web-gratis":
      "Hola AliadoPyme, vi lo de la página web sin costo y quiero uno de los cupos. Mi empresa es: ",
    "privacidad":
      "Hola AliadoPyme, tengo una consulta sobre el tratamiento de mis datos.",
    "404":
      "Hola AliadoPyme, estaba buscando información en el sitio y quiero consultar por: "
  };

  /* Botones del contenido con su propio mensaje: <a data-whatsapp="Hola..."> */
  var conMensaje = document.querySelectorAll("a[data-whatsapp]");
  for (var i = 0; i < conMensaje.length; i++) {
    conMensaje[i].href = "https://wa.me/" + CONFIG.WHATSAPP + "?text=" +
                         encodeURIComponent(conMensaje[i].getAttribute("data-whatsapp"));
  }

  var POR_DEFECTO =
    "Hola AliadoPyme, quiero cotizar un servicio para mi empresa. Somos ";

  var boton = document.createElement("a");
  boton.className = "wa-flotante";
  boton.href = "https://wa.me/" + CONFIG.WHATSAPP + "?text=" +
               encodeURIComponent(MENSAJES[pagina] || POR_DEFECTO);
  boton.target = "_blank";
  boton.rel = "noopener";
  boton.setAttribute("aria-label", "Escribirnos por WhatsApp");
  boton.innerHTML =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>' +
    '</svg>' +
    '<span>¿Hablamos?</span>';

  document.body.appendChild(boton);
})();
