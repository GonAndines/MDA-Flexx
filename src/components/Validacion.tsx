"use client";

import { useEffect } from "react";

/**
 * Mantiene aria-invalid en sincronía con :user-invalid: lo que se ve y lo que anuncia el
 * lector de pantalla tienen que cambiar en el mismo momento. Sin esto, Chromium no anuncia
 * un campo requerido que quedó vacío después de interactuar, y Firefox y Safari lo anuncian
 * como inválido desde que se carga la página.
 */
export function Validacion() {
  useEffect(() => {
    // Sin soporte nativo de :user-invalid no hay estado visual que sincronizar.
    if (!CSS.supports("selector(:user-invalid)")) return;

    const sincronizar = (el: EventTarget | null) => {
      if (!(el instanceof HTMLElement) || !el.matches("input, select, textarea")) return;
      el.setAttribute("aria-invalid", el.matches(":user-invalid") ? "true" : "false");
    };

    // Arranca en "false": un campo requerido vacío no es un error hasta que se interactúa.
    document.querySelectorAll<HTMLElement>("input, select, textarea").forEach(sincronizar);

    // Al salir del campo y al enviar el formulario aparece el error; al escribir se corrige.
    const alSalir = (e: Event) => sincronizar(e.target);
    const alEscribir = (e: Event) => sincronizar(e.target);
    const alResetear = (e: Event) => {
      // El reset limpia el estado del navegador después del evento: hay que esperarlo.
      const form = e.target;
      if (form instanceof HTMLFormElement) setTimeout(() => form.querySelectorAll("input, select, textarea").forEach(sincronizar));
    };

    document.addEventListener("blur", alSalir, true);
    document.addEventListener("change", alSalir, true);
    document.addEventListener("input", alEscribir);
    document.addEventListener("invalid", alSalir, true);
    document.addEventListener("reset", alResetear, true);
    return () => {
      document.removeEventListener("blur", alSalir, true);
      document.removeEventListener("change", alSalir, true);
      document.removeEventListener("input", alEscribir);
      document.removeEventListener("invalid", alSalir, true);
      document.removeEventListener("reset", alResetear, true);
    };
  }, []);

  return null;
}
