/* ==========================================================
   SOFTmercio - Animaciones del sitio
   - Aparición de elementos al hacer scroll (escalonada)
   - Títulos que suben línea por línea
   - Números que cuentan hacia arriba
   - Barra de progreso de lectura
   - Menú que se esconde al bajar y aparece al subir
   - Luz que sigue al mouse en las tarjetas
   Si el usuario pidió "reducir movimiento", todo se muestra
   directo y sin animaciones.
   ========================================================== */
(function () {
  var raiz = document.documentElement;
  var reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Avisamos al CSS que JavaScript sí funciona
  raiz.classList.add("js");

  /* ---------- 1. Títulos: cada línea sube desde abajo ---------- */
  var titulos = document.querySelectorAll(
    ".portada-texto h1, .banner-texto h1, .franja h2, .titulo-grande, .pie-firma h2"
  );
  titulos.forEach(function (titulo) {
    var lineas = titulo.innerHTML.split(/<br\s*\/?>/i);
    titulo.innerHTML = lineas
      .map(function (linea, i) {
        return '<span class="linea"><span style="--i:' + i + '">' + linea.trim() + "</span></span>";
      })
      .join("");
    titulo.classList.add("titulo-animado");
  });

  /* ---------- 2. Elementos que aparecen al hacer scroll ---------- */
  var selectores = [
    // Solo se animan los títulos, las imágenes y los datos;
    // el texto corrido aparece quieto para que la página se lea tranquila.
    ".intro h2", ".encabezado-seccion h2", ".nosotros-texto h2",
    ".seccion-tabla h2", "#preguntas h2", "#contacto h2", ".servicio-texto h3",
    ".columna", ".servicio-imagen", ".proyecto", ".nosotros-imagen",
    ".paso", ".cifra", ".caja-experiencia",
    ".titulo-animado", "#nosotros"
  ];
  var elementos = document.querySelectorAll(selectores.join(","));

  elementos.forEach(function (el) {
    el.classList.add("revelar");
    // Retraso escalonado entre hermanos (tarjetas, columnas, pasos...)
    var hermanos = Array.prototype.filter.call(el.parentElement.children, function (h) {
      return h.matches(selectores.join(","));
    });
    var posicion = hermanos.indexOf(el);
    el.style.setProperty("--retraso", Math.min(posicion, 6) * 0.09 + "s");
  });

  // La portada y los banners se animan apenas carga la página
  document.querySelectorAll(".portada-texto .revelar, .banner-texto .revelar").forEach(function (el) {
    requestAnimationFrame(function () {
      el.classList.add("visible");
    });
  });

  if (reducir || !("IntersectionObserver" in window)) {
    elementos.forEach(function (el) { el.classList.add("visible"); });
  } else {
    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (entrada.isIntersecting) {
          entrada.target.classList.add("visible");
          contar(entrada.target);
          observador.unobserve(entrada.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

    elementos.forEach(function (el) { observador.observe(el); });
  }

  /* ---------- 3. Números que cuentan hacia arriba ---------- */
  function contar(contenedor) {
    if (reducir) return;
    var numeros = contenedor.querySelectorAll
      ? contenedor.querySelectorAll(".cifra strong, .caja-experiencia strong, .paso strong")
      : [];
    if (contenedor.matches(".cifra, .caja-experiencia, .paso")) {
      numeros = contenedor.querySelectorAll("strong");
    }
    numeros.forEach(function (n) {
      if (n.dataset.contado) return;
      var nodo = n.firstChild;
      if (!nodo || nodo.nodeType !== 3) return;          // solo el texto inicial
      var coincidencia = nodo.nodeValue.match(/^(\d+)(.*)$/);
      if (!coincidencia) return;
      n.dataset.contado = "1";
      var final = parseInt(coincidencia[1], 10);
      // Solo rellena con ceros si el número original los tenía ("01"), no en "100"
      var ceros = coincidencia[1].charAt(0) === "0" ? coincidencia[1].length : 0;
      var resto = coincidencia[2];
      var inicio = null;
      var duracion = 1400;
      function paso(t) {
        if (!inicio) inicio = t;
        var avance = Math.min((t - inicio) / duracion, 1);
        var suave = 1 - Math.pow(1 - avance, 3);           // frena al final
        var valor = String(Math.round(final * suave));
        while (valor.length < ceros) valor = "0" + valor;
        nodo.nodeValue = valor + resto;
        if (avance < 1) requestAnimationFrame(paso);
      }
      requestAnimationFrame(paso);
    });
  }

  if (reducir) return;

  /* ---------- 4. Barra de progreso de lectura ---------- */
  var barra = document.createElement("div");
  barra.id = "progreso";
  document.body.appendChild(barra);

  /* ---------- 5. Menú que se esconde al bajar ---------- */
  var encabezado = document.getElementById("encabezado");
  var ultimoScroll = 0;
  var pendiente = false;

  function alHacerScroll() {
    var y = window.scrollY;
    var alto = document.documentElement.scrollHeight - window.innerHeight;
    barra.style.transform = "scaleX(" + (alto > 0 ? y / alto : 0) + ")";
    if (encabezado) {
      encabezado.classList.toggle("oculto", y > 160 && y > ultimoScroll);
      encabezado.classList.toggle("con-fondo", y > 40);
    }
    ultimoScroll = y;
    pendiente = false;
  }

  window.addEventListener("scroll", function () {
    if (!pendiente) {
      pendiente = true;
      requestAnimationFrame(alHacerScroll);
    }
  }, { passive: true });

  /* ---------- 6. Luz que sigue al mouse en las tarjetas ---------- */
  if (window.matchMedia("(hover: hover)").matches) {
    document.querySelectorAll(".tarjeta, .bento-item, .proyecto, .columna").forEach(function (tarjeta) {
      tarjeta.addEventListener("pointermove", function (e) {
        var r = tarjeta.getBoundingClientRect();
        tarjeta.style.setProperty("--x", e.clientX - r.left + "px");
        tarjeta.style.setProperty("--y", e.clientY - r.top + "px");
      });
      tarjeta.addEventListener("pointerleave", function () {
        tarjeta.style.removeProperty("--x");
        tarjeta.style.removeProperty("--y");
      });
    });
  }

  /* ==========================================================
     ANIMACIONES EXTRA
     ========================================================== */
  var conMouse = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- 7. Subtítulos que aparecen palabra por palabra ---------- */
  function partirPalabras(nodo, contador) {
    Array.prototype.slice.call(nodo.childNodes).forEach(function (hijo) {
      if (hijo.nodeType === 3) {                       // texto
        var trozos = hijo.nodeValue.split(/(\s+)/);
        var frag = document.createDocumentFragment();
        trozos.forEach(function (t) {
          if (!t) return;
          if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(t)); return; }
          var span = document.createElement("span");
          span.className = "palabra";
          span.style.setProperty("--p", contador.n++);
          span.textContent = t;
          frag.appendChild(span);
        });
        nodo.replaceChild(frag, hijo);
      } else if (hijo.nodeType === 1) {                // <em>, <br>...
        partirPalabras(hijo, contador);
      }
    });
  }
  document.querySelectorAll(
    ".intro h2, .encabezado-seccion h2, .nosotros-texto h2, .seccion-tabla h2, #preguntas h2, #contacto h2, .servicio-texto h3"
  ).forEach(function (h) {
    partirPalabras(h, { n: 0 });
    h.classList.add("por-palabras");
  });

  /* ---------- 8. Tarjetas que se inclinan en 3D con el mouse ---------- */
  if (conMouse) {
    document.querySelectorAll(".tarjeta, .bento-item, .proyecto, .columna").forEach(function (t) {
      t.addEventListener("pointermove", function (e) {
        var r = t.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;   // -0.5 a 0.5
        var y = (e.clientY - r.top) / r.height - 0.5;
        t.style.transform = "perspective(900px) rotateX(" + (-y * 6).toFixed(2) + "deg) rotateY(" +
          (x * 8).toFixed(2) + "deg) translateY(-6px)";
      });
      t.addEventListener("pointerleave", function () {
        t.style.transform = "";
      });
    });
  }

  /* ---------- 9. Botones "magnéticos" que siguen un poco al cursor ---------- */
  if (conMouse) {
    document.querySelectorAll(".boton, .boton-menu.externo").forEach(function (b) {
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        var x = e.clientX - (r.left + r.width / 2);
        var y = e.clientY - (r.top + r.height / 2);
        b.style.translate = (x * 0.25).toFixed(1) + "px " + (y * 0.35).toFixed(1) + "px";
      });
      b.addEventListener("pointerleave", function () {
        b.style.translate = "";
      });
    });
  }

  /* ---------- 10. Portada con profundidad al mover el mouse ---------- */
  var portada = document.querySelector("#portada, .banner");
  if (portada && conMouse) {
    var fondo = portada.querySelector("img");
    var texto = portada.querySelector(".portada-texto, .banner-texto");
    portada.addEventListener("pointermove", function (e) {
      var x = e.clientX / window.innerWidth - 0.5;
      var y = e.clientY / window.innerHeight - 0.5;
      if (fondo) fondo.style.translate = (x * -24).toFixed(1) + "px " + (y * -18).toFixed(1) + "px";
      if (texto) texto.style.translate = (x * 14).toFixed(1) + "px " + (y * 10).toFixed(1) + "px";
    });
    portada.addEventListener("pointerleave", function () {
      if (fondo) fondo.style.translate = "";
      if (texto) texto.style.translate = "";
    });
  }

  /* ---------- 11. Imágenes con efecto "parallax" al bajar ---------- */
  var paralaje = document.querySelectorAll(".nosotros-imagen img, .servicio-imagen img");
  function moverParalaje() {
    var alto = window.innerHeight;
    paralaje.forEach(function (img) {
      var r = img.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > alto) return;
      var avance = (r.top + r.height / 2 - alto / 2) / alto;   // -1 a 1
      img.style.translate = "0 " + (avance * -40).toFixed(1) + "px";
    });
  }

  /* ---------- 12. La cinta de tecnologías acelera con el scroll ---------- */
  var pista = document.querySelector(".cinta-pista");
  var animCinta = pista && pista.getAnimations ? pista.getAnimations()[0] : null;
  var yAnterior = window.scrollY;
  var velocidad = 1;

  function cadaCuadro() {
    var y = window.scrollY;
    var objetivo = 1 + Math.min(Math.abs(y - yAnterior) * 0.15, 5);
    velocidad += (objetivo - velocidad) * 0.08;               // suaviza el cambio
    if (animCinta) animCinta.playbackRate = velocidad;
    yAnterior = y;
    moverParalaje();
    requestAnimationFrame(cadaCuadro);
  }
  requestAnimationFrame(cadaCuadro);

})();
