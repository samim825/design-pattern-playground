import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
# {{subject}}
class RateService(Protocol):
    def get_rate(self, currency: str) -> float: ...  # {{oneMethod}}


# {{realSubject}}
class BankRateService:
    def get_rate(self, currency: str) -> float:
        return bank_feed.fetch(currency)  # {{slowCall}} # @step:bank


# {{proxy}}
class CachedRateService:
    def __init__(self, real: RateService) -> None:
        self._real = real  # {{holdsReal}}
        self._cache: dict[str, float] = {}  # {{cacheField}}

    def get_rate(self, currency: str) -> float:  # {{sameDoor}}
        if currency in self._cache:  # {{lookFirst}} # @step:check
            return self._cache[currency]  # {{hitFast}} # @step:hit
        rate = self._real.get_rate(currency)  # {{missForward}} # @step:forward
        self._cache[currency] = rate  # {{remember}} # @step:store
        return rate


# {{client}}
@dataclass(frozen=True)
class Counter:
    rates: RateService  # {{onlyInterface}}

    def quote(self, currency: str, amount: float) -> float:
        return amount * self.rates.get_rate(currency)  # {{cantTell}} # @step:ask,reply


# {{usage}}
counter = Counter(CachedRateService(BankRateService()))  # {{wireOnce}} # @step:wire
counter.quote("USD", 200)  # {{firstMiss}} # @step:done
counter.quote("USD", 500)  # {{thenHit}} # @step:done
`

const without = `
# {{withoutIntro}}
class Counter:
    def __init__(self) -> None:
        self.bank = BankRateService()  # {{knowsBank}}
        self.notebook: dict[str, float] = {}  # {{handNotes}}
        self.last_rate = 0.0

    def quote(self, currency: str, amount: float, source: str) -> float:  # {{youDecide}} # @step:l1-start
        if source == "notebook":
            rate = self.notebook.get(currency, 0.0)  # {{blankPage}} # @step:l1-notebook
        elif source == "last":
            rate = self.last_rate  # {{anyCurrency}} # @step:l1-last
        else:
            rate = self.bank.get_rate(currency)  # {{slowEveryTime}} # @step:l1-bank,l1-call
            self.notebook[currency] = rate  # {{noteByHand}} # @step:l1-note
        self.last_rate = rate
        return amount * rate  # @step:l1-reply,l1-result

# {{withoutCopy}} # @step:l1-copy
`

const withPattern = `
# {{withAdd}}
class LoggingRateService:  # {{sameInterface}} # @step:build-class
    def __init__(self, inner: RateService) -> None:
        self._inner = inner  # {{wrapsAny}} # @step:build-hold

    def get_rate(self, currency: str) -> float:
        audit_log.write(currency, datetime.now())  # {{logFirst}} # @step:log
        return self._inner.get_rate(currency)  # {{passOn}} # @step:delegate


# {{othersSame}}
class CachedRateService: ...  # @step:cache
class BankRateService: ...  # @step:bank-new

# {{withWire}}
rates = LoggingRateService(  # {{stacked}} # @step:wire-new
    CachedRateService(BankRateService()))  # @step:wire-new
counter = Counter(rates)  # {{clientSame}} # @step:client-same
counter.quote("SAR", 2000)  # {{withSame}} # @step:ask-new,reply-new,done-new
# {{withZero}}
`

export const python: CodeSet = {
  main: { filename: 'exchange_rates.py', source: main },
  without: { filename: 'rates_without_proxy.py', source: without },
  with: { filename: 'rates_with_proxy.py', source: withPattern },
}
