import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Swift: a "static let" is created lazily, exactly once and thread-safely, so that one line is the whole getInstance().

const main = `
// {{singleton}}
final class CashBox {
    // {{theOne}}
    static let shared = CashBox() // {{firstTime}} // @step:call,check,create,return
    private(set) var total = 0

    private init() {} // {{noNew}} // @step:blocked

    func add(_ amount: Int) { total += amount } // @step:add
}

// {{client}}
struct Salesperson {
    let name: String

    func ringUp(_ amount: Int) {
        let box = CashBox.shared // {{sameBox}} // @step:call
        box.add(amount) // @step:add
    }
}

// {{usage}}
Salesperson(name: "Rahim").ringUp(1500) // @step:sell
Salesperson(name: "Mitu").ringUp(1200)
karim.count(CashBox.shared.total) // @step:count,done
`

const without = `
// {{withoutIntro}}
final class CashBox {
    private(set) var total = 0
    func add(_ amount: Int) { total += amount } // @step:l1-add
}

let shopBox = CashBox() // {{withoutGlobal}} // @step:l1-open

rahim.box = shopBox // @step:l1-shared
mitu.box = CashBox() // {{withoutAnyone}} // @step:l1-new
seller.box.add(sale.amount) // @step:l1-add

// {{withoutTodo}} // @step:l1-todo
karim.count(shopBox.total) // @step:l1-count
`

const withPattern = `
// {{withAdd}}
struct BkashCounter { // @step:build-counter
    func receive(_ amount: Int) { // @step:b-receive
        let box = CashBox.shared // {{sameBox}} // @step:build-counter,b-call
        box.add(amount) // @step:b-add
    }
}

// {{withSame}}
BkashCounter().receive(2000) // @step:b-start
karim.count(CashBox.shared.total) // @step:b-count,b-done
`

export const swift: CodeSet = {
  main: { filename: 'CashBox.swift', source: main },
  without: { filename: 'CashBoxWithoutSingleton.swift', source: without },
  with: { filename: 'CashBoxWithSingleton.swift', source: withPattern },
}
