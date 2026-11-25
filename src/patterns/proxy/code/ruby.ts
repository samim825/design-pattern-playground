import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Ruby: duck typing, so "the same interface" is a RateService module whose get_rate raises
// NotImplementedError; the proxy includes it and answers the same message.

const main = `
# {{subject}}
module RateService
  def get_rate(currency) = raise(NotImplementedError) # {{oneMethod}}
end

# {{realSubject}}
class BankRateService
  include RateService
  def get_rate(currency) = BankFeed.fetch(currency) # {{slowCall}} # @step:bank
end

# {{proxy}}
class CachedRateService
  include RateService

  def initialize(real)
    @real = real # {{holdsReal}}
    @cache = {} # {{cacheField}}
  end

  def get_rate(currency) # {{sameDoor}}
    if @cache.key?(currency) # {{lookFirst}} # @step:check
      return @cache[currency] # {{hitFast}} # @step:hit
    end
    rate = @real.get_rate(currency) # {{missForward}} # @step:forward
    @cache[currency] = rate # {{remember}} # @step:store
  end
end

# {{client}}
class Counter
  def initialize(rates) = @rates = rates # {{onlyInterface}}

  def quote(currency, amount)
    amount * @rates.get_rate(currency) # {{cantTell}} # @step:ask,reply
  end
end

# {{usage}}
counter = Counter.new(CachedRateService.new(BankRateService.new)) # {{wireOnce}} # @step:wire
counter.quote("USD", 200) # {{firstMiss}} # @step:done
counter.quote("USD", 500) # {{thenHit}} # @step:done
`

const without = `
# {{withoutIntro}}
class Counter
  def initialize
    @bank = BankRateService.new # {{knowsBank}}
    @notebook = {} # {{handNotes}}
    @last_rate = 0
  end

  def quote(currency, amount, from) # {{youDecide}} # @step:l1-start
    rate =
      case from
      when :notebook then @notebook.fetch(currency, 0) # {{blankPage}} # @step:l1-notebook
      when :last then @last_rate # {{anyCurrency}} # @step:l1-last
      else
        fresh = @bank.get_rate(currency) # {{slowEveryTime}} # @step:l1-bank,l1-call
        @notebook[currency] = fresh # {{noteByHand}} # @step:l1-note
      end
    @last_rate = rate
    amount * rate # @step:l1-reply,l1-result
  end
end
# {{withoutCopy}} # @step:l1-copy
`

const withPattern = `
# {{withAdd}}
class LoggingRateService
  include RateService # {{sameInterface}} # @step:build-class

  def initialize(inner) = @inner = inner # {{wrapsAny}} # @step:build-hold

  def get_rate(currency)
    AuditLog.write(currency, Time.now) # {{logFirst}} # @step:log
    @inner.get_rate(currency) # {{passOn}} # @step:delegate
  end
end

# {{othersSame}}
class CachedRateService; include RateService; end # @step:cache
class BankRateService; include RateService; end # @step:bank-new

# {{withWire}}
rates = LoggingRateService.new( # {{stacked}} # @step:wire-new
  CachedRateService.new(BankRateService.new)) # @step:wire-new
counter = Counter.new(rates) # {{clientSame}} # @step:client-same
counter.quote("SAR", 2000) # {{withSame}} # @step:ask-new,reply-new,done-new
# {{withZero}}
`

export const ruby: CodeSet = {
  main: { filename: 'exchange_rates.rb', source: main },
  without: { filename: 'rates_without_proxy.rb', source: without },
  with: { filename: 'rates_with_proxy.rb', source: withPattern },
}
