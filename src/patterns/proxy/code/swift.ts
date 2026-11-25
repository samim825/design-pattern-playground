import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Swift: the proxy is a class (its cache changes) conforming to the same RateService protocol.

const main = `
// {{subject}}
protocol RateService {
    func getRate(_ currency: String) -> Double // {{oneMethod}}
}

// {{realSubject}}
struct BankRateService: RateService {
    func getRate(_ currency: String) -> Double {
        bankFeed.fetch(currency) // {{slowCall}} // @step:bank
    }
}

// {{proxy}}
final class CachedRateService: RateService {
    private let real: any RateService // {{holdsReal}}
    private var cache: [String: Double] = [:] // {{cacheField}}

    init(real: any RateService) { self.real = real }

    func getRate(_ currency: String) -> Double { // {{sameDoor}}
        if let saved = cache[currency] { // {{lookFirst}} // @step:check
            return saved // {{hitFast}} // @step:hit
        }
        let rate = real.getRate(currency) // {{missForward}} // @step:forward
        cache[currency] = rate // {{remember}} // @step:store
        return rate
    }
}

// {{client}}
struct Counter {
    let rates: any RateService // {{onlyInterface}}

    func quote(_ currency: String, amount: Double) -> Double {
        amount * rates.getRate(currency) // {{cantTell}} // @step:ask,reply
    }
}

// {{usage}}
let counter = Counter(rates: CachedRateService(real: BankRateService())) // {{wireOnce}} // @step:wire
counter.quote("USD", amount: 200) // {{firstMiss}} // @step:done
counter.quote("USD", amount: 500) // {{thenHit}} // @step:done
`

const without = `
// {{withoutIntro}}
final class Counter {
    private let bank = BankRateService() // {{knowsBank}}
    private var notebook: [String: Double] = [:] // {{handNotes}}
    private var lastRate = 0.0

    enum From { case bank, notebook, last }

    func quote(_ currency: String, amount: Double, from: From) -> Double { // {{youDecide}} // @step:l1-start
        let rate: Double
        switch from {
        case .notebook: rate = notebook[currency] ?? 0 // {{blankPage}} // @step:l1-notebook
        case .last: rate = lastRate // {{anyCurrency}} // @step:l1-last
        case .bank:
            rate = bank.getRate(currency) // {{slowEveryTime}} // @step:l1-bank,l1-call
            notebook[currency] = rate // {{noteByHand}} // @step:l1-note
        }
        lastRate = rate
        return amount * rate // @step:l1-reply,l1-result
    }
}
// {{withoutCopy}} // @step:l1-copy
`

const withPattern = `
// {{withAdd}}
final class LoggingRateService: RateService { // {{sameInterface}} // @step:build-class
    private let inner: any RateService // {{wrapsAny}} // @step:build-hold

    init(inner: any RateService) { self.inner = inner }

    func getRate(_ currency: String) -> Double {
        auditLog.write(currency, Date()) // {{logFirst}} // @step:log
        return inner.getRate(currency) // {{passOn}} // @step:delegate
    }
}

// {{othersSame}}
final class CachedRateService: RateService { /* … */ } // @step:cache
struct BankRateService: RateService { /* … */ } // @step:bank-new

// {{withWire}}
let rates = LoggingRateService( // {{stacked}} // @step:wire-new
    inner: CachedRateService(real: BankRateService())) // @step:wire-new
let counter = Counter(rates: rates) // {{clientSame}} // @step:client-same
counter.quote("SAR", amount: 2000) // {{withSame}} // @step:ask-new,reply-new,done-new
// {{withZero}}
`

export const swift: CodeSet = {
  main: { filename: 'ExchangeRates.swift', source: main },
  without: { filename: 'RatesWithoutProxy.swift', source: without },
  with: { filename: 'RatesWithProxy.swift', source: withPattern },
}
