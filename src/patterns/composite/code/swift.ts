import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Swift prefers protocols over base classes: BazarItem is a protocol, Item is a struct, and
// Bag is a final class so bags can be filled step by step and shared inside other bags.

const main = `
// {{component}}
protocol BazarItem {
    var name: String { get }
    func getPrice() -> Int
}

// {{leaf}}
struct Item: BazarItem {
    let name: String
    let price: Int

    func getPrice() -> Int {
        price // {{leafPrice}} // @step:leaf
    }
}

// {{composite}}
final class Bag: BazarItem {
    let name: String
    private var children: [any BazarItem] = []
    init(_ name: String) { self.name = name }

    @discardableResult
    func add(_ items: any BazarItem...) -> Bag { // {{anyChild}}
        children += items
        return self
    }

    func getPrice() -> Int {
        var sum = 0 // @step:open
        for child in children {
            sum += child.getPrice() // {{recurse}} // @step:recurse
        }
        return sum // {{bagTotal}} // @step:bag-total
    }
}

// {{usage}}
let fishBag = Bag("Fish bag").add(Item(name: "Ilish", price: 1200), Item(name: "Rui", price: 450))
let chiliBag = Bag("Chili bag").add(Item(name: "Green chili", price: 40))
let vegBag = Bag("Vegetable bag").add(Item(name: "Potato", price: 60), chiliBag) // {{bagInBag}}
let order = Bag("Jute bag").add(fishBag, vegBag, Item(name: "Eggs", price: 150))

let picked: any BazarItem = vegBag // {{anyNode}} // @step:pick
let bill = picked.getPrice() // {{sameCall}} // @step:call,done
`

const without = `
// {{withoutIntro}}
struct Item { let name: String; let price: Int }
struct Bag { let items: [Item]; let bags: [Bag] }

func billTotal(_ order: Bag) -> Int {
    var sum = 0
    for item in order.items { sum += item.price } // {{loopLoose}} // @step:l1-loop-1
    for bag in order.bags {
        for item in bag.items { sum += item.price } // {{loopBags}} // @step:l1-loop-2
        for inner in bag.bags { // {{withoutCopy}} // @step:l1-write-3
            for item in inner.items { sum += item.price } // @step:l1-loop-3
            for deeper in inner.bags { // {{copyAgain}} // @step:l1-write-4
                for item in deeper.items { sum += item.price } // @step:l1-loop-4
                // {{withoutTodo}} // @step:l1-skip
            }
        }
    }
    return sum // @step:l1-total
}

// {{withoutUse}}
let bill = billTotal(mitusOrder) // @step:l1-call
charge(mitu, bill) // {{shortBill}} // @step:l1-result
`

const withPattern = `
// {{withAdd}}
final class GiftBox: BazarItem { // @step:build-class
    static let wrapFee = 50 // {{wrapFee}}
    let name: String
    private var children: [any BazarItem] = []
    init(_ name: String) { self.name = name }

    @discardableResult
    func add(_ items: any BazarItem...) -> GiftBox { children += items; return self }

    func getPrice() -> Int { // @step:build-sum
        var sum = Self.wrapFee // @step:build-sum,gift-open
        for child in children {
            sum += child.getPrice() // {{sameRecursion}} // @step:build-sum,gift-child
        }
        return sum // @step:build-sum,gift-total
    }
}

// {{withSame}}
let eidBox = GiftBox("Eid gift box").add(Item(name: "Semai", price: 120), Item(name: "Sugar", price: 140)) // @step:gift-make
let order = Bag("Jute bag").add(eidBox, Item(name: "Milk", price: 90)) // {{justAChild}} // @step:gift-make
let bill = order.getPrice() // {{billUnchanged}} // @step:gift-call,gift-outer,gift-done

// {{withZero}}
`

export const swift: CodeSet = {
  main: { filename: 'Bazar.swift', source: main },
  without: { filename: 'BazarWithoutComposite.swift', source: without },
  with: { filename: 'BazarWithComposite.swift', source: withPattern },
}
