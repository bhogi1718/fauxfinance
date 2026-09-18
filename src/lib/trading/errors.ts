export class TradingError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.name = "TradingError";
    this.code = code;
    this.status = status;
  }
}

export class InsufficientFundsError extends TradingError {
  constructor(requiredCents: number, availableCents: number) {
    super(
      "INSUFFICIENT_FUNDS",
      `This order costs ${fmt(requiredCents)} but you only have ${fmt(availableCents)} available.`,
    );
  }
}

export class InsufficientSharesError extends TradingError {
  constructor(symbol: string, requested: number, owned: number) {
    super(
      "INSUFFICIENT_SHARES",
      owned === 0
        ? `You don't own any shares of ${symbol}.`
        : `You tried to sell ${requested} shares of ${symbol} but only own ${owned}.`,
    );
  }
}

export class QuoteUnavailableError extends TradingError {
  constructor(symbol: string) {
    super("QUOTE_UNAVAILABLE", `Live price for ${symbol} is unavailable right now. Try again shortly.`, 503);
  }
}

function fmt(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}
