import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
// {{subject}}
interface RateService {
    double getRate(String currency); // {{oneMethod}}
}

// {{realSubject}}
class BankRateService implements RateService {
    @Override
    public double getRate(String currency) {
        return bankFeed.fetch(currency); // {{slowCall}} // @step:bank
    }
}

// {{proxy}}
class CachedRateService implements RateService {
    private final Map<String, Double> cache = new HashMap<>(); // {{cacheField}}
    private final RateService real; // {{holdsReal}}

    CachedRateService(RateService real) { this.real = real; }

    @Override
    public double getRate(String currency) { // {{sameDoor}}
        Double saved = cache.get(currency); // {{lookFirst}} // @step:check
        if (saved != null) return saved; // {{hitFast}} // @step:hit
        double rate = real.getRate(currency); // {{missForward}} // @step:forward
        cache.put(currency, rate); // {{remember}} // @step:store
        return rate;
    }
}

// {{client}}
record Counter(RateService rates) { // {{onlyInterface}}
    double quote(String currency, double amount) {
        return amount * rates.getRate(currency); // {{cantTell}} // @step:ask,reply
    }
}

// {{usage}}
var counter = new Counter(new CachedRateService(new BankRateService())); // {{wireOnce}} // @step:wire
counter.quote("USD", 200); // {{firstMiss}} // @step:done
counter.quote("USD", 500); // {{thenHit}} // @step:done
`

const without = `
// {{withoutIntro}}
class Counter {
    private final BankRateService bank = new BankRateService(); // {{knowsBank}}
    private final Map<String, Double> notebook = new HashMap<>(); // {{handNotes}}
    private double lastRate = 0;

    double quote(String currency, double amount, String from) { // {{youDecide}} // @step:l1-start
        double rate = switch (from) {
            case "notebook" -> notebook.getOrDefault(currency, 0.0); // {{blankPage}} // @step:l1-notebook
            case "last" -> lastRate; // {{anyCurrency}} // @step:l1-last
            default -> {
                double fresh = bank.getRate(currency); // {{slowEveryTime}} // @step:l1-bank,l1-call
                notebook.put(currency, fresh); // {{noteByHand}} // @step:l1-note
                yield fresh;
            }
        };
        lastRate = rate;
        return amount * rate; // @step:l1-reply,l1-result
    }
}
// {{withoutCopy}} // @step:l1-copy
`

const withPattern = `
// {{withAdd}}
class LoggingRateService implements RateService { // {{sameInterface}} // @step:build-class
    private final RateService inner; // {{wrapsAny}} // @step:build-hold

    LoggingRateService(RateService inner) { this.inner = inner; } // @step:build-hold

    @Override
    public double getRate(String currency) {
        auditLog.write(currency, Instant.now()); // {{logFirst}} // @step:log
        return inner.getRate(currency); // {{passOn}} // @step:delegate
    }
}

// {{othersSame}}
class CachedRateService implements RateService { /* … */ } // @step:cache
class BankRateService implements RateService { /* … */ } // @step:bank-new

// {{withWire}}
RateService rates = new LoggingRateService( // {{stacked}} // @step:wire-new
    new CachedRateService(new BankRateService())); // @step:wire-new
var counter = new Counter(rates); // {{clientSame}} // @step:client-same
counter.quote("SAR", 2000); // {{withSame}} // @step:ask-new,reply-new,done-new
// {{withZero}}
`

export const java: CodeSet = {
  main: { filename: 'ExchangeRates.java', source: main },
  without: { filename: 'RatesWithoutProxy.java', source: without },
  with: { filename: 'RatesWithProxy.java', source: withPattern },
}
