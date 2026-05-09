import { useState } from "react";

// ── CONSTANTS ────────────────────────────────────────────────────────────────
const TEAMS = ["Research", "Development", "QA"];
const TICKET_TYPES = ["Research Task", "Feature Development", "Bug Fix", "Client Deliverable"];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];
const STATUSES = ["Open", "In Progress", "Closed"];

const DEFAULT_PASSWORD = "Aazora@2026";

const INITIAL_USERS = [
  { email: "ananya012640@gmail.com", name: "Ananya", team: "Research", avatar: "AN", isAdmin: true },
  { email: "srinithib2505@gmail.com", name: "Srinithi", team: "Research", avatar: "SR", isAdmin: false },
  { email: "skeerthana805088@gmail.com", name: "Keerthana", team: "Development", avatar: "KE", isAdmin: false },
  { email: "roshini.srinivasarajagopalan@gmail.com", name: "Roshini", team: "Development", avatar: "RO", isAdmin: false },
  { email: "gopikameena881@gmail.com", name: "Gopika", team: "QA", avatar: "GO", isAdmin: false },
  { email: "praveenbruce04@gmail.com", name: "Praveen", team: "QA", avatar: "PR", isAdmin: false },
];

const TEAM_ACCENT = { Research: "#7F77DD", Development: "#1D9E75", QA: "#BA7517" };

const TYPE_META = {
  "Research Task": { icon: "🔬", bg: "#2B2548", text: "#B7A7FF" },
  "Feature Development": { icon: "⚙️", bg: "#18382E", text: "#6EE7B7" },
  "Bug Fix": { icon: "🐛", bg: "#3A1F24", text: "#FF8A8A" },
  "Client Deliverable": { icon: "📦", bg: "#3B2E1D", text: "#F6C177" },
};
const PRIORITY_META = {
  Low: { bg: "#18382E", text: "#6EE7B7", dot: "#1D9E75" },
  Medium: { bg: "#3B2E1D", text: "#F6C177", dot: "#BA7517" },
  High: { bg: "#3D2320", text: "#FF8A65", dot: "#D85A30" },
  Urgent: { bg: "#3A1B22", text: "#FF5D73", dot: "#E24B4A" },
};
const STATUS_META = {
  "Open": { bg: "#1D2A44", text: "#7AB8FF" },
  "In Progress": { bg: "#3B2E1D", text: "#F6C177" },
  "Closed": { bg: "#18382E", text: "#6EE7B7" },
};

// ── STYLES ───────────────────────────────────────────────────────────────────
const D = {
  root: { fontFamily: "var(--font-sans)", background: "#0B0B0F", minHeight: "100vh", color: "#E8EAF0" },
  card: { background: "#111318", border: "0.5px solid #2A2D38", borderRadius: 14 },
  input: { width: "100%", boxSizing: "border-box", background: "#1C1F2A", border: "0.5px solid #2A2D38", color: "#E8EAF0", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", fontFamily: "var(--font-sans)" },
  label: { fontSize: 11, color: "#6B7280", marginBottom: 5, display: "block" },
  btnPrim: { background: "#7F77DD", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 500, cursor: "pointer" },
  btnGhost: { background: "transparent", color: "#9CA3AF", border: "0.5px solid #2A2D38", borderRadius: 8, padding: "8px 14px", fontSize: 13, cursor: "pointer" },
  sHead: { fontSize: 10, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6B7280", marginBottom: 10 },
  divider: { borderTop: "0.5px solid #2A2D38", margin: "14px 0" },
};

const Pill = ({ label, meta }) => (
  <span style={{ background: meta.bg, color: meta.text, fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 99 }}>{label}</span>
);

const Avatar = ({ initials, size = 32, team }) => {
  const color = TEAM_ACCENT[team] || "#7F77DD";
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: color + "28", color, fontSize: size * 0.36, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{initials}</div>
  );
};

let nextId = 1;
function mkTicket(data, user) {
  return {
    id: nextId++, ...data, status: "Open",
    createdBy: user.name, createdByTeam: user.team,
    createdAt: new Date().toLocaleString(),
    comments: [],
    activity: [{ who: user.name, text: "Ticket created", ts: new Date().toLocaleString() }],
  };
}

// ── LOGIN ────────────────────────────────────────────────────────────────────
function Login({ users, onLogin }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  function attempt() {
    setLoading(true); setErr("");
    setTimeout(() => {
      const u = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
      if (!u) { setErr("Email not recognised. Contact your admin."); setLoading(false); return; }
      if ((u.password || DEFAULT_PASSWORD) !== pass) { setErr("Incorrect password."); setLoading(false); return; }
      onLogin(u);
    }, 500);
  }

  return (
    <div style={{ ...D.root, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ ...D.card, width: 400, padding: "2.5rem 2rem" }}>
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ fontWeight: 600, fontSize: 20, color: "#E8EAF0", marginBottom: 4 }}>AAZORA</div>
          <div style={{ fontSize: 13, color: "#6B7280" }}>Sign in to the internal ticketing system</div>
        </div>

        <label style={D.label}>Work email</label>
        <input style={{ ...D.input, marginBottom: 12 }} placeholder="you@gmail.com" value={email}
          onChange={e => { setEmail(e.target.value); setErr(""); }} onKeyDown={e => e.key === "Enter" && attempt()} />

        <label style={D.label}>Password</label>
        <div style={{ position: "relative", marginBottom: 6 }}>
          <input style={{ ...D.input, paddingRight: 40 }} placeholder="Enter password" type={showPass ? "text" : "password"}
            value={pass} onChange={e => { setPass(e.target.value); setErr(""); }} onKeyDown={e => e.key === "Enter" && attempt()} />
          <button onClick={() => setShowPass(s => !s)}
            style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: 12 }}>
            {showPass ? "Hide" : "Show"}
          </button>
        </div>

        {err && <div style={{ fontSize: 12, color: "#FF5D73", background: "#3A1B22", padding: "8px 12px", borderRadius: 8, marginBottom: 10 }}>{err}</div>}

        <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 16 }}>
          Default password: <code style={{ color: "#B7A7FF" }}>{DEFAULT_PASSWORD}</code> — change it after first login.
        </div>

        <button style={{ ...D.btnPrim, width: "100%", opacity: (!email.trim() || !pass) ? 0.5 : 1 }}
          disabled={!email.trim() || !pass} onClick={attempt}>
          {loading ? "Signing in…" : "Sign in →"}
        </button>
      </div>
    </div>
  );
}

// ── CHANGE PASSWORD MODAL ────────────────────────────────────────────────────
function ChangePassModal({ user, onSave, onClose }) {
  const [cur, setCur] = useState("");
  const [n1, setN1] = useState("");
  const [n2, setN2] = useState("");
  const [err, setErr] = useState("");

  function save() {
    if ((user.password || DEFAULT_PASSWORD) !== cur) { setErr("Current password is incorrect."); return; }
    if (n1.length < 8) { setErr("New password must be at least 8 characters."); return; }
    if (n1 !== n2) { setErr("Passwords don't match."); return; }
    onSave(n1);
  }

  return (
    <div style={{ ...D.card, padding: "1.5rem", marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontWeight: 500 }}>Change password</div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: 18 }}>×</button>
      </div>
      {[
        { label: "Current password", val: cur, set: setCur },
        { label: "New password", val: n1, set: setN1 },
        { label: "Confirm new password", val: n2, set: setN2 },
      ].map(f => (
        <div key={f.label} style={{ marginBottom: 10 }}>
          <label style={D.label}>{f.label}</label>
          <input type="password" style={D.input} value={f.val} onChange={e => { f.set(e.target.value); setErr(""); }} />
        </div>
      ))}
      {err && <div style={{ fontSize: 12, color: "#FF5D73", background: "#3A1B22", padding: "8px 12px", borderRadius: 8, marginBottom: 10 }}>{err}</div>}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button style={D.btnGhost} onClick={onClose}>Cancel</button>
        <button style={D.btnPrim} onClick={save}>Save password</button>
      </div>
    </div>
  );
}

// ── ADMIN PANEL ──────────────────────────────────────────────────────────────
function AdminPanel({ users, onUpdateUser, onClose }) {
  const [resetTarget, setResetTarget] = useState(null);
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");

  function doReset() {
    if (newPass.length < 8) { setErr("Password must be at least 8 characters."); return; }
    if (newPass !== confirm) { setErr("Passwords don't match."); return; }
    onUpdateUser(resetTarget.email, { password: newPass });
    setSuccess(`Password reset for ${resetTarget.name}.`);
    setResetTarget(null); setNewPass(""); setConfirm(""); setErr("");
  }

  return (
    <div style={{ ...D.root, padding: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1.5rem" }}>
        <button onClick={onClose} style={{ ...D.btnGhost, fontSize: 12 }}>← Back</button>
        <div style={{ fontWeight: 500, fontSize: 16 }}>Admin panel</div>
      </div>

      {success && <div style={{ fontSize: 13, color: "#6EE7B7", background: "#18382E", padding: "10px 14px", borderRadius: 8, marginBottom: 14 }}>{success}</div>}

      <div style={{ ...D.card, padding: "1.25rem", marginBottom: 16 }}>
        <div style={D.sHead}>Team members</div>
        {users.map(u => (
          <div key={u.email} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "0.5px solid #2A2D38" }}>
            <Avatar initials={u.avatar} size={34} team={u.team} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{u.name} {u.isAdmin && <span style={{ fontSize: 10, background: "#2B2548", color: "#B7A7FF", padding: "2px 7px", borderRadius: 99, marginLeft: 6 }}>admin</span>}</div>
              <div style={{ fontSize: 11, color: "#6B7280" }}>{u.email}</div>
            </div>
            <span style={{ fontSize: 11, color: TEAM_ACCENT[u.team], background: TEAM_ACCENT[u.team] + "22", padding: "2px 9px", borderRadius: 99 }}>{u.team}</span>
            <button onClick={() => { setResetTarget(u); setNewPass(""); setConfirm(""); setErr(""); setSuccess(""); }}
              style={{ ...D.btnGhost, fontSize: 12, padding: "6px 12px" }}>Reset password</button>
          </div>
        ))}
      </div>

      {resetTarget && (
        <div style={{ ...D.card, padding: "1.25rem" }}>
          <div style={{ fontWeight: 500, marginBottom: 12 }}>Reset password for <span style={{ color: "#B7A7FF" }}>{resetTarget.name}</span></div>
          {[
            { label: "New password", val: newPass, set: setNewPass },
            { label: "Confirm password", val: confirm, set: setConfirm },
          ].map(f => (
            <div key={f.label} style={{ marginBottom: 10 }}>
              <label style={D.label}>{f.label}</label>
              <input type="password" style={D.input} value={f.val} onChange={e => { f.set(e.target.value); setErr(""); }} />
            </div>
          ))}
          {err && <div style={{ fontSize: 12, color: "#FF5D73", background: "#3A1B22", padding: "8px 12px", borderRadius: 8, marginBottom: 10 }}>{err}</div>}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button style={D.btnGhost} onClick={() => setResetTarget(null)}>Cancel</button>
            <button style={D.btnPrim} onClick={doReset}>Reset password</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [user, setUser] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState("board");
  const [showForm, setShowForm] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showChangePass, setShowChangePass] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [comment, setComment] = useState("");
  const [form, setForm] = useState({ title: "", type: TICKET_TYPES[0], priority: "Medium", assignedTeam: TEAMS[0], description: "" });

  function updateUser(email, changes) {
    setUsers(p => p.map(u => u.email === email ? { ...u, ...changes } : u));
    if (user?.email === email) setUser(u => ({ ...u, ...changes }));
  }

  if (!user) return <Login users={users} onLogin={setUser} />;
  if (showAdmin && user.isAdmin) return <AdminPanel users={users} onUpdateUser={updateUser} onClose={() => setShowAdmin(false)} />;

  function createTicket() {
    if (!form.title.trim()) return;
    setTickets(p => [mkTicket(form, user), ...p]);
    setForm({ title: "", type: TICKET_TYPES[0], priority: "Medium", assignedTeam: TEAMS[0], description: "" });
    setShowForm(false);
  }

  function changeStatus(id, status) {
    setTickets(p => p.map(t => {
      if (t.id !== id) return t;
      const u = { ...t, status, activity: [{ who: user.name, text: `Status set to "${status}"`, ts: new Date().toLocaleString() }, ...t.activity] };
      if (selected?.id === id) setSelected(u);
      return u;
    }));
  }

  function postComment() {
    if (!comment.trim() || !selected) return;
    setTickets(p => p.map(t => {
      if (t.id !== selected.id) return t;
      const u = {
        ...t,
        comments: [{ who: user.name, avatar: user.avatar, team: user.team, text: comment, ts: new Date().toLocaleString() }, ...t.comments],
        activity: [{ who: user.name, text: "Added a comment", ts: new Date().toLocaleString() }, ...t.activity],
      };
      setSelected(u); return u;
    }));
    setComment("");
  }

  const filtered = tickets.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) &&
    (filterStatus === "All" || t.status === filterStatus) &&
    (filterPriority === "All" || t.priority === filterPriority)
  );

  const stats = { total: tickets.length, open: tickets.filter(t => t.status === "Open").length, inProgress: tickets.filter(t => t.status === "In Progress").length, closed: tickets.filter(t => t.status === "Closed").length };

  const inputDark = { ...D.input };
  const selectDark = { ...D.input, appearance: "auto" };

  return (
    <div style={D.root}>
      <h2 className="sr-only">AAZORA Internal Ticketing System</h2>

      {/* ── HEADER ── */}
      <div style={{ background: "#0F1117", borderBottom: "0.5px solid #2A2D38", padding: "0 1.5rem", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontWeight: 600, fontSize: 16, color: "#E8EAF0" }}>AAZORA</span>
          <span style={{ fontSize: 12, color: "#6B7280", borderLeft: "0.5px solid #2A2D38", paddingLeft: 10, marginLeft: 2 }}>Ticketing</span>
        </div>

        <div style={{ display: "flex", gap: 4 }}>
          {["board", "tickets"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ background: tab === t ? "#1C1F2A" : "transparent", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 13, cursor: "pointer", color: tab === t ? "#E8EAF0" : "#6B7280", fontWeight: tab === t ? 500 : 400 }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => setShowForm(true)} style={D.btnPrim}>+ New ticket</button>
          {user.isAdmin && (
            <button onClick={() => setShowAdmin(true)} style={{ ...D.btnGhost, fontSize: 12 }}>Admin</button>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 10px", background: "#1C1F2A", borderRadius: 8, border: "0.5px solid #2A2D38" }}>
            <Avatar initials={user.avatar} size={24} team={user.team} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.2, color: "#E8EAF0" }}>{user.name}</div>
              <div style={{ fontSize: 10, color: "#6B7280" }}>{user.team}</div>
            </div>
          </div>
          <button onClick={() => setShowChangePass(s => !s)} style={{ ...D.btnGhost, fontSize: 12 }}>🔑</button>
          <button onClick={() => { setUser(null); setSelected(null); setShowChangePass(false); }} style={{ ...D.btnGhost, fontSize: 12 }}>Sign out</button>
        </div>
      </div>

      <div style={{ padding: "1.5rem", maxWidth: 1100, margin: "0 auto" }}>

        {/* Change password inline */}
        {showChangePass && (
          <ChangePassModal user={user} onClose={() => setShowChangePass(false)}
            onSave={pw => { updateUser(user.email, { password: pw }); setShowChangePass(false); }} />
        )}

        {/* New ticket form inline */}
        {showForm && (
          <div style={{ ...D.card, padding: "1.75rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div style={{ fontWeight: 500, fontSize: 15 }}>New ticket</div>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#6B7280" }}>×</button>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={D.label}>Title</label>
              <input style={inputDark} placeholder="What needs to be done?" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={D.label}>Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the task…" rows={3}
                style={{ ...inputDark, resize: "vertical" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div><label style={D.label}>Type</label><select style={selectDark} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>{TICKET_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
              <div><label style={D.label}>Priority</label><select style={selectDark} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>{PRIORITIES.map(p => <option key={p}>{p}</option>)}</select></div>
              <div style={{ gridColumn: "1/-1" }}><label style={D.label}>Assign to team</label><select style={selectDark} value={form.assignedTeam} onChange={e => setForm(f => ({ ...f, assignedTeam: e.target.value }))}>{TEAMS.map(t => <option key={t}>{t}</option>)}</select></div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button style={D.btnGhost} onClick={() => setShowForm(false)}>Cancel</button>
              <button style={D.btnPrim} onClick={createTicket}>Create ticket</button>
            </div>
          </div>
        )}

        {/* ── METRICS ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: "1.5rem" }}>
          {[
            { label: "Total", val: stats.total, color: "#E8EAF0" },
            { label: "Open", val: stats.open, color: "#7AB8FF" },
            { label: "In progress", val: stats.inProgress, color: "#F6C177" },
            { label: "Closed", val: stats.closed, color: "#6EE7B7" },
          ].map(m => (
            <div key={m.label} style={{ ...D.card, padding: "1rem 1.25rem" }}>
              <div style={{ fontSize: 10, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>{m.label}</div>
              <div style={{ fontSize: 28, fontWeight: 600, color: m.color }}>{m.val}</div>
            </div>
          ))}
        </div>

        {/* ── BOARD ── */}
        {tab === "board" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
            {TEAMS.map(team => {
              const tt = tickets.filter(t => t.assignedTeam === team);
              const accent = TEAM_ACCENT[team];
              return (
                <div key={team} style={{ ...D.card, overflow: "hidden" }}>
                  <div style={{ padding: "12px 14px", borderBottom: "0.5px solid #2A2D38", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: accent }} />
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{team}</span>
                    </div>
                    <span style={{ fontSize: 12, color: "#6B7280", background: "#1C1F2A", padding: "1px 8px", borderRadius: 99 }}>{tt.length}</span>
                  </div>
                  <div style={{ padding: 10, minHeight: 80 }}>
                    {tt.length === 0
                      ? <div style={{ fontSize: 12, color: "#4B5060", textAlign: "center", padding: "16px 0" }}>No tickets</div>
                      : tt.map(t => (
                        <div key={t.id} onClick={() => { setSelected(t); setTab("tickets"); }}
                          style={{ background: "#1C1F2A", border: "0.5px solid #2A2D38", borderRadius: 10, padding: "10px 12px", marginBottom: 8, cursor: "pointer" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 7 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 7, background: TYPE_META[t.type].bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{TYPE_META[t.type].icon}</div>
                            <span style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.3, color: "#E8EAF0" }}>{t.title}</span>
                          </div>
                          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                            <Pill label={t.priority} meta={PRIORITY_META[t.priority]} />
                            <Pill label={t.status} meta={STATUS_META[t.status]} />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── TICKETS ── */}
        {tab === "tickets" && (
          <div style={{ display: "grid", gridTemplateColumns: selected ? "300px 1fr" : "1fr", gap: 14, alignItems: "start" }}>
            {/* List */}
            <div style={D.card}>
              <div style={{ padding: "12px 14px", borderBottom: "0.5px solid #2A2D38" }}>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tickets…"
                  style={{ ...inputDark, marginBottom: 8 }} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...selectDark, fontSize: 12 }}><option>All</option>{STATUSES.map(s => <option key={s}>{s}</option>)}</select>
                  <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{ ...selectDark, fontSize: 12 }}><option>All</option>{PRIORITIES.map(p => <option key={p}>{p}</option>)}</select>
                </div>
              </div>
              <div style={{ overflowY: "auto", maxHeight: "65vh" }}>
                {filtered.length === 0
                  ? <div style={{ padding: "2rem", textAlign: "center", fontSize: 13, color: "#6B7280" }}>No tickets found</div>
                  : filtered.map(t => (
                    <div key={t.id} onClick={() => setSelected(t)}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderBottom: "0.5px solid #2A2D38", cursor: "pointer", background: selected?.id === t.id ? "#1C1F2A" : "transparent" }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: TYPE_META[t.type].bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>{TYPE_META[t.type].icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#E8EAF0" }}>{t.title}</div>
                        <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{t.assignedTeam} · {t.createdBy}</div>
                      </div>
                      <Pill label={t.status} meta={STATUS_META[t.status]} />
                    </div>
                  ))}
              </div>
            </div>

            {/* Detail */}
            {selected && (
              <div style={{ ...D.card, padding: "1.5rem", overflowY: "auto", maxHeight: "80vh" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: TYPE_META[selected.type].bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{TYPE_META[selected.type].icon}</div>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 16, lineHeight: 1.3, marginBottom: 8, color: "#E8EAF0" }}>{selected.title}</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <Pill label={selected.type} meta={{ bg: TYPE_META[selected.type].bg, text: TYPE_META[selected.type].text }} />
                        <Pill label={selected.priority} meta={PRIORITY_META[selected.priority]} />
                        <Pill label={selected.status} meta={STATUS_META[selected.status]} />
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#6B7280" }}>×</button>
                </div>

                {/* Status buttons */}
                <div style={{ background: "#1C1F2A", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
                  <div style={{ fontSize: 10, color: "#6B7280", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.07em" }}>Update status</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {STATUSES.map(s => (
                      <button key={s} onClick={() => changeStatus(selected.id, s)}
                        style={{
                          flex: 1, padding: "7px 4px", fontSize: 12, fontWeight: 500, borderRadius: 8, cursor: "pointer",
                          border: selected.status === s ? `1.5px solid ${STATUS_META[s].text}` : "0.5px solid #2A2D38",
                          background: selected.status === s ? STATUS_META[s].bg : "#111318",
                          color: selected.status === s ? STATUS_META[s].text : "#6B7280"
                        }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Meta */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                  {[
                    { label: "Assigned team", val: selected.assignedTeam },
                    { label: "Created by", val: `${selected.createdBy} (${selected.createdByTeam})` },
                    { label: "Created at", val: selected.createdAt },
                    { label: "Ticket ID", val: `#${selected.id}` },
                  ].map(m => (
                    <div key={m.label} style={{ background: "#1C1F2A", borderRadius: 8, padding: "10px 12px" }}>
                      <div style={{ fontSize: 10, color: "#6B7280", marginBottom: 3 }}>{m.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#E8EAF0" }}>{m.val}</div>
                    </div>
                  ))}
                </div>

                {selected.description && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={D.sHead}>Description</div>
                    <div style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.6, background: "#1C1F2A", padding: "12px 14px", borderRadius: 8 }}>{selected.description}</div>
                  </div>
                )}

                {/* Comments */}
                <div style={{ marginBottom: 16 }}>
                  <div style={D.sHead}>Comments ({selected.comments.length})</div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                    <Avatar initials={user.avatar} size={28} team={user.team} />
                    <div style={{ flex: 1 }}>
                      <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment…" rows={2}
                        style={{ ...inputDark, resize: "vertical", marginBottom: 6 }} />
                      <button onClick={postComment} disabled={!comment.trim()} style={{ ...D.btnPrim, fontSize: 12, opacity: comment.trim() ? 1 : 0.5, cursor: comment.trim() ? "pointer" : "not-allowed" }}>Post</button>
                    </div>
                  </div>
                  {selected.comments.length === 0
                    ? <div style={{ fontSize: 12, color: "#4B5060" }}>No comments yet</div>
                    : selected.comments.map((c, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                        <Avatar initials={c.avatar} size={26} team={c.team} />
                        <div style={{ flex: 1, background: "#1C1F2A", borderRadius: 8, padding: "8px 12px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 500, color: "#E8EAF0" }}>{c.who}</span>
                            <span style={{ fontSize: 11, color: "#6B7280" }}>{c.ts}</span>
                          </div>
                          <div style={{ fontSize: 13, color: "#9CA3AF" }}>{c.text}</div>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Activity */}
                <div>
                  <div style={D.sHead}>Activity</div>
                  {selected.activity.map((a, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 2, background: "#2A2D38", borderRadius: 2, flexShrink: 0, marginTop: 3 }} />
                      <div>
                        <div style={{ fontSize: 12, color: "#E8EAF0" }}><span style={{ fontWeight: 500 }}>{a.who}</span> <span style={{ color: "#6B7280" }}>· {a.text}</span></div>
                        <div style={{ fontSize: 11, color: "#4B5060", marginTop: 2 }}>{a.ts}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}