import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
// {{subject}}
class RateService {
public:
    virtual ~RateService() = default;
    virtual double getRate(const std::string& currency) = 0; // {{oneMethod}}
};

// {{realSubject}}
class BankRateService : public RateService {
public:
    double getRate(const std::string& currency) override {
        return bankFeed.fetch(currency); // {{slowCall}} // @step:bank
    }
};

// {{proxy}}
class CachedRateService : public RateService {
    std::unique_ptr<RateService> real; // {{holdsReal}}
    std::unordered_map<std::string, double> cache; // {{cacheField}}
public:
    explicit CachedRateService(std::unique_ptr<RateService> r) : real(std::move(r)) {}

    double getRate(const std::string& currency) override { // {{sameDoor}}
        if (auto it = cache.find(currency); it != cache.end()) // {{lookFirst}} // @step:check
            return it->second; // {{hitFast}} // @step:hit
        double rate = real->getRate(currency); // {{missForward}} // @step:forward
        cache[currency] = rate; // {{remember}} // @step:store
        return rate;
    }
};

// {{client}}
class Counter {
    std::unique_ptr<RateService> rates; // {{onlyInterface}}
public:
    explicit Counter(std::unique_ptr<RateService> r) : rates(std::move(r)) {}
    double quote(const std::string& currency, double amount) {
        return amount * rates->getRate(currency); // {{cantTell}} // @step:ask,reply
    }
};

// {{usage}}
Counter counter(std::make_unique<CachedRateService>(std::make_unique<BankRateService>())); // {{wireOnce}} // @step:wire
counter.quote("USD", 200); // {{firstMiss}} // @step:done
counter.quote("USD", 500); // {{thenHit}} // @step:done
`

const without = `
// {{withoutIntro}}
class Counter {
    BankRateService bank; // {{knowsBank}}
    std::unordered_map<std::string, double> notebook; // {{handNotes}}
    double lastRate = 0;
public:
    double quote(const std::string& currency, double amount, From from) { // {{youDecide}} // @step:l1-start
        double rate;
        if (from == From::Notebook) rate = notebook[currency]; // {{blankPage}} // @step:l1-notebook
        else if (from == From::Last) rate = lastRate; // {{anyCurrency}} // @step:l1-last
        else {
            rate = bank.getRate(currency); // {{slowEveryTime}} // @step:l1-bank,l1-call
            notebook[currency] = rate; // {{noteByHand}} // @step:l1-note
        }
        lastRate = rate;
        return amount * rate; // @step:l1-reply,l1-result
    }
};
// {{withoutCopy}} // @step:l1-copy
`

const withPattern = `
// {{withAdd}}
class LoggingRateService : public RateService { // {{sameInterface}} // @step:build-class
    std::unique_ptr<RateService> inner; // {{wrapsAny}} // @step:build-hold
public:
    explicit LoggingRateService(std::unique_ptr<RateService> i) : inner(std::move(i)) {}
    double getRate(const std::string& currency) override {
        auditLog.write(currency, std::chrono::system_clock::now()); // {{logFirst}} // @step:log
        return inner->getRate(currency); // {{passOn}} // @step:delegate
    }
};

// {{othersSame}}
class CachedRateService : public RateService { /* … */ }; // @step:cache
class BankRateService : public RateService { /* … */ }; // @step:bank-new

// {{withWire}}
auto rates = std::make_unique<LoggingRateService>( // {{stacked}} // @step:wire-new
    std::make_unique<CachedRateService>(std::make_unique<BankRateService>())); // @step:wire-new
Counter counter(std::move(rates)); // {{clientSame}} // @step:client-same
counter.quote("SAR", 2000); // {{withSame}} // @step:ask-new,reply-new,done-new
// {{withZero}}
`

export const cpp: CodeSet = {
  main: { filename: 'exchange_rates.cpp', source: main },
  without: { filename: 'rates_without_proxy.cpp', source: without },
  with: { filename: 'rates_with_proxy.cpp', source: withPattern },
}
