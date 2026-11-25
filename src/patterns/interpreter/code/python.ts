import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
# {{context}}
@dataclass(frozen=True)
class Cart:
    total: int
    category: str


# {{abstract}}
class Rule(ABC):
    @abstractmethod
    def interpret(self, cart: Cart) -> bool: ...


# {{terminal}}
@dataclass(frozen=True)
class TotalAbove(Rule):
    amount: int

    def interpret(self, cart: Cart) -> bool:
        return cart.total > self.amount  # {{readsTotal}} # @step:total


@dataclass(frozen=True)
class CategoryIs(Rule):
    name: str

    def interpret(self, cart: Cart) -> bool:
        return cart.category == self.name  # {{readsCategory}} # @step:category


# {{nonterminal}}
@dataclass(frozen=True)
class And(Rule):
    left: Rule  # {{holdsRules}}
    right: Rule

    def interpret(self, cart: Cart) -> bool:
        return (self.left.interpret(cart)  # {{asksLeft}} # @step:and-left
                and self.right.interpret(cart))  # {{shortCircuit}} # @step:and-combine


# {{client}}
def checkout(cart: Cart, rule: Rule, percent: int) -> float:
    ok = rule.interpret(cart)  # {{oneCall}} # @step:interpret
    return cart.total * (100 - percent) / 100 if ok else cart.total  # {{payOrNot}} # @step:result


rule = And(CategoryIs("saree"), TotalAbove(3000))  # {{buildTree}} # @step:build
checkout(Cart(3450, "saree"), rule, 10)
`

const without = `
# {{withoutIntro}}
def checkout(cart: Cart) -> float:  # {{everyRuleHere}} # @step:l1-rule,l1-cart
    percent = 0  # @step:l1-none
    if cart.total > 5000:  # {{orderMatters}} # @step:l1-big
        percent = 15
    elif cart.category == "saree" and cart.total > 3000:  # @step:l1-saree
        percent = 10
    elif cart.category == "panjabi" and cart.total > 2000:  # @step:l1-panjabi
        percent = 5
    return cart.total * (100 - percent) / 100  # @step:l1-pay


# {{redeploy}}
deploy(billing_app)  # @step:l1-deploy
# {{withoutNext}}
`

const withPattern = `
# {{withAdd}}
@dataclass(frozen=True)
class Or(Rule):  # {{sameInterface}} # @step:build-class
    left: Rule
    right: Rule

    def interpret(self, cart: Cart) -> bool:
        return (self.left.interpret(cart)  # {{recursive}} # @step:build-recursive,or-left
                or self.right.interpret(cart))  # {{orShort}} # @step:or-combine


# {{othersSame}}
class And(Rule): ...  # @step:and-left,and-combine
class TotalAbove(Rule): ...  # @step:total
class CategoryIs(Rule): ...  # @step:category

# {{withUse}}
eid = Or(  # {{nested}} # @step:l3-build
    And(CategoryIs("saree"), TotalAbove(3000)),
    TotalAbove(5000),
)
ok = eid.interpret(cart)  # {{sameCall}} # @step:interpret
price = cart.total * 0.9 if ok else cart.total  # @step:result
# {{withZero}}
`

export const python: CodeSet = {
  main: { filename: 'discount_rules.py', source: main },
  without: { filename: 'checkout_without_interpreter.py', source: without },
  with: { filename: 'discount_with_or.py', source: withPattern },
}
