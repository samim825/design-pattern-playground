import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
// {{player}}
struct Player {
    std::string name;
    int strikeRate;
    std::string role;
    bool leftHanded;
};

// {{iterator}}
class PlayerIterator {
public:
    virtual ~PlayerIterator() = default;
    virtual bool hasNext() = 0;
    virtual const Player& next() = 0;
};

// {{concreteIterator}}
class BattingOrderIterator : public PlayerIterator {
public:
    explicit BattingOrderIterator(std::vector<Player> players) : players(std::move(players)) {}
    bool hasNext() override {
        return pos < players.size(); // @step:has-next
    }
    const Player& next() override {
        return players[pos++]; // {{handOut}} // @step:next
    }
protected:
    std::vector<Player> players;
    size_t pos = 0; // {{cursor}}
};

class StrikeRateIterator : public BattingOrderIterator {
public:
    explicit StrikeRateIterator(std::vector<Player> players) : BattingOrderIterator(std::move(players)) {
        std::ranges::sort(this->players, std::greater{}, &Player::strikeRate); // {{sortedCopy}} // @step:sort-copy
    }
};

class AllRounderIterator : public BattingOrderIterator {
public:
    using BattingOrderIterator::BattingOrderIterator;
    bool hasNext() override {
        while (BattingOrderIterator::hasNext() && players[pos].role != "all-rounder") pos++; // {{skipInside}} // @step:skip
        return BattingOrderIterator::hasNext(); // @step:ar-has-next
    }
};

// {{aggregate}}
class Team {
public:
    virtual ~Team() = default;
    virtual std::unique_ptr<PlayerIterator> battingOrder() const = 0;
    virtual std::unique_ptr<PlayerIterator> byStrikeRate() const = 0;
    virtual std::unique_ptr<PlayerIterator> allRounders() const = 0;
};

// {{concreteAggregate}}
class Squad : public Team {
public:
    void add(Player p) { players.push_back(std::move(p)); }
    std::unique_ptr<PlayerIterator> battingOrder() const override { return std::make_unique<BattingOrderIterator>(players); } // @step:create-order
    std::unique_ptr<PlayerIterator> byStrikeRate() const override { return std::make_unique<StrikeRateIterator>(players); } // @step:create-sr
    std::unique_ptr<PlayerIterator> allRounders() const override { return std::make_unique<AllRounderIterator>(players); } // @step:create-ar
private:
    std::vector<Player> players; // {{hidden}}
};

// {{client}}
auto it = squad.allRounders(); // {{pickOne}} // @step:request
while (it->hasNext()) { // {{sameLoop}} // @step:loop
    announce(it->next().name);
}
`

const without = `
// {{withoutIntro}}
struct Squad {
    std::vector<Player> players; // {{exposed}} // @step:l1-expose
};

// {{orderLoop}}
for (size_t i = 0; i < squad.players.size(); i++) { // {{indexMath}} // @step:l1-loop
    announce(squad.players[i].name); // @step:l1-read
}

// {{formLoop}}
auto inForm = squad.players; // {{copyFirst}} // @step:l1-sort
std::ranges::sort(inForm, std::greater{}, &Player::strikeRate); // @step:l1-sort
for (const auto& p : inForm) announce(p.name); // @step:l1-read-sorted

// {{changed}}
struct Squad { std::map<int, Player> players; }; // {{breaksAll}} // @step:l1-map
for (const auto& [jersey, p] : squad.players) { // @step:l1-loop-map
    if (p.role == "all-rounder") announce(p.name); // {{filterHere}} // @step:l1-filter
}
// {{withoutNext}}
`

const withPattern = `
// {{withAdd}}
class LeftHandedIterator : public PlayerIterator { // {{sameInterface}} // @step:build-class
public:
    explicit LeftHandedIterator(std::unique_ptr<PlayerIterator> inner) : inner(std::move(inner)) {} // {{wrapsAny}} // @step:build-wrap
    bool hasNext() override {
        while (!found && inner->hasNext()) {
            const Player& p = inner->next(); // {{pull}} // @step:lh-skip,lh-keep
            if (p.leftHanded) found = &p; // {{skipRight}} // @step:lh-skip,lh-keep
        }
        return found != nullptr; // @step:lh-has-next
    }
    const Player& next() override {
        return *std::exchange(found, nullptr); // @step:lh-next
    }
private:
    std::unique_ptr<PlayerIterator> inner;
    const Player* found = nullptr;
};

// {{othersSame}}
class Squad : public Team { /* … */ };

// {{withUse}}
auto it = std::make_unique<LeftHandedIterator>(squad.battingOrder()); // {{wrapUse}} // @step:lh-create
while (it->hasNext()) { // {{sameLoop}} // @step:loop
    announce(it->next().name);
}
// {{withZero}}
`

export const cpp: CodeSet = {
  main: { filename: 'squad.cpp', source: main },
  without: { filename: 'squad_without_iterator.cpp', source: without },
  with: { filename: 'left_handed_iterator.cpp', source: withPattern },
}
