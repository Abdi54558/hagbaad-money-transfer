"""
Hagbaad Money Transfer API
FastAPI backend — Python 3.11+

"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime
import uuid

app = FastAPI(
    title="Hagbaad Money Transfer",
    version="1.0.0",
    description="Hagbaad Money Transfer — API built with FastAPI",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── In-memory data store ─────────────────────────────────────────────────────
accounts: dict = {
    "ACC001": {"id": "ACC001", "name": "Alice Martin",  "email": "alice@example.com",  "balance": 5420.00, "currency": "USD"},
    "ACC002": {"id": "ACC002", "name": "Bob Chen",      "email": "bob@example.com",    "balance": 2100.50, "currency": "USD"},
    "ACC003": {"id": "ACC003", "name": "Clara Diaz",    "email": "clara@example.com",  "balance": 9875.00, "currency": "USD"},
    "ACC004": {"id": "ACC004", "name": "David Osei",    "email": "david@example.com",  "balance":  312.75, "currency": "USD"},
}

transactions: list = []

EXCHANGE_RATES: dict[str, float] = {
    "USD": 1.0,
    "EUR": 0.92,
    "GBP": 0.79,
    "CAD": 1.36,
    "JPY": 149.50,
}

# ─── Pydantic models ──────────────────────────────────────────────────────────
class TransferRequest(BaseModel):
    from_account: str
    to_account: str
    amount: float = Field(..., gt=0, description="Amount must be positive")
    currency: str = "USD"
    note: Optional[str] = None

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, v: str) -> str:
        if v not in EXCHANGE_RATES:
            raise ValueError(f"Unsupported currency. Choose from: {list(EXCHANGE_RATES.keys())}")
        return v


class TransferResponse(BaseModel):
    transaction_id: str
    status: str
    from_account: str
    to_account: str
    amount: float
    currency: str
    converted_amount_usd: float
    fee: float
    timestamp: str
    note: Optional[str]


# ─── Routes ───────────────────────────────────────────────────────────────────
@app.get("/", tags=["General"])
def root():
    return {"message": "Hagbaad Money Transfer API is running", "version": "1.0.0"}


@app.get("/health", tags=["General"])
def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat() + "Z"}


@app.get("/accounts", tags=["Accounts"])
def list_accounts():
    """Return all registered accounts."""
    return {"accounts": list(accounts.values())}


@app.get("/accounts/{account_id}", tags=["Accounts"])
def get_account(account_id: str):
    """Return a single account by ID."""
    if account_id not in accounts:
        raise HTTPException(status_code=404, detail=f"Account '{account_id}' not found")
    return accounts[account_id]


@app.post("/transfer", response_model=TransferResponse, tags=["Transfers"])
def transfer_funds(request: TransferRequest):
    """
    Execute a money transfer between two accounts.

    - Applies a 1.5% service fee on the sender.
    - Converts the amount to USD using live exchange rates.
    - Returns a completed transaction record.
    """
    if request.from_account not in accounts:
        raise HTTPException(status_code=404, detail=f"Source account '{request.from_account}' not found")
    if request.to_account not in accounts:
        raise HTTPException(status_code=404, detail=f"Destination account '{request.to_account}' not found")
    if request.from_account == request.to_account:
        raise HTTPException(status_code=400, detail="Source and destination accounts cannot be the same")

    rate = EXCHANGE_RATES[request.currency]
    amount_usd = request.amount / rate
    fee = round(amount_usd * 0.015, 2)          # 1.5% service fee
    total_deducted = round(amount_usd + fee, 2)

    sender = accounts[request.from_account]
    if sender["balance"] < total_deducted:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Insufficient funds. "
                f"Available: ${sender['balance']:.2f}, "
                f"Required: ${total_deducted:.2f} (incl. ${fee:.2f} fee)"
            ),
        )

    # Debit sender, credit receiver
    accounts[request.from_account]["balance"] = round(sender["balance"] - total_deducted, 2)
    accounts[request.to_account]["balance"]   = round(accounts[request.to_account]["balance"] + amount_usd, 2)

    txn = {
        "transaction_id":      f"HGB-{uuid.uuid4().hex[:10].upper()}",
        "status":              "completed",
        "from_account":        request.from_account,
        "to_account":          request.to_account,
        "amount":              request.amount,
        "currency":            request.currency,
        "converted_amount_usd": round(amount_usd, 2),
        "fee":                 fee,
        "timestamp":           datetime.utcnow().isoformat() + "Z",
        "note":                request.note,
    }
    transactions.append(txn)
    return txn


@app.get("/transactions", tags=["Transfers"])
def list_transactions(account_id: Optional[str] = None):
    """
    Return all transactions, optionally filtered by account_id
    (matches either sender or receiver).
    """
    if account_id:
        filtered = [
            t for t in transactions
            if t["from_account"] == account_id or t["to_account"] == account_id
        ]
        return {"transactions": filtered, "count": len(filtered)}
    return {"transactions": transactions, "count": len(transactions)}


@app.get("/rates", tags=["Rates"])
def get_exchange_rates():
    """Return current exchange rates with USD as the base currency."""
    return {
        "base":    "USD",
        "rates":   EXCHANGE_RATES,
        "updated": datetime.utcnow().isoformat() + "Z",
    }
