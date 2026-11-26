import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
# {{mediator}}
module ControlTower
  def request_landing(plane) = raise NotImplementedError
  def notify(sender, event) = raise NotImplementedError
end

# {{colleague}}
class Aircraft
  attr_reader :call_sign

  def initialize(call_sign, tower)
    @call_sign, @tower = call_sign, tower # {{onlyTower}} # @step:only-tower
  end

  def priority? = false # {{priorityHook}}
  def ask_to_land = @tower.request_landing(self) # {{askTower}} # @step:request
  def hold = radio("#{call_sign}: holding") # @step:hold
  def land = raise NotImplementedError
end

# {{concreteColleague}}
class PassengerPlane < Aircraft
  def land
    radio("#{call_sign}: landing with passengers") # @step:land
    @tower.notify(self, :landed) # {{reportBack}} # @step:vacate
  end
end

class CargoPlane < Aircraft
  def land
    radio("#{call_sign}: landing with cargo") # @step:land
    @tower.notify(self, :landed) # @step:vacate
  end
end

# {{concreteMediator}}
class SylhetTower
  include ControlTower

  def initialize
    @runway_free = true # {{runwayState}}
    @queue = [] # {{waitingLine}}
  end

  def request_landing(plane)
    return clear(plane) if @runway_free # @step:check-runway
    plane.priority? ? @queue.unshift(plane) : @queue.push(plane) # {{emergencyFirst}} # @step:queue
    plane.hold # @step:hold
  end

  def notify(sender, event)
    @runway_free = true # {{runwayBack}} # @step:runway-free
    next_plane = @queue.shift # {{nextInLine}} # @step:clear-next
    clear(next_plane) if next_plane # @step:clear-next
  end

  private

  def clear(plane)
    @runway_free = false # {{onlyOne}} # @step:clear,clear-next,conflict
    plane.land # @step:clear,clear-next
  end
end

# {{client}}
tower = SylhetTower.new
pa101 = PassengerPlane.new("PA-101", tower) # {{noPlaneKnowsPlane}}
kc33 = CargoPlane.new("KC-33", tower)
pa101.ask_to_land # @step:request
`

const without = `
# {{withoutIntro}}
class Plane
  attr_reader :others # {{knowsAll}} # @step:l1-arrive
  attr_accessor :on_final

  def initialize(call_sign)
    @call_sign, @others, @on_final = call_sign, [], false
  end

  def try_to_land(runway)
    @others.each do |other| # {{askEach}} # @step:l1-ask
      return hold if other.landing? # {{waitTurn}} # @step:l1-hold
    end
    runway.land(self) # {{hopeClear}} # @step:l1-land
  end

  def landing? = on_final # @step:l1-reply
end

class Runway
  def land(plane) = @planes << plane # {{nobodyGuards}} # @step:l1-conflict
end

# {{wireUp}}
[pa101, mg207].each { |p| kc33.others << p; p.others << kc33 } # {{linksGrow}} # @step:l1-arrive
kc33.try_to_land(runway) # @step:l1-try
# {{withoutNext}}
`

const withPattern = `
# {{withAdd}}
class Helicopter < Aircraft # {{sameBase}} # @step:build-class
  def priority? = true # {{airAmbulance}} # @step:build-priority,h-priority

  def land
    radio("#{call_sign}: landing with a patient") # @step:h-land
    @tower.notify(self, :landed) # {{reportBack}} # @step:h-vacate
  end
end

# {{othersSame}}
class PassengerPlane < Aircraft; end # @step:p-pass
class CargoPlane < Aircraft; end # @step:p-cargo
class SylhetTower; end # {{towerSame}} # @step:t-act

# {{withUse}}
rescue1 = Helicopter.new("Rescue-1", tower) # {{knowsTower}} # @step:h-create
rescue1.ask_to_land # {{sameCall}} # @step:h-request
# {{withZero}}
`

export const ruby: CodeSet = {
  main: { filename: 'control_tower.rb', source: main },
  without: { filename: 'control_tower_without_mediator.rb', source: without },
  with: { filename: 'helicopter.rb', source: withPattern },
}
