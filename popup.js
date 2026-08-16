const listEl = document.getElementById("list");
const openBtn = document.getElementById("openOptions");

async function refresh() {
  const res = await chrome.runtime.sendMessage({ type: "getHosts" });
  const hosts = res.hosts || [];
  if (hosts.length === 0) {
    listEl.innerHTML = '<span class="empty">No hosts configured</span>';
    return;
  }
  const ul = document.createElement("ul");
  hosts.forEach((h) => {
    const li = document.createElement("li");
    li.textContent = h;
    ul.appendChild(li);
  });
  listEl.innerHTML = "";
  listEl.appendChild(ul);
}

openBtn.addEventListener("click", () => chrome.runtime.openOptionsPage());

refresh();
