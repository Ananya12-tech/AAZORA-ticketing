import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "../supabase";

const EMAILJS_SERVICE_ID = "YOUR_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID";
const EMAILJS_PUBLIC_KEY = "YOUR_PUBLIC_KEY";
const EMAILJS_ENABLED =
    EMAILJS_SERVICE_ID !== "YOUR_SERVICE_ID" &&
    EMAILJS_TEMPLATE_ID !== "YOUR_TEMPLATE_ID" &&
    EMAILJS_PUBLIC_KEY !== "YOUR_PUBLIC_KEY";

const DEFAULT_PASSWORD = "Aazora@2026";

export const DEFAULT_USERS = [
    { email: "ananya012640@gmail.com", name: "Ananya", team: "Research", avatar: "AN", isAdmin: true, password: DEFAULT_PASSWORD },
    { email: "srinithib2505@gmail.com", name: "Srinithi", team: "Research", avatar: "SR", isAdmin: false, password: DEFAULT_PASSWORD },
    { email: "skeerthana805088@gmail.com", name: "Keerthana", team: "Development", avatar: "KE", isAdmin: false, password: DEFAULT_PASSWORD },
    { email: "roshini.srinivasarajagopalan@gmail.com", name: "Roshini", team: "Development", avatar: "RO", isAdmin: false, password: DEFAULT_PASSWORD },
    { email: "gopikameena881@gmail.com", name: "Gopika", team: "QA", avatar: "GO", isAdmin: false, password: DEFAULT_PASSWORD },
    { email: "praveenbruce04@gmail.com", name: "Praveen", team: "QA", avatar: "PR", isAdmin: false, password: DEFAULT_PASSWORD },
    { email: "m.thivaghar@gmail.com", name: "Thivaghar", team: "Development", avatar: "TH", isAdmin: false, password: DEFAULT_PASSWORD },
    { email: "hp.lakshana@gmail.com", name: "Lakshana", team: "QA", avatar: "LA", isAdmin: false, password: DEFAULT_PASSWORD },
];

const USERS_STORAGE_KEY = "aazora_users_v1";
let sharedUsers = loadUsers();
const userListeners = new Set();

function loadUsers() {
    if (typeof localStorage === "undefined") return DEFAULT_USERS;
    try {
        const saved = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || "null");
        if (!Array.isArray(saved) || !saved.length) return DEFAULT_USERS;

        const merged = [...saved];
        DEFAULT_USERS.forEach(defaultUser => {
            if (!merged.some(user => user.email === defaultUser.email)) {
                merged.push(defaultUser);
            }
        });
        return merged;
    } catch {
        return DEFAULT_USERS;
    }
}

function saveUsers(next) {
    sharedUsers = next;
    if (typeof localStorage !== "undefined") {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(next));
    }
    userListeners.forEach(listener => listener(next));
}

export function useUsers() {
    const [users, setUsers] = useState(sharedUsers);

    useEffect(() => {
        userListeners.add(setUsers);
        return () => userListeners.delete(setUsers);
    }, []);

    const login = useCallback((email, password) => {
        const user = sharedUsers.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
        if (!user) return { user: null, error: "Email not recognised. Contact your admin." };
        if (user.password !== password) return { user: null, error: "Incorrect password." };
        return { user, error: null };
    }, []);

    const updatePassword = useCallback((email, newPassword) => {
        saveUsers(sharedUsers.map(u => u.email === email ? { ...u, password: newPassword } : u));
        return { error: null };
    }, []);

    const adminResetPassword = useCallback((email, newPassword) => {
        saveUsers(sharedUsers.map(u => u.email === email ? { ...u, password: newPassword } : u));
        return { error: null };
    }, []);

    return { users, login, updatePassword, adminResetPassword };
}

let emailjsReady = false;

async function ensureEmailJS() {
    if (!EMAILJS_ENABLED) return false;
    if (emailjsReady) return true;
    if (typeof window === "undefined") return false;
    if (window.emailjs) {
        window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
        emailjsReady = true;
        return true;
    }

    return new Promise(resolve => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
        script.onload = () => {
            window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
            emailjsReady = true;
            resolve(true);
        };
        script.onerror = () => resolve(false);
        document.head.appendChild(script);
    });
}

async function sendDueReminderEmail({ toEmail, toName, ticketTitle, dueDate, daysLeft }) {
    if (!EMAILJS_ENABLED) return;
    try {
        const ok = await ensureEmailJS();
        if (!ok) return;
        await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
            to_email: toEmail,
            to_name: toName,
            ticket_title: ticketTitle,
            due_date: new Date(dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
            days_left: daysLeft === 0 ? "today" : `in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`,
        });
    } catch (err) {
        console.error("[EmailJS] send error:", err);
    }
}

function todayStr() {
    return new Date().toISOString().slice(0, 10);
}

function reminderKey(ticketId, email) {
    return `aazora_reminded_${ticketId}_${email}_${todayStr()}`;
}

function alreadyRemindedToday(ticketId, email) {
    if (typeof localStorage === "undefined") return false;
    return !!localStorage.getItem(reminderKey(ticketId, email));
}

function markRemindedToday(ticketId, email) {
    if (typeof localStorage !== "undefined") {
        localStorage.setItem(reminderKey(ticketId, email), "1");
    }
}

function dismissedNotifsKey(email) {
    return `aazora_dismissed_notifications_${email}`;
}

function getDismissedNotifIds(email) {
    if (typeof localStorage === "undefined" || !email) return new Set();
    try {
        const saved = JSON.parse(localStorage.getItem(dismissedNotifsKey(email)) || "[]");
        return new Set(Array.isArray(saved) ? saved.map(String) : []);
    } catch {
        return new Set();
    }
}

function saveDismissedNotifIds(email, ids) {
    if (typeof localStorage === "undefined" || !email) return;
    localStorage.setItem(dismissedNotifsKey(email), JSON.stringify([...ids]));
}

export async function runDueReminders(tickets, users, pushNotif, currentUser) {
    if (!tickets.length || !currentUser) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const ticket of tickets) {
        if (ticket.archived || ticket.status === "Closed" || !ticket.dueDate || !ticket.assignedTo) continue;
        if (ticket.assignedTo !== currentUser.email) continue;

        const due = new Date(ticket.dueDate);
        due.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((due - today) / 86400000);
        if (diffDays > 2) continue;
        if (alreadyRemindedToday(ticket.id, ticket.assignedTo)) continue;

        const assignee = users.find(u => u.email === ticket.assignedTo);
        if (!assignee) continue;

        const notifText = diffDays < 0
            ? `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? "" : "s"}: "${ticket.title}"`
            : diffDays === 0
                ? `Due today: "${ticket.title}"`
                : `Due in ${diffDays} day${diffDays === 1 ? "" : "s"}: "${ticket.title}"`;

        const { error } = await pushNotif(notifText, [ticket.assignedTo]);
        if (!error) {
            await sendDueReminderEmail({
                toEmail: ticket.assignedTo,
                toName: assignee.name,
                ticketTitle: ticket.title,
                dueDate: ticket.dueDate,
                daysLeft: Math.max(0, diffDays),
            });
            markRemindedToday(ticket.id, ticket.assignedTo);
        }
    }
}

export function useNotifications(email) {
    const [notifs, setNotifs] = useState([]);
    const emailRef = useRef(email);

    useEffect(() => {
        emailRef.current = email;
    }, [email]);

    const notificationEmail = useCallback(n => (
        n.for_email ?? n.user_email ?? n.email ?? n.recipient_email ?? ""
    ), []);

    const mapNotif = useCallback(n => ({
        id: n.id,
        text: n.text,
        read: Boolean(n.read ?? n.is_read ?? false),
        ts: n.created_at,
        forEmail: notificationEmail(n),
    }), [notificationEmail]);

    const selectNotificationsForEmail = useCallback(async e => {
        const emailColumns = ["for_email", "user_email", "email", "recipient_email"];
        let lastError = null;

        for (const column of emailColumns) {
            const { data, error } = await supabase
                .from("notifications")
                .select("*")
                .eq(column, e)
                .order("created_at", { ascending: false })
                .limit(50);

            if (!error) return { data, error: null, emailColumn: column };

            lastError = error;
            const msg = String(error.message || "").toLowerCase();
            const isColumnProblem =
                msg.includes("column") ||
                msg.includes("schema cache") ||
                msg.includes("could not find");

            if (!isColumnProblem) break;
        }

        return { data: null, error: lastError, emailColumn: null };
    }, []);

    const fetchNotifs = useCallback(async () => {
        const e = emailRef.current;
        if (!e) {
            setNotifs([]);
            return;
        }

        const { data, error } = await selectNotificationsForEmail(e);

        if (error) {
            console.error("fetchNotifs error:", error);
            return;
        }

        const dismissed = getDismissedNotifIds(e);
        setNotifs((data || [])
            .map(mapNotif)
            .filter(n => !dismissed.has(String(n.id))));
    }, [mapNotif, selectNotificationsForEmail]);

    useEffect(() => {
        if (!email) {
            setNotifs([]);
            return;
        }

        fetchNotifs();
        const safeSuffix = email.replace(/[^a-zA-Z0-9]/g, "_");
        const channel = supabase
            .channel(`notifs_${safeSuffix}`)
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, payload => {
                if (notificationEmail(payload.new) !== emailRef.current) return;
                const mapped = mapNotif(payload.new);
                const dismissed = getDismissedNotifIds(emailRef.current);
                if (dismissed.has(String(mapped.id))) return;
                setNotifs(prev => [mapped, ...prev]);
            })
            .on("postgres_changes", { event: "UPDATE", schema: "public", table: "notifications" }, fetchNotifs)
            .on("postgres_changes", { event: "DELETE", schema: "public", table: "notifications" }, fetchNotifs)
            .subscribe(status => console.log("[notifs channel]", status));

        const syncInterval = window.setInterval(() => {
            if (document.visibilityState === "visible") {
                fetchNotifs();
            }
        }, 15000);

        function syncWhenVisible() {
            if (document.visibilityState === "visible") {
                fetchNotifs();
            }
        }

        document.addEventListener("visibilitychange", syncWhenVisible);
        window.addEventListener("focus", fetchNotifs);

        return () => {
            supabase.removeChannel(channel);
            window.clearInterval(syncInterval);
            document.removeEventListener("visibilitychange", syncWhenVisible);
            window.removeEventListener("focus", fetchNotifs);
        };
    }, [email, fetchNotifs, mapNotif, notificationEmail]);

    const pushNotif = useCallback(async (text, emails = []) => {
        const uniqueEmails = [...new Set(emails.filter(Boolean))];
        if (!uniqueEmails.length) return { error: null };

        const payloadBuilders = [
            forEmail => ({ for_email: forEmail, text, read: false }),
            forEmail => ({ for_email: forEmail, text, is_read: false }),
            forEmail => ({ for_email: forEmail, text }),
            forEmail => ({ user_email: forEmail, text, read: false }),
            forEmail => ({ user_email: forEmail, text, is_read: false }),
            forEmail => ({ user_email: forEmail, text }),
            forEmail => ({ email: forEmail, text, read: false }),
            forEmail => ({ email: forEmail, text, is_read: false }),
            forEmail => ({ email: forEmail, text }),
            forEmail => ({ recipient_email: forEmail, text, read: false }),
            forEmail => ({ recipient_email: forEmail, text, is_read: false }),
            forEmail => ({ recipient_email: forEmail, text }),
        ];

        let error = null;

        for (const buildPayload of payloadBuilders) {
            const rows = uniqueEmails.map(buildPayload);
            const result = await supabase.from("notifications").insert(rows);

            if (!result.error) {
                error = null;
                break;
            }

            error = result.error;
            const msg = String(error.message || "").toLowerCase();
            const isSchemaProblem =
                msg.includes("column") ||
                msg.includes("schema cache") ||
                msg.includes("could not find") ||
                msg.includes("read") ||
                msg.includes("email");

            if (!isSchemaProblem) break;
        }

        if (error) {
            console.error("pushNotif error:", error);
        } else if (uniqueEmails.includes(emailRef.current)) {
            await fetchNotifs();
        }

        return { error };
    }, [fetchNotifs]);

    const markAllRead = useCallback(async () => {
        const e = emailRef.current;
        if (!e) return;

        setNotifs(prev => prev.map(n => ({ ...n, read: true })));
        let { emailColumn } = await selectNotificationsForEmail(e);
        emailColumn = emailColumn || "for_email";

        let { error } = await supabase
            .from("notifications")
            .update({ read: true })
            .eq(emailColumn, e)
            .eq("read", false);

        if (error && String(error.message || "").toLowerCase().includes("read")) {
            const retry = await supabase
                .from("notifications")
                .update({ is_read: true })
                .eq(emailColumn, e)
                .eq("is_read", false);
            error = retry.error;
        }

        if (error) {
            console.error("markAllRead error:", error);
            fetchNotifs();
        }
    }, [fetchNotifs, selectNotificationsForEmail]);

    const clearAll = useCallback(async () => {
        const e = emailRef.current;
        if (!e) return;

        const dismissed = getDismissedNotifIds(e);
        notifs.forEach(n => dismissed.add(String(n.id)));
        saveDismissedNotifIds(e, dismissed);

        setNotifs([]);
    }, [notifs]);

    return {
        notifs,
        unreadCount: notifs.filter(n => !n.read).length,
        pushNotif,
        markAllRead,
        clearAll,
        refetchNotifs: fetchNotifs,
    };
}

export function useNotificationDebug(enabled = false) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchRows = useCallback(async () => {
        if (!enabled) return;
        setLoading(true);
        const { data, error } = await supabase
            .from("notifications")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(25);

        if (error) {
            console.error("notification debug fetch:", error);
        } else {
            setRows(data || []);
        }
        setLoading(false);
    }, [enabled]);

    useEffect(() => {
        fetchRows();
    }, [fetchRows]);

    return { rows, loading, refetch: fetchRows };
}

const FIELD_MAP = {
    title: "title",
    description: "description",
    priority: "priority",
    type: "type",
    assignedTeam: "assigned_team",
    assignedTo: "assigned_to",
    dueDate: "due_date",
    tags: "tags",
};

const FIELD_LABELS = {
    title: "Title",
    description: "Description",
    priority: "Priority",
    type: "Type",
    assignedTeam: "Assigned team",
    assignedTo: "Assignee",
    dueDate: "Due date",
    tags: "Tags",
};

function mapComment(c) {
    return {
        id: c.id,
        who: c.who || "Unknown",
        avatar: c.who_avatar ?? c.avatar ?? "",
        team: c.who_team ?? c.team ?? "",
        text: c.text ?? c.content ?? "",
        ts: c.created_at,
    };
}

function mapActivity(a) {
    return {
        id: a.id,
        who: a.who || "System",
        text: a.action ?? a.text ?? "",
        ts: a.created_at,
    };
}

function mapAttachment(a) {
    return {
        id: a.id,
        name: a.file_name || a.name || "Attachment",
        url: a.file_url || a.url || "",
        path: a.file_path || a.path || "",
        uploadedBy: a.uploaded_by || "",
        ts: a.created_at,
    };
}

function commentsPayloads(ticketId, text, user) {
    return [
        {
            ticket_id: ticketId,
            who: user.name,
            who_avatar: user.avatar || "",
            who_team: user.team || "",
            text,
        },
        {
            ticket_id: ticketId,
            who: user.name,
            avatar: user.avatar || "",
            team: user.team || "",
            text,
        },
        {
            ticket_id: ticketId,
            who: user.name,
            avatar: user.avatar || "",
            team: user.team || "",
            content: text,
        },
        {
            ticket_id: ticketId,
            who: user.name,
            text,
        },
    ];
}

export function useTickets() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchTickets = useCallback(async (options = {}) => {
        const silent = Boolean(options.silent);
        if (!silent) setLoading(true);

        const [
            { data: ticketRows, error: tErr },
            { data: commentRows, error: cErr },
            { data: activityRows, error: aErr },
            { data: attachmentRows, error: atErr },
        ] = await Promise.all([
            supabase.from("tickets").select("*").order("created_at", { ascending: false }),
            supabase.from("comments").select("*").order("created_at", { ascending: false }),
            supabase.from("activity").select("*").order("created_at", { ascending: false }),
            supabase.from("ticket_attachments").select("*").order("created_at", { ascending: false }),
        ]);

        if (tErr) {
            console.error("fetch tickets:", tErr);
            if (!silent) setLoading(false);
            return;
        }
        if (cErr) console.error("fetch comments:", cErr);
        if (aErr) console.error("fetch activity:", aErr);
        if (atErr) console.error("fetch attachments:", atErr);

        const comments = commentRows || [];
        const activities = activityRows || [];
        const attachments = attachmentRows || [];

        const rebuilt = (ticketRows || []).map(t => {
            const tid = Number(t.id);
            return {
                id: t.id,
                title: t.title,
                description: t.description || "",
                type: t.type,
                priority: t.priority,
                status: t.status,
                assignedTeam: t.assigned_team,
                assignedTo: t.assigned_to || null,
                dueDate: t.due_date || "",
                tags: Array.isArray(t.tags) ? t.tags : [],
                archived: Boolean(t.archived),
                createdBy: t.created_by,
                createdByTeam: t.created_by_team,
                createdAt: t.created_at,
                comments: comments.filter(c => Number(c.ticket_id) === tid).map(mapComment),
                activity: activities.filter(a => Number(a.ticket_id) === tid).map(mapActivity),
                attachments: attachments.filter(a => Number(a.ticket_id) === tid).map(mapAttachment),
            };
        });

        setTickets(rebuilt);
        if (!silent) setLoading(false);
    }, []);

    useEffect(() => {
        fetchTickets();
        const channel = supabase
            .channel("tickets-live")
            .on("postgres_changes", { event: "*", schema: "public", table: "tickets" }, () => fetchTickets({ silent: true }))
            .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, () => fetchTickets({ silent: true }))
            .on("postgres_changes", { event: "*", schema: "public", table: "activity" }, () => fetchTickets({ silent: true }))
            .on("postgres_changes", { event: "*", schema: "public", table: "ticket_attachments" }, () => fetchTickets({ silent: true }))
            .subscribe(status => console.log("[tickets channel]", status));

        const syncInterval = window.setInterval(() => {
            if (document.visibilityState === "visible") {
                fetchTickets({ silent: true });
            }
        }, 15000);

        function syncWhenVisible() {
            if (document.visibilityState === "visible") {
                fetchTickets({ silent: true });
            }
        }

        document.addEventListener("visibilitychange", syncWhenVisible);
        window.addEventListener("focus", syncWhenVisible);

        return () => {
            supabase.removeChannel(channel);
            window.clearInterval(syncInterval);
            document.removeEventListener("visibilitychange", syncWhenVisible);
            window.removeEventListener("focus", syncWhenVisible);
        };
    }, [fetchTickets]);

    const addActivity = useCallback(async (ticketId, who, action) => {
        const { error } = await supabase
            .from("activity")
            .insert({ ticket_id: ticketId, who, action });
        if (error) console.error("addActivity:", error);
    }, []);

    const createTicket = useCallback(async (form, user) => {
        const payloadVariants = [
            {
                title: form.title,
                description: form.description || "",
                type: form.type,
                priority: form.priority,
                status: "Open",
                assigned_team: form.assignedTeam,
                assigned_to: form.assignedTo || null,
                due_date: form.dueDate || null,
                tags: form.tags || [],
                archived: false,
                created_by: user.name,
                created_by_team: user.team,
            },
            {
                title: form.title,
                description: form.description || "",
                type: form.type,
                priority: form.priority,
                status: "Open",
                assigned_team: form.assignedTeam,
                assigned_to: form.assignedTo || null,
                due_date: form.dueDate || null,
                created_by: user.name,
                created_by_team: user.team,
            },
            {
                title: form.title,
                description: form.description || "",
                type: form.type,
                priority: form.priority,
                status: "Open",
                created_by: user.name,
                created_by_team: user.team,
            },
        ];

        let lastError = null;

        for (const payload of payloadVariants) {
            const result = await supabase
                .from("tickets")
                .insert([payload]);

            if (!result.error) {
                const latest = await supabase
                    .from("tickets")
                    .select("id, created_at, title, created_by")
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (latest.data?.id) {
                    await addActivity(latest.data.id, user.name, "Ticket created");
                }

                await fetchTickets();
                return { ticket: null, error: null };
            }

            lastError = result.error;
            const msg = String(lastError.message || "").toLowerCase();
            const isSchemaProblem =
                msg.includes("column") ||
                msg.includes("schema cache") ||
                msg.includes("could not find") ||
                msg.includes("row-level security") ||
                msg.includes("permission") ||
                msg.includes("new row violates") ||
                msg.includes("violates row-level security");

            if (!isSchemaProblem) break;
        }

        console.error("createTicket:", lastError);
        return { ticket: null, error: lastError };
    }, [addActivity, fetchTickets]);

    const updateStatus = useCallback(async (id, status, user) => {
        const { error } = await supabase.from("tickets").update({ status }).eq("id", id);
        if (error) {
            console.error("updateStatus:", error);
            return { error };
        }
        await addActivity(id, user.name, `Status changed to "${status}"`);
        await fetchTickets();
        return { error: null };
    }, [addActivity, fetchTickets]);

    const updateField = useCallback(async (id, field, value, user) => {
        const dbField = FIELD_MAP[field] || field;
        const dbValue = value === "" || value === undefined ? null : value;
        const { error } = await supabase.from("tickets").update({ [dbField]: dbValue }).eq("id", id);
        if (error) {
            console.error("updateField:", error);
            return { error };
        }

        const label = FIELD_LABELS[field] || field;
        const action = dbValue ? `${label} changed to "${value}"` : `${label} cleared`;
        await addActivity(id, user?.name || "User", action);
        await fetchTickets();
        return { error: null };
    }, [addActivity, fetchTickets]);

    const addComment = useCallback(async (ticketId, text, user) => {
        const payloads = commentsPayloads(ticketId, text, user);
        let lastError = null;

        for (const payload of payloads) {
            const { data, error } = await supabase
                .from("comments")
                .insert([payload])
                .select();

            if (!error) {
                console.log("[addComment SUCCESS]", data);
                await addActivity(ticketId, user.name, "Added a comment");
                await fetchTickets();
                return { error: null };
            }

            lastError = error;
            const msg = String(error.message || "").toLowerCase();
            const isSchemaMismatch =
                msg.includes("column") ||
                msg.includes("schema cache") ||
                msg.includes("could not find") ||
                msg.includes("content") ||
                msg.includes("avatar") ||
                msg.includes("team");

            if (!isSchemaMismatch) break;
        }

        console.error("[addComment ERROR]", lastError);
        return { error: lastError };
    }, [addActivity, fetchTickets]);

    const deleteComment = useCallback(async (commentId, ticketId, user) => {
        const { error } = await supabase.from("comments").delete().eq("id", commentId);
        if (error) {
            console.error("deleteComment:", error);
            return { error };
        }
        await addActivity(ticketId, user.name, "Deleted a comment");
        await fetchTickets();
        return { error: null };
    }, [addActivity, fetchTickets]);

    const deleteTicket = useCallback(async (id) => {
        await Promise.all([
            supabase.from("comments").delete().eq("ticket_id", id),
            supabase.from("activity").delete().eq("ticket_id", id),
        ]);
        const { error } = await supabase.from("tickets").delete().eq("id", id);
        if (error) {
            console.error("deleteTicket:", error);
            return { error };
        }
        await fetchTickets();
        return { error: null };
    }, [fetchTickets]);

    const archiveTicket = useCallback(async (id, user) => {
        const { error } = await supabase.from("tickets").update({ archived: true }).eq("id", id);
        if (error) {
            console.error("archiveTicket:", error);
            return { error };
        }
        await addActivity(id, user?.name || "User", "Ticket archived");
        await fetchTickets();
        return { error: null };
    }, [addActivity, fetchTickets]);

    const restoreTicket = useCallback(async (id, user) => {
        const { error } = await supabase.from("tickets").update({ archived: false }).eq("id", id);
        if (error) {
            console.error("restoreTicket:", error);
            return { error };
        }
        await addActivity(id, user?.name || "User", "Ticket restored");
        await fetchTickets();
        return { error: null };
    }, [addActivity, fetchTickets]);

    const uploadAttachment = useCallback(async (ticketId, file, user) => {
        if (!file) return { error: null };

        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${ticketId}/${Date.now()}_${safeName}`;
        const upload = await supabase.storage
            .from("ticket-attachments")
            .upload(path, file, { upsert: false });

        if (upload.error) {
            console.error("uploadAttachment storage:", upload.error);
            return { error: upload.error };
        }

        const { data: publicUrlData } = supabase.storage
            .from("ticket-attachments")
            .getPublicUrl(path);

        const { error } = await supabase
            .from("ticket_attachments")
            .insert({
                ticket_id: ticketId,
                file_name: file.name,
                file_path: path,
                file_url: publicUrlData?.publicUrl || "",
                uploaded_by: user?.name || "User",
            });

        if (error) {
            console.error("uploadAttachment row:", error);
            return { error };
        }

        await addActivity(ticketId, user?.name || "User", `Uploaded attachment "${file.name}"`);
        await fetchTickets();
        return { error: null };
    }, [addActivity, fetchTickets]);

    return {
        tickets,
        loading,
        createTicket,
        updateStatus,
        updateField,
        addComment,
        deleteComment,
        deleteTicket,
        archiveTicket,
        restoreTicket,
        uploadAttachment,
        refetch: fetchTickets,
    };
}
