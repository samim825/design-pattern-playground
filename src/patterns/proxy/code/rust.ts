import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Rust: the proxy owns the wrapped service as Box<dyn RateService>; get_rate takes &mut self
// because the cache changes on a miss (a RefCell would let it keep &self).

const main = `
// {{subject}}
pub trait RateService {
    fn get_rate(&mut self, currency: &str) -> f64; // {{oneMethod}}
}

// {{realSubject}}
pub struct BankRateService;

impl RateService for BankRateService {
    fn get_rate(&mut self, currency: &str) -> f64 {
        bank_feed::fetch(currency) // {{slowCall}} // @step:bank
    }
}

// {{proxy}}
pub struct CachedRateService {
    real: Box<dyn RateService>, // {{holdsReal}}
    cache: HashMap<String, f64>, // {{cacheField}}
}

impl RateService for CachedRateService {
    fn get_rate(&mut self, currency: &str) -> f64 { // {{sameDoor}}
        if let Some(saved) = self.cache.get(currency) { // {{lookFirst}} // @step:check
            return *saved; // {{hitFast}} // @step:hit
        }
        let rate = self.real.get_rate(currency); // {{missForward}} // @step:forward
        self.cache.insert(currency.to_string(), rate); // {{remember}} // @step:store
        rate
    }
}

// {{client}}
pub struct Counter { rates: Box<dyn RateService> } // {{onlyInterface}}

impl Counter {
    pub fn quote(&mut self, currency: &str, amount: f64) -> f64 {
        amount * self.rates.get_rate(currency) // {{cantTell}} // @step:ask,reply
    }
}

// {{usage}}
let cached = CachedRateService { real: Box::new(BankRateService), cache: HashMap::new() };
let mut counter = Counter { rates: Box::new(cached) }; // {{wireOnce}} // @step:wire
counter.quote("USD", 200.0); // {{firstMiss}} // @step:done
counter.quote("USD", 500.0); // {{thenHit}} // @step:done
`

const without = `
// {{withoutIntro}}
pub struct Counter {
    bank: BankRateService, // {{knowsBank}}
    notebook: HashMap<String, f64>, // {{handNotes}}
    last_rate: f64,
}

impl Counter {
    pub fn quote(&mut self, currency: &str, amount: f64, from: From) -> f64 { // {{youDecide}} // @step:l1-start
        let rate = match from {
            From::Notebook => *self.notebook.get(currency).unwrap_or(&0.0), // {{blankPage}} // @step:l1-notebook
            From::Last => self.last_rate, // {{anyCurrency}} // @step:l1-last
            From::Bank => {
                let fresh = self.bank.get_rate(currency); // {{slowEveryTime}} // @step:l1-bank,l1-call
                self.notebook.insert(currency.to_string(), fresh); // {{noteByHand}} // @step:l1-note
                fresh
            }
        };
        self.last_rate = rate;
        amount * rate // @step:l1-reply,l1-result
    }
}
// {{withoutCopy}} // @step:l1-copy
`

const withPattern = `
// {{withAdd}}
pub struct LoggingRateService { // {{sameInterface}} // @step:build-class
    inner: Box<dyn RateService>, // {{wrapsAny}} // @step:build-hold
}

impl RateService for LoggingRateService {
    fn get_rate(&mut self, currency: &str) -> f64 {
        audit_log::write(currency, SystemTime::now()); // {{logFirst}} // @step:log
        self.inner.get_rate(currency) // {{passOn}} // @step:delegate
    }
}

// {{othersSame}}
impl RateService for CachedRateService { /* … */ } // @step:cache
impl RateService for BankRateService { /* … */ } // @step:bank-new

// {{withWire}}
let rates = LoggingRateService { // {{stacked}} // @step:wire-new
    inner: Box::new(CachedRateService::new(Box::new(BankRateService))) }; // @step:wire-new
let mut counter = Counter { rates: Box::new(rates) }; // {{clientSame}} // @step:client-same
counter.quote("SAR", 2000.0); // {{withSame}} // @step:ask-new,reply-new,done-new
// {{withZero}}
`

export const rust: CodeSet = {
  main: { filename: 'exchange_rates.rs', source: main },
  without: { filename: 'rates_without_proxy.rs', source: without },
  with: { filename: 'rates_with_proxy.rs', source: withPattern },
}
