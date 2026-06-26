export interface Account {
  id: string;
  name: string;
  email: string;
  balance: number;
  currency: string;
}

export interface Transaction {
  transaction_id: string;
  status: "completed" | "pending" | "failed";
  from_account: string;
  to_account: string;
  amount: number;
  currency: string;
  converted_amount_usd: number;
  fee: number;
  timestamp: string;
  note?: string;
}

export interface TransferRequest {
  from_account: string;
  to_account: string;
  amount: number;
  currency: string;
  note?: string;
}

export interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
  updated: string;
}

export type Tab = "transfer" | "accounts" | "history" | "rates";
