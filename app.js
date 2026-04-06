

// ===== manual update control =====
async function manualUpdate() {
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return;

  await reg.update();

  if (reg.waiting) {
    reg.waiting.postMessage("SKIP_WAITING");
    setTimeout(() => location.reload(), 500);
  }
}

// version handling
const LOCAL_VERSION_KEY = "app_version";

async function loadVersion() {
  const current = localStorage.getItem(LOCAL_VERSION_KEY) || "1.0.0";
  document.getElementById("currentVersion").textContent = current;

  try {
    const res = await fetch("version.json", { cache: "no-store" });
    const data = await res.json();

    document.getElementById("latestVersion").textContent = data.version;

    if (data.version !== current) {
      document.getElementById("updateBtn").disabled = false;
      document.getElementById("updateBtn").onclick = async () => {
        localStorage.setItem(LOCAL_VERSION_KEY, data.version);
        await manualUpdate();
      };
    }
  } catch (e) {}
}

window.addEventListener("load", loadVersion);
