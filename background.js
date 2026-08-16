const DEFAULT_HOSTS = [];

const STORAGE_KEY = "hosts";

function buildRules(hosts) {
  const responseHeaders = [
    { header: "Access-Control-Allow-Origin", operation: "set", value: "*" },
    {
      header: "Access-Control-Allow-Methods",
      operation: "set",
      value: "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD",
    },
    { header: "Access-Control-Allow-Headers", operation: "set", value: "*" },
    { header: "Access-Control-Max-Age", operation: "set", value: "86400" },
  ];

  return hosts.map((host, index) => ({
    id: index + 1,
    priority: 1,
    action: { type: "modifyHeaders", responseHeaders },
    condition: {
      urlFilter: "||" + host + "/*",
      resourceTypes: ["xmlhttprequest", "main_frame", "sub_frame"],
    },
  }));
}

function parseHost(input) {
  let h = input.trim();
  if (!h) return null;
  h = h.replace(/^https?:\/\//i, "");
  h = h.replace(/\/.*$/, "");
  if (!h) return null;
  return h;
}

let applyChain = Promise.resolve();

function applyRules(hosts) {
  applyChain = applyChain
    .then(async () => {
      const rules = buildRules(hosts);
      const existing = await chrome.declarativeNetRequest.getDynamicRules();
      const removeRuleIds = existing.map((r) => r.id);
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds,
        addRules: rules,
      });
    })
    .catch((e) => console.error("applyRules failed:", e));
  return applyChain;
}

async function syncRules() {
  const stored = await chrome.storage.sync.get(STORAGE_KEY);
  const hosts = Array.isArray(stored[STORAGE_KEY])
    ? stored[STORAGE_KEY]
    : DEFAULT_HOSTS;
  await applyRules(hosts);
}

chrome.runtime.onInstalled.addListener(syncRules);
chrome.runtime.onStartup.addListener(syncRules);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes[STORAGE_KEY]) {
    const hosts = Array.isArray(changes[STORAGE_KEY].newValue)
      ? changes[STORAGE_KEY].newValue
      : DEFAULT_HOSTS;
    applyRules(hosts);
  }
});

syncRules();

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "getHosts") {
    (async () => {
      const stored = await chrome.storage.sync.get(STORAGE_KEY);
      const hosts = Array.isArray(stored[STORAGE_KEY])
        ? stored[STORAGE_KEY]
        : DEFAULT_HOSTS;
      sendResponse({ hosts });
    })();
    return true;
  }
  if (msg && msg.type === "addHost") {
    (async () => {
      const host = parseHost(msg.host);
      if (!host) {
        sendResponse({ ok: false, error: "Invalid host" });
        return;
      }
      const stored = await chrome.storage.sync.get(STORAGE_KEY);
      const hosts = Array.isArray(stored[STORAGE_KEY])
        ? stored[STORAGE_KEY]
        : DEFAULT_HOSTS;
      if (hosts.includes(host)) {
        sendResponse({ ok: false, error: "Already present" });
        return;
      }
      hosts.push(host);
      await chrome.storage.sync.set({ [STORAGE_KEY]: hosts });
      sendResponse({ ok: true, hosts });
    })();
    return true;
  }
  if (msg && msg.type === "removeHost") {
    (async () => {
      const stored = await chrome.storage.sync.get(STORAGE_KEY);
      const hosts = Array.isArray(stored[STORAGE_KEY])
        ? stored[STORAGE_KEY]
        : DEFAULT_HOSTS;
      const next = hosts.filter((h) => h !== msg.host);
      await chrome.storage.sync.set({ [STORAGE_KEY]: next });
      try {
        await chrome.permissions.remove({
          origins: ["https://" + msg.host + "/*", "http://" + msg.host + "/*"],
        });
      } catch (e) {
        console.error("permissions.remove failed:", e);
      }
      sendResponse({ ok: true, hosts: next });
    })();
    return true;
  }
});
