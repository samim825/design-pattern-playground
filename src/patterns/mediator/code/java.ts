import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
// {{mediator}}
interface ControlTower {
    void requestLanding(Aircraft plane);
    void notify(Aircraft sender, String event);
}

// {{colleague}}
abstract class Aircraft {
    protected final String callSign;
    protected final ControlTower tower; // {{onlyTower}} // @step:only-tower
    Aircraft(String callSign, ControlTower tower) { this.callSign = callSign; this.tower = tower; }
    boolean priority() { return false; } // {{priorityHook}}
    void askToLand() {
        tower.requestLanding(this); // {{askTower}} // @step:request
    }
    void hold() {
        radio(callSign + ": holding"); // @step:hold
    }
    abstract void land();
}

// {{concreteColleague}}
class PassengerPlane extends Aircraft {
    PassengerPlane(String callSign, ControlTower tower) { super(callSign, tower); }
    @Override void land() {
        radio(callSign + ": landing with passengers"); // @step:land
        tower.notify(this, "landed"); // {{reportBack}} // @step:vacate
    }
}

class CargoPlane extends Aircraft {
    CargoPlane(String callSign, ControlTower tower) { super(callSign, tower); }
    @Override void land() {
        radio(callSign + ": landing with cargo"); // @step:land
        tower.notify(this, "landed"); // @step:vacate
    }
}

// {{concreteMediator}}
class SylhetTower implements ControlTower {
    private boolean runwayFree = true; // {{runwayState}}
    private final Deque<Aircraft> queue = new ArrayDeque<>(); // {{waitingLine}}

    @Override public void requestLanding(Aircraft plane) {
        if (runwayFree) { clear(plane); return; } // @step:check-runway
        if (plane.priority()) queue.addFirst(plane); // {{emergencyFirst}} // @step:queue
        else queue.addLast(plane); // @step:queue
        plane.hold(); // @step:hold
    }

    @Override public void notify(Aircraft sender, String event) {
        runwayFree = true; // {{runwayBack}} // @step:runway-free
        Aircraft next = queue.pollFirst(); // {{nextInLine}} // @step:clear-next
        if (next != null) clear(next); // @step:clear-next
    }

    private void clear(Aircraft plane) {
        runwayFree = false; // {{onlyOne}} // @step:clear,clear-next,conflict
        plane.land(); // @step:clear,clear-next
    }
}

// {{client}}
var tower = new SylhetTower();
var pa101 = new PassengerPlane("PA-101", tower); // {{noPlaneKnowsPlane}}
var kc33 = new CargoPlane("KC-33", tower);
pa101.askToLand(); // @step:request
`

const without = `
// {{withoutIntro}}
class Plane {
    final List<Plane> others = new ArrayList<>(); // {{knowsAll}} // @step:l1-arrive
    boolean onFinal = false;

    void tryToLand(Runway runway) {
        for (Plane other : others) { // {{askEach}} // @step:l1-ask
            if (other.isLanding()) { hold(); return; } // {{waitTurn}} // @step:l1-hold
        }
        runway.land(this); // {{hopeClear}} // @step:l1-land
    }

    boolean isLanding() {
        return onFinal; // @step:l1-reply
    }
}

class Runway {
    void land(Plane plane) { planes.add(plane); } // {{nobodyGuards}} // @step:l1-conflict
}

// {{wireUp}}
for (Plane p : List.of(pa101, mg207)) { kc33.others.add(p); p.others.add(kc33); } // {{linksGrow}} // @step:l1-arrive
kc33.tryToLand(runway); // @step:l1-try
// {{withoutNext}}
`

const withPattern = `
// {{withAdd}}
class Helicopter extends Aircraft { // {{sameBase}} // @step:build-class
    Helicopter(String callSign, ControlTower tower) { super(callSign, tower); }
    @Override boolean priority() { return true; } // {{airAmbulance}} // @step:build-priority,h-priority
    @Override void land() {
        radio(callSign + ": landing with a patient"); // @step:h-land
        tower.notify(this, "landed"); // {{reportBack}} // @step:h-vacate
    }
}

// {{othersSame}}
class PassengerPlane extends Aircraft { /* … */ } // @step:p-pass
class CargoPlane extends Aircraft { /* … */ } // @step:p-cargo
class SylhetTower implements ControlTower { /* … */ } // {{towerSame}} // @step:t-act

// {{withUse}}
var rescue1 = new Helicopter("Rescue-1", tower); // {{knowsTower}} // @step:h-create
rescue1.askToLand(); // {{sameCall}} // @step:h-request
// {{withZero}}
`

export const java: CodeSet = {
  main: { filename: 'ControlTower.java', source: main },
  without: { filename: 'ControlTowerWithoutMediator.java', source: without },
  with: { filename: 'Helicopter.java', source: withPattern },
}
