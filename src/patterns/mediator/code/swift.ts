import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
// {{mediator}}
protocol ControlTower: AnyObject {
    func requestLanding(_ plane: any Aircraft)
    func notify(_ sender: any Aircraft, event: String)
}

// {{colleague}}
protocol Aircraft: AnyObject {
    var callSign: String { get }
    var tower: any ControlTower { get } // {{onlyTower}} // @step:only-tower
    var priority: Bool { get }
    func land()
}

extension Aircraft {
    var priority: Bool { false } // {{priorityHook}}
    func askToLand() {
        tower.requestLanding(self) // {{askTower}} // @step:request
    }
    func hold() { radio(callSign + ": holding") } // @step:hold
}

// {{concreteColleague}}
final class PassengerPlane: Aircraft {
    let callSign: String; let tower: any ControlTower
    init(_ callSign: String, tower: any ControlTower) { self.callSign = callSign; self.tower = tower }
    func land() {
        radio(callSign + ": landing with passengers") // @step:land
        tower.notify(self, event: "landed") // {{reportBack}} // @step:vacate
    }
}

final class CargoPlane: Aircraft {
    let callSign: String; let tower: any ControlTower
    init(_ callSign: String, tower: any ControlTower) { self.callSign = callSign; self.tower = tower }
    func land() {
        radio(callSign + ": landing with cargo") // @step:land
        tower.notify(self, event: "landed") // @step:vacate
    }
}

// {{concreteMediator}}
final class SylhetTower: ControlTower {
    private var runwayFree = true // {{runwayState}}
    private var queue: [any Aircraft] = [] // {{waitingLine}}

    func requestLanding(_ plane: any Aircraft) {
        if runwayFree { return clear(plane) } // @step:check-runway
        if plane.priority { queue.insert(plane, at: 0) } // {{emergencyFirst}} // @step:queue
        else { queue.append(plane) } // @step:queue
        plane.hold() // @step:hold
    }

    func notify(_ sender: any Aircraft, event: String) {
        runwayFree = true // {{runwayBack}} // @step:runway-free
        guard !queue.isEmpty else { return } // {{nextInLine}} // @step:clear-next
        clear(queue.removeFirst()) // @step:clear-next
    }

    private func clear(_ plane: any Aircraft) {
        runwayFree = false // {{onlyOne}} // @step:clear,clear-next,conflict
        plane.land() // @step:clear,clear-next
    }
}

// {{client}}
let tower = SylhetTower()
let pa101 = PassengerPlane("PA-101", tower: tower) // {{noPlaneKnowsPlane}}
let kc33 = CargoPlane("KC-33", tower: tower)
pa101.askToLand() // @step:request
`

const without = `
// {{withoutIntro}}
final class Plane {
    var others: [Plane] = [] // {{knowsAll}} // @step:l1-arrive
    var onFinal = false

    func tryToLand(on runway: Runway) {
        for other in others { // {{askEach}} // @step:l1-ask
            if other.isLanding() { return hold() } // {{waitTurn}} // @step:l1-hold
        }
        runway.land(self) // {{hopeClear}} // @step:l1-land
    }

    func isLanding() -> Bool {
        onFinal // @step:l1-reply
    }
}

extension Runway {
    func land(_ plane: Plane) { planes.append(plane) } // {{nobodyGuards}} // @step:l1-conflict
}

// {{wireUp}}
for p in [pa101, mg207] { kc33.others.append(p); p.others.append(kc33) } // {{linksGrow}} // @step:l1-arrive
kc33.tryToLand(on: runway) // @step:l1-try
// {{withoutNext}}
`

const withPattern = `
// {{withAdd}}
final class Helicopter: Aircraft { // {{sameBase}} // @step:build-class
    let callSign: String; let tower: any ControlTower
    init(_ callSign: String, tower: any ControlTower) { self.callSign = callSign; self.tower = tower }
    var priority: Bool { true } // {{airAmbulance}} // @step:build-priority,h-priority
    func land() {
        radio(callSign + ": landing with a patient") // @step:h-land
        tower.notify(self, event: "landed") // {{reportBack}} // @step:h-vacate
    }
}

// {{othersSame}}
final class PassengerPlane: Aircraft { /* … */ } // @step:p-pass
final class CargoPlane: Aircraft { /* … */ } // @step:p-cargo
final class SylhetTower: ControlTower { /* … */ } // {{towerSame}} // @step:t-act

// {{withUse}}
let rescue1 = Helicopter("Rescue-1", tower: tower) // {{knowsTower}} // @step:h-create
rescue1.askToLand() // {{sameCall}} // @step:h-request
// {{withZero}}
`

export const swift: CodeSet = {
  main: { filename: 'ControlTower.swift', source: main },
  without: { filename: 'ControlTowerWithoutMediator.swift', source: without },
  with: { filename: 'Helicopter.swift', source: withPattern },
}
