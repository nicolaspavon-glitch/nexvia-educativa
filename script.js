/* ============================================================
   MENÚ PARA CELULAR
   ============================================================ */

/*
   Más adelante vamos a utilizar este espacio para hacer
   funcionar correctamente el menú de navegación del celular.
*/


/* ============================================================
   PREGUNTAS FRECUENTES / FAQ
   ============================================================ */

document.addEventListener("DOMContentLoaded", function () {

    const preguntasFAQ = document.querySelectorAll(".faq-pregunta");

    preguntasFAQ.forEach(function (pregunta) {

        pregunta.addEventListener("click", function () {

            const respuesta = this.nextElementSibling;

            if (respuesta.style.display === "block") {
                respuesta.style.display = "none";
            } else {
                respuesta.style.display = "block";
            }

        });

    });

});
const botonMenu = document.querySelector(".menu-movil");
const menu = document.querySelector(".menu");

botonMenu.addEventListener("click", function () {
    menu.classList.toggle("menu-abierto");
});