import type { CodeSet } from '@/types/pattern'

/*
 * Conventions (see CLAUDE.md):
 *   // {{key}}        → translated comment from content.<lang>.ts → codeComments[key]
 *   // @step:a,b      → this line lights up while visual step a or b runs (stripped on display)
 */

const main = `
// {{component}}
interface BazarItem {
  readonly name: string;
  getPrice(): number;
}

// {{leaf}}
class Item implements BazarItem {
  constructor(readonly name: string, private readonly price: number) {}

  getPrice() {
    return this.price; // {{leafPrice}} // @step:leaf
  }
}

// {{composite}}
class Bag implements BazarItem {
  private readonly children: BazarItem[] = [];
  constructor(readonly name: string) {}

  add(...items: BazarItem[]) { // {{anyChild}}
    this.children.push(...items);
    return this;
  }

  getPrice() {
    let sum = 0; // @step:open
    for (const child of this.children) {
      sum += child.getPrice(); // {{recurse}} // @step:recurse
    }
    return sum; // {{bagTotal}} // @step:bag-total
  }
}

// {{usage}}
const fishBag = new Bag('Fish bag').add(new Item('Ilish', 1200), new Item('Rui', 450));
const chiliBag = new Bag('Chili bag').add(new Item('Green chili', 40));
const vegBag = new Bag('Vegetable bag').add(new Item('Potato', 60), chiliBag); // {{bagInBag}}
const order = new Bag('Jute bag').add(fishBag, vegBag, new Item('Eggs', 150));

const picked: BazarItem = vegBag; // {{anyNode}} // @step:pick
const bill = picked.getPrice(); // {{sameCall}} // @step:call,done
`

const without = `
// {{withoutIntro}}
interface Item { name: string; price: number }
interface Bag { items: Item[]; bags: Bag[] }

function billTotal(order: Bag): number {
  let sum = 0;
  for (const item of order.items) sum += item.price; // {{loopLoose}} // @step:l1-loop-1
  for (const bag of order.bags) {
    for (const item of bag.items) sum += item.price; // {{loopBags}} // @step:l1-loop-2
    for (const inner of bag.bags) { // {{withoutCopy}} // @step:l1-write-3
      for (const item of inner.items) sum += item.price; // @step:l1-loop-3
      for (const deeper of inner.bags) { // {{copyAgain}} // @step:l1-write-4
        for (const item of deeper.items) sum += item.price; // @step:l1-loop-4
        // {{withoutTodo}} // @step:l1-skip
      }
    }
  }
  return sum; // @step:l1-total
}

// {{withoutUse}}
const bill = billTotal(mitusOrder); // @step:l1-call
charge(mitu, bill); // {{shortBill}} // @step:l1-result
`

const withPattern = `
// {{withAdd}}
class GiftBox implements BazarItem { // @step:build-class
  private readonly children: BazarItem[] = [];
  private readonly wrapFee = 50; // {{wrapFee}}
  constructor(readonly name: string) {}

  add(...items: BazarItem[]) {
    this.children.push(...items);
    return this;
  }

  getPrice() { // @step:build-sum
    let sum = this.wrapFee; // @step:build-sum,gift-open
    for (const child of this.children) {
      sum += child.getPrice(); // {{sameRecursion}} // @step:build-sum,gift-child
    }
    return sum; // @step:build-sum,gift-total
  }
}

// {{withSame}}
const eidBox = new GiftBox('Eid gift box').add(new Item('Semai', 120), new Item('Sugar', 140)); // @step:gift-make
const order = new Bag('Jute bag').add(eidBox, new Item('Milk', 90)); // {{justAChild}} // @step:gift-make
const bill = order.getPrice(); // {{billUnchanged}} // @step:gift-call,gift-outer,gift-done

// {{withZero}}
`

export const ts: CodeSet = {
  main: { filename: 'bazar.ts', source: main },
  without: { filename: 'bazar-without-composite.ts', source: without },
  with: { filename: 'bazar-with-composite.ts', source: withPattern },
}
