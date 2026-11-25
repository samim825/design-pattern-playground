import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
from abc import ABC, abstractmethod
from dataclasses import dataclass, field

# {{component}}
class BazarItem(ABC):
    name: str

    @abstractmethod
    def get_price(self) -> int: ...

# {{leaf}}
@dataclass
class Item(BazarItem):
    name: str
    price: int

    def get_price(self) -> int:
        return self.price  # {{leafPrice}}  # @step:leaf

# {{composite}}
@dataclass
class Bag(BazarItem):
    name: str
    children: list[BazarItem] = field(default_factory=list)

    def add(self, *items: BazarItem) -> "Bag":  # {{anyChild}}
        self.children.extend(items)
        return self

    def get_price(self) -> int:
        total = 0  # @step:open
        for child in self.children:
            total += child.get_price()  # {{recurse}}  # @step:recurse
        return total  # {{bagTotal}}  # @step:bag-total

# {{usage}}
fish_bag = Bag("Fish bag").add(Item("Ilish", 1200), Item("Rui", 450))
chili_bag = Bag("Chili bag").add(Item("Green chili", 40))
veg_bag = Bag("Vegetable bag").add(Item("Potato", 60), chili_bag)  # {{bagInBag}}
order = Bag("Jute bag").add(fish_bag, veg_bag, Item("Eggs", 150))

picked: BazarItem = veg_bag  # {{anyNode}}  # @step:pick
bill = picked.get_price()  # {{sameCall}}  # @step:call,done
`

const without = `
# {{withoutIntro}}
@dataclass
class Bag:
    items: list[Item]
    bags: list["Bag"]

def bill_total(order: Bag) -> int:
    total = 0
    for item in order.items: total += item.price  # {{loopLoose}}  # @step:l1-loop-1
    for bag in order.bags:
        for item in bag.items: total += item.price  # {{loopBags}}  # @step:l1-loop-2
        for inner in bag.bags:  # {{withoutCopy}}  # @step:l1-write-3
            for item in inner.items: total += item.price  # @step:l1-loop-3
            for deeper in inner.bags:  # {{copyAgain}}  # @step:l1-write-4
                for item in deeper.items: total += item.price  # @step:l1-loop-4
                # {{withoutTodo}}  # @step:l1-skip
    return total  # @step:l1-total

# {{withoutUse}}
bill = bill_total(mitus_order)  # @step:l1-call
charge(mitu, bill)  # {{shortBill}}  # @step:l1-result
`

const withPattern = `
# {{withAdd}}
@dataclass
class GiftBox(BazarItem):  # @step:build-class
    name: str
    children: list[BazarItem] = field(default_factory=list)
    WRAP_FEE = 50  # {{wrapFee}}

    def add(self, *items: BazarItem) -> "GiftBox":
        self.children.extend(items)
        return self

    def get_price(self) -> int:  # @step:build-sum
        total = self.WRAP_FEE  # @step:build-sum,gift-open
        for child in self.children:
            total += child.get_price()  # {{sameRecursion}}  # @step:build-sum,gift-child
        return total  # @step:build-sum,gift-total

# {{withSame}}
eid_box = GiftBox("Eid gift box").add(Item("Semai", 120), Item("Sugar", 140))  # @step:gift-make
order = Bag("Jute bag").add(eid_box, Item("Milk", 90))  # {{justAChild}}  # @step:gift-make
bill = order.get_price()  # {{billUnchanged}}  # @step:gift-call,gift-outer,gift-done

# {{withZero}}
`

export const python: CodeSet = {
  main: { filename: 'bazar.py', source: main },
  without: { filename: 'bazar_without_composite.py', source: without },
  with: { filename: 'bazar_with_composite.py', source: withPattern },
}
