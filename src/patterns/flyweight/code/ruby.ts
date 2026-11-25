import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Ruby: the flyweight is an immutable Data value; the factory caches it in a Hash with ||=,
// and every Vehicle keeps a reference to that one object.

const main = `
# {{flyweight}}
VehicleModel = Data.define(:sprite, :hood_art, :bell) do # {{sharedSprite}} # @step:split
  def draw(canvas, x, y, heading) = canvas.blit(sprite, x, y, heading) # {{extrinsicIn}} # @step:draw
end

# {{factory}}
class ModelFactory
  def initialize
    @cache = {}
    @loaders = {}
  end

  def register(kind, &load)
    @loaders[kind] = load
  end

  def get(kind) # {{lookFirst}} # @step:request
    @cache[kind] ||= @loaders.fetch(kind).call # {{missCreate}} # @step:request,miss,hit
  end
end

# {{context}}
class Vehicle # @step:split
  def initialize(x, y, heading, free, model)
    @x, @y, @heading, @free = x, y, heading, free # {{extrinsic}} # @step:place
    @model = model # {{sharedRef}} # @step:place
  end

  def draw(canvas) = @model.draw(canvas, @x, @y, @heading) # @step:draw
end

# {{usage}}
factory = ModelFactory.new
factory.register(:rickshaw) do
  VehicleModel.new(load_image("rickshaw.png"), load_image("hood-art.png"), load_sound("bell.mp3")) # @step:miss
end
rickshaws = farmgate.spots.map do |s| # {{manyObjects}} # @step:fill
  Vehicle.new(s.x, s.y, s.heading, true, factory.get(:rickshaw)) # {{hitReuse}} # @step:request,place
end
rickshaws.each { |r| r.draw(canvas) } # @step:draw
`

const without = `
# {{withoutIntro}}
class Rickshaw
  def initialize(x, y, heading) # @step:l1-new
    @sprite = load_image("rickshaw.png") # {{loadsAgain}} # @step:l1-new,l1-copy
    @hood_art = load_image("hood-art.png") # {{ownCopy}} # @step:l1-new,l1-copy
    @x, @y, @heading = x, y, heading
  end

  def draw(canvas) = canvas.blit(@sprite, @x, @y, @heading)
end

class MapScreen
  def show_area(area, limit) # {{pickLimit}} # @step:l1-start
    @rickshaws = area.spots.first(limit).map do |s| # @step:l1-fill
      Rickshaw.new(s.x, s.y, s.heading) # {{perObject}} # @step:l1-new,l1-copy,l1-fill
    end
    @rickshaws.each { |r| r.draw(@canvas) } # {{outOfMemory}} # @step:l1-result
  end
end
# {{withoutMath}} # @step:l1-math
`

const withPattern = `
# {{withAdd}}
factory.register(:cng) do # {{newModel}} # @step:build-model,l3-miss
  VehicleModel.new(load_image("cng.png"), load_image("green-cage.png"), load_sound("horn.mp3")) # {{cngShared}} # @step:build-model,l3-miss
end

# {{withSame}}
# {{unchanged}}
rickshaws = gulshan.rickshaw_spots.map { |s| Vehicle.new(s.x, s.y, s.heading, true, factory.get(:rickshaw)) } # @step:l3-rickshaws
cngs = gulshan.cng_spots.map do |s| # @step:l3-fill
  Vehicle.new(s.x, s.y, s.heading, true, factory.get(:cng)) # {{sameFactory}} # @step:build-use,l3-request,l3-hit,l3-place
end
(rickshaws + cngs).each { |v| v.draw(canvas) } # {{sameDraw}} # @step:l3-draw
# {{withZero}}
`

export const ruby: CodeSet = {
  main: { filename: 'rickshaw_map.rb', source: main },
  without: { filename: 'rickshaw_map_without_flyweight.rb', source: without },
  with: { filename: 'rickshaw_map_with_flyweight.rb', source: withPattern },
}
