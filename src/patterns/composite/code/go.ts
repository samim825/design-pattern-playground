import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Go has no classes: the Component is an interface, and Item and Bag are plain structs that
// satisfy it implicitly. Go getters drop the "Get" prefix, so the method is Price().

const main = `
// {{component}}
type BazarItem interface {
    Name() string
    Price() int
}

// {{leaf}}
type Item struct {
    name  string
    price int
}

func (i Item) Name() string { return i.name }
func (i Item) Price() int {
    return i.price // {{leafPrice}} // @step:leaf
}

// {{composite}}
type Bag struct {
    name     string
    children []BazarItem
}

func NewBag(name string, items ...BazarItem) *Bag { // {{anyChild}}
    return &Bag{name: name, children: items}
}

func (b *Bag) Name() string { return b.name }
func (b *Bag) Price() int {
    sum := 0 // @step:open
    for _, child := range b.children {
        sum += child.Price() // {{recurse}} // @step:recurse
    }
    return sum // {{bagTotal}} // @step:bag-total
}

// {{usage}}
fishBag := NewBag("Fish bag", Item{"Ilish", 1200}, Item{"Rui", 450})
chiliBag := NewBag("Chili bag", Item{"Green chili", 40})
vegBag := NewBag("Vegetable bag", Item{"Potato", 60}, chiliBag) // {{bagInBag}}
order := NewBag("Jute bag", fishBag, vegBag, Item{"Eggs", 150})

var picked BazarItem = vegBag // {{anyNode}} // @step:pick
bill := picked.Price() // {{sameCall}} // @step:call,done
`

const without = `
// {{withoutIntro}}
type Item struct {
    Name  string
    Price int
}
type Bag struct {
    Items []Item
    Bags  []Bag
}

func BillTotal(order Bag) int {
    sum := 0
    for _, item := range order.Items { sum += item.Price } // {{loopLoose}} // @step:l1-loop-1
    for _, bag := range order.Bags {
        for _, item := range bag.Items { sum += item.Price } // {{loopBags}} // @step:l1-loop-2
        for _, inner := range bag.Bags { // {{withoutCopy}} // @step:l1-write-3
            for _, item := range inner.Items { sum += item.Price } // @step:l1-loop-3
            for _, deeper := range inner.Bags { // {{copyAgain}} // @step:l1-write-4
                for _, item := range deeper.Items { sum += item.Price } // @step:l1-loop-4
                // {{withoutTodo}} // @step:l1-skip
            }
        }
    }
    return sum // @step:l1-total
}

// {{withoutUse}}
bill := BillTotal(mitusOrder) // @step:l1-call
charge(mitu, bill) // {{shortBill}} // @step:l1-result
`

const withPattern = `
// {{withAdd}}
type GiftBox struct { // @step:build-class
    name     string
    children []BazarItem
}

const wrapFee = 50 // {{wrapFee}}

func NewGiftBox(name string, items ...BazarItem) *GiftBox {
    return &GiftBox{name: name, children: items}
}

func (g *GiftBox) Name() string { return g.name }
func (g *GiftBox) Price() int { // @step:build-sum
    sum := wrapFee // @step:build-sum,gift-open
    for _, child := range g.children {
        sum += child.Price() // {{sameRecursion}} // @step:build-sum,gift-child
    }
    return sum // @step:build-sum,gift-total
}

// {{withSame}}
eidBox := NewGiftBox("Eid gift box", Item{"Semai", 120}, Item{"Sugar", 140}) // @step:gift-make
order := NewBag("Jute bag", eidBox, Item{"Milk", 90}) // {{justAChild}} // @step:gift-make
bill := order.Price() // {{billUnchanged}} // @step:gift-call,gift-outer,gift-done

// {{withZero}}
`

export const go: CodeSet = {
  main: { filename: 'bazar.go', source: main },
  without: { filename: 'bazar_without_composite.go', source: without },
  with: { filename: 'bazar_with_composite.go', source: withPattern },
}
