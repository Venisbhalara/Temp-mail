/**
 * SmsContext.jsx
 * ==============
 * Dedicated React context for the Temporary Indian SMS feature.
 * Manages number selection, inbox polling, socket connection,
 * and real-time new-SMS events.
 */

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useCallback,
} from 'react';
import { io } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const API         = `${API_BASE_URL}/api/sms`;
const SOCKET_URL  = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// ── Initial state ─────────────────────────────────────────────────────────────
const initialState = {
  smsNumbers: [],
  numbersLoading: false,
  activeNumber: null,
  smsMessages: [],
  messagesLoading: false,
  selectedSms: null,
  smsConnected: false,
  numberChanging: false,   // true while "Change Number" is in flight
  toasts: [],
};

// ── Reducer ───────────────────────────────────────────────────────────────────
const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_NUMBERS':
      return { ...state, smsNumbers: action.payload, numbersLoading: false };
    case 'SET_NUMBERS_LOADING':
      return { ...state, numbersLoading: action.payload };
    case 'SET_ACTIVE_NUMBER':
      return { ...state, activeNumber: action.payload, smsMessages: [], selectedSms: null };
    case 'SET_MESSAGES':
      return { ...state, smsMessages: action.payload, messagesLoading: false };
    case 'SET_MESSAGES_LOADING':
      return { ...state, messagesLoading: action.payload };
    case 'ADD_SMS': {
      // Prepend, avoid duplicates
      const exists = state.smsMessages.some(m => m.id === action.payload.id);
      if (exists) return state;
      return { ...state, smsMessages: [action.payload, ...state.smsMessages] };
    }
    case 'SET_SELECTED':
      return { ...state, selectedSms: action.payload };
    case 'SET_CONNECTED':
      return { ...state, smsConnected: action.payload };
    case 'SET_NUMBER_CHANGING':
      return { ...state, numberChanging: action.payload };
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, action.payload] };
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };
    default:
      return state;
  }
};

// ── Context ───────────────────────────────────────────────────────────────────
const SmsContext = createContext(null);
export const useSms = () => useContext(SmsContext);

let toastId = 0;

export const SmsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const socketRef = useRef(null);
  const activeNumberRef = useRef(null);

  // ── Toast helper ────────────────────────────────────────────────────────────
  const toast = useCallback((message, type = 'success') => {
    const id = ++toastId;
    dispatch({ type: 'ADD_TOAST', payload: { id, message, type } });
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: id }), 3500);
  }, []);

  // ── Socket lifecycle ─────────────────────────────────────────────────────────
  const connectSmsSocket = useCallback((number) => {
    // Disconnect previous socket if switching numbers
    if (socketRef.current) {
      if (activeNumberRef.current) {
        socketRef.current.emit('leave_sms_inbox', activeNumberRef.current);
      }
      socketRef.current.disconnect();
    }

    activeNumberRef.current = number;

    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      dispatch({ type: 'SET_CONNECTED', payload: true });
      socket.emit('join_sms_inbox', number);
    });
    socket.on('disconnect', () => dispatch({ type: 'SET_CONNECTED', payload: false }));
    socket.on('connect_error', () => dispatch({ type: 'SET_CONNECTED', payload: false }));

    socket.on('new_sms', (sms) => {
      dispatch({ type: 'ADD_SMS', payload: sms });
      const preview = sms.body?.slice(0, 40) || '';
      toast(`📱 New SMS from ${sms.from}${sms.otpCode ? ` — OTP: ${sms.otpCode}` : ''}`, 'info');
      try { new Audio('/notify.mp3').play().catch(() => {}); } catch {}
    });
  }, [toast]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const loadNumbers = useCallback(async () => {
    dispatch({ type: 'SET_NUMBERS_LOADING', payload: true });
    try {
      const res = await fetch(`${API}/numbers`);
      if (!res.ok) throw new Error('Failed to load numbers');
      const { numbers } = await res.json();
      dispatch({ type: 'SET_NUMBERS', payload: numbers || [] });
      return numbers || [];
    } catch (err) {
      dispatch({ type: 'SET_NUMBERS_LOADING', payload: false });
      toast(err.message, 'error');
      return [];
    }
  }, [toast]);

  const fetchInbox = useCallback(async (number) => {
    if (!number) return;
    dispatch({ type: 'SET_MESSAGES_LOADING', payload: true });
    try {
      const res = await fetch(`${API}/inbox/${number}`);
      if (!res.ok) throw new Error('Failed to fetch inbox');
      const { messages } = await res.json();
      dispatch({ type: 'SET_MESSAGES', payload: messages || [] });
    } catch (err) {
      dispatch({ type: 'SET_MESSAGES_LOADING', payload: false });
      toast('Could not load SMS inbox', 'error');
    }
  }, [toast]);

  const selectNumber = useCallback(async (numberObj) => {
    dispatch({ type: 'SET_ACTIVE_NUMBER', payload: numberObj });
    connectSmsSocket(numberObj.number);
    await fetchInbox(numberObj.number);
  }, [connectSmsSocket, fetchInbox]);

  const refreshInbox = useCallback(async () => {
    if (!state.activeNumber) return;
    dispatch({ type: 'SET_MESSAGES_LOADING', payload: true });
    try {
      const res = await fetch(`${API}/refresh/${state.activeNumber.number}`, { method: 'POST' });
      if (!res.ok) throw new Error('Refresh failed');
      const { messages } = await res.json();
      dispatch({ type: 'SET_MESSAGES', payload: messages || [] });
      toast('Inbox refreshed', 'success');
    } catch {
      dispatch({ type: 'SET_MESSAGES_LOADING', payload: false });
      toast('Refresh failed', 'error');
    }
  }, [state.activeNumber, toast]);

  // ── Change Number ────────────────────────────────────────────────────────────
  // Fetches a FRESH random number from the backend pool — never repeats the current one.
  const changeNumber = useCallback(async () => {
    const currentNumber = state.activeNumber?.number || '';
    dispatch({ type: 'SET_NUMBER_CHANGING', payload: true });
    try {
      const res = await fetch(`${API}/next/${currentNumber}`);
      if (!res.ok) throw new Error('Could not get next number');
      const { number: nextNumberObj } = await res.json();
      if (!nextNumberObj) throw new Error('Empty response');
      dispatch({ type: 'SET_ACTIVE_NUMBER', payload: nextNumberObj });
      dispatch({ type: 'SET_NUMBER_CHANGING', payload: false });
      connectSmsSocket(nextNumberObj.number);
      await fetchInbox(nextNumberObj.number);
      toast(`🇮🇳 Switched to ${nextNumberObj.display}`, 'success');
    } catch (err) {
      dispatch({ type: 'SET_NUMBER_CHANGING', payload: false });
      toast('Could not change number — try again', 'error');
    }
  }, [state.activeNumber, connectSmsSocket, fetchInbox, toast]);

  const selectSms = useCallback((sms) => dispatch({ type: 'SET_SELECTED', payload: sms }), []);
  const closeSms  = useCallback(() => dispatch({ type: 'SET_SELECTED', payload: null }), []);

  // ── Bootstrap on mount ───────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const numbers = await loadNumbers();
      if (numbers.length > 0) {
        await selectNumber(numbers[0]);
      }
    })();
    // Cleanup socket on unmount
    return () => { socketRef.current?.disconnect(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SmsContext.Provider value={{
      ...state,
      loadNumbers,
      selectNumber,
      fetchInbox,
      refreshInbox,
      changeNumber,
      selectSms,
      closeSms,
      toast,
    }}>
      {children}
    </SmsContext.Provider>
  );
};
