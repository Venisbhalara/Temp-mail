import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from "react";
import { io } from "socket.io-client";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const API = `${API_BASE_URL}/api`;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

// ── State ─────────────────────────────────────────────────────
const initialState = {
  inbox: null, // { inboxId, address, username, domain, expiresAt }
  emails: [], // list of email summaries
  selectedEmail: null, // full email object
  loading: false, // inbox generation
  emailsLoading: false,
  emailLoading: false,
  domains: [],
  toasts: [],
  connected: false,
  minutesLeft: null,
};

const reducer = (state, action) => {
  switch (action.type) {
    case "SET_INBOX":
      return { ...state, inbox: action.payload, loading: false };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_EMAILS":
      return { ...state, emails: action.payload, emailsLoading: false };
    case "SET_EMAILS_LOADING":
      return { ...state, emailsLoading: action.payload };
    case "ADD_EMAIL":
      return { ...state, emails: [action.payload, ...state.emails] };
    case "SET_SELECTED":
      return { ...state, selectedEmail: action.payload, emailLoading: false };
    case "SET_EMAIL_LOADING":
      return { ...state, emailLoading: action.payload };
    case "SET_DOMAINS":
      return { ...state, domains: action.payload };
    case "SET_CONNECTED":
      return { ...state, connected: action.payload };
    case "SET_MINUTES":
      return { ...state, minutesLeft: action.payload };
    case "MARK_READ":
      return {
        ...state,
        emails: state.emails.map((e) =>
          e.id === action.payload ? { ...e, isRead: true } : e,
        ),
      };
    case "REMOVE_EMAIL":
      return {
        ...state,
        emails: state.emails.filter((e) => e.id !== action.payload),
        selectedEmail:
          state.selectedEmail?.id === action.payload
            ? null
            : state.selectedEmail,
      };
    case "ADD_TOAST":
      return { ...state, toasts: [...state.toasts, action.payload] };
    case "REMOVE_TOAST":
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.payload),
      };
    case "RESET":
      return { ...initialState, domains: state.domains };
    default:
      return state;
  }
};

// ── Context ───────────────────────────────────────────────────
const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

let toastId = 0;

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const socketRef = useRef(null);

  // ── Toasts ─────────────────────────────────────────────────
  const toast = (message, type = "success") => {
    const id = ++toastId;
    dispatch({ type: "ADD_TOAST", payload: { id, message, type } });
    setTimeout(() => dispatch({ type: "REMOVE_TOAST", payload: id }), 3500);
  };

  // ── Fetch domains on mount ──────────────────────────────────
  useEffect(() => {
    fetch(`${API}/domains`)
      .then((r) => r.json())
      .then((d) => dispatch({ type: "SET_DOMAINS", payload: d.domains || [] }))
      .catch(() => {});
  }, []);

  // ── Socket.io lifecycle ─────────────────────────────────────
  const connectSocket = (inboxId) => {
    if (socketRef.current) socketRef.current.disconnect();

    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () =>
      dispatch({ type: "SET_CONNECTED", payload: true }),
    );
    socket.on("disconnect", () =>
      dispatch({ type: "SET_CONNECTED", payload: false }),
    );
    socket.on("connect_error", () =>
      dispatch({ type: "SET_CONNECTED", payload: false }),
    );

    socket.on("connect", () => socket.emit("join_inbox", inboxId));

    socket.on("new_email", (email) => {
      dispatch({ type: "ADD_EMAIL", payload: email });
      toast(`📨 New email from ${email.fromName || email.from}`, "info");
      // Play notification sound
      try {
        new Audio("/notify.mp3").play().catch(() => {});
      } catch {}
    });

    socket.on("inbox_expiring", ({ minutesLeft }) => {
      dispatch({ type: "SET_MINUTES", payload: minutesLeft });
      if (minutesLeft <= 1) toast("⚠️ Inbox expires in 1 minute!", "warning");
    });

    socket.on("inbox_deleted", () => {
      dispatch({ type: "RESET" });
      toast("Inbox has expired", "error");
    });
  };

  // ── Actions ─────────────────────────────────────────────────
  const generateInbox = async (customUsername = null) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const res = await fetch(`${API}/generate-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customUsername }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate email");
      }
      const inbox = await res.json();
      dispatch({ type: "SET_INBOX", payload: inbox });
      dispatch({ type: "SET_EMAILS", payload: [] });
      dispatch({ type: "SET_SELECTED", payload: null });
      connectSocket(inbox.inboxId);
      toast(` New inbox created!`);
    } catch (err) {
      dispatch({ type: "SET_LOADING", payload: false });
      toast(err.message, "error");
    }
  };

  const fetchEmails = async () => {
    if (!state.inbox) return;
    dispatch({ type: "SET_EMAILS_LOADING", payload: true });
    try {
      const res = await fetch(`${API}/emails/${state.inbox.inboxId}`);
      const data = await res.json();
      dispatch({ type: "SET_EMAILS", payload: data.emails || [] });
    } catch {
      dispatch({ type: "SET_EMAILS_LOADING", payload: false });
    }
  };

  const selectEmail = async (email) => {
    dispatch({ type: "MARK_READ", payload: email.id });
    dispatch({ type: "SET_EMAIL_LOADING", payload: true });
    try {
      const res = await fetch(`${API}/email/${email.id}`);
      const full = await res.json();
      dispatch({ type: "SET_SELECTED", payload: full });
    } catch {
      dispatch({ type: "SET_EMAIL_LOADING", payload: false });
    }
  };

  const deleteEmail = async (id) => {
    try {
      await fetch(`${API}/email/${id}`, { method: "DELETE" });
      dispatch({ type: "REMOVE_EMAIL", payload: id });
      toast("Email deleted");
    } catch {
      toast("Failed to delete email", "error");
    }
  };

  const simulateEmail = async (type = "otp") => {
    if (!state.inbox) return;
    try {
      await fetch(`${API}/simulate-email/${state.inbox.inboxId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
    } catch {
      toast("Simulation failed", "error");
    }
  };

  const deleteInbox = async () => {
    if (!state.inbox) return;
    try {
      await fetch(`${API}/inbox/${state.inbox.inboxId}`, { method: "DELETE" });
      dispatch({ type: "RESET" });
      if (socketRef.current) socketRef.current.disconnect();
      toast("Inbox deleted");
    } catch {
      toast("Failed to delete inbox", "error");
    }
  };

  // Auto-fetch emails when inbox changes
  useEffect(() => {
    if (state.inbox) fetchEmails();
  }, [state.inbox?.inboxId]);

  // Generate inbox on first load
  useEffect(() => {
    generateInbox();
  }, []);

  // Cleanup socket on unmount
  useEffect(
    () => () => {
      socketRef.current?.disconnect();
    },
    [],
  );

  return (
    <AppContext.Provider
      value={{
        ...state,
        generateInbox,
        fetchEmails,
        selectEmail,
        deleteEmail,
        simulateEmail,
        deleteInbox,
        toast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
