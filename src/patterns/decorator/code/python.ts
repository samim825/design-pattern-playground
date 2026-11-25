import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Python: Topping is a dataclass holding the wrapped Snack, so every topping gets the same
// __init__(inner) for free.

const main = `
from abc import ABC, abstractmethod
from dataclasses import dataclass

# {{component}}
class Snack(ABC):
    @abstractmethod
    def cost(self) -> int: ...

    @abstractmethod
    def describe(self) -> str: ...

# {{concrete}}
class Fuchka(Snack):
    def cost(self) -> int: return 60  # {{basePrice}}  # @step:core
    def describe(self) -> str: return "Fuchka"  # @step:describe

# {{decorator}}
@dataclass
class Topping(Snack, ABC):
    inner: Snack  # {{wrapsAny}}  # @step:wrap-egg,wrap-chanachur,wrap-spicy

# {{concreteDecorators}}
class Egg(Topping):
    def cost(self) -> int: return self.inner.cost() + 20  # {{passIn}}  # @step:in-egg,out-egg
    def describe(self) -> str: return self.inner.describe() + " + egg"  # @step:describe

class Chanachur(Topping):
    def cost(self) -> int: return self.inner.cost() + 10  # @step:in-chanachur,out-chanachur
    def describe(self) -> str: return self.inner.describe() + " + chanachur"  # @step:describe

class ExtraSpicy(Topping):
    def cost(self) -> int: return self.inner.cost() + 5  # @step:in-spicy,out-spicy
    def describe(self) -> str: return self.inner.describe() + " + extra spicy"  # @step:describe

# {{usage}}
plate: Snack = Fuchka()  # @step:base
plate = Egg(plate)  # {{wrapLayer}}  # @step:wrap-egg
plate = Chanachur(plate)  # @step:wrap-chanachur
plate = ExtraSpicy(plate)  # @step:wrap-spicy

total = plate.cost()  # {{oneCall}}  # @step:call,done
receipt = plate.describe()  # {{sameTrip}}  # @step:describe
`

const without = `
# {{withoutIntro}}
class Fuchka:
    def cost(self) -> int: return 60
    def describe(self) -> str: return "Fuchka"

class FuchkaWithEgg(Fuchka):
    def cost(self) -> int: return 80  # {{hardcoded}}  # @step:l1-cost
    def describe(self) -> str: return "Fuchka + egg"  # @step:l1-describe

class FuchkaWithSpicy(Fuchka):
    def cost(self) -> int: return 65  # @step:l1-cost
    def describe(self) -> str: return "Fuchka + extra spicy"  # @step:l1-describe

# {{withoutCopy}}
class FuchkaWithEggAndSpicy(Fuchka):  # @step:l1-write
    def cost(self) -> int: return 85  # {{copyPrice}}  # @step:l1-cost
    def describe(self) -> str: return "Fuchka + egg + extra spicy"  # @step:l1-describe

# {{withoutPick}}
plate = FuchkaWithEggAndSpicy()  # @step:l1-pick
serve(karim, plate.describe(), plate.cost())  # @step:l1-serve,l1-result
# {{withoutTodo}}  # @step:l1-count
`

const withPattern = `
# {{withAdd}}
class TokDoi(Topping):  # @step:build-class
    def cost(self) -> int: return self.inner.cost() + 30  # {{onlyNew}}  # @step:build-cost,in-tokdoi,out-tokdoi
    def describe(self) -> str: return self.inner.describe() + " + tok-doi"  # @step:build-cost,describe-new

# {{withSame}}
plate: Snack = Fuchka()  # @step:base-new
plate = TokDoi(plate)  # {{justWrap}}  # @step:wrap-tokdoi
plate = Chanachur(plate)  # {{oldStillWork}}  # @step:wrap-old

total = plate.cost()  # {{costUnchanged}}  # @step:call-new,inner-old,done-new
receipt = plate.describe()  # @step:describe-new

# {{withZero}}
`

export const python: CodeSet = {
  main: { filename: 'fuchka.py', source: main },
  without: { filename: 'fuchka_without_decorator.py', source: without },
  with: { filename: 'fuchka_with_decorator.py', source: withPattern },
}
