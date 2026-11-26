import type { CodeSet } from '@/types/pattern'

/*
 * Conventions (see CLAUDE.md):
 *   // {{key}}        → translated comment from content.<lang>.ts → codeComments[key]
 *   // @step:a,b      → this line lights up while visual step a or b runs (stripped on display)
 * radio() (a message on the air-traffic frequency) is left undeclared to keep the snippets small.
 */

const main = `
// {{mediator}}
interface ControlTower {
  requestLanding(plane: Aircraft): void;
  notify(sender: Aircraft, event: 'landed'): void;
}

// {{colleague}}
abstract class Aircraft {
  constructor(readonly callSign: string, protected readonly tower: ControlTower) {} // {{onlyTower}} // @step:only-tower
  get priority(): boolean { return false; } // {{priorityHook}}
  askToLand(): void {
    this.tower.requestLanding(this); // {{askTower}} // @step:request
  }
  hold(): void {
    radio(this.callSign + ': holding'); // @step:hold
  }
  abstract land(): void;
}

// {{concreteColleague}}
class PassengerPlane extends Aircraft {
  land(): void {
    radio(this.callSign + ': landing with passengers'); // @step:land
    this.tower.notify(this, 'landed'); // {{reportBack}} // @step:vacate
  }
}

class CargoPlane extends Aircraft {
  land(): void {
    radio(this.callSign + ': landing with cargo'); // @step:land
    this.tower.notify(this, 'landed'); // @step:vacate
  }
}

// {{concreteMediator}}
class SylhetTower implements ControlTower {
  private runwayFree = true; // {{runwayState}}
  private readonly queue: Aircraft[] = []; // {{waitingLine}}

  requestLanding(plane: Aircraft): void {
    if (this.runwayFree) return this.clear(plane); // @step:check-runway
    if (plane.priority) this.queue.unshift(plane); // {{emergencyFirst}} // @step:queue
    else this.queue.push(plane); // @step:queue
    plane.hold(); // @step:hold
  }

  notify(sender: Aircraft, event: 'landed'): void {
    this.runwayFree = true; // {{runwayBack}} // @step:runway-free
    const next = this.queue.shift(); // {{nextInLine}} // @step:clear-next
    if (next) this.clear(next); // @step:clear-next
  }

  private clear(plane: Aircraft): void {
    this.runwayFree = false; // {{onlyOne}} // @step:clear,clear-next,conflict
    plane.land(); // @step:clear,clear-next
  }
}

// {{client}}
const tower = new SylhetTower();
const pa101 = new PassengerPlane('PA-101', tower); // {{noPlaneKnowsPlane}}
const kc33 = new CargoPlane('KC-33', tower);
pa101.askToLand(); // @step:request
`

const without = `
// {{withoutIntro}}
class Plane {
  readonly others: Plane[] = []; // {{knowsAll}} // @step:l1-arrive
  onFinal = false;
  constructor(readonly callSign: string) {}

  tryToLand(runway: Runway): void {
    for (const other of this.others) { // {{askEach}} // @step:l1-ask
      if (other.isLanding()) return this.hold(); // {{waitTurn}} // @step:l1-hold
    }
    runway.land(this); // {{hopeClear}} // @step:l1-land
  }

  isLanding(): boolean {
    return this.onFinal; // @step:l1-reply
  }
}

class Runway {
  land(plane: Plane): void { this.planes.push(plane); } // {{nobodyGuards}} // @step:l1-conflict
}

// {{wireUp}}
for (const p of [pa101, mg207]) { kc33.others.push(p); p.others.push(kc33); } // {{linksGrow}} // @step:l1-arrive
kc33.tryToLand(runway); // @step:l1-try
// {{withoutNext}}
`

const withPattern = `
// {{withAdd}}
class Helicopter extends Aircraft { // {{sameBase}} // @step:build-class
  override get priority(): boolean { return true; } // {{airAmbulance}} // @step:build-priority,h-priority
  land(): void {
    radio(this.callSign + ': landing with a patient'); // @step:h-land
    this.tower.notify(this, 'landed'); // {{reportBack}} // @step:h-vacate
  }
}

// {{othersSame}}
class PassengerPlane extends Aircraft { /* … */ } // @step:p-pass
class CargoPlane extends Aircraft { /* … */ } // @step:p-cargo
class SylhetTower implements ControlTower { /* … */ } // {{towerSame}} // @step:t-act

// {{withUse}}
const rescue1 = new Helicopter('Rescue-1', tower); // {{knowsTower}} // @step:h-create
rescue1.askToLand(); // {{sameCall}} // @step:h-request
// {{withZero}}
`

export const ts: CodeSet = {
  main: { filename: 'control-tower.ts', source: main },
  without: { filename: 'control-tower-without-mediator.ts', source: without },
  with: { filename: 'helicopter.ts', source: withPattern },
}
