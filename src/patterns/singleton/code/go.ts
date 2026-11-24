import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Go: an unexported type (other packages can't create one) plus sync.Once for the single instance.

const main = `
// {{singleton}}
type cashBox struct { // {{noNew}} // @step:blocked
    total int
}

var (
    instance *cashBox // {{theOne}}
    once     sync.Once
)

func GetInstance() *cashBox { // @step:call
    once.Do(func() { // @step:check
        instance = &cashBox{} // {{firstTime}} // @step:create
    })
    return instance // @step:return
}

func (b *cashBox) Add(amount int) { b.total += amount } // @step:add
func (b *cashBox) Total() int     { return b.total }

// {{client}}
type Salesperson struct{ Name string }

func (s Salesperson) RingUp(amount int) {
    box := GetInstance() // {{sameBox}} // @step:call
    box.Add(amount) // @step:add
}

// {{usage}}
Salesperson{"Rahim"}.RingUp(1500) // @step:sell
Salesperson{"Mitu"}.RingUp(1200)
karim.Count(GetInstance().Total()) // @step:count,done
`

const without = `
// {{withoutIntro}}
type CashBox struct{ Total int }

func (b *CashBox) Add(amount int) { b.Total += amount } // @step:l1-add

var shopBox = &CashBox{} // {{withoutGlobal}} // @step:l1-open

rahim.Box = shopBox // @step:l1-shared
mitu.Box = &CashBox{} // {{withoutAnyone}} // @step:l1-new
seller.Box.Add(sale.Amount) // @step:l1-add

// {{withoutTodo}} // @step:l1-todo
karim.Count(shopBox.Total) // @step:l1-count
`

const withPattern = `
// {{withAdd}}
type BkashCounter struct{} // @step:build-counter

func (BkashCounter) Receive(amount int) { // @step:b-receive
    box := GetInstance() // {{sameBox}} // @step:build-counter,b-call
    box.Add(amount) // @step:b-add
}

// {{withSame}}
BkashCounter{}.Receive(2000) // @step:b-start
karim.Count(GetInstance().Total()) // @step:b-count,b-done
`

export const go: CodeSet = {
  main: { filename: 'cash_box.go', source: main },
  without: { filename: 'cash_box_without_singleton.go', source: without },
  with: { filename: 'cash_box_with_singleton.go', source: withPattern },
}
