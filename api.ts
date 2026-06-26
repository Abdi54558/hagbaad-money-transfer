import type { Account, Transaction, TransferRequest, ExchangeRates } from "./types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail ?? "Request failed");
  return data as T;
}

export const api = {
  getAccounts: () =>
    request<{ accounts: Account[] }>("/accounts").then((d) => d.accounts),

  getAccount: (id: string) =>
    request<Account>(`/accounts/${id}`),

  transfer: (body: TransferRequest) =>
    request<Transaction>("/transfer", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getTransactions: (accountId?: string) =>
    request<{ transactions: Transaction[]; count: number }>(
      accountId ? `/transactions?account_id=${accountId}` : "/transactions"
    ).then((d) => d.transactions),

  getRates: () => request<ExchangeRates>("/rates"),
};
