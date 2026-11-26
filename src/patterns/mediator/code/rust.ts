import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Rust: no cyclic references (tower ↔ planes), so each aircraft gets the tower as a &mut parameter, the tower queues call signs, and it radios "cleared" instead of calling back into a plane.

const main = `
use std::collections::VecDeque;

// {{mediator}}
pub trait ControlTower {
    fn request_landing(&mut self, plane: &dyn Aircraft) -> bool;
    fn notify(&mut self, sender: &dyn Aircraft, event: &str);
}

// {{colleague}}
pub trait Aircraft {
    fn call_sign(&self) -> &str;
    fn priority(&self) -> bool { false } // {{priorityHook}}
    fn hold(&self) {
        radio(&format!("{}: holding", self.call_sign())); // @step:hold
    }
    fn land(&self, tower: &mut dyn ControlTower);
}

pub fn ask_to_land(plane: &dyn Aircraft, tower: &mut dyn ControlTower) { // {{onlyTower}} // @step:only-tower
    if tower.request_landing(plane) { plane.land(tower) } else { plane.hold() } // {{askTower}} // @step:request
}

// {{concreteColleague}}
pub struct PassengerPlane { pub call_sign: String }
pub struct CargoPlane { pub call_sign: String }

impl Aircraft for PassengerPlane {
    fn call_sign(&self) -> &str { &self.call_sign }
    fn land(&self, tower: &mut dyn ControlTower) {
        radio(&format!("{}: landing with passengers", self.call_sign)); // @step:land
        tower.notify(self, "landed"); // {{reportBack}} // @step:vacate
    }
}

impl Aircraft for CargoPlane {
    fn call_sign(&self) -> &str { &self.call_sign }
    fn land(&self, tower: &mut dyn ControlTower) {
        radio(&format!("{}: landing with cargo", self.call_sign)); // @step:land
        tower.notify(self, "landed"); // @step:vacate
    }
}

// {{concreteMediator}}
pub struct SylhetTower {
    runway_free: bool,         // {{runwayState}}
    queue: VecDeque<String>,   // {{waitingLine}}
}

impl ControlTower for SylhetTower {
    fn request_landing(&mut self, plane: &dyn Aircraft) -> bool {
        if self.runway_free { return self.clear(plane.call_sign()) } // @step:check-runway
        let call = plane.call_sign().to_string();
        if plane.priority() { self.queue.push_front(call) } // {{emergencyFirst}} // @step:queue
        else { self.queue.push_back(call) } // @step:queue
        false // @step:hold
    }

    fn notify(&mut self, _sender: &dyn Aircraft, _event: &str) {
        self.runway_free = true; // {{runwayBack}} // @step:runway-free
        if let Some(next) = self.queue.pop_front() { // {{nextInLine}} // @step:clear-next
            self.clear(&next); // @step:clear-next
        }
    }
}

impl SylhetTower {
    fn clear(&mut self, call_sign: &str) -> bool {
        self.runway_free = false; // {{onlyOne}} // @step:clear,clear-next,conflict
        radio(&format!("{call_sign}: cleared to land")); // @step:clear,clear-next
        true
    }
}

// {{client}}
let mut tower = SylhetTower { runway_free: true, queue: VecDeque::new() };
let pa101 = PassengerPlane { call_sign: "PA-101".into() }; // {{noPlaneKnowsPlane}}
ask_to_land(&pa101, &mut tower); // @step:request
`

const without = `
// {{withoutIntro}}
pub struct Plane {
    pub call_sign: String,
    pub others: Vec<Rc<RefCell<Plane>>>, // {{knowsAll}} // @step:l1-arrive
    pub on_final: bool,
}

impl Plane {
    pub fn try_to_land(&self, runway: &mut Runway) {
        for other in &self.others { // {{askEach}} // @step:l1-ask
            if other.borrow().is_landing() { return self.hold() } // {{waitTurn}} // @step:l1-hold
        }
        runway.land(&self.call_sign); // {{hopeClear}} // @step:l1-land
    }

    pub fn is_landing(&self) -> bool {
        self.on_final // @step:l1-reply
    }
}

impl Runway {
    pub fn land(&mut self, call_sign: &str) { self.planes.push(call_sign.into()) } // {{nobodyGuards}} // @step:l1-conflict
}

// {{wireUp}}
for p in [&pa101, &mg207] { kc33.borrow_mut().others.push(p.clone()); p.borrow_mut().others.push(kc33.clone()); } // {{linksGrow}} // @step:l1-arrive
kc33.borrow().try_to_land(&mut runway); // @step:l1-try
// {{withoutNext}}
`

const withPattern = `
// {{withAdd}}
pub struct Helicopter { pub call_sign: String } // @step:build-class

impl Aircraft for Helicopter { // {{sameBase}} // @step:build-class
    fn call_sign(&self) -> &str { &self.call_sign }
    fn priority(&self) -> bool { true } // {{airAmbulance}} // @step:build-priority,h-priority
    fn land(&self, tower: &mut dyn ControlTower) {
        radio(&format!("{}: landing with a patient", self.call_sign)); // @step:h-land
        tower.notify(self, "landed"); // {{reportBack}} // @step:h-vacate
    }
}

// {{othersSame}}
impl Aircraft for PassengerPlane { /* … */ } // @step:p-pass
impl Aircraft for CargoPlane { /* … */ } // @step:p-cargo
impl ControlTower for SylhetTower { /* … */ } // {{towerSame}} // @step:t-act

// {{withUse}}
let rescue1 = Helicopter { call_sign: "Rescue-1".into() }; // {{knowsTower}} // @step:h-create
ask_to_land(&rescue1, &mut tower); // {{sameCall}} // @step:h-request
// {{withZero}}
`

export const rust: CodeSet = {
  main: { filename: 'control_tower.rs', source: main },
  without: { filename: 'control_tower_without_mediator.rs', source: without },
  with: { filename: 'helicopter.rs', source: withPattern },
}
