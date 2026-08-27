import { VERSION, encodeEnvelope } from "./sigil.js";

const form = document.querySelector("#codec-form");
const output = document.querySelector("#wire");
const copyButton = document.querySelector("#copy");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    output.textContent = encodeEnvelope({
      sigil: VERSION,
      sender: document.querySelector("#sender").value,
      seq: Number(document.querySelector("#seq").value),
      verb: document.querySelector("#verb").value,
      body: JSON.parse(document.querySelector("#body").value),
    });
    output.dataset.error = "false";
  } catch (error) {
    output.textContent = error instanceof Error ? error.message : "Could not encode message";
    output.dataset.error = "true";
  }
});

copyButton.addEventListener("click", async () => {
  if (!output.textContent.startsWith("SIGIL1.")) return;
  await navigator.clipboard.writeText(output.textContent);
  copyButton.textContent = "Copied";
  setTimeout(() => { copyButton.textContent = "Copy"; }, 1200);
});
