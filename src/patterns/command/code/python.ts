import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
# {{command}}
class OrderCommand(ABC):
    price: int  # {{slipPrice}}

    @abstractmethod
    def execute(self) -> None: ...  # {{doIt}}

    @abstractmethod
    def undo(self) -> None: ...  # {{undoIt}}


# {{receiver}}
class Kitchen:
    def cook(self, dish: str, table: int) -> None: ...  # {{realWork}}  # @step:cook
    def take_back(self, dish: str, table: int) -> None: ...  # @step:uncook
    def add_chili(self, dish: str, table: int) -> None: ...
    def remove_chili(self, dish: str, table: int) -> None: ...


# {{concrete}}
@dataclass
class CookDishCommand(OrderCommand):
    kitchen: Kitchen  # {{holdsReceiver}}
    dish: str
    table: int
    price: int

    def execute(self) -> None:
        self.kitchen.cook(self.dish, self.table)  # {{delegates}}  # @step:exec

    def undo(self) -> None:
        self.kitchen.take_back(self.dish, self.table)  # {{reverses}}  # @step:undo-exec


# {{invoker}}
class OrderRail:
    def __init__(self) -> None:
        self.queue: deque[OrderCommand] = deque()  # {{queueField}}
        self.history: list[OrderCommand] = []  # {{historyField}}  # @step:tear

    def pin(self, slip: OrderCommand) -> None:
        self.queue.append(slip)  # {{waits}}  # @step:pin

    def run_next(self) -> None:
        if not self.queue:
            return
        slip = self.queue.popleft()  # {{inOrder}}  # @step:run
        slip.execute()  # {{blind}}  # @step:run
        self.history.append(slip)  # {{remember}}  # @step:cook

    def undo_last(self) -> None:
        if self.history:
            self.history.pop().undo()  # {{lastFirst}}  # @step:undo

    def bill(self) -> int:
        return sum(s.price for s in self.history)  # {{billFromHistory}}  # @step:bill


# {{client}}
kitchen = Kitchen()
rail = OrderRail()
rail.pin(CookDishCommand(kitchen, "kacchi", 4, 350))  # {{writeSlip}}  # @step:write
rail.run_next()  # {{railRuns}}  # @step:run
rail.undo_last()  # {{cancelIsUndo}}  # @step:cancel
`

const without = `
# {{withoutIntro}}
class Waiter:
    def __init__(self, kitchen: Kitchen) -> None:
        self.kitchen = kitchen  # {{knowsKitchen}}
        self.bill = 0  # {{billInHead}}

    def take_order(self, dish: str, table: int, price: int) -> None:  # @step:l1-order
        if dish == "kacchi":
            self.kitchen.cook_kacchi(table)  # {{shoutNow}}  # @step:l1-kacchi
        elif dish == "roast":
            self.kitchen.cook_roast(table)  # @step:l1-roast
        else:
            self.kitchen.serve_cold(dish, table)  # {{busyLost}}  # @step:l1-cold
        self.bill += price  # @step:l1-bill

    def cancel(self, dish: str, table: int, price: int) -> None:  # {{noRecord}}  # @step:l1-cancel
        self.kitchen.throw_away(dish, table)  # {{hopeRight}}  # @step:l1-undo
        self.bill -= price  # {{fixByHand}}  # @step:l1-bill


# {{withoutCopy}}  # @step:l1-copy
`

const withPattern = `
# {{withAdd}}
@dataclass
class MakeSpicyCommand(OrderCommand):  # {{sameInterface}}  # @step:build-class
    kitchen: Kitchen  # {{askReceiver}}  # @step:build-receiver
    dish: str
    table: int
    price: int = 20  # {{chiliPrice}}

    def execute(self) -> None:
        self.kitchen.add_chili(self.dish, self.table)  # {{chiliOn}}  # @step:spicy-exec

    def undo(self) -> None:
        self.kitchen.remove_chili(self.dish, self.table)  # {{chiliOff}}  # @step:spicy-undo


# {{othersSame}}
class OrderRail: ...  # @step:rail-same
class CookDishCommand(OrderCommand): ...  # @step:cook-same

# {{withUse}}
rail.pin(CookDishCommand(kitchen, "kacchi", 4, 350))  # @step:l3-order
rail.pin(MakeSpicyCommand(kitchen, "kacchi", 4))  # {{newSlip}}  # @step:l3-spicy
rail.run_next()  # {{sameRail}}  # @step:l3-run
rail.undo_last()  # {{tooHot}}  # @step:l3-undo
# {{withZero}}
`

export const python: CodeSet = {
  main: { filename: 'order_rail.py', source: main },
  without: { filename: 'orders_without_command.py', source: without },
  with: { filename: 'orders_with_command.py', source: withPattern },
}
