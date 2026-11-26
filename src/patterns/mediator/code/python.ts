import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
from abc import ABC, abstractmethod
from collections import deque

# {{mediator}}
class ControlTower(ABC):
    @abstractmethod
    def request_landing(self, plane: "Aircraft") -> None: ...
    @abstractmethod
    def notify(self, sender: "Aircraft", event: str) -> None: ...

# {{colleague}}
class Aircraft(ABC):
    priority = False  # {{priorityHook}}

    def __init__(self, call_sign: str, tower: ControlTower):
        self.call_sign, self.tower = call_sign, tower  # {{onlyTower}} # @step:only-tower

    def ask_to_land(self) -> None:
        self.tower.request_landing(self)  # {{askTower}} # @step:request

    def hold(self) -> None:
        radio(f"{self.call_sign}: holding")  # @step:hold

    @abstractmethod
    def land(self) -> None: ...

# {{concreteColleague}}
class PassengerPlane(Aircraft):
    def land(self) -> None:
        radio(f"{self.call_sign}: landing with passengers")  # @step:land
        self.tower.notify(self, "landed")  # {{reportBack}} # @step:vacate

class CargoPlane(Aircraft):
    def land(self) -> None:
        radio(f"{self.call_sign}: landing with cargo")  # @step:land
        self.tower.notify(self, "landed")  # @step:vacate

# {{concreteMediator}}
class SylhetTower(ControlTower):
    def __init__(self):
        self._runway_free = True  # {{runwayState}}
        self._queue: deque[Aircraft] = deque()  # {{waitingLine}}

    def request_landing(self, plane: Aircraft) -> None:
        if self._runway_free: return self._clear(plane)  # @step:check-runway
        if plane.priority: self._queue.appendleft(plane)  # {{emergencyFirst}} # @step:queue
        else: self._queue.append(plane)  # @step:queue
        plane.hold()  # @step:hold

    def notify(self, sender: Aircraft, event: str) -> None:
        self._runway_free = True  # {{runwayBack}} # @step:runway-free
        if self._queue:  # {{nextInLine}} # @step:clear-next
            self._clear(self._queue.popleft())  # @step:clear-next

    def _clear(self, plane: Aircraft) -> None:
        self._runway_free = False  # {{onlyOne}} # @step:clear,clear-next,conflict
        plane.land()  # @step:clear,clear-next

# {{client}}
tower = SylhetTower()
pa101 = PassengerPlane("PA-101", tower)  # {{noPlaneKnowsPlane}}
kc33 = CargoPlane("KC-33", tower)
pa101.ask_to_land()  # @step:request
`

const without = `
# {{withoutIntro}}
class Plane:
    def __init__(self, call_sign: str):
        self.call_sign = call_sign
        self.others: list[Plane] = []  # {{knowsAll}} # @step:l1-arrive
        self.on_final = False

    def try_to_land(self, runway: "Runway") -> None:
        for other in self.others:  # {{askEach}} # @step:l1-ask
            if other.is_landing(): return self.hold()  # {{waitTurn}} # @step:l1-hold
        runway.land(self)  # {{hopeClear}} # @step:l1-land

    def is_landing(self) -> bool:
        return self.on_final  # @step:l1-reply

class Runway:
    def land(self, plane: Plane) -> None:
        self.planes.append(plane)  # {{nobodyGuards}} # @step:l1-conflict

# {{wireUp}}
for p in (pa101, mg207): kc33.others.append(p); p.others.append(kc33)  # {{linksGrow}} # @step:l1-arrive
kc33.try_to_land(runway)  # @step:l1-try
# {{withoutNext}}
`

const withPattern = `
# {{withAdd}}
class Helicopter(Aircraft):  # {{sameBase}} # @step:build-class
    priority = True  # {{airAmbulance}} # @step:build-priority,h-priority

    def land(self) -> None:
        radio(f"{self.call_sign}: landing with a patient")  # @step:h-land
        self.tower.notify(self, "landed")  # {{reportBack}} # @step:h-vacate

# {{othersSame}}
class PassengerPlane(Aircraft): ...  # @step:p-pass
class CargoPlane(Aircraft): ...  # @step:p-cargo
class SylhetTower(ControlTower): ...  # {{towerSame}} # @step:t-act

# {{withUse}}
rescue1 = Helicopter("Rescue-1", tower)  # {{knowsTower}} # @step:h-create
rescue1.ask_to_land()  # {{sameCall}} # @step:h-request
# {{withZero}}
`

export const python: CodeSet = {
  main: { filename: 'control_tower.py', source: main },
  without: { filename: 'control_tower_without_mediator.py', source: without },
  with: { filename: 'helicopter.py', source: withPattern },
}
