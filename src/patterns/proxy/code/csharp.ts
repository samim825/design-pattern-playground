import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
// {{subject}}
public interface IRateService
{
    decimal GetRate(string currency); // {{oneMethod}}
}

// {{realSubject}}
public sealed class BankRateService : IRateService
{
    public decimal GetRate(string currency) => BankFeed.Fetch(currency); // {{slowCall}} // @step:bank
}

// {{proxy}}
public sealed class CachedRateService : IRateService
{
    private readonly Dictionary<string, decimal> _cache = new(); // {{cacheField}}
    private readonly IRateService _real; // {{holdsReal}}

    public CachedRateService(IRateService real) => _real = real;

    public decimal GetRate(string currency) // {{sameDoor}}
    {
        if (_cache.TryGetValue(currency, out var saved)) // {{lookFirst}} // @step:check
            return saved; // {{hitFast}} // @step:hit
        var rate = _real.GetRate(currency); // {{missForward}} // @step:forward
        _cache[currency] = rate; // {{remember}} // @step:store
        return rate;
    }
}

// {{client}}
public sealed class Counter(IRateService rates) // {{onlyInterface}}
{
    public decimal Quote(string currency, decimal amount) =>
        amount * rates.GetRate(currency); // {{cantTell}} // @step:ask,reply
}

// {{usage}}
var counter = new Counter(new CachedRateService(new BankRateService())); // {{wireOnce}} // @step:wire
counter.Quote("USD", 200m); // {{firstMiss}} // @step:done
counter.Quote("USD", 500m); // {{thenHit}} // @step:done
`

const without = `
// {{withoutIntro}}
public class Counter
{
    private readonly BankRateService _bank = new(); // {{knowsBank}}
    private readonly Dictionary<string, decimal> _notebook = new(); // {{handNotes}}
    private decimal _lastRate;

    public decimal Quote(string currency, decimal amount, string from) // {{youDecide}} // @step:l1-start
    {
        decimal rate;
        if (from == "notebook") rate = _notebook.GetValueOrDefault(currency); // {{blankPage}} // @step:l1-notebook
        else if (from == "last") rate = _lastRate; // {{anyCurrency}} // @step:l1-last
        else
        {
            rate = _bank.GetRate(currency); // {{slowEveryTime}} // @step:l1-bank,l1-call
            _notebook[currency] = rate; // {{noteByHand}} // @step:l1-note
        }
        _lastRate = rate;
        return amount * rate; // @step:l1-reply,l1-result
    }
}
// {{withoutCopy}} // @step:l1-copy
`

const withPattern = `
// {{withAdd}}
public sealed class LoggingRateService(IRateService inner) : IRateService // {{sameInterface}} // @step:build-class,build-hold
{
    // {{wrapsAny}} // @step:build-hold
    public decimal GetRate(string currency)
    {
        AuditLog.Write(currency, DateTime.Now); // {{logFirst}} // @step:log
        return inner.GetRate(currency); // {{passOn}} // @step:delegate
    }
}

// {{othersSame}}
public sealed class CachedRateService : IRateService { /* … */ } // @step:cache
public sealed class BankRateService : IRateService { /* … */ } // @step:bank-new

// {{withWire}}
IRateService rates = new LoggingRateService( // {{stacked}} // @step:wire-new
    new CachedRateService(new BankRateService())); // @step:wire-new
var counter = new Counter(rates); // {{clientSame}} // @step:client-same
counter.Quote("SAR", 2000m); // {{withSame}} // @step:ask-new,reply-new,done-new
// {{withZero}}
`

export const csharp: CodeSet = {
  main: { filename: 'ExchangeRates.cs', source: main },
  without: { filename: 'RatesWithoutProxy.cs', source: without },
  with: { filename: 'RatesWithProxy.cs', source: withPattern },
}
