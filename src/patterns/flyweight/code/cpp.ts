import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// C++: the factory owns each model once (std::unordered_map of std::shared_ptr<const VehicleModel>);
// every Vehicle holds a shared_ptr to it, which copies a pointer, never the images.

const main = `
#include <functional>
#include <memory>
#include <string>
#include <unordered_map>

// {{flyweight}}
struct VehicleModel { // @step:split
    Image sprite; // {{sharedSprite}}
    Image hoodArt;
    Sound bell;

    void draw(MapCanvas& map, int x, int y, int heading) const { // {{extrinsicIn}}
        map.blit(sprite, x, y, heading); // @step:draw
    }
};
using ModelPtr = std::shared_ptr<const VehicleModel>;

// {{factory}}
class ModelFactory {
public:
    void add(const std::string& type, std::function<VehicleModel()> load) { loaders_[type] = std::move(load); }

    ModelPtr get(const std::string& type) { // @step:request
        auto& model = cache_[type]; // {{lookFirst}} // @step:request,hit
        if (!model) model = std::make_shared<const VehicleModel>(loaders_.at(type)()); // {{missCreate}} // @step:miss
        return model; // {{hitReuse}} // @step:hit
    }

private:
    std::unordered_map<std::string, ModelPtr> cache_;
    std::unordered_map<std::string, std::function<VehicleModel()>> loaders_;
};

// {{context}}
struct Vehicle { // @step:split
    int x, y, heading; // {{extrinsic}} // @step:place
    bool isFree;
    ModelPtr model; // {{sharedRef}} // @step:place

    void draw(MapCanvas& map) const { model->draw(map, x, y, heading); } // @step:draw
};

// {{usage}}
ModelFactory factory;
factory.add("rickshaw", [] {
    return VehicleModel{loadImage("rickshaw.png"), loadImage("hood-art.png"), loadSound("bell.mp3")}; // @step:miss
});
std::vector<Vehicle> rickshaws;
for (const auto& s : farmgate.spots) // {{manyObjects}} // @step:fill
    rickshaws.push_back({s.x, s.y, s.heading, true, factory.get("rickshaw")}); // @step:request,place
for (const auto& r : rickshaws) r.draw(map); // @step:draw
`

const without = `
// {{withoutIntro}}
class Rickshaw {
public:
    Rickshaw(int x, int y, int heading) // @step:l1-new
        : sprite_(loadImage("rickshaw.png")), // {{loadsAgain}} // @step:l1-new,l1-copy
          hoodArt_(loadImage("hood-art.png")), // @step:l1-new,l1-copy
          x_(x), y_(y), heading_(heading) {}

    void draw(MapCanvas& map) const { map.blit(sprite_, x_, y_, heading_); }

private:
    Image sprite_, hoodArt_; // {{ownCopy}}
    int x_, y_, heading_;
};

void MapScreen::showArea(const Area& area, std::size_t limit) { // {{pickLimit}} // @step:l1-start
    for (std::size_t i = 0; i < limit; ++i) { // @step:l1-fill
        const auto& s = area.spots[i];
        rickshaws_.emplace_back(s.x, s.y, s.heading); // {{perObject}} // @step:l1-new,l1-copy,l1-fill
    }
    for (const auto& r : rickshaws_) r.draw(map_); // {{outOfMemory}} // @step:l1-result
}
// {{withoutMath}} // @step:l1-math
`

const withPattern = `
// {{withAdd}}
factory.add("cng", [] { // {{newModel}} // @step:build-model,l3-miss
    return VehicleModel{loadImage("cng.png"), loadImage("green-cage.png"), loadSound("horn.mp3")}; // {{cngShared}} // @step:build-model,l3-miss
});

// {{withSame}}
for (const auto& s : gulshan.rickshawSpots) // {{unchanged}}
    vehicles.push_back({s.x, s.y, s.heading, true, factory.get("rickshaw")}); // @step:l3-rickshaws
for (const auto& s : gulshan.cngSpots) // @step:l3-fill
    vehicles.push_back({s.x, s.y, s.heading, true, factory.get("cng")}); // {{sameFactory}} // @step:build-use,l3-request,l3-hit,l3-place
for (const auto& v : vehicles) v.draw(map); // {{sameDraw}} // @step:l3-draw
// {{withZero}}
`

export const cpp: CodeSet = {
  main: { filename: 'rickshaw_map.cpp', source: main },
  without: { filename: 'rickshaw_map_without_flyweight.cpp', source: without },
  with: { filename: 'rickshaw_map_with_flyweight.cpp', source: withPattern },
}
