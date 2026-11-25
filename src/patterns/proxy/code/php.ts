import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
<?php
// {{subject}}
interface RateService
{
    public function getRate(string $currency): float; // {{oneMethod}}
}

// {{realSubject}}
final class BankRateService implements RateService
{
    public function getRate(string $currency): float
    {
        return BankFeed::fetch($currency); // {{slowCall}} // @step:bank
    }
}

// {{proxy}}
final class CachedRateService implements RateService
{
    private array $cache = []; // {{cacheField}}

    public function __construct(private readonly RateService $real) {} // {{holdsReal}}

    public function getRate(string $currency): float // {{sameDoor}}
    {
        if (isset($this->cache[$currency])) { // {{lookFirst}} // @step:check
            return $this->cache[$currency]; // {{hitFast}} // @step:hit
        }
        $rate = $this->real->getRate($currency); // {{missForward}} // @step:forward
        $this->cache[$currency] = $rate; // {{remember}} // @step:store
        return $rate;
    }
}

// {{client}}
final readonly class Counter
{
    public function __construct(private RateService $rates) {} // {{onlyInterface}}

    public function quote(string $currency, float $amount): float
    {
        return $amount * $this->rates->getRate($currency); // {{cantTell}} // @step:ask,reply
    }
}

// {{usage}}
$counter = new Counter(new CachedRateService(new BankRateService())); // {{wireOnce}} // @step:wire
$counter->quote('USD', 200); // {{firstMiss}} // @step:done
$counter->quote('USD', 500); // {{thenHit}} // @step:done
`

const without = `
<?php
// {{withoutIntro}}
final class Counter
{
    private array $notebook = []; // {{handNotes}}
    private float $lastRate = 0;

    public function __construct(private BankRateService $bank = new BankRateService()) {} // {{knowsBank}}

    public function quote(string $currency, float $amount, string $from): float // {{youDecide}} // @step:l1-start
    {
        if ($from === 'notebook') {
            $rate = $this->notebook[$currency] ?? 0.0; // {{blankPage}} // @step:l1-notebook
        } elseif ($from === 'last') {
            $rate = $this->lastRate; // {{anyCurrency}} // @step:l1-last
        } else {
            $rate = $this->bank->getRate($currency); // {{slowEveryTime}} // @step:l1-bank,l1-call
            $this->notebook[$currency] = $rate; // {{noteByHand}} // @step:l1-note
        }
        $this->lastRate = $rate;
        return $amount * $rate; // @step:l1-reply,l1-result
    }
}
// {{withoutCopy}} // @step:l1-copy
`

const withPattern = `
<?php
// {{withAdd}}
final class LoggingRateService implements RateService // {{sameInterface}} // @step:build-class
{
    public function __construct(private readonly RateService $inner) {} // {{wrapsAny}} // @step:build-hold

    public function getRate(string $currency): float
    {
        AuditLog::write($currency, new DateTimeImmutable()); // {{logFirst}} // @step:log
        return $this->inner->getRate($currency); // {{passOn}} // @step:delegate
    }
}

// {{othersSame}}
final class CachedRateService implements RateService { /* … */ } // @step:cache
final class BankRateService implements RateService { /* … */ } // @step:bank-new

// {{withWire}}
$rates = new LoggingRateService( // {{stacked}} // @step:wire-new
    new CachedRateService(new BankRateService())); // @step:wire-new
$counter = new Counter($rates); // {{clientSame}} // @step:client-same
$counter->quote('SAR', 2000); // {{withSame}} // @step:ask-new,reply-new,done-new
// {{withZero}}
`

export const php: CodeSet = {
  main: { filename: 'ExchangeRates.php', source: main },
  without: { filename: 'RatesWithoutProxy.php', source: without },
  with: { filename: 'RatesWithProxy.php', source: withPattern },
}
