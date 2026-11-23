const http = require("http");
const crypto = require("crypto");

const PORT = 8081;
const LINK_LIFETIME_MS = 10 * 60 * 1000;

let people = [
  { id: "bonheur", name: "Bonheur", email: "", memberNo: "KT-001", type: "Student", active: true, location: null, expiresAt: Date.now() + LINK_LIFETIME_MS },
  { id: "serge", name: "Serge", email: "", memberNo: "KT-003", type: "Student", active: true, location: null, expiresAt: Date.now() + LINK_LIFETIME_MS }
];

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function slugify(value) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}

function uniqueId(name) {
  const base = slugify(name) || "person";
  let id = base;
  let suffix = 2;
  while (people.some(person => person.id === id)) id = `${base}-${suffix++}`;
  return id;
}

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase();
}

function page(title, body) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    :root { --orange:#f5a524; --ink:#18202f; --muted:#7d879c; --line:#e9edf5; --blue:#eef4ff; --green:#eaf8ef; --red:#fff0f1; }
    * { box-sizing:border-box; }
    body { margin:0; font-family:Inter,Segoe UI,Arial,sans-serif; color:var(--ink); background:#f7f8fb; }
    button,input,select { font:inherit; }
    button { cursor:pointer; }
    .shell { min-height:100vh; }
    .rail { position:fixed; z-index:30; left:0; top:0; width:280px; height:100vh; background:#fff; border-right:1px solid var(--line); display:flex; flex-direction:column; overflow:hidden; }
    .brand-row { height:96px; border-bottom:1px solid var(--line); display:flex; align-items:center; padding:0 24px; }
    .brand-mark { width:44px; height:44px; border-radius:13px; background:var(--orange); display:grid; place-items:center; color:#18202f; font-weight:900; font-size:18px; }
    .brand-copy { margin-left:12px; }
    .brand-copy strong { display:block; font-size:18px; }
    .brand-copy span { color:#8b95a7; font-size:12px; }
    .rail-nav { width:100%; display:flex; flex-direction:column; gap:8px; padding:28px 20px; }
    .rail-button { width:240px; height:58px; border:0; border-radius:18px; background:transparent; color:#252a31; display:flex; align-items:center; gap:22px; padding:0 24px; white-space:nowrap; text-align:left; }
    .rail-button.active { background:var(--orange); color:#151515; }
    .rail-button:not(.active):hover { background:#f7f8fb; }
    .rail-button .nav-icon { min-width:22px; text-align:center; font-size:20px; color:#4f5968; }
    .rail-button.active .nav-icon { color:#151515; }
    .nav-label { font-size:20px; font-weight:650; }
    .account { margin-top:auto; height:116px; border-top:1px solid var(--line); display:flex; align-items:center; gap:12px; padding:20px 22px; }
    .account-avatar { width:48px; height:48px; border-radius:50%; background:#202b3c; color:#fff; display:grid; place-items:center; font-weight:800; }
    .account-copy strong { display:block; font-size:15px; }
    .account-copy span { color:#7d879c; font-size:12px; }
    .main { min-width:0; margin-left:280px; }
    .topbar { height:64px; background:#fff; border-bottom:1px solid var(--line); display:flex; align-items:center; gap:16px; padding:0 28px; position:sticky; top:0; z-index:10; }
    .search { position:relative; width:min(330px,35vw); }
    .search input { width:100%; height:42px; border:1px solid var(--line); border-radius:8px; padding:0 16px 0 42px; background:#fff; outline:none; }
    .search span { position:absolute; left:15px; top:11px; color:#98a1b3; }
    .filters { display:flex; gap:8px; margin-left:auto; }
    .filter { height:42px; border:1px solid var(--line); border-radius:8px; background:#fff; padding:0 14px; color:#69748a; }
    .content { padding:24px 28px 40px; }
    .unit-card { background:#fff; border:1px solid var(--line); border-radius:10px; margin-bottom:22px; box-shadow:0 4px 15px rgba(30,45,75,.03); }
    .unit-header { display:flex; align-items:center; gap:12px; padding:18px 20px 14px; border-bottom:1px solid var(--line); }
    .unit-header h1 { font-size:20px; margin:0; }
    .eyebrow { color:#8290a8; background:#eff3fa; border-radius:999px; padding:5px 9px; font-size:11px; font-weight:800; }
    .actions { display:flex; gap:8px; padding:14px 20px 0; flex-wrap:wrap; }
    .btn { border:1px solid #ccd3df; background:#fff; min-height:38px; border-radius:7px; padding:0 13px; color:#344054; font-weight:700; display:inline-flex; align-items:center; gap:7px; text-decoration:none; }
    .btn.primary { background:var(--orange); border-color:var(--orange); color:#172033; }
    .btn.danger { color:#f04458; border-color:#ffd2d7; background:#fff7f8; }
    .stats { display:grid; grid-template-columns:1fr 1fr; gap:12px; padding:18px 20px 20px; }
    .stat { border:1px solid var(--line); border-radius:8px; min-height:72px; display:flex; align-items:center; gap:13px; padding:14px; }
    .stat-icon { width:40px; height:40px; border-radius:50%; background:#fff5df; color:#f28a00; display:grid; place-items:center; }
    .stat strong { display:block; font-size:20px; }
    .stat span { color:#8a94a7; font-size:13px; }
    .table-card { background:#fff; border:1px solid var(--line); border-radius:10px; overflow:hidden; box-shadow:0 4px 15px rgba(30,45,75,.03); }
    .view { display:none; }
    .view.active { display:block; }
    .panel { background:#fff; border:1px solid var(--line); border-radius:10px; padding:20px; }
    .panel h2 { margin:0 0 18px; font-size:18px; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
    .activity-row { min-height:64px; border-bottom:1px solid var(--line); display:flex; align-items:center; justify-content:space-between; }
    .table-head { height:58px; display:flex; align-items:center; justify-content:space-between; padding:0 20px; border-bottom:1px solid var(--line); }
    .table-head h2 { font-size:15px; margin:0; }
    table { width:100%; border-collapse:collapse; }
    th { height:48px; text-align:left; color:#8b96aa; font-size:11px; letter-spacing:.05em; text-transform:uppercase; font-weight:800; background:#fbfcfe; }
    th,td { padding:0 20px; border-bottom:1px solid var(--line); }
    td { height:68px; font-size:13px; }
    tbody tr:hover { background:#fcfdff; }
    .member { display:flex; align-items:center; gap:11px; }
    .avatar { width:38px; height:38px; border-radius:50%; background:#202b3c; color:#fff; display:grid; place-items:center; font-size:12px; font-weight:800; }
    .badge { display:inline-flex; align-items:center; border-radius:999px; padding:5px 8px; font-size:10px; font-weight:800; text-transform:uppercase; }
    .badge.type { color:#3d70ca; background:var(--blue); }
    .badge.live { color:#168947; background:var(--green); }
    .badge.offline { color:#7b8494; background:#eef1f5; }
    .row-actions { display:flex; align-items:center; gap:10px; white-space:nowrap; }
    .icon-btn { width:30px; height:30px; border:0; background:transparent; color:#8b95a7; display:grid; place-items:center; text-decoration:none; }
    .icon-btn.danger { color:#f04458; }
    .location-cell { max-width:260px; color:#667085; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    dialog { width:min(480px,calc(100vw - 32px)); border:0; border-radius:12px; padding:0; box-shadow:0 24px 70px rgba(25,35,55,.22); }
    dialog::backdrop { background:rgba(20,28,43,.32); backdrop-filter:blur(2px); }
    .dialog-head { display:flex; justify-content:space-between; align-items:center; padding:18px 20px; border-bottom:1px solid var(--line); }
    .dialog-head h2 { margin:0; font-size:18px; }
    .dialog-body { padding:20px; }
    .field { display:block; margin-bottom:14px; color:#667085; font-size:13px; font-weight:700; }
    .field input { width:100%; height:44px; border:1px solid var(--line); border-radius:8px; padding:0 12px; margin-top:7px; outline:none; }
    .field input:focus { border-color:#f5b43a; box-shadow:0 0 0 3px rgba(245,165,36,.12); }
    .dialog-actions { display:flex; justify-content:flex-end; gap:8px; padding:14px 20px; border-top:1px solid var(--line); }
    .consent { background:#f7f8fb; border-radius:8px; padding:12px; color:#667085; font-size:13px; line-height:1.5; }
    .empty { color:#98a2b3; }
    @media(max-width:900px) { .filters{display:none}.topbar{padding:0 16px}.content{padding:16px}.main{margin-left:220px}.stats{grid-template-columns:1fr}.table-card{overflow-x:auto}.rail{width:220px}.rail-nav{padding:20px 12px}.rail-button{width:196px}.brand-row{padding:0 24px}.account{padding:16px}.account-copy span{display:none}}
  </style>
</head>
<body>${body}</body>
</html>`;
}

function dashboard() {
  const sharingCount = people.filter(person => person.location).length;
  const rows = people.map(person => `
    <tr>
      <td><div class="member"><span class="avatar">${initials(person.name)}</span><strong>${escapeHtml(person.name)}</strong></div></td>
      <td>${escapeHtml(person.memberNo)}</td>
      <td><span class="badge type">${escapeHtml(person.type)}</span></td>
      <td><span class="badge ${person.location ? "live" : "offline"}">${person.location ? "sharing" : "inactive"}</span></td>
      <td class="location-cell" id="location-${person.id}">${person.location ? `${person.location.latitude.toFixed(5)}, ${person.location.longitude.toFixed(5)}` : '<span class="empty">No consent response</span>'}</td>
      <td><div class="row-actions">
        <a class="icon-btn" href="/share/${person.id}" title="Open ${escapeHtml(person.name)} sharing link" target="_blank">&#8599;</a>
        ${person.email ? `<a class="icon-btn" href="/email/${person.id}" title="Open email draft">&#9993;</a>` : ""}
        <button class="icon-btn" type="button" title="Copy link" onclick="copyLink('${person.id}')">&#10697;</button>
      </div></td>
    </tr>`).join("");

  return page("Location sharing administration", `
    <div class="shell">
      <aside class="rail">
        <div class="brand-row">
          <div class="brand-mark">L</div>
          <div class="brand-copy"><strong>Locate</strong><span>Consent sharing</span></div>
        </div>
        <nav class="rail-nav">
          <button class="rail-button active" data-view="dashboard" title="Dashboard" onclick="showView('dashboard', this)"><span class="nav-icon">&#9638;</span><span class="nav-label">Dashboard</span></button>
          <button class="rail-button" data-view="people" title="People" onclick="showView('people', this)"><span class="nav-icon">&#9787;</span><span class="nav-label">People</span></button>
          <button class="rail-button" data-view="invitations" title="Invitations" onclick="showView('invitations', this)"><span class="nav-icon">&#9993;</span><span class="nav-label">Invitations</span></button>
          <button class="rail-button" data-view="activity" title="Location activity" onclick="showView('activity', this)"><span class="nav-icon">&#9672;</span><span class="nav-label">Location activity</span></button>
          <button class="rail-button" data-view="settings" title="Settings" onclick="showView('settings', this)"><span class="nav-icon">&#9881;</span><span class="nav-label">Settings</span></button>
        </nav>
        <div class="account">
          <div class="account-avatar">LS</div>
          <div class="account-copy"><strong>Location Sender</strong><span>Sharing account</span></div>
        </div>
      </aside>
      <main class="main">
        <header class="topbar">
          <div class="search"><span>&#128269;</span><input id="search" placeholder="Search people by name..." oninput="filterPeople()"></div>
          <div class="filters">
            <button class="filter">All types &#8964;</button>
            <button class="filter">Active only &#8964;</button>
          </div>
        </header>
        <div class="content">
          <section id="view-dashboard" class="view active">
          <section class="unit-card">
            <div class="unit-header"><h1>Location sharing</h1><span class="eyebrow">CONSENT APP</span></div>
            <div class="actions">
              <button class="btn primary" onclick="document.getElementById('addDialog').showModal()">&#43; Add person</button>
              <button class="btn" onclick="location.reload()">&#8635; Refresh data</button>
              <button class="btn danger" onclick="stopAll()">Stop all sharing</button>
            </div>
            <div class="stats">
              <div class="stat"><span class="stat-icon">&#9787;</span><div><strong>${people.length}</strong><span>People</span></div></div>
              <div class="stat"><span class="stat-icon">&#9672;</span><div><strong id="sharingCount">${sharingCount}</strong><span>Currently sharing</span></div></div>
            </div>
          </section>
          </section>

          <section id="view-people" class="view">
          <section class="table-card">
            <div class="table-head"><h2>People</h2><span class="eyebrow">${people.length}</span></div>
            <table>
              <thead><tr><th>Person</th><th>Member no.</th><th>Type</th><th>Status</th><th>Location</th><th>Actions</th></tr></thead>
              <tbody id="peopleRows">${rows}</tbody>
            </table>
          </section>
          </section>

          <section id="view-invitations" class="view">
            <section class="panel">
              <h2>Send consent invitations</h2>
              <div class="form-grid">
                ${people.map(person => `
                  <div class="activity-row">
                    <div><strong>${escapeHtml(person.name)}</strong><br><small>${escapeHtml(person.email || "Email not added")}</small></div>
                    ${person.email ? `<a class="btn" href="/email/${person.id}">Open email draft</a>` : `<button class="btn" onclick="document.getElementById('addDialog').showModal()">Add email</button>`}
                  </div>`).join("")}
              </div>
              <div style="margin-top:18px"><button class="btn primary" onclick="document.getElementById('addDialog').showModal()">&#43; Add person</button></div>
            </section>
          </section>

          <section id="view-activity" class="view">
            <section class="panel">
              <h2>Location activity</h2>
              ${people.map(person => `
                <div class="activity-row">
                  <div><strong>${escapeHtml(person.name)}</strong><br><small>${person.location ? "Currently sharing" : "Not sharing"}</small></div>
                  <span class="badge ${person.location ? "live" : "offline"}">${person.location ? "Live" : "Inactive"}</span>
                </div>`).join("")}
            </section>
          </section>

          <section id="view-settings" class="view">
            <section class="panel">
              <h2>Sharing settings</h2>
              <label class="field">Consent link lifetime
                <select style="width:100%;height:44px;border:1px solid var(--line);border-radius:8px;padding:0 12px;margin-top:7px">
                  <option>10 minutes</option><option>30 minutes</option><option>1 hour</option>
                </select>
              </label>
              <div class="consent">Location sharing requires the recipient to confirm consent and approve browser permission.</div>
              <div style="margin-top:18px"><button class="btn danger" onclick="stopAll()">Stop all sharing</button></div>
            </section>
          </section>
        </div>
      </main>
    </div>

    <dialog id="addDialog">
      <form method="POST" action="/persons">
        <div class="dialog-head"><h2>Add person</h2><button class="icon-btn" type="button" onclick="this.closest('dialog').close()">&#10005;</button></div>
        <div class="dialog-body">
          <label class="field">Full name<input name="name" required maxlength="50" placeholder="Person name"></label>
          <label class="field">Email address<input name="email" type="email" required maxlength="254" placeholder="name@example.com"></label>
          <label class="field">Member number<input name="memberNo" maxlength="30" placeholder="KT-001"></label>
          <div class="consent">This creates an opt-in consent entry only. It does not create an email account or share location without browser permission.</div>
        </div>
        <div class="dialog-actions"><button class="btn" type="button" onclick="this.closest('dialog').close()">Cancel</button><button class="btn primary" type="submit">Create person</button></div>
      </form>
    </dialog>

    <dialog id="settingsDialog">
      <div class="dialog-head"><h2>Sharing settings</h2><button class="icon-btn" type="button" onclick="this.closest('dialog').close()">&#10005;</button></div>
      <div class="dialog-body">
        <label class="field">Consent link lifetime
          <select id="linkLifetime" style="width:100%;height:44px;border:1px solid var(--line);border-radius:8px;padding:0 12px;margin-top:7px">
            <option>10 minutes</option>
            <option>30 minutes</option>
            <option>1 hour</option>
          </select>
        </label>
        <div class="consent">Location sharing always requires the recipient to confirm consent and approve the browser permission prompt.</div>
      </div>
      <div class="dialog-actions"><button class="btn" type="button" onclick="this.closest('dialog').close()">Close</button></div>
    </dialog>

    <script>
      function showView(viewName, button) {
        document.querySelectorAll(".view").forEach(view => view.classList.remove("active"));
        document.getElementById("view-" + viewName).classList.add("active");
        document.querySelectorAll(".rail-button").forEach(item => item.classList.remove("active"));
        if (button) button.classList.add("active");
        history.replaceState(null, "", "#" + viewName);
      }

      function openViewFromHash() {
        const viewName = location.hash.replace("#", "") || "dashboard";
        const valid = ["dashboard", "people", "invitations", "activity", "settings"];
        const selected = valid.includes(viewName) ? viewName : "dashboard";
        const button = document.querySelector('[data-view="' + selected + '"]');
        showView(selected, button);
      }
      window.addEventListener("hashchange", openViewFromHash);
      openViewFromHash();
      function filterPeople() {
        const query = document.getElementById("search").value.toLowerCase();
        for (const row of document.querySelectorAll("#peopleRows tr")) {
          row.hidden = !row.textContent.toLowerCase().includes(query);
        }
      }
      function copyLink(id) {
        navigator.clipboard.writeText(location.origin + "/share/" + id);
      }
      async function stopAll() {
        await fetch("/stop-all", { method:"POST" });
        location.reload();
      }
      async function refreshLocations() {
        try {
          const response = await fetch("/locations");
          if (!response.ok) return;
          const data = await response.json();
          let count = 0;
          for (const person of data.people) {
            const cell = document.getElementById("location-" + person.id);
            if (!cell) continue;
            if (person.location) {
              count++;
              cell.textContent = person.location.latitude.toFixed(5) + ", " + person.location.longitude.toFixed(5);
            } else {
              cell.innerHTML = '<span class="empty">No consent response</span>';
            }
          }
          document.getElementById("sharingCount").textContent = count;
        } catch (_) {}
      }
      setInterval(refreshLocations, 3000);
    </script>
  `);
}

function recipientPage(person) {
  const name = escapeHtml(person.name);
  return page(`${name} - Location consent`, `
    <main style="min-height:100vh;display:grid;place-items:center;padding:20px">
      <section class="unit-card" style="width:min(520px,100%);margin:0">
        <div class="unit-header"><h1>${name}, share your location?</h1></div>
        <div style="padding:20px">
          <div class="consent" style="margin-bottom:16px">
            Precise browser location will be shared only after you confirm and approve browser permission.
            You can stop sharing at any time.
          </div>
          <label class="field"><input id="consent" type="checkbox" style="width:auto;height:auto;margin:0 8px 0 0">I confirm that I, ${name}, consent to share my location.</label>
          <div class="actions" style="padding:0">
            <button class="btn primary" id="start" disabled>Start sharing</button>
            <button class="btn" id="stop" disabled>Stop sharing</button>
          </div>
          <p id="status">Sharing is stopped.</p>
          <pre id="output"></pre>
        </div>
      </section>
    </main>
    <script>
      let watchId = null;
      const consent = document.getElementById("consent");
      const start = document.getElementById("start");
      const stop = document.getElementById("stop");
      consent.onchange = () => start.disabled = !consent.checked || watchId !== null;
      start.onclick = () => {
        if (!navigator.geolocation) {
          document.getElementById("status").textContent = "Geolocation is not supported.";
          return;
        }
        document.getElementById("status").textContent = "Requesting browser permission...";
        watchId = navigator.geolocation.watchPosition(async position => {
          const location = { latitude:position.coords.latitude, longitude:position.coords.longitude, accuracyMeters:position.coords.accuracy, timestamp:new Date().toISOString() };
          document.getElementById("status").textContent = "${name} is actively sharing.";
          document.getElementById("output").textContent = JSON.stringify(location, null, 2);
          start.disabled = true;
          stop.disabled = false;
          await fetch("/location/${person.id}", { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify(location) });
        }, error => {
          document.getElementById("status").textContent = "Sharing stopped (" + error.code + "): " + error.message;
          watchId = null;
          start.disabled = !consent.checked;
          stop.disabled = true;
        }, { enableHighAccuracy:true, timeout:10000, maximumAge:1000 });
      };
      stop.onclick = () => {
        if (watchId !== null) navigator.geolocation.clearWatch(watchId);
        watchId = null;
        document.getElementById("status").textContent = "Sharing is stopped.";
        document.getElementById("output").textContent = "";
        start.disabled = !consent.checked;
        stop.disabled = true;
        fetch("/location/${person.id}", { method:"DELETE" });
      };
      window.addEventListener("beforeunload", () => {
        if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      });
    </script>
  `);
}

function send(res, status, type, body) {
  res.writeHead(status, { "Content-Type": type });
  res.end(body);
}

function findPerson(id) {
  const person = people.find(entry => entry.id === id);
  if (!person) return null;
  if (person.expiresAt <= Date.now()) {
    person.location = null;
    return null;
  }
  return person;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");

  if (req.method === "GET" && url.pathname === "/") {
    send(res, 200, "text/html", dashboard());
    return;
  }

  if (req.method === "GET" && url.pathname === "/locations") {
    send(res, 200, "application/json", JSON.stringify({
      people: people.map(person => ({ id: person.id, location: person.location }))
    }));
    return;
  }

  if (req.method === "POST" && url.pathname === "/stop-all") {
    for (const person of people) person.location = null;
    send(res, 200, "application/json", JSON.stringify({ status: "stopped" }));
    return;
  }

  if (req.method === "POST" && url.pathname === "/persons") {
    let body = "";
    req.on("data", chunk => { body += chunk; if (body.length > 4096) req.destroy(); });
    req.on("end", () => {
      const params = new URLSearchParams(body);
      const name = (params.get("name") || "").trim().slice(0, 50);
      const email = (params.get("email") || "").trim().slice(0, 254);
      const memberNo = (params.get("memberNo") || "").trim().slice(0, 30) || "KT-" + String(people.length + 1).padStart(3, "0");
      if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        send(res, 400, "text/plain", "A valid name and email address are required.");
        return;
      }
      const id = uniqueId(name);
      people.push({ id, name, email, memberNo, type: "Student", active: true, location: null, expiresAt: Date.now() + LINK_LIFETIME_MS });
      res.writeHead(303, { Location: "/" });
      res.end();
    });
    return;
  }

  const shareMatch = url.pathname.match(/^\/share\/([a-z0-9-]+)$/);
  if (req.method === "GET" && shareMatch) {
    const person = findPerson(shareMatch[1]);
    if (!person) {
      send(res, 410, "text/html", page("Link expired", "<main style='padding:40px'><h1>Sharing link expired</h1></main>"));
      return;
    }
    send(res, 200, "text/html", recipientPage(person));
    return;
  }

  const emailMatch = url.pathname.match(/^\/email\/([a-z0-9-]+)$/);
  if (req.method === "GET" && emailMatch) {
    const person = people.find(entry => entry.id === emailMatch[1]);
    if (!person) { send(res, 404, "text/plain", "Person not found"); return; }
    const link = `http://localhost:${PORT}/share/${person.id}`;
    const subject = encodeURIComponent(`Location sharing consent request for ${person.name}`);
    const body = encodeURIComponent(`Hi ${person.name},\n\nPlease open this link only if you consent to share your location:\n${link}\n\nThe link expires after 10 minutes.`);
    res.writeHead(303, { Location: `mailto:${encodeURIComponent(person.email)}?subject=${subject}&body=${body}` });
    res.end();
    return;
  }

  const locationMatch = url.pathname.match(/^\/location\/([a-z0-9-]+)$/);
  if (locationMatch) {
    const person = findPerson(locationMatch[1]);
    if (!person) { send(res, 410, "application/json", JSON.stringify({ error:"expired" })); return; }
    if (req.method === "DELETE") {
      person.location = null;
      send(res, 200, "application/json", JSON.stringify({ status:"stopped" }));
      return;
    }
    if (req.method === "POST") {
      let body = "";
      req.on("data", chunk => { body += chunk; if (body.length > 16384) req.destroy(); });
      req.on("end", () => {
        try {
          const location = JSON.parse(body);
          if (typeof location.latitude !== "number" || typeof location.longitude !== "number" ||
              location.latitude < -90 || location.latitude > 90 ||
              location.longitude < -180 || location.longitude > 180) {
            send(res, 400, "application/json", JSON.stringify({ error:"invalid location" }));
            return;
          }
          person.location = location;
          send(res, 200, "application/json", JSON.stringify({ status:"shared" }));
        } catch (_) {
          send(res, 400, "application/json", JSON.stringify({ error:"invalid JSON" }));
        }
      });
      return;
    }
  }

  send(res, 404, "text/plain", "Not Found");
});

setInterval(() => {
  for (const person of people) {
    if (person.expiresAt <= Date.now()) person.location = null;
  }
}, 30000);

server.listen(PORT, () => console.log(`Location consent dashboard: http://localhost:${PORT}`));
