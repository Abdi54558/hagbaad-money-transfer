import { useState, useEffect, useCallback } from "react";
import { api } from "./api";
import type { Account, Transaction, Tab } from "./types";
import "./index.css";

// ─── Constants ────────────────────────────────────────────────────────────────
const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "JPY"] as const;
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", CAD: "CA$", JPY: "¥",
};

const fmt = (n: number, cur = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: cur,
    maximumFractionDigits: 2,
  }).format(n);

const fmtDate = (s: string) =>
  new Date(s).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  return <span className={`badge badge-${status}`}>{status}</span>;
}

function AccountCard({ account }: { account: Account }) {
  const initials = account.name.split(" ").map((n) => n[0]).join("");
  return (
    <div className="account-card">
      <div className="account-avatar">{initials}</div>
      <div className="account-info">
        <div className="account-name">{account.name}</div>
        <div className="account-id">{account.id}</div>
        <div className="account-email">{account.email}</div>
      </div>
      <div className="account-balance">
        <span className="balance-amount">{fmt(account.balance)}</span>
        <span className="balance-label">Available</span>
      </div>
    </div>
  );
}

// ─── Transfer Form ────────────────────────────────────────────────────────────
function TransferForm({
  accounts,
  onSuccess,
}: {
  accounts: Account[];
  onSuccess: (t: Transaction) => void;
}) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<{ fee: number; total: number } | null>(null);

  useEffect(() => {
    const amt = parseFloat(amount);
    if (!isNaN(amt) && amt > 0) {
      const fee = parseFloat((amt * 0.015).toFixed(2));
      setPreview({ fee, total: parseFloat((amt + fee).toFixed(2)) });
    } else {
      setPreview(null);
    }
  }, [amount]);

  const handleSubmit = async () => {
    setError("");
    if (!from || !to || !amount) {
      setError("Please fill in all required fields.");
      return;
    }
    if (from === to) {
      setError("Source and destination must be different accounts.");
      return;
    }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setError("Enter a valid amount greater than 0.");
      return;
    }
    setLoading(true);
    try {
      const txn = await api.transfer({
        from_account: from,
        to_account: to,
        amount: amt,
        currency,
        note: note || undefined,
      });
      onSuccess(txn);
      setFrom(""); setTo(""); setAmount(""); setNote(""); setPreview(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Transfer failed");
    } finally {
      setLoading(false);
    }
  };

  const sender = accounts.find((a) => a.id === from);

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-icon">⇄</div>
        <div>
          <h2 className="panel-title">New Transfer</h2>
          <p className="panel-subtitle">Move funds between accounts instantly</p>
        </div>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">
            From Account <span className="required">*</span>
          </label>
          <select
            className="form-select"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          >
            <option value="">Select source account</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} — {fmt(a.balance)} ({a.id})
              </option>
            ))}
          </select>
          {sender && (
            <div className="form-hint">
              Balance: <strong>{fmt(sender.balance)}</strong>
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">
            To Account <span className="required">*</span>
          </label>
          <select
            className="form-select"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          >
            <option value="">Select destination account</option>
            {accounts
              .filter((a) => a.id !== from)
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} — {a.id}
                </option>
              ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">
            Amount <span className="required">*</span>
          </label>
          <div className="amount-input-wrap">
            <span className="currency-symbol">
              {CURRENCY_SYMBOLS[currency] ?? "$"}
            </span>
            <input
              className="form-input amount-input"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <select
              className="currency-select"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            Note <span className="optional">(optional)</span>
          </label>
          <input
            className="form-input"
            type="text"
            placeholder="e.g. Rent, Invoice #42…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={120}
          />
        </div>
      </div>

      {preview && (
        <div className="fee-preview">
          <div className="fee-row">
            <span>Transfer amount</span>
            <span>
              {CURRENCY_SYMBOLS[currency]}{parseFloat(amount).toFixed(2)} {currency}
            </span>
          </div>
          <div className="fee-row">
            <span>Service fee (1.5%)</span>
            <span>
              {CURRENCY_SYMBOLS[currency]}{preview.fee.toFixed(2)} {currency}
            </span>
          </div>
          <div className="fee-row total-row">
            <span>Total deducted</span>
            <span>
              {CURRENCY_SYMBOLS[currency]}{preview.total.toFixed(2)} {currency}
            </span>
          </div>
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      <button
        className="btn btn-primary"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? <span className="spinner" /> : "Send Transfer"}
      </button>
    </div>
  );
}

// ─── Success Toast ────────────────────────────────────────────────────────────
function SuccessToast({
  txn,
  onDismiss,
}: {
  txn: Transaction;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 6000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className="toast toast-success">
      <div className="toast-icon">✓</div>
      <div className="toast-content">
        <div className="toast-title">Transfer complete</div>
        <div className="toast-detail">
          {txn.transaction_id} · {fmt(txn.converted_amount_usd)} sent
        </div>
      </div>
      <button className="toast-close" onClick={onDismiss}>×</button>
    </div>
  );
}

// ─── Accounts Panel ───────────────────────────────────────────────────────────
function AccountsPanel({ accounts }: { accounts: Account[] }) {
  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-icon">◈</div>
        <div>
          <h2 className="panel-title">Accounts</h2>
          <p className="panel-subtitle">{accounts.length} registered accounts</p>
        </div>
      </div>
      <div className="accounts-list">
        {accounts.map((a) => <AccountCard key={a.id} account={a} />)}
      </div>
    </div>
  );
}

// ─── History Panel ────────────────────────────────────────────────────────────
function HistoryPanel({ accounts }: { accounts: Account[] }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTransactions().then(setTransactions).finally(() => setLoading(false));
  }, []);

  const getName = (id: string) =>
    accounts.find((a) => a.id === id)?.name ?? id;

  const handleFilter = (val: string) => {
    setFilter(val);
    setLoading(true);
    api
      .getTransactions(val || undefined)
      .then(setTransactions)
      .finally(() => setLoading(false));
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-icon">≡</div>
        <div>
          <h2 className="panel-title">Transaction History</h2>
          <p className="panel-subtitle">{transactions.length} transactions</p>
        </div>
      </div>

      <select
        className="form-select"
        value={filter}
        onChange={(e) => handleFilter(e.target.value)}
      >
        <option value="">All accounts</option>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>{a.name}</option>
        ))}
      </select>

      {loading ? (
        <div className="loading-state"><span className="spinner large" /></div>
      ) : transactions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">⊙</div>
          <p>No transactions yet. Make your first transfer.</p>
        </div>
      ) : (
        <div className="txn-list">
          {[...transactions].reverse().map((t) => (
            <div key={t.transaction_id} className="txn-row">
              <div className="txn-meta">
                <span className="txn-id">{t.transaction_id}</span>
                <StatusBadge status={t.status} />
              </div>
              <div className="txn-parties">
                <span className="txn-name">{getName(t.from_account)}</span>
                <span className="txn-arrow">→</span>
                <span className="txn-name">{getName(t.to_account)}</span>
              </div>
              {t.note && <div className="txn-note">"{t.note}"</div>}
              <div className="txn-amounts">
                <span className="txn-amount">
                  {CURRENCY_SYMBOLS[t.currency]}{t.amount.toFixed(2)} {t.currency}
                </span>
                <span className="txn-fee">fee: {fmt(t.fee)}</span>
                <span className="txn-date">{fmtDate(t.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Rates Panel ──────────────────────────────────────────────────────────────
function RatesPanel() {
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [updated, setUpdated] = useState("");
  const [base, setBase] = useState("USD");

  useEffect(() => {
    api.getRates().then((r) => {
      setRates(r.rates);
      setUpdated(r.updated);
    });
  }, []);

  const convert = (code: string) => {
    if (!rates) return "—";
    const val = rates[code] / rates[base];
    return code === "JPY" ? val.toFixed(2) : val.toFixed(4);
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-icon">◎</div>
        <div>
          <h2 className="panel-title">Exchange Rates</h2>
          <p className="panel-subtitle">Live rates relative to your chosen base</p>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Base currency</label>
        <select
          className="form-select"
          value={base}
          onChange={(e) => setBase(e.target.value)}
        >
          {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      {rates && (
        <div className="rates-grid">
          {CURRENCIES.filter((c) => c !== base).map((c) => (
            <div key={c} className="rate-card">
              <div className="rate-code">{c}</div>
              <div className="rate-symbol">{CURRENCY_SYMBOLS[c]}</div>
              <div className="rate-value">
                1 {base} = {convert(c)} {c}
              </div>
            </div>
          ))}
        </div>
      )}
      {updated && (
        <div className="rate-updated">Updated {fmtDate(updated)}</div>
      )}
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState<Tab>("transfer");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [toast, setToast] = useState<Transaction | null>(null);
  const [apiStatus, setApiStatus] = useState<"ok" | "error" | "loading">("loading");

  const loadAccounts = useCallback(() => {
    api
      .getAccounts()
      .then((a) => { setAccounts(a); setApiStatus("ok"); })
      .catch(() => setApiStatus("error"));
  }, []);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  const handleSuccess = (txn: Transaction) => {
    setToast(txn);
    loadAccounts();
  };

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "transfer", label: "Transfer", icon: "⇄" },
    { id: "accounts", label: "Accounts", icon: "◈" },
    { id: "history",  label: "History",  icon: "≡" },
    { id: "rates",    label: "Rates",    icon: "◎" },
  ];

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <div className="logo-mark">H</div>
            <span className="logo-text">Hagbaad Money Transfer</span>
          </div>
          <div className="api-status">
            <span className={`status-dot status-${apiStatus}`} />
            <span className="status-label">
              API{" "}
              {apiStatus === "ok"
                ? "connected"
                : apiStatus === "error"
                ? "offline"
                : "connecting…"}
            </span>
          </div>
        </div>
      </header>

      <nav className="nav">
        <div className="nav-inner">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`nav-btn ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              <span className="nav-icon">{t.icon}</span>
              <span className="nav-label">{t.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="main">
        {apiStatus === "error" && (
          <div className="alert alert-error banner">
            Cannot reach the API at{" "}
            <code>http://localhost:8000</code>. Make sure the FastAPI server is
            running: <code>uvicorn main:app --reload</code>
          </div>
        )}
        {tab === "transfer" && (
          <TransferForm accounts={accounts} onSuccess={handleSuccess} />
        )}
        {tab === "accounts" && <AccountsPanel accounts={accounts} />}
        {tab === "history"  && <HistoryPanel accounts={accounts} />}
        {tab === "rates"    && <RatesPanel />}
      </main>

      {toast && (
        <SuccessToast txn={toast} onDismiss={() => setToast(null)} />
      )}
    </div>
  );
}
