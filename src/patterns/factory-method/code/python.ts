import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
from abc import ABC, abstractmethod
from dataclasses import dataclass

@dataclass
class Parcel:
    item: str
    to: str

@dataclass
class Booking:
    tracking: str
    fee: int
    eta: str

# {{product}}
class Transport(ABC):
    fee: int

    @abstractmethod
    def deliver(self, to: str) -> str: ...

class RickshawVan(Transport):
    fee = 60
    def deliver(self, to: str) -> str:
        return f"Through the lanes to {to}, today"  # @step:dhaka-deliver

class Truck(Transport):
    fee = 150
    def deliver(self, to: str) -> str:
        return f"On the highway to {to}, tomorrow"  # @step:chattogram-deliver

class Launch(Transport):
    fee = 120
    def deliver(self, to: str) -> str:
        return f"Down the river to {to}, overnight"  # @step:barishal-deliver

# {{creator}}
class CourierBranch(ABC):
    # {{factoryMethod}}
    @abstractmethod
    def create_transport(self) -> Transport: ...

    # {{shared}}
    def send_parcel(self, parcel: Parcel) -> Booking:
        transport = self.create_transport()  # {{noConcrete}} # @step:call-factory
        tracking = new_tracking_id()  # @step:book
        eta = transport.deliver(parcel.to)  # @step:deliver
        return Booking(tracking, transport.fee, eta)  # @step:done

# {{concreteCreators}}
class DhakaBranch(CourierBranch):
    def create_transport(self) -> Transport:
        return RickshawVan()  # @step:dhaka-create

class ChattogramBranch(CourierBranch):
    def create_transport(self) -> Transport:
        return Truck()  # @step:chattogram-create

class BarishalBranch(CourierBranch):
    def create_transport(self) -> Transport:
        return Launch()  # @step:barishal-create

# {{usage}}
branch: CourierBranch = branches[selected_city]  # @step:pick-branch
booking = branch.send_parcel(Parcel("Saree", destination))  # @step:client-send,done
`

const without = `
# {{withoutIntro}}
def send_parcel(parcel: Parcel, city: str) -> Booking:
    if city == "dhaka":
        transport = RickshawVan()
    elif city == "chattogram":
        transport = Truck()
    elif city == "barishal":
        transport = Launch()
    else:
        raise ValueError("No transport for " + city)
    # {{withoutTodo}}

    tracking = new_tracking_id()
    eta = transport.deliver(parcel.to)
    return Booking(tracking, transport.fee, eta)
`

const withPattern = `
# {{withAdd}}
class Drone(Transport):
    fee = 200
    def deliver(self, to: str) -> str:
        return f"Flying over the hills to {to}"

class SylhetBranch(CourierBranch):
    def create_transport(self) -> Transport:
        return Drone()

# {{withSame}}
SylhetBranch().send_parcel(Parcel("Tea", "Srimangal"))
`

export const python: CodeSet = {
  main: { filename: 'courier.py', source: main },
  without: { filename: 'courier_without_factory_method.py', source: without },
  with: { filename: 'courier_with_factory_method.py', source: withPattern },
}
