import { useState, useEffect, useRef } from "react";
import { useTickets, useNotifications, useUsers, runDueReminders, useNotificationDebug } from "./hooks/useTickets.jsx";

const TEAMS = ["Research", "Development", "QA"];
const TICKET_TYPES = ["Research Task", "Feature Development", "Bug Fix", "Client Deliverable"];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];
const STATUSES = ["Open", "In Progress", "Blocked", "Closed"];
const TICKET_TAGS = ["Frontend", "Backend", "Design", "Blocked", "Client", "Urgent Review"];
const PRIORITY_RANK = { Low: 1, Medium: 2, High: 3, Urgent: 4 };

const TEAM_ACCENT = { Research: "#8B8CF6", Development: "#2DD4BF", QA: "#F59E0B" };
const TYPE_META = {
  "Research Task": { icon: "R", bg: "#29264A", text: "#C4B5FD" },
  "Feature Development": { icon: "F", bg: "#123B34", text: "#5EEAD4" },
  "Bug Fix": { icon: "B", bg: "#4A1F2A", text: "#FDA4AF" },
  "Client Deliverable": { icon: "C", bg: "#43371F", text: "#FCD34D" },
};
const PRIORITY_META = {
  Low: { bg: "#123B34", text: "#5EEAD4" },
  Medium: { bg: "#3F321D", text: "#FBBF24" },
  High: { bg: "#43251D", text: "#FB923C" },
  Urgent: { bg: "#4A1F2A", text: "#FB7185" },
};
const STATUS_META = {
  Open: { bg: "#172A46", text: "#60A5FA" },
  "In Progress": { bg: "#3F321D", text: "#FBBF24" },
  Blocked: { bg: "#4A1F2A", text: "#FB7185" },
  Closed: { bg: "#123B34", text: "#5EEAD4" },
};

const D = {
  root: { fontFamily: "Inter, var(--font-sans), sans-serif", background: "linear-gradient(180deg, #0A0D14 0%, #0E111A 46%, #090B10 100%)", minHeight: "100vh", color: "#E8EAF0" },
  card: { background: "rgba(17, 20, 30, 0.92)", border: "1px solid #252B3A", borderRadius: 8, boxShadow: "0 18px 55px rgba(0,0,0,0.26)" },
  input: { width: "100%", boxSizing: "border-box", background: "#151A25", border: "1px solid #2B3244", color: "#F8FAFC", borderRadius: 8, padding: "10px 12px", fontSize: 13, outline: "none", fontFamily: "inherit", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)" },
  label: { fontSize: 11, color: "#8B95A7", marginBottom: 6, display: "block", fontWeight: 600 },
  btnP: { background: "linear-gradient(135deg, #14B8A6 0%, #6366F1 100%)", color: "#fff", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 10px 24px rgba(20,184,166,0.18)" },
  btnG: { background: "#141926", color: "#CBD5E1", border: "1px solid #2B3244", borderRadius: 8, padding: "8px 14px", fontSize: 13, cursor: "pointer", fontWeight: 600 },
  btnDanger: { background: "#20131A", color: "#FB7185", border: "1px solid #7F1D1D", borderRadius: 8, padding: "8px 14px", fontSize: 13, cursor: "pointer", fontWeight: 700 },
  sHead: { fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8B95A7", marginBottom: 10 },
};

const iDark = { ...D.input };
const iSel = { ...D.input, appearance: "auto" };

function timeAgo(ts) {
  const d = new Date(ts);
  if (isNaN(d)) return ts;
  const s = Math.floor((Date.now() - d) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function dueBadge(due) {
  if (!due) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(due);
  d.setHours(0, 0, 0, 0);
  const diff = Math.ceil((d - today) / 86400000);
  if (diff < 0) return { label: `Overdue ${Math.abs(diff)}d`, bg: "#3A1B22", text: "#FF5D73" };
  if (diff === 0) return { label: "Due today", bg: "#3D2320", text: "#FF8A65" };
  if (diff <= 2) return { label: `Due in ${diff}d`, bg: "#3B2E1D", text: "#F6C177" };
  return { label: d.toLocaleDateString(), bg: "#1C1F2A", text: "#6B7280" };
}

const Pill = ({ label, meta }) => (
  <span style={{ background: meta.bg, color: meta.text, fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 999, whiteSpace: "nowrap" }}>
    {label}
  </span>
);

const Avatar = ({ initials, size = 32, team }) => {
  const c = TEAM_ACCENT[team] || "#7F77DD";
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: c + "28", color: c, fontSize: size * 0.36, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {initials}
    </div>
  );
};

function DateInput({ value, onChange, style }) {
  const inputRef = useRef(null);

  function openPicker() {
    if (inputRef.current?.showPicker) {
      inputRef.current.showPicker();
    } else {
      inputRef.current?.focus();
    }
  }

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <input
        ref={inputRef}
        type="date"
        style={{
          ...iDark,
          ...style,
          paddingRight: 98,
          colorScheme: "dark",
        }}
        value={value}
        onChange={onChange}
      />
      <button
        type="button"
        onClick={openPicker}
        style={{
          position: "absolute",
          right: 6,
          top: "50%",
          transform: "translateY(-50%)",
          background: "linear-gradient(135deg, #14B8A6 0%, #6366F1 100%)",
          color: "#FFFFFF",
          border: "none",
          borderRadius: 6,
          padding: "5px 9px",
          fontSize: 11,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Pick date
      </button>
    </div>
  );
}

function Login({ onLogin }) {
  const { login } = useUsers();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  async function go() {
    setLoading(true);
    setErr("");
    const { user, error } = login(email, pass);
    if (error) {
      setErr(error);
      setLoading(false);
      return;
    }
    onLogin(user);
  }

  return (
    <div style={{ ...D.root, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ ...D.card, width: 400, padding: "2.5rem 2rem", borderTop: "3px solid #14B8A6" }}>
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg, #14B8A6 0%, #6366F1 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#FFFFFF" }}>A</div>
            <div style={{ fontWeight: 800, fontSize: 24, color: "#F8FAFC" }}>AAZORA</div>
          </div>
          <div style={{ fontSize: 13, color: "#8B95A7", marginTop: 2 }}>Internal Ticketing System</div>
        </div>
        <label style={D.label}>Work email</label>
        <input style={{ ...D.input, marginBottom: 12 }} placeholder="you@gmail.com" value={email} onChange={e => { setEmail(e.target.value); setErr(""); }} onKeyDown={e => e.key === "Enter" && go()} />
        <label style={D.label}>Password</label>
        <div style={{ position: "relative", marginBottom: 6 }}>
          <input style={{ ...D.input, paddingRight: 54 }} type={show ? "text" : "password"} placeholder="Password" value={pass} onChange={e => { setPass(e.target.value); setErr(""); }} onKeyDown={e => e.key === "Enter" && go()} />
          <button onClick={() => setShow(s => !s)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: 12 }}>
            {show ? "Hide" : "Show"}
          </button>
        </div>
        {err && <div style={{ fontSize: 12, color: "#FF5D73", background: "#3A1B22", padding: "8px 12px", borderRadius: 8, marginBottom: 10 }}>{err}</div>}
        <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 16 }}>Default password: <code style={{ color: "#B7A7FF" }}>Aazora@2026</code></div>
        <button style={{ ...D.btnP, width: "100%", opacity: (!email.trim() || !pass || loading) ? 0.5 : 1 }} disabled={!email.trim() || !pass || loading} onClick={go}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </div>
    </div>
  );
}

function ChangePass({ user, onSave, onClose }) {
  const { updatePassword } = useUsers();
  const [cur, setCur] = useState("");
  const [n1, setN1] = useState("");
  const [n2, setN2] = useState("");
  const [err, setErr] = useState("");

  function save() {
    if (user.password !== cur) return setErr("Current password incorrect.");
    if (n1.length < 8) return setErr("Min 8 characters.");
    if (n1 !== n2) return setErr("Passwords do not match.");
    updatePassword(user.email, n1);
    onSave(n1);
  }

  return (
    <div style={{ ...D.card, padding: "1.5rem", marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontWeight: 500 }}>Change password</div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: 18 }}>x</button>
      </div>
      {[["Current password", cur, setCur], ["New password", n1, setN1], ["Confirm new", n2, setN2]].map(([label, value, setter]) => (
        <div key={label} style={{ marginBottom: 10 }}>
          <label style={D.label}>{label}</label>
          <input type="password" style={D.input} value={value} onChange={e => { setter(e.target.value); setErr(""); }} />
        </div>
      ))}
      {err && <div style={{ fontSize: 12, color: "#FF5D73", background: "#3A1B22", padding: "8px 12px", borderRadius: 8, marginBottom: 10 }}>{err}</div>}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button style={D.btnG} onClick={onClose}>Cancel</button>
        <button style={D.btnP} onClick={save}>Save</button>
      </div>
    </div>
  );
}

function AdminPanel({ users, onClose }) {
  const { adminResetPassword } = useUsers();
  const { rows: notificationRows, loading: loadingNotifications, refetch: refetchNotifications } = useNotificationDebug(true);
  const [target, setTarget] = useState(null);
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  function doReset() {
    if (p1.length < 8) return setErr("Min 8 chars.");
    if (p1 !== p2) return setErr("Passwords do not match.");
    adminResetPassword(target.email, p1);
    setOk(`Password reset for ${target.name}.`);
    setTarget(null);
    setP1("");
    setP2("");
    setErr("");
  }

  return (
    <div style={{ ...D.root, padding: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1.5rem" }}>
        <button onClick={onClose} style={{ ...D.btnG, fontSize: 12 }}>Back</button>
        <div style={{ fontWeight: 500, fontSize: 16 }}>Admin panel</div>
      </div>
      {ok && <div style={{ fontSize: 13, color: "#6EE7B7", background: "#18382E", padding: "10px 14px", borderRadius: 8, marginBottom: 14 }}>{ok}</div>}
      <div style={{ ...D.card, padding: "1.25rem", marginBottom: 16 }}>
        <div style={D.sHead}>Team members</div>
        {users.map(u => (
          <div key={u.email} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "0.5px solid #2A2D38" }}>
            <Avatar initials={u.avatar} size={34} team={u.team} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{u.name}{u.isAdmin && <span style={{ fontSize: 10, background: "#2B2548", color: "#B7A7FF", padding: "2px 7px", borderRadius: 999, marginLeft: 6 }}>admin</span>}</div>
              <div style={{ fontSize: 11, color: "#6B7280" }}>{u.email}</div>
            </div>
            <span style={{ fontSize: 11, color: TEAM_ACCENT[u.team], background: TEAM_ACCENT[u.team] + "22", padding: "2px 9px", borderRadius: 999 }}>{u.team}</span>
            <button onClick={() => { setTarget(u); setP1(""); setP2(""); setErr(""); setOk(""); }} style={{ ...D.btnG, fontSize: 12, padding: "6px 12px" }}>Reset pwd</button>
          </div>
        ))}
      </div>
      {target && (
        <div style={{ ...D.card, padding: "1.25rem" }}>
          <div style={{ fontWeight: 500, marginBottom: 12 }}>Reset for <span style={{ color: "#B7A7FF" }}>{target.name}</span></div>
          <label style={D.label}>New password</label>
          <input type="password" style={{ ...D.input, marginBottom: 10 }} value={p1} onChange={e => { setP1(e.target.value); setErr(""); }} />
          <label style={D.label}>Confirm</label>
          <input type="password" style={{ ...D.input, marginBottom: 10 }} value={p2} onChange={e => { setP2(e.target.value); setErr(""); }} />
          {err && <div style={{ fontSize: 12, color: "#FF5D73", background: "#3A1B22", padding: "8px 12px", borderRadius: 8, marginBottom: 10 }}>{err}</div>}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button style={D.btnG} onClick={() => setTarget(null)}>Cancel</button>
            <button style={D.btnP} onClick={doReset}>Reset</button>
          </div>
        </div>
      )}

      <div style={{ ...D.card, padding: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
          <div style={D.sHead}>Notification debug</div>
          <button onClick={refetchNotifications} style={{ ...D.btnG, fontSize: 11, padding: "5px 9px" }}>Refresh</button>
        </div>
        {loadingNotifications ? (
          <div style={{ fontSize: 12, color: "#6B7280" }}>Loading notifications...</div>
        ) : notificationRows.length === 0 ? (
          <div style={{ fontSize: 12, color: "#6B7280" }}>No notification rows found</div>
        ) : notificationRows.map(n => (
          <div key={n.id} style={{ padding: "8px 0", borderBottom: "0.5px solid #2A2D38" }}>
            <div style={{ fontSize: 12, color: "#E8EAF0", marginBottom: 2 }}>{n.text}</div>
            <div style={{ fontSize: 11, color: "#6B7280" }}>
              To: {n.for_email || n.user_email || n.email || n.recipient_email || "unknown"} - {timeAgo(n.created_at)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotifCenter({ notifs, onMarkRead, onClear, onClose }) {
  const unread = notifs.filter(n => !n.read).length;
  return (
    <div style={{ ...D.card, position: "absolute", top: 52, right: 0, width: 340, maxHeight: 420, overflowY: "auto", zIndex: 9999, boxShadow: "0 12px 40px rgba(0,0,0,0.55)", padding: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontWeight: 500, fontSize: 14 }}>Notifications {unread > 0 && <span style={{ background: "#7F77DD", color: "#fff", fontSize: 10, padding: "1px 6px", borderRadius: 999, marginLeft: 6 }}>{unread}</span>}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onMarkRead} style={{ fontSize: 11, color: "#6B7280", background: "none", border: "none", cursor: "pointer" }}>Mark read</button>
          <button onClick={onClear} style={{ fontSize: 11, color: "#6B7280", background: "none", border: "none", cursor: "pointer" }}>Clear</button>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: 16 }}>x</button>
        </div>
      </div>
      {notifs.length === 0 ? (
        <div style={{ fontSize: 13, color: "#6B7280", textAlign: "center", padding: "1rem 0" }}>All caught up</div>
      ) : notifs.slice(0, 20).map(n => (
        <div key={n.id} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "0.5px solid #2A2D38" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: n.read ? "#2A2D38" : "#7F77DD", flexShrink: 0, marginTop: 5 }} />
          <div>
            <div style={{ fontSize: 12, color: "#E8EAF0", marginBottom: 2 }}>{n.text}</div>
            <div style={{ fontSize: 11, color: "#6B7280" }}>{timeAgo(n.ts)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function BoardCard({ ticket, users, onOpen, onDragStart }) {
  const db = dueBadge(ticket.dueDate);
  const assignee = users.find(u => u.email === ticket.assignedTo);
  return (
    <div draggable onDragStart={() => onDragStart(ticket)} onClick={() => onOpen(ticket)} style={{ background: "linear-gradient(180deg, #1A2030 0%, #151A25 100%)", border: "1px solid #2B3244", borderLeft: `3px solid ${PRIORITY_META[ticket.priority]?.text || "#8B95A7"}`, borderRadius: 8, padding: "11px 12px", marginBottom: 9, cursor: "grab", userSelect: "none", boxShadow: "0 10px 24px rgba(0,0,0,0.18)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 7 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: TYPE_META[ticket.type]?.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
          {TYPE_META[ticket.type]?.icon}
        </div>
        <span style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.3, color: "#E8EAF0" }}>{ticket.title}</span>
      </div>
      {assignee && <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}><Avatar initials={assignee.avatar} size={18} team={assignee.team} /><span style={{ fontSize: 11, color: "#6B7280" }}>{assignee.name}</span></div>}
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        <Pill label={ticket.priority} meta={PRIORITY_META[ticket.priority]} />
        {db && <Pill label={db.label} meta={db} />}
        {(ticket.tags || []).slice(0, 2).map(tag => (
          <Pill key={tag} label={tag} meta={{ bg: "#202637", text: "#A8B3CF" }} />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const { users } = useUsers();
  const { tickets, loading, createTicket, updateStatus, updateField, addComment, deleteComment, deleteTicket, archiveTicket, restoreTicket, uploadAttachment } = useTickets();

  const [user, setUser] = useState(null);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState("board");
  const [showForm, setShowForm] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showCPass, setShowCPass] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [search, setSearch] = useState("");
  const [fStatus, setFStatus] = useState("All");
  const [fPriority, setFPriority] = useState("All");
  const [fTeam, setFTeam] = useState("All");
  const [fTag, setFTag] = useState("All");
  const [fMine, setFMine] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [sortBy, setSortBy] = useState("Newest");
  const [editField, setEditField] = useState(null);
  const [editVals, setEditVals] = useState({});
  const [dragTicket, setDragTicket] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [comment, setComment] = useState("");
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ title: "", type: TICKET_TYPES[0], priority: "Medium", assignedTeam: TEAMS[0], assignedUser: null, description: "", dueDate: "", tags: [] });

  const { notifs, pushNotif, markAllRead, clearAll } = useNotifications(user?.email);
  const notifRef = useRef(null);
  const lastToastIdRef = useRef(null);

  useEffect(() => {
    if (!selected) return;
    const fresh = tickets.find(t => t.id === selected.id);
    if (fresh) setSelected(fresh);
  }, [tickets, selected?.id]);

  useEffect(() => {
    if (!showNotif) return;
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showNotif]);

  useEffect(() => {
    if (!user || loading) return;
    runDueReminders(tickets, users, pushNotif, user);
    const id = window.setInterval(() => {
      runDueReminders(tickets, users, pushNotif, user);
    }, 60 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [user, loading, tickets, users, pushNotif]);

  useEffect(() => {
    const newest = notifs[0];
    if (!newest || newest.read || newest.id === lastToastIdRef.current) return;

    lastToastIdRef.current = newest.id;
    setToast(newest);
    const id = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(id);
  }, [notifs]);

  if (!user) return <Login onLogin={setUser} />;
  if (showAdmin && user.isAdmin) return <AdminPanel users={users} onClose={() => setShowAdmin(false)} />;

  async function handleCreate() {
    if (!form.title.trim()) return;
    setSaving(true);
    const { error } = await createTicket({ ...form, assignedTo: form.assignedUser?.email || null }, user);
    setSaving(false);
    if (!error) {
      if (form.assignedUser?.email) {
        await pushNotif(`${user.name} assigned you: "${form.title}"`, [form.assignedUser.email]);
      }
      setForm({ title: "", type: TICKET_TYPES[0], priority: "Medium", assignedTeam: TEAMS[0], assignedUser: null, description: "", dueDate: "", tags: [] });
      setShowForm(false);
    }
  }

  async function handleStatusChange(id, status) {
    const t = tickets.find(ticket => ticket.id === id);
    await updateStatus(id, status, user);
    if (t?.assignedTo) {
      await pushNotif(`Ticket "${t.title}" moved to ${status}`, [t.assignedTo]);
    }
  }

  async function handleSaveEdit(field) {
    const val = editVals[field];
    if (val === undefined) {
      setEditField(null);
      return;
    }
    setSaving(true);
    await updateField(selected.id, field, val, user);
    setSaving(false);
    setEditField(null);
    if (field === "assignedTo" && val) {
      await pushNotif(`${user.name} assigned you ticket: "${selected.title}"`, [val]);
    }
  }

  async function handlePostComment() {
    if (!comment.trim() || !selected) return;
    const text = comment.trim();
    setComment("");
    const { error } = await addComment(selected.id, text, user);
    if (error) {
      setComment(text);
      return;
    }
    const targets = [selected.assignedTo].filter(Boolean);
    if (targets.length) {
      await pushNotif(`${user.name} commented on "${selected.title}"`, targets);
    }
  }

  async function handleDeleteComment(commentId) {
    if (!selected) return;
    await deleteComment(commentId, selected.id, user);
  }

  async function handleArchiveTicket(id) {
    if (!window.confirm("Archive this ticket? You can restore it later.")) return;
    await archiveTicket(id, user);
    setSelected(null);
  }

  async function handleRestoreTicket(id) {
    await restoreTicket(id, user);
  }

  async function handleDeleteTicket(id) {
    if (!user.isAdmin) return;
    if (!window.confirm("Permanently delete this ticket and its history? This cannot be undone.")) return;
    await deleteTicket(id);
    setSelected(null);
  }

  async function handleUploadAttachment() {
    if (!selected || !attachmentFile) return;
    setSaving(true);
    await uploadAttachment(selected.id, attachmentFile, user);
    setSaving(false);
    setAttachmentFile(null);
  }

  function onDrop(e, status) {
    e.preventDefault();
    if (!dragTicket || dragTicket.status === status) {
      setDragOver(null);
      setDragTicket(null);
      return;
    }
    handleStatusChange(dragTicket.id, status);
    setDragOver(null);
    setDragTicket(null);
  }

  const activeTickets = tickets.filter(t => !t.archived);
  const filtered = tickets
    .filter(t =>
      (showArchived ? t.archived : !t.archived) &&
      t.title.toLowerCase().includes(search.toLowerCase()) &&
      (fStatus === "All" || t.status === fStatus) &&
      (fPriority === "All" || t.priority === fPriority) &&
      (fTeam === "All" || t.assignedTeam === fTeam) &&
      (fTag === "All" || (t.tags || []).includes(fTag)) &&
      (!fMine || t.assignedTo === user.email)
    )
    .sort((a, b) => {
      if (sortBy === "Due date") {
        const ad = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        const bd = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        return ad - bd;
      }
      if (sortBy === "Priority") return (PRIORITY_RANK[b.priority] || 0) - (PRIORITY_RANK[a.priority] || 0);
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

  const stats = {
    total: activeTickets.length,
    open: activeTickets.filter(t => t.status === "Open").length,
    inProgress: activeTickets.filter(t => t.status === "In Progress").length,
    blocked: activeTickets.filter(t => t.status === "Blocked").length,
    closed: activeTickets.filter(t => t.status === "Closed").length,
    overdue: activeTickets.filter(t => t.dueDate && t.status !== "Closed" && new Date(t.dueDate) < new Date()).length,
    mine: activeTickets.filter(t => t.assignedTo === user.email && t.status !== "Closed").length,
    archived: tickets.filter(t => t.archived).length,
  };

  const workload = users.map(member => ({
    ...member,
    openCount: activeTickets.filter(t => t.assignedTo === member.email && t.status !== "Closed").length,
  }));

  const unread = notifs.filter(n => !n.read).length;

  function FieldEdit({ field, label, type = "text", opts }) {
    const isMe = editField === field;
    const currentVal = field === "assignedTo" ? (selected.assignedTo || "") : (selected[field] || "");
    const effectiveTeam = editVals.assignedTeam || selected.assignedTeam;
    const resolvedOpts = field === "assignedTo" && opts === undefined
      ? users.filter(u => u.team === effectiveTeam).map(u => ({ value: u.email, label: u.name }))
      : opts;

    return (
      <div style={{ background: "#1C1F2A", borderRadius: 8, padding: "10px 12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
          <div style={{ fontSize: 10, color: "#6B7280" }}>{label}</div>
          <button onClick={() => {
            if (isMe) handleSaveEdit(field);
            else {
              setEditField(field);
              setEditVals(v => ({ ...v, [field]: currentVal }));
            }
          }} style={{ background: "none", border: "none", color: isMe ? "#7F77DD" : "#6B7280", cursor: "pointer", fontSize: 11 }}>
            {isMe ? (saving ? "..." : "Save") : "Edit"}
          </button>
        </div>
        {isMe ? (
          resolvedOpts ? (
            <select style={{ ...iSel, fontSize: 12 }} value={editVals[field] || ""} onChange={e => setEditVals(v => ({ ...v, [field]: e.target.value }))}>
              {field === "assignedTo" && <option value="">Unassigned</option>}
              {resolvedOpts.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
            </select>
          ) : field === "description" ? (
            <textarea rows={4} style={{ ...iDark, fontSize: 12, resize: "vertical" }} value={editVals[field] || ""} onChange={e => setEditVals(v => ({ ...v, [field]: e.target.value }))} />
          ) : type === "date" ? (
            <DateInput
              value={editVals[field] || ""}
              onChange={e => setEditVals(v => ({ ...v, [field]: e.target.value }))}
              style={{ fontSize: 12 }}
            />
          ) : (
            <input type={type} style={{ ...iDark, fontSize: 12 }} value={editVals[field] || ""} onChange={e => setEditVals(v => ({ ...v, [field]: e.target.value }))} onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSaveEdit(field)} />
          )
        ) : (
          <div style={{ fontSize: 13, fontWeight: 500, color: "#E8EAF0" }}>
            {field === "assignedTo" ? (() => {
              const u = users.find(person => person.email === selected.assignedTo);
              return u ? <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Avatar initials={u.avatar} size={16} team={u.team} />{u.name}</span> : <span style={{ color: "#4B5060" }}>Unassigned</span>;
            })() : <span style={{ color: selected[field] ? "#E8EAF0" : "#4B5060" }}>{selected[field] || "-"}</span>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={D.root}>
      {toast && (
        <div
          style={{
            position: "fixed",
            right: 18,
            top: 74,
            zIndex: 2000,
            width: 320,
            background: "linear-gradient(180deg, #1A2030 0%, #151A25 100%)",
            border: "1px solid #14B8A6",
            borderRadius: 8,
            boxShadow: "0 16px 44px rgba(0,0,0,0.45)",
            padding: "12px 14px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 11, color: "#5EEAD4", fontWeight: 800, marginBottom: 4 }}>Notification</div>
              <div style={{ fontSize: 13, color: "#E8EAF0", lineHeight: 1.4 }}>{toast.text}</div>
            </div>
            <button
              onClick={() => setToast(null)}
              style={{ background: "none", border: "none", color: "#9CA3AF", cursor: "pointer", fontSize: 16, lineHeight: 1 }}
            >
              x
            </button>
          </div>
        </div>
      )}

      <div style={{ background: "rgba(10, 13, 20, 0.94)", borderBottom: "1px solid #252B3A", padding: "0.65rem 1.5rem", minHeight: 62, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, position: "sticky", top: 0, zIndex: 100, flexWrap: "wrap", backdropFilter: "blur(14px)", boxShadow: "0 14px 40px rgba(0,0,0,0.26)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #14B8A6 0%, #6366F1 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF", fontWeight: 900, boxShadow: "0 8px 22px rgba(20,184,166,0.18)" }}>A</span>
          <span style={{ fontWeight: 900, fontSize: 17, color: "#F8FAFC" }}>AAZORA</span>
          <span style={{ fontSize: 12, color: "#8B95A7", borderLeft: "1px solid #2B3244", paddingLeft: 10 }}>Ticketing</span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {["board", "tickets"].map(t => <button key={t} onClick={() => setTab(t)} style={{ background: tab === t ? "#1C1F2A" : "transparent", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 13, cursor: "pointer", color: tab === t ? "#E8EAF0" : "#6B7280", fontWeight: tab === t ? 500 : 400 }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>)}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => setShowForm(s => !s)} style={D.btnP}>+ New ticket</button>
          {user.isAdmin && <button onClick={() => setShowAdmin(true)} style={{ ...D.btnG, fontSize: 12 }}>Admin</button>}
          <div style={{ position: "relative" }} ref={notifRef}>
            <button onClick={() => setShowNotif(s => !s)} style={{ ...D.btnG, fontSize: 12, padding: "7px 10px", position: "relative" }}>
              Notify
              {unread > 0 && <span style={{ position: "absolute", top: 2, right: 2, width: 8, height: 8, borderRadius: "50%", background: "#FF5D73" }} />}
            </button>
            {showNotif && <NotifCenter notifs={notifs} onMarkRead={markAllRead} onClear={clearAll} onClose={() => setShowNotif(false)} />}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 10px", background: "#1C1F2A", borderRadius: 8, border: "0.5px solid #2A2D38" }}>
            <Avatar initials={user.avatar} size={24} team={user.team} />
            <div><div style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.2 }}>{user.name}</div><div style={{ fontSize: 10, color: "#6B7280" }}>{user.team}</div></div>
          </div>
          <button onClick={() => setShowCPass(s => !s)} style={{ ...D.btnG, fontSize: 12, padding: "7px 10px" }}>Password</button>
          <button onClick={() => { setUser(null); setSelected(null); }} style={{ ...D.btnG, fontSize: 12 }}>Sign out</button>
        </div>
      </div>

      <div style={{ padding: "1.5rem", maxWidth: 1200, margin: "0 auto" }}>
        {showCPass && <ChangePass user={user} onClose={() => setShowCPass(false)} onSave={pw => { setUser(u => ({ ...u, password: pw })); setShowCPass(false); }} />}

        {showForm && (
          <div style={{ ...D.card, padding: "1.75rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div style={{ fontWeight: 500, fontSize: 15 }}>New ticket</div>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#6B7280" }}>x</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 12 }}>
              <div style={{ gridColumn: "1/-1" }}><label style={D.label}>Title</label><input style={iDark} placeholder="What needs to be done?" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} onKeyDown={e => e.key === "Enter" && handleCreate()} /></div>
              <div style={{ gridColumn: "1/-1" }}><label style={D.label}>Description</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the task..." rows={3} style={{ ...iDark, resize: "vertical" }} /></div>
              <div><label style={D.label}>Type</label><select style={iSel} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>{TICKET_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
              <div><label style={D.label}>Priority</label><select style={iSel} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>{PRIORITIES.map(p => <option key={p}>{p}</option>)}</select></div>
              <div><label style={D.label}>Assign to team</label><select style={iSel} value={form.assignedTeam} onChange={e => setForm(f => ({ ...f, assignedTeam: e.target.value, assignedUser: null }))}>{TEAMS.map(t => <option key={t}>{t}</option>)}</select></div>
              <div><label style={D.label}>Assign to person</label><select style={iSel} value={form.assignedUser?.email || ""} onChange={e => setForm(f => ({ ...f, assignedUser: users.find(u => u.email === e.target.value) || null }))}><option value="">Unassigned</option>{users.filter(u => u.team === form.assignedTeam).map(u => <option key={u.email} value={u.email}>{u.name}</option>)}</select></div>
              <div>
                <label style={D.label}>Due date</label>
                <DateInput value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={D.label}>Tags</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {TICKET_TAGS.map(tag => {
                    const active = form.tags.includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => setForm(f => ({
                          ...f,
                          tags: active ? f.tags.filter(t => t !== tag) : [...f.tags, tag],
                        }))}
                        style={{
                          ...(active ? D.btnP : D.btnG),
                          fontSize: 11,
                          padding: "6px 9px",
                        }}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}><button style={D.btnG} onClick={() => setShowForm(false)}>Cancel</button><button style={{ ...D.btnP, opacity: (!form.title.trim() || saving) ? 0.5 : 1 }} onClick={handleCreate} disabled={!form.title.trim() || saving}>{saving ? "Creating..." : "Create ticket"}</button></div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginBottom: "1.5rem" }}>
          {[
            ["Total", stats.total, "#E8EAF0"], ["Open", stats.open, "#7AB8FF"], ["In Progress", stats.inProgress, "#F6C177"], ["Blocked", stats.blocked, "#FF5D73"], ["Closed", stats.closed, "#6EE7B7"], ["Overdue", stats.overdue, "#FF5D73"], ["My open", stats.mine, "#B7A7FF"], ["Archived", stats.archived, "#9CA3AF"],
          ].map(([label, val, color]) => <div key={label} style={{ ...D.card, padding: "1rem", borderTop: `3px solid ${color}` }}><div style={{ fontSize: 10, color: "#8B95A7", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7, fontWeight: 800 }}>{label}</div><div style={{ fontSize: 28, fontWeight: 800, color }}>{val}</div></div>)}
        </div>

        <div style={{ ...D.card, padding: "1rem", marginBottom: "1.5rem" }}>
          <div style={D.sHead}>Assignee workload</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
            {workload.map(member => (
              <div key={member.email} style={{ display: "flex", alignItems: "center", gap: 8, background: "#1C1F2A", borderRadius: 8, padding: "8px 10px" }}>
                <Avatar initials={member.avatar} size={24} team={member.team} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{member.name}</div>
                  <div style={{ fontSize: 11, color: "#6B7280" }}>{member.openCount} open</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {tab === "board" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
            {STATUSES.map(status => {
              const col = activeTickets.filter(t => t.status === status);
              const isOver = dragOver === status;
              return (
                <div key={status} onDragOver={e => { e.preventDefault(); setDragOver(status); }} onDragLeave={() => setDragOver(null)} onDrop={e => onDrop(e, status)} style={{ ...D.card, overflow: "hidden", outline: isOver ? "1.5px dashed #14B8A6" : "none", borderTop: `3px solid ${STATUS_META[status].text}` }}>
                  <div style={{ padding: "12px 14px", borderBottom: "1px solid #252B3A", background: "#121722", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_META[status].text }} /><span style={{ fontSize: 13, fontWeight: 500 }}>{status}</span></div>
                    <span style={{ fontSize: 12, color: "#CBD5E1", background: "#1A2030", padding: "2px 9px", borderRadius: 999, border: "1px solid #2B3244" }}>{col.length}</span>
                  </div>
                  <div style={{ padding: 10, minHeight: 80 }}>{loading ? <div style={{ fontSize: 12, color: "#4B5060", textAlign: "center", padding: "16px 0" }}>Loading...</div> : col.length === 0 ? <div style={{ fontSize: 12, color: "#4B5060", textAlign: "center", padding: "16px 0" }}>{isOver ? "Drop here" : "No tickets"}</div> : col.map(t => <BoardCard key={t.id} ticket={t} users={users} onOpen={tk => { setSelected(tk); setTab("tickets"); }} onDragStart={setDragTicket} />)}</div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "tickets" && (
          <div style={{ display: "grid", gridTemplateColumns: selected ? "300px 1fr" : "1fr", gap: 14, alignItems: "start" }}>
            <div style={D.card}>
              <div style={{ padding: "12px 14px", borderBottom: "0.5px solid #2A2D38" }}>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tickets..." style={{ ...iDark, marginBottom: 8 }} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 6 }}>
                  <select value={fStatus} onChange={e => setFStatus(e.target.value)} style={{ ...iSel, fontSize: 12 }}><option>All</option>{STATUSES.map(s => <option key={s}>{s}</option>)}</select>
                  <select value={fPriority} onChange={e => setFPriority(e.target.value)} style={{ ...iSel, fontSize: 12 }}><option>All</option>{PRIORITIES.map(p => <option key={p}>{p}</option>)}</select>
                  <select value={fTeam} onChange={e => setFTeam(e.target.value)} style={{ ...iSel, fontSize: 12 }}><option>All</option>{TEAMS.map(t => <option key={t}>{t}</option>)}</select>
                  <select value={fTag} onChange={e => setFTag(e.target.value)} style={{ ...iSel, fontSize: 12 }}><option>All</option>{TICKET_TAGS.map(t => <option key={t}>{t}</option>)}</select>
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ ...iSel, fontSize: 12 }}><option>Newest</option><option>Due date</option><option>Priority</option></select>
                  <button onClick={() => setFMine(s => !s)} style={{ ...(fMine ? D.btnP : D.btnG), fontSize: 11, padding: "6px 8px" }}>Mine only</button>
                  <button onClick={() => setShowArchived(s => !s)} style={{ ...(showArchived ? D.btnP : D.btnG), fontSize: 11, padding: "6px 8px" }}>{showArchived ? "Viewing archived" : "View archived"}</button>
                </div>
                {showArchived && (
                  <div style={{ fontSize: 11, color: "#8B95A7", marginTop: 6 }}>
                    Archived tickets are hidden from the board, metrics, workload, and reminders.
                  </div>
                )}
              </div>
              <div style={{ overflowY: "auto", maxHeight: "65vh" }}>
                {loading ? <div style={{ padding: "2rem", textAlign: "center", color: "#6B7280", fontSize: 13 }}>Loading...</div> : filtered.length === 0 ? <div style={{ padding: "2rem", textAlign: "center", fontSize: 13, color: "#6B7280" }}>No tickets found</div> : filtered.map(t => {
                  const db = dueBadge(t.dueDate);
                  const assignee = users.find(u => u.email === t.assignedTo);
                  return (
                    <div key={t.id} onClick={() => setSelected(t)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderBottom: "1px solid #252B3A", cursor: "pointer", background: selected?.id === t.id ? "#1A2030" : "transparent", borderLeft: selected?.id === t.id ? "3px solid #14B8A6" : "3px solid transparent" }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: TYPE_META[t.type]?.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{TYPE_META[t.type]?.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div><div style={{ display: "flex", gap: 5, marginTop: 3, alignItems: "center", flexWrap: "wrap" }}><span style={{ fontSize: 11, color: "#6B7280" }}>{t.assignedTeam}</span>{assignee && <span style={{ fontSize: 11, color: TEAM_ACCENT[assignee.team] }}>- {assignee.name}</span>}{db && <span style={{ fontSize: 11, color: db.text }}>- {db.label}</span>}{(t.tags || []).slice(0, 2).map(tag => <span key={tag} style={{ fontSize: 11, color: "#A8B3CF" }}>- {tag}</span>)}</div></div>
                      <Pill label={t.status} meta={STATUS_META[t.status]} />
                    </div>
                  );
                })}
              </div>
            </div>

            {selected && (
              <div style={{ ...D.card, padding: "1.5rem", overflowY: "auto", maxHeight: "85vh", borderTop: "3px solid #14B8A6" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: TYPE_META[selected.type]?.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, flexShrink: 0 }}>{TYPE_META[selected.type]?.icon}</div>
                    <div><div style={{ fontWeight: 500, fontSize: 16, lineHeight: 1.3, marginBottom: 8 }}>{selected.title}</div><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}><Pill label={selected.type} meta={{ bg: TYPE_META[selected.type]?.bg, text: TYPE_META[selected.type]?.text }} /><Pill label={selected.priority} meta={PRIORITY_META[selected.priority]} /><Pill label={selected.status} meta={STATUS_META[selected.status]} />{dueBadge(selected.dueDate) && <Pill label={dueBadge(selected.dueDate).label} meta={dueBadge(selected.dueDate)} />}{(selected.tags || []).map(tag => <Pill key={tag} label={tag} meta={{ bg: "#202637", text: "#A8B3CF" }} />)}{selected.archived && <Pill label="Archived" meta={{ bg: "#2A2D38", text: "#9CA3AF" }} />}</div></div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {user.isAdmin && (selected.archived
                      ? <button onClick={() => handleRestoreTicket(selected.id)} style={{ ...D.btnG, fontSize: 11, padding: "5px 10px" }}>Restore</button>
                      : <button onClick={() => handleArchiveTicket(selected.id)} style={{ ...D.btnG, fontSize: 11, padding: "5px 10px" }}>Archive</button>)}
                    {user.isAdmin && (
                      <button onClick={() => handleDeleteTicket(selected.id)} style={{ ...D.btnDanger, fontSize: 11, padding: "5px 10px" }}>Delete</button>
                    )}
                    <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#6B7280" }}>x</button>
                  </div>
                </div>

                <div style={{ background: "#151A25", border: "1px solid #2B3244", borderRadius: 8, padding: "12px 14px", marginBottom: 14 }}>
                  <div style={{ fontSize: 10, color: "#6B7280", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.07em" }}>Update status</div>
                  <div style={{ display: "flex", gap: 8 }}>{STATUSES.map(s => <button key={s} onClick={() => handleStatusChange(selected.id, s)} style={{ flex: 1, padding: "7px 4px", fontSize: 12, fontWeight: 500, borderRadius: 8, cursor: "pointer", border: selected.status === s ? `1.5px solid ${STATUS_META[s].text}` : "0.5px solid #2A2D38", background: selected.status === s ? STATUS_META[s].text : "#111318", color: selected.status === s ? "#FFFFFF" : "#6B7280" }}>{s}</button>)}</div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8, marginBottom: 14 }}>
                  <FieldEdit field="title" label="Title" />
                  <FieldEdit field="priority" label="Priority" opts={PRIORITIES} />
                  <FieldEdit field="type" label="Type" opts={TICKET_TYPES} />
                  <FieldEdit field="assignedTeam" label="Team" opts={TEAMS} />
                  <FieldEdit field="assignedTo" label="Assignee" />
                  <FieldEdit field="dueDate" label="Due date" type="date" />
                  <div style={{ background: "#1C1F2A", borderRadius: 8, padding: "10px 12px", gridColumn: "1/-1" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                      <div style={{ fontSize: 10, color: "#6B7280" }}>Tags</div>
                      <button
                        onClick={() => {
                          if (editField === "tags") {
                            handleSaveEdit("tags");
                          } else {
                            setEditField("tags");
                            setEditVals(v => ({ ...v, tags: selected.tags || [] }));
                          }
                        }}
                        style={{ background: "none", border: "none", color: editField === "tags" ? "#7F77DD" : "#6B7280", cursor: "pointer", fontSize: 11 }}
                      >
                        {editField === "tags" ? (saving ? "..." : "Save") : "Edit"}
                      </button>
                    </div>
                    {editField === "tags" ? (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {TICKET_TAGS.map(tag => {
                          const active = (editVals.tags || []).includes(tag);
                          return (
                            <button
                              type="button"
                              key={tag}
                              onClick={() => setEditVals(v => ({
                                ...v,
                                tags: active ? (v.tags || []).filter(t => t !== tag) : [...(v.tags || []), tag],
                              }))}
                              style={{ ...(active ? D.btnP : D.btnG), fontSize: 11, padding: "5px 8px" }}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {(selected.tags || []).length ? selected.tags.map(tag => <Pill key={tag} label={tag} meta={{ bg: "#202637", text: "#A8B3CF" }} />) : <span style={{ fontSize: 13, color: "#4B5060" }}>No tags</span>}
                      </div>
                    )}
                  </div>
                  <div style={{ background: "#1C1F2A", borderRadius: 8, padding: "10px 12px" }}><div style={{ fontSize: 10, color: "#6B7280", marginBottom: 3 }}>Created by</div><div style={{ fontSize: 13, fontWeight: 500 }}>{selected.createdBy} - {selected.createdByTeam}</div></div>
                  <div style={{ background: "#1C1F2A", borderRadius: 8, padding: "10px 12px" }}><div style={{ fontSize: 10, color: "#6B7280", marginBottom: 3 }}>Ticket ID</div><div style={{ fontSize: 13, fontWeight: 500 }}>#{selected.id}</div></div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}><div style={D.sHead}>Description</div><button onClick={() => { if (editField === "description") handleSaveEdit("description"); else { setEditField("description"); setEditVals(v => ({ ...v, description: selected.description || "" })); } }} style={{ ...D.btnG, fontSize: 11, padding: "4px 10px" }}>{editField === "description" ? (saving ? "..." : "Save") : "Edit"}</button></div>
                  {editField === "description" ? <textarea rows={4} value={editVals.description || ""} onChange={e => setEditVals(v => ({ ...v, description: e.target.value }))} style={{ ...iDark, resize: "vertical" }} /> : <div style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.6, background: "#1C1F2A", padding: "12px 14px", borderRadius: 8, whiteSpace: "pre-wrap" }}>{selected.description || <span style={{ color: "#4B5060" }}>No description</span>}</div>}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={D.sHead}>Attachments ({selected.attachments?.length || 0})</div>
                  <div style={{ fontSize: 11, color: "#8B95A7", marginBottom: 8 }}>
                    Stored in Supabase Storage bucket: ticket-attachments
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                    <input
                      type="file"
                      onChange={e => setAttachmentFile(e.target.files?.[0] || null)}
                      style={{ ...iDark, fontSize: 12 }}
                    />
                    <button
                      onClick={handleUploadAttachment}
                      disabled={!attachmentFile || saving}
                      style={{ ...D.btnP, fontSize: 12, opacity: attachmentFile && !saving ? 1 : 0.5, whiteSpace: "nowrap" }}
                    >
                      {saving ? "Uploading..." : "Upload"}
                    </button>
                  </div>
                  {!selected.attachments?.length ? (
                    <div style={{ fontSize: 12, color: "#4B5060" }}>No attachments yet</div>
                  ) : selected.attachments.map(file => (
                    <a
                      key={file.id}
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ display: "flex", justifyContent: "space-between", gap: 10, color: "#E8EAF0", textDecoration: "none", background: "#1C1F2A", borderRadius: 8, padding: "8px 10px", marginBottom: 6 }}
                    >
                      <span style={{ fontSize: 13 }}>{file.name}</span>
                      <span style={{ fontSize: 11, color: "#6B7280" }}>{file.uploadedBy || "Uploaded"}</span>
                    </a>
                  ))}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={D.sHead}>Comments ({Array.isArray(selected.comments) ? selected.comments.length : 0})</div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                    <Avatar initials={user.avatar} size={28} team={user.team} />
                    <div style={{ flex: 1 }}><textarea value={comment} onChange={e => setComment(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handlePostComment(); } }} placeholder="Add a comment... (Ctrl+Enter to post)" rows={2} style={{ ...iDark, resize: "vertical", marginBottom: 6 }} /><button onClick={handlePostComment} disabled={!comment.trim()} style={{ ...D.btnP, fontSize: 12, opacity: comment.trim() ? 1 : 0.5 }}>Post</button></div>
                  </div>
                  {!Array.isArray(selected.comments) || selected.comments.length === 0 ? <div style={{ fontSize: 12, color: "#4B5060" }}>No comments yet</div> : selected.comments.map((c, i) => (
                    <div key={c.id ?? i} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                      <Avatar initials={c.avatar || "?"} size={26} team={c.team} />
                      <div style={{ flex: 1, background: "#1C1F2A", borderRadius: 8, padding: "8px 12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, gap: 8 }}><span style={{ fontSize: 12, fontWeight: 500 }}>{c.who}</span><div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 11, color: "#6B7280" }}>{timeAgo(c.ts)}</span>{(user.isAdmin || c.who === user.name) && <button onClick={() => handleDeleteComment(c.id)} style={{ background: "none", border: "none", color: "#FF5D73", cursor: "pointer", fontSize: 11 }}>Delete</button>}</div></div>
                        <div style={{ fontSize: 13, color: "#9CA3AF", whiteSpace: "pre-wrap" }}>{c.text}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <div style={D.sHead}>Activity</div>
                  {!selected.activity?.length ? <div style={{ fontSize: 12, color: "#4B5060" }}>No activity yet</div> : selected.activity.map((a, i) => <div key={a.id || i} style={{ display: "flex", gap: 10, marginBottom: 10 }}><div style={{ width: 2, background: "#2A2D38", borderRadius: 2, flexShrink: 0, marginTop: 3 }} /><div><div style={{ fontSize: 12 }}><span style={{ fontWeight: 500 }}>{a.who}</span><span style={{ color: "#6B7280" }}> - {a.text}</span></div><div style={{ fontSize: 11, color: "#4B5060", marginTop: 2 }}>{timeAgo(a.ts)}</div></div></div>)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
