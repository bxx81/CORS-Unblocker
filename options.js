const input = document.getElementById("hostInput");
const addBtn = document.getElementById("addBtn");
const listEl = document.getElementById("list");
const msgEl = document.getElementById("msg");

const DEFAULTS = [];

function parseInput(input) {
  let h = input.trim();
  if (!h) return null;
  h = h.replace(/\/.*$/, "");
  if (!/^https?:\/\//i.test(h)) h = "https://" + h;
  return h;
}

function showMsg(text, ok) {
  msgEl.textContent = text;
  msgEl.className = "msg " + (ok ? "ok" : "err");
  if (text)
    setTimeout(() => {
      msgEl.textContent = "";
    }, 3000);
}

async function refresh() {
  const res = await chrome.runtime.sendMessage({ type: "getHosts" });
  const hosts = res.hosts || [];
  listEl.innerHTML = "";
  hosts.forEach((h) => {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = h;
    const btn = document.createElement("button");
    btn.className = "remove";
    btn.textContent = "Remove";
    btn.addEventListener("click", async () => {
      await chrome.runtime.sendMessage({ type: "removeHost", host: h });
      refresh();
    });
    li.appendChild(span);
    li.appendChild(btn);
    listEl.appendChild(li);
  });
  if (hosts.length === 0) {
    listEl.innerHTML = "<li>No hosts configured.</li>";
  }
}

addBtn.addEventListener("click", async () => {
  const url = parseInput(input.value);
  if (!url) {
    showMsg("Invalid host", false);
    return;
  }
  const granted = await chrome.permissions.request({ origins: [url + "/*"] });
  if (!granted) {
    showMsg("Permission denied for " + url, false);
    return;
  }
  const res = await chrome.runtime.sendMessage({ type: "addHost", host: url });
  if (res.ok) {
    input.value = "";
    showMsg("Added " + url, true);
    refresh();
  } else {
    showMsg(res.error || "Failed to add", false);
  }
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addBtn.click();
});

refresh();
