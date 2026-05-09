import { useState } from "react";

const TEAMS = ["Research", "Development", "QA"];
const TICKET_TYPES = ["Research Task", "Feature Development", "Bug Fix", "Client Deliverable"];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];
const STATUSES = ["Open", "In Progress", "Closed"];

const ALLOWED_USERS = [
  { email: "research1@aazora.com", name: "Alex R.", team: "Research", avatar: "AR" },
  { email: "research2@aazora.com", name: "Priya S.", team: "Research", avatar: "PS" },
  { email: "dev1@aazora.com", name: "Jordan K.", team: "Development", avatar: "JK" },
  { email: "dev2@aazora.com", name: "Rahul M.", team: "Development", avatar: "RM" },
  { email: "qa1@aazora.com", name: "Sofia L.", team: "QA", avatar: "SL" },
  { email: "qa2@aazora.com", name: "Chris T.", team: "QA", avatar: "CT" },
];

const TYPE_META = {
  "Research Task": { icon: "🔬", bg: "#EEEDFE", text: "#534AB7" },
  "Feature Development": { icon: "⚙️", bg: "#E1F5EE", text: "#0F6E56" },
  "Bug Fix": { icon: "🐛", bg: "#FCEBEB", text: "#A32D2D" },
  "Client Deliverable": { icon: "📦", bg: "#FAEEDA", text: "#854F0B" },
};

const PRIORITY_META = {
  Low: { bg: "#EAF3DE", text: "#3B6D11", dot: "#639922" },
  Medium: { bg: "#FAEEDA", text: "#854F0B", dot: "#BA7517" },
  High: { bg: "#FAECE7", text: "#993C1D", dot: "#D85A30" },
  Urgent: { bg: "#FCEBEB", text: "#A32D2D", dot: "#E24B4A" },
};

const STATUS_META = {
  "Open": { bg: "#E6F1FB", text: "#185FA5" },
  "In Progress": { bg: "#FAEEDA", text: "#854F0B" },
  "Closed": { bg: "#EAF3DE", text: "#0F6E56" },
};

const TEAM_ACCENT = { Research: "#7F77DD", Development: "#1D9E75", QA: "#BA7517" };

let nextId = 1;
function mkTicket(data, user) {
  return {
    id: nextId++, ...data,
    status: "Open",
    createdBy: user.name, createdByTeam: user.team,
    createdAt: new Date().toLocaleString(),
    comments: [],
    activity: [{ who: user.name, text: "Ticket created", ts: new Date().toLocaleString() }],
  };
}

const Pill = ({ label, meta }) => (
  <span style={{ background: meta.bg, color: meta.text, fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 99, whiteSpace: "nowrap" }}>{label}</span>
);

const Avatar = ({ initials, size = 32, color = "#7F77DD" }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", background: color + "22", color, fontSize: size * 0.38, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{initials}</div>
);

// ── LOGIN SCREEN ──────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function attempt() {
    setLoading(true); setError("");
    setTimeout(() => {
      const user = ALLOWED_USERS.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
      if (user) onLogin(user);
      else { setError("This email isn't authorised. Contact your AAZORA admin."); setLoading(false); }
    }, 600);
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background-tertiary)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-sans)" }}>
      <div style={{ width: 400, background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "2.5rem 2rem", boxShadow: "0 4px 32px rgba(0,0,0,0.07)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "2rem" }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "#7F77DD", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 18 }}>A</div>
          <div>
            <div style={{ fontWeight: 500, fontSize: 18, color: "var(--color-text-primary)" }}>AAZORA</div>
            <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Internal Ticketing System</div>
          </div>
        </div>

        <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6, color: "var(--color-text-primary)" }}>Sign in to your workspace</div>
        <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: "1.5rem" }}>Enter your AAZORA team email to continue</div>

        <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 6 }}>Work email</div>
        <input
          value={email} onChange={e => { setEmail(e.target.value); setError(""); }}
          onKeyDown={e => e.key === "Enter" && attempt()}
          placeholder="you@aazora.com"
          style={{ width: "100%", boxSizing: "border-box", marginBottom: 8 }}
          autoFocus
        />
        {error && <div style={{ fontSize: 12, color: "#A32D2D", background: "#FCEBEB", padding: "8px 12px", borderRadius: 8, marginBottom: 12 }}>{error}</div>}

        <button onClick={attempt} disabled={!email.trim() || loading}
          style={{ width: "100%", background: "#7F77DD", color: "#fff", border: "none", borderRadius: "var(--border-radius-md)", padding: "10px", fontSize: 14, fontWeight: 500, cursor: email.trim() ? "pointer" : "not-allowed", opacity: !email.trim() ? 0.5 : 1, marginBottom: "1.5rem" }}>
          {loading ? "Checking…" : "Continue →"}
        </button>

        <div style={{ borderTop: "0.5px solid var(--color-border-tertiary)", paddingTop: "1rem" }}>
          <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 8 }}>Demo — authorised emails</div>
          {ALLOWED_USERS.map(u => (
            <div key={u.email} onClick={() => setEmail(u.email)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", cursor: "pointer" }}>
              <Avatar initials={u.avatar} size={24} color={TEAM_ACCENT[u.team]} />
              <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{u.email}</span>
              <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--color-text-tertiary)" }}>{u.team}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState("board");
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [comment, setComment] = useState("");
  const [form, setForm] = useState({ title: "", type: TICKET_TYPES[0], priority: "Medium", assignedTeam: TEAMS[0], description: "" });

  if (!user) return <LoginScreen onLogin={setUser} />;

  function createTicket() {
    if (!form.title.trim()) return;
    const t = mkTicket(form, user);
    setTickets(p => [t, ...p]);
    setForm({ title: "", type: TICKET_TYPES[0], priority: "Medium", assignedTeam: TEAMS[0], description: "" });
    setShowForm(false);
  }

  function changeStatus(id, status) {
    setTickets(p => p.map(t => {
      if (t.id !== id) return t;
      const u = { ...t, status, activity: [{ who: user.name, text: `Changed status to "${status}"`, ts: new Date().toLocaleString() }, ...t.activity] };
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

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === "Open").length,
    inProgress: tickets.filter(t => t.status === "In Progress").length,
    closed: tickets.filter(t => t.status === "Closed").length,
  };

  const C = {
    card: { background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)" },
    label: { fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 4 },
    sectionHead: { fontSize: 11, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--color-text-secondary)", marginBottom: 10 },
  };

  return (
    <div style={{ fontFamily: "var(--font-sans)", color: "var(--color-text-primary)", background: "var(--color-background-tertiary)", minHeight: "100vh" }}>
      <h2 className="sr-only">AAZORA Internal Ticketing System</h2>

      {/* ── HEADER ── */}
      <div style={{ background: "var(--color-background-primary)", borderBottom: "0.5px solid var(--color-border-tertiary)", padding: "0 1.5rem", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "#7F77DD", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 15 }}>A</div>
          <span style={{ fontWeight: 500, fontSize: 15 }}>AAZORA</span>
          <span style={{ fontSize: 12, color: "var(--color-text-secondary)", borderLeft: "0.5px solid var(--color-border-secondary)", paddingLeft: 10, marginLeft: 2 }}>Ticketing</span>
        </div>

        <div style={{ display: "flex", gap: 4 }}>
          {["board", "tickets"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ background: tab === t ? "var(--color-background-secondary)" : "transparent", border: "none", borderRadius: "var(--border-radius-md)", padding: "6px 14px", fontSize: 13, cursor: "pointer", color: tab === t ? "var(--color-text-primary)" : "var(--color-text-secondary)", fontWeight: tab === t ? 500 : 400 }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setShowForm(true)}
            style={{ background: "#7F77DD", color: "#fff", border: "none", borderRadius: "var(--border-radius-md)", padding: "7px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
            + New ticket
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 10px", background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-tertiary)" }}>
            <Avatar initials={user.avatar} size={24} color={TEAM_ACCENT[user.team]} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.2 }}>{user.name}</div>
              <div style={{ fontSize: 10, color: "var(--color-text-secondary)" }}>{user.team}</div>
            </div>
          </div>
          <button onClick={() => { setUser(null); setTickets([]); setSelected(null); }}
            style={{ background: "none", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", padding: "6px 10px", fontSize: 12, cursor: "pointer", color: "var(--color-text-secondary)" }}>
            Sign out
          </button>
        </div>
      </div>

      <div style={{ padding: "1.5rem", maxWidth: 1100, margin: "0 auto" }}>

        {/* ── METRICS ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: "1.5rem" }}>
          {[
            { label: "Total", val: stats.total, color: "var(--color-text-primary)" },
            { label: "Open", val: stats.open, color: "#185FA5" },
            { label: "In progress", val: stats.inProgress, color: "#854F0B" },
            { label: "Closed", val: stats.closed, color: "#0F6E56" },
          ].map(m => (
            <div key={m.label} style={{ ...C.card, padding: "1rem 1.25rem" }}>
              <div style={{ fontSize: 11, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontSize: 28, fontWeight: 500, color: m.color }}>{m.val}</div>
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
                <div key={team} style={{ ...C.card, overflow: "hidden" }}>
                  <div style={{ padding: "12px 14px", borderBottom: "0.5px solid var(--color-border-tertiary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: accent }} />
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{team}</span>
                    </div>
                    <span style={{ fontSize: 12, color: "var(--color-text-secondary)", background: "var(--color-background-secondary)", padding: "1px 8px", borderRadius: 99 }}>{tt.length}</span>
                  </div>
                  <div style={{ padding: 10, minHeight: 80 }}>
                    {tt.length === 0
                      ? <div style={{ fontSize: 12, color: "var(--color-text-tertiary)", textAlign: "center", padding: "16px 0" }}>No tickets</div>
                      : tt.map(t => (
                        <div key={t.id} onClick={() => { setSelected(t); setTab("tickets"); }}
                          style={{ background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-md)", padding: "10px 12px", marginBottom: 8, cursor: "pointer" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 7 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 7, background: TYPE_META[t.type].bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{TYPE_META[t.type].icon}</div>
                            <span style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.3 }}>{t.title}</span>
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
          <div style={{ display: "grid", gridTemplateColumns: selected ? "320px 1fr" : "1fr", gap: 14, alignItems: "start" }}>

            {/* List */}
            <div style={C.card}>
              <div style={{ padding: "12px 14px", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tickets…"
                  style={{ width: "100%", boxSizing: "border-box", marginBottom: 8 }} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: "100%", boxSizing: "border-box", fontSize: 12 }}>
                    <option>All</option>
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{ width: "100%", boxSizing: "border-box", fontSize: 12 }}>
                    <option>All</option>
                    {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ overflowY: "auto", maxHeight: "70vh" }}>
                {filtered.length === 0
                  ? <div style={{ padding: "2rem", textAlign: "center", fontSize: 13, color: "var(--color-text-secondary)" }}>No tickets found</div>
                  : filtered.map(t => (
                    <div key={t.id} onClick={() => setSelected(t)}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderBottom: "0.5px solid var(--color-border-tertiary)", cursor: "pointer", background: selected?.id === t.id ? "var(--color-background-secondary)" : "transparent" }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: TYPE_META[t.type].bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{TYPE_META[t.type].icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
                        <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 3 }}>{t.assignedTeam} · {t.createdBy}</div>
                      </div>
                      <Pill label={t.status} meta={STATUS_META[t.status]} />
                    </div>
                  ))}
              </div>
            </div>

            {/* Detail */}
            {selected && (
              <div style={{ ...C.card, padding: "1.5rem", overflowY: "auto", maxHeight: "80vh" }}>
                {/* Top */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: TYPE_META[selected.type].bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{TYPE_META[selected.type].icon}</div>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 16, lineHeight: 1.3, marginBottom: 6 }}>{selected.title}</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <Pill label={selected.type} meta={{ bg: TYPE_META[selected.type].bg, text: TYPE_META[selected.type].text }} />
                        <Pill label={selected.priority} meta={PRIORITY_META[selected.priority]} />
                        <Pill label={selected.status} meta={STATUS_META[selected.status]} />
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "var(--color-text-secondary)", lineHeight: 1 }}>×</button>
                </div>

                {/* Status controls */}
                <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "12px 14px", marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 8 }}>Update status</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {STATUSES.map(s => (
                      <button key={s} onClick={() => changeStatus(selected.id, s)}
                        style={{ flex: 1, padding: "7px 4px", fontSize: 12, fontWeight: 500, borderRadius: "var(--border-radius-md)", cursor: "pointer", border: selected.status === s ? `1.5px solid ${s === "Open" ? "#185FA5" : s === "In Progress" ? "#BA7517" : "#0F6E56"}` : "0.5px solid var(--color-border-secondary)", background: selected.status === s ? STATUS_META[s].bg : "var(--color-background-primary)", color: selected.status === s ? STATUS_META[s].text : "var(--color-text-secondary)" }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Meta grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                  {[
                    { label: "Assigned team", val: selected.assignedTeam },
                    { label: "Created by", val: `${selected.createdBy} (${selected.createdByTeam})` },
                    { label: "Created at", val: selected.createdAt },
                    { label: "Ticket ID", val: `#${selected.id}` },
                  ].map(m => (
                    <div key={m.label} style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "10px 12px" }}>
                      <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 3 }}>{m.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{m.val}</div>
                    </div>
                  ))}
                </div>

                {/* Description */}
                {selected.description && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={C.sectionHead}>Description</div>
                    <div style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.6, background: "var(--color-background-secondary)", padding: "12px 14px", borderRadius: "var(--border-radius-md)" }}>{selected.description}</div>
                  </div>
                )}

                {/* Comments */}
                <div style={{ marginBottom: 16 }}>
                  <div style={C.sectionHead}>Comments ({selected.comments.length})</div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                    <Avatar initials={user.avatar} size={30} color={TEAM_ACCENT[user.team]} />
                    <div style={{ flex: 1 }}>
                      <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment…" rows={2}
                        style={{ width: "100%", boxSizing: "border-box", resize: "vertical", fontFamily: "var(--font-sans)", fontSize: 13, marginBottom: 6 }} />
                      <button onClick={postComment} disabled={!comment.trim()}
                        style={{ background: "#7F77DD", color: "#fff", border: "none", borderRadius: "var(--border-radius-md)", padding: "6px 14px", fontSize: 12, fontWeight: 500, cursor: comment.trim() ? "pointer" : "not-allowed", opacity: comment.trim() ? 1 : 0.5 }}>
                        Post comment
                      </button>
                    </div>
                  </div>
                  {selected.comments.length === 0
                    ? <div style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>No comments yet</div>
                    : selected.comments.map((c, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                        <Avatar initials={c.avatar} size={28} color={TEAM_ACCENT[c.team]} />
                        <div style={{ flex: 1, background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "8px 12px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 500 }}>{c.who}</span>
                            <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{c.ts}</span>
                          </div>
                          <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{c.text}</div>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Activity */}
                <div>
                  <div style={C.sectionHead}>Activity</div>
                  {selected.activity.map((a, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 2, background: "var(--color-border-secondary)", borderRadius: 2, flexShrink: 0, marginTop: 3 }} />
                      <div>
                        <div style={{ fontSize: 12 }}><span style={{ fontWeight: 500 }}>{a.who}</span> <span style={{ color: "var(--color-text-secondary)" }}>· {a.text}</span></div>
                        <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 2 }}>{a.ts}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── CREATE MODAL ── */}
      {showForm && (
        <div style={{ display: "flex", justifyContent: "center", padding: "1rem 0" }}>
          <div style={{ ...C.card, width: "100%", maxWidth: 500, padding: "1.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div style={{ fontWeight: 500, fontSize: 16 }}>New ticket</div>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "var(--color-text-secondary)" }}>×</button>
            </div>
            {[
              { label: "Title", el: <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="What needs to be done?" style={{ width: "100%", boxSizing: "border-box" }} /> },
              { label: "Description", el: <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the task…" rows={3} style={{ width: "100%", boxSizing: "border-box", resize: "vertical", fontFamily: "var(--font-sans)", fontSize: 14 }} /> },
            ].map(f => (
              <div key={f.label} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 4 }}>{f.label}</div>
                {f.el}
              </div>
            ))}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              {[
                { label: "Type", val: form.type, key: "type", opts: TICKET_TYPES },
                { label: "Priority", val: form.priority, key: "priority", opts: PRIORITIES },
                { label: "Assign to team", val: form.assignedTeam, key: "assignedTeam", opts: TEAMS },
              ].map(f => (
                <div key={f.key} style={f.key === "assignedTeam" ? { gridColumn: "1/-1" } : {}}>
                  <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 4 }}>{f.label}</div>
                  <select value={f.val} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={{ width: "100%", boxSizing: "border-box" }}>
                    {f.opts.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setShowForm(false)} style={{ border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", padding: "7px 14px", fontSize: 13, cursor: "pointer", background: "var(--color-background-primary)" }}>Cancel</button>
              <button onClick={createTicket} style={{ background: "#7F77DD", color: "#fff", border: "none", borderRadius: "var(--border-radius-md)", padding: "7px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Create ticket</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}