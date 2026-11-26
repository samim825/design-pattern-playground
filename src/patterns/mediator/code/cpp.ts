import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
// {{mediator}}
class Aircraft;
class ControlTower {
public:
    virtual ~ControlTower() = default;
    virtual void requestLanding(Aircraft& plane) = 0;
    virtual void notify(Aircraft& sender, const std::string& event) = 0;
};

// {{colleague}}
class Aircraft {
public:
    Aircraft(std::string callSign, ControlTower& tower)
        : callSign_(std::move(callSign)), tower_(tower) {} // {{onlyTower}} // @step:only-tower
    virtual ~Aircraft() = default;
    virtual bool priority() const { return false; } // {{priorityHook}}
    void askToLand() {
        tower_.requestLanding(*this); // {{askTower}} // @step:request
    }
    void hold() { radio(callSign_ + ": holding"); } // @step:hold
    virtual void land() = 0;
protected:
    std::string callSign_;
    ControlTower& tower_;
};

// {{concreteColleague}}
class PassengerPlane : public Aircraft {
public:
    using Aircraft::Aircraft;
    void land() override {
        radio(callSign_ + ": landing with passengers"); // @step:land
        tower_.notify(*this, "landed"); // {{reportBack}} // @step:vacate
    }
};

class CargoPlane : public Aircraft {
public:
    using Aircraft::Aircraft;
    void land() override {
        radio(callSign_ + ": landing with cargo"); // @step:land
        tower_.notify(*this, "landed"); // @step:vacate
    }
};

// {{concreteMediator}}
class SylhetTower : public ControlTower {
public:
    void requestLanding(Aircraft& plane) override {
        if (runwayFree_) { clear(plane); return; } // @step:check-runway
        if (plane.priority()) queue_.push_front(&plane); // {{emergencyFirst}} // @step:queue
        else queue_.push_back(&plane); // @step:queue
        plane.hold(); // @step:hold
    }
    void notify(Aircraft&, const std::string&) override {
        runwayFree_ = true; // {{runwayBack}} // @step:runway-free
        if (queue_.empty()) return; // {{nextInLine}} // @step:clear-next
        Aircraft* next = queue_.front(); queue_.pop_front(); clear(*next); // @step:clear-next
    }
private:
    void clear(Aircraft& plane) {
        runwayFree_ = false; // {{onlyOne}} // @step:clear,clear-next,conflict
        plane.land(); // @step:clear,clear-next
    }
    bool runwayFree_ = true; // {{runwayState}}
    std::deque<Aircraft*> queue_; // {{waitingLine}}
};

// {{client}}
SylhetTower tower;
auto pa101 = std::make_unique<PassengerPlane>("PA-101", tower); // {{noPlaneKnowsPlane}}
auto kc33 = std::make_unique<CargoPlane>("KC-33", tower);
pa101->askToLand(); // @step:request
`

const without = `
// {{withoutIntro}}
class Plane {
public:
    std::vector<Plane*> others; // {{knowsAll}} // @step:l1-arrive
    bool onFinal = false;

    void tryToLand(Runway& runway) {
        for (Plane* other : others) { // {{askEach}} // @step:l1-ask
            if (other->isLanding()) { hold(); return; } // {{waitTurn}} // @step:l1-hold
        }
        runway.land(*this); // {{hopeClear}} // @step:l1-land
    }

    bool isLanding() const {
        return onFinal; // @step:l1-reply
    }
};

void Runway::land(Plane& plane) { planes_.push_back(&plane); } // {{nobodyGuards}} // @step:l1-conflict

// {{wireUp}}
for (Plane* p : {&pa101, &mg207}) { kc33.others.push_back(p); p->others.push_back(&kc33); } // {{linksGrow}} // @step:l1-arrive
kc33.tryToLand(runway); // @step:l1-try
// {{withoutNext}}
`

const withPattern = `
// {{withAdd}}
class Helicopter : public Aircraft { // {{sameBase}} // @step:build-class
public:
    using Aircraft::Aircraft;
    bool priority() const override { return true; } // {{airAmbulance}} // @step:build-priority,h-priority
    void land() override {
        radio(callSign_ + ": landing with a patient"); // @step:h-land
        tower_.notify(*this, "landed"); // {{reportBack}} // @step:h-vacate
    }
};

// {{othersSame}}
class PassengerPlane : public Aircraft { /* … */ }; // @step:p-pass
class CargoPlane : public Aircraft { /* … */ }; // @step:p-cargo
class SylhetTower : public ControlTower { /* … */ }; // {{towerSame}} // @step:t-act

// {{withUse}}
auto rescue1 = std::make_unique<Helicopter>("Rescue-1", tower); // {{knowsTower}} // @step:h-create
rescue1->askToLand(); // {{sameCall}} // @step:h-request
// {{withZero}}
`

export const cpp: CodeSet = {
  main: { filename: 'control_tower.cpp', source: main },
  without: { filename: 'control_tower_without_mediator.cpp', source: without },
  with: { filename: 'helicopter.cpp', source: withPattern },
}
