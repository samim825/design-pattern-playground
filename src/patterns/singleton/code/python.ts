import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Python has no private constructors, so __init__ refuses direct calls and get_instance() builds the box.

const main = `
# {{singleton}}
class CashBox:
    _instance: "CashBox | None" = None  # {{theOne}}

    def __init__(self) -> None:
        raise RuntimeError("Use CashBox.get_instance()")  # {{noNew}}  # @step:blocked

    @classmethod
    def get_instance(cls) -> "CashBox":  # @step:call
        if cls._instance is None:  # @step:check
            cls._instance = cls.__new__(cls)  # {{firstTime}}  # @step:create
            cls._instance.total = 0
        return cls._instance  # @step:return

    def add(self, amount: int) -> None:  # @step:add
        self.total += amount

# {{client}}
class Salesperson:
    def __init__(self, name: str) -> None:
        self.name = name

    def ring_up(self, amount: int) -> None:
        box = CashBox.get_instance()  # {{sameBox}}  # @step:call
        box.add(amount)  # @step:add

# {{usage}}
Salesperson("Rahim").ring_up(1500)  # @step:sell
Salesperson("Mitu").ring_up(1200)
karim.count(CashBox.get_instance().total)  # @step:count,done
`

const without = `
# {{withoutIntro}}
class CashBox:
    def __init__(self) -> None:
        self.total = 0

    def add(self, amount: int) -> None:  # @step:l1-add
        self.total += amount

shop_box = CashBox()  # {{withoutGlobal}}  # @step:l1-open

rahim.box = shop_box  # @step:l1-shared
mitu.box = CashBox()  # {{withoutAnyone}}  # @step:l1-new
seller.box.add(sale.amount)  # @step:l1-add

# {{withoutTodo}}  # @step:l1-todo
karim.count(shop_box.total)  # @step:l1-count
`

const withPattern = `
# {{withAdd}}
class BkashCounter:  # @step:build-counter
    def receive(self, amount: int) -> None:  # @step:b-receive
        box = CashBox.get_instance()  # {{sameBox}}  # @step:build-counter,b-call
        box.add(amount)  # @step:b-add

# {{withSame}}
BkashCounter().receive(2000)  # @step:b-start
karim.count(CashBox.get_instance().total)  # @step:b-count,b-done
`

export const python: CodeSet = {
  main: { filename: 'cash_box.py', source: main },
  without: { filename: 'cash_box_without_singleton.py', source: without },
  with: { filename: 'cash_box_with_singleton.py', source: withPattern },
}
