export const THEME_KEY = "theme";

/**
 * Corre antes de hidratar (next/script beforeInteractive en el layout) para que la
 * página nunca parpadee en el tema equivocado. Sin preferencia guardada, sigue al sistema.
 */
export const THEME_SCRIPT = `(function(){try{var k="${THEME_KEY}",m=matchMedia("(prefers-color-scheme: dark)"),r=document.documentElement;function a(){var t=localStorage.getItem(k);r.classList.toggle("dark",t?t==="dark":m.matches)}a();m.addEventListener("change",a)}catch(e){}})()`;
