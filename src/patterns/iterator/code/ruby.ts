import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Ruby: no interfaces, so PlayerIterator and Team are modules whose methods raise NotImplementedError (duck typing).

const main = `
# {{player}}
Player = Data.define(:name, :strike_rate, :role, :left_handed)

# {{iterator}}
module PlayerIterator
  def has_next? = raise(NotImplementedError)
  def next = raise(NotImplementedError)
end

# {{concreteIterator}}
class BattingOrderIterator
  include PlayerIterator

  def initialize(players)
    @players = players
    @pos = 0 # {{cursor}}
  end

  def has_next? = @pos < @players.size # @step:has-next

  def next
    @pos += 1
    @players[@pos - 1] # {{handOut}} # @step:next
  end
end

class StrikeRateIterator < BattingOrderIterator
  def initialize(players)
    super(players.sort_by { |p| -p.strike_rate }) # {{sortedCopy}} # @step:sort-copy
  end
end

class AllRounderIterator < BattingOrderIterator
  def has_next?
    @pos += 1 while @pos < @players.size && @players[@pos].role != "all-rounder" # {{skipInside}} # @step:skip
    super # @step:ar-has-next
  end
end

# {{aggregate}}
module Team
  def batting_order = raise(NotImplementedError)
  def by_strike_rate = raise(NotImplementedError)
  def all_rounders = raise(NotImplementedError)
end

# {{concreteAggregate}}
class Squad
  include Team

  def initialize = (@players = []) # {{hidden}}
  def add(player) = @players << player
  def batting_order = BattingOrderIterator.new(@players) # @step:create-order
  def by_strike_rate = StrikeRateIterator.new(@players) # @step:create-sr
  def all_rounders = AllRounderIterator.new(@players) # @step:create-ar
end

# {{client}}
it = squad.all_rounders # {{pickOne}} # @step:request
while it.has_next? # {{sameLoop}} # @step:loop
  announce(it.next.name)
end
`

const without = `
# {{withoutIntro}}
class Squad
  attr_accessor :players # {{exposed}} # @step:l1-expose
end

# {{orderLoop}}
(0...squad.players.size).each do |i| # {{indexMath}} # @step:l1-loop
  announce(squad.players[i].name) # @step:l1-read
end

# {{formLoop}}
in_form = squad.players.sort_by { |p| -p.strike_rate } # {{copyFirst}} # @step:l1-sort
in_form.each { |p| announce(p.name) } # @step:l1-read-sorted

# {{changed}}
squad.players = { 7 => rahim, 1 => sumon } # {{breaksAll}} # @step:l1-map
squad.players.each_value do |p| # @step:l1-loop-map
  announce(p.name) if p.role == "all-rounder" # {{filterHere}} # @step:l1-filter
end
# {{withoutNext}}
`

const withPattern = `
# {{withAdd}}
class LeftHandedIterator
  include PlayerIterator # {{sameInterface}} # @step:build-class

  def initialize(inner)
    @inner = inner # {{wrapsAny}} # @step:build-wrap
    @found = nil
  end

  def has_next?
    while @found.nil? && @inner.has_next?
      player = @inner.next # {{pull}} # @step:lh-skip,lh-keep
      @found = player if player.left_handed # {{skipRight}} # @step:lh-skip,lh-keep
    end
    !@found.nil? # @step:lh-has-next
  end

  def next
    player, @found = @found, nil # @step:lh-next
    player
  end
end

# {{othersSame}}
class Squad # …
end

# {{withUse}}
it = LeftHandedIterator.new(squad.batting_order) # {{wrapUse}} # @step:lh-create
while it.has_next? # {{sameLoop}} # @step:loop
  announce(it.next.name)
end
# {{withZero}}
`

export const ruby: CodeSet = {
  main: { filename: 'squad.rb', source: main },
  without: { filename: 'squad_without_iterator.rb', source: without },
  with: { filename: 'left_handed_iterator.rb', source: withPattern },
}
