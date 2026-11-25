import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Go: there is no "implements" keyword; a struct with a GetRate method satisfies RateService
// automatically, so the proxy is a struct that holds a RateService and has the same method.

const main = `
// {{subject}}
type RateService interface {
    GetRate(currency string) float64 // {{oneMethod}}
}

// {{realSubject}}
type BankRateService struct{}

func (BankRateService) GetRate(currency string) float64 {
    return bankFeed.Fetch(currency) // {{slowCall}} // @step:bank
}

// {{proxy}}
type CachedRateService struct {
    real  RateService        // {{holdsReal}}
    cache map[string]float64 // {{cacheField}}
}

func NewCachedRateService(real RateService) *CachedRateService {
    return &CachedRateService{real: real, cache: map[string]float64{}}
}

func (c *CachedRateService) GetRate(currency string) float64 { // {{sameDoor}}
    if saved, ok := c.cache[currency]; ok { // {{lookFirst}} // @step:check
        return saved // {{hitFast}} // @step:hit
    }
    rate := c.real.GetRate(currency) // {{missForward}} // @step:forward
    c.cache[currency] = rate // {{remember}} // @step:store
    return rate
}

// {{client}}
type Counter struct{ Rates RateService } // {{onlyInterface}}

func (c Counter) Quote(currency string, amount float64) float64 {
    return amount * c.Rates.GetRate(currency) // {{cantTell}} // @step:ask,reply
}

// {{usage}}
counter := Counter{Rates: NewCachedRateService(BankRateService{})} // {{wireOnce}} // @step:wire
counter.Quote("USD", 200) // {{firstMiss}} // @step:done
counter.Quote("USD", 500) // {{thenHit}} // @step:done
`

const without = `
// {{withoutIntro}}
type Counter struct {
    bank     BankRateService    // {{knowsBank}}
    notebook map[string]float64 // {{handNotes}}
    lastRate float64
}

func (c *Counter) Quote(currency string, amount float64, from string) float64 { // {{youDecide}} // @step:l1-start
    var rate float64
    switch from {
    case "notebook":
        rate = c.notebook[currency] // {{blankPage}} // @step:l1-notebook
    case "last":
        rate = c.lastRate // {{anyCurrency}} // @step:l1-last
    default:
        rate = c.bank.GetRate(currency) // {{slowEveryTime}} // @step:l1-bank,l1-call
        c.notebook[currency] = rate // {{noteByHand}} // @step:l1-note
    }
    c.lastRate = rate
    return amount * rate // @step:l1-reply,l1-result
}
// {{withoutCopy}} // @step:l1-copy
`

const withPattern = `
// {{withAdd}}
type LoggingRateService struct { // {{sameInterface}} // @step:build-class
    inner RateService // {{wrapsAny}} // @step:build-hold
}

func (l LoggingRateService) GetRate(currency string) float64 {
    auditLog.Write(currency, time.Now()) // {{logFirst}} // @step:log
    return l.inner.GetRate(currency) // {{passOn}} // @step:delegate
}

// {{othersSame}}
type CachedRateService struct{ /* … */ } // @step:cache
type BankRateService struct{} // @step:bank-new

// {{withWire}}
rates := LoggingRateService{ // {{stacked}} // @step:wire-new
    inner: NewCachedRateService(BankRateService{})} // @step:wire-new
counter := Counter{Rates: rates} // {{clientSame}} // @step:client-same
counter.Quote("SAR", 2000) // {{withSame}} // @step:ask-new,reply-new,done-new
// {{withZero}}
`

export const go: CodeSet = {
  main: { filename: 'exchange_rates.go', source: main },
  without: { filename: 'rates_without_proxy.go', source: without },
  with: { filename: 'rates_with_proxy.go', source: withPattern },
}
