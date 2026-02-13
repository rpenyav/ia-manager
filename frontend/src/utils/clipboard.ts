import { emitToast } from "../toast";

export async function copyToClipboard(value: string, label = "Texto") {
  if (typeof window === "undefined") {
    return;
  }
  let copied = false;

  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      copied = true;
    } catch (err) {
      copied = false;
    }
  }

  if (!copied) {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      copied = document.execCommand("copy");
      document.body.removeChild(textarea);
    } catch (err) {
      copied = false;
    }
  }

  emitToast(copied ? `${label} copiado` : "No se pudo copiar", copied ? "info" : "error");
}
