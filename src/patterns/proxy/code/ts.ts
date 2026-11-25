import type { CodeSet } from '@/types/pattern'

/*
 * Conventions (see CLAUDE.md):
 *   // {{key}}        → translated comment from content.<lang>.ts → codeComments[key]
 *   // @step:a,b      → this line lights up while visual step a or b runs (stripped on display)
 * bankFeed and auditLog are left undeclared to keep the snippets small.
 */

const main = `
// {{subject}}
interface RateService {
  getRate(currency: string): number; // {{oneMethod}}
}

// {{realSubject}}
class BankRateService implements RateService {
  getRate(currency: string): number {
    return bankFeed.fetch(currency); // {{slowCall}} // @step:bank
  }
}

// {{proxy}}
class CachedRateService implements RateService {
  private readonly cache = new Map<string, number>(); // {{cacheField}}

  constructor(private readonly real: RateService) {} // {{holdsReal}}

  getRate(currency: string): number { // {{sameDoor}}
    const saved = this.cache.get(currency); // {{lookFirst}} // @step:check
    if (saved !== undefined) return saved; // {{hitFast}} // @step:hit
    const rate = this.real.getRate(currency); // {{missForward}} // @step:forward
    this.cache.set(currency, rate); // {{remember}} // @step:store
    return rate;
  }
}

// {{client}}
class Counter {
  constructor(private readonly rates: RateService) {} // {{onlyInterface}}

  quote(currency: string, amount: number): number {
    return amount * this.rates.getRate(currency); // {{cantTell}} // @step:ask,reply
  }
}

// {{usage}}
const counter = new Counter(new CachedRateService(new BankRateService())); // {{wireOnce}} // @step:wire
counter.quote('USD', 200); // {{firstMiss}} // @step:done
counter.quote('USD', 500); // {{thenHit}} // @step:done
`

const without = `
// {{withoutIntro}}
class Counter {
  private readonly bank = new BankRateService(); // {{knowsBank}}
  private readonly notebook = new Map<string, number>(); // {{handNotes}}
  private lastRate = 0;

  quote(currency: string, amount: number, from: 'bank' | 'notebook' | 'last'): number { // {{youDecide}} // @step:l1-start
    let rate: number;
    if (from === 'notebook') rate = this.notebook.get(currency) ?? 0; // {{blankPage}} // @step:l1-notebook
    else if (from === 'last') rate = this.lastRate; // {{anyCurrency}} // @step:l1-last
    else {
      rate = this.bank.getRate(currency); // {{slowEveryTime}} // @step:l1-bank,l1-call
      this.notebook.set(currency, rate); // {{noteByHand}} // @step:l1-note
    }
    this.lastRate = rate;
    return amount * rate; // @step:l1-reply,l1-result
  }
}
// {{withoutCopy}} // @step:l1-copy
`

const withPattern = `
// {{withAdd}}
class LoggingRateService implements RateService { // {{sameInterface}} // @step:build-class
  constructor(private readonly inner: RateService) {} // {{wrapsAny}} // @step:build-hold

  getRate(currency: string): number {
    auditLog.write(currency, new Date()); // {{logFirst}} // @step:log
    return this.inner.getRate(currency); // {{passOn}} // @step:delegate
  }
}

// {{othersSame}}
class CachedRateService implements RateService { /* … */ } // @step:cache
class BankRateService implements RateService { /* … */ } // @step:bank-new

// {{withWire}}
const rates = new LoggingRateService( // {{stacked}} // @step:wire-new
  new CachedRateService(new BankRateService())); // @step:wire-new
const counter = new Counter(rates); // {{clientSame}} // @step:client-same
counter.quote('SAR', 2000); // {{withSame}} // @step:ask-new,reply-new,done-new
// {{withZero}}
`

export const ts: CodeSet = {
  main: { filename: 'exchange-rates.ts', source: main },
  without: { filename: 'rates-without-proxy.ts', source: without },
  with: { filename: 'rates-with-proxy.ts', source: withPattern },
}
