import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
// {{component}}
interface BazarItem {
    String name();
    int getPrice();
}

// {{leaf}}
record Item(String name, int price) implements BazarItem {
    @Override public int getPrice() {
        return price; // {{leafPrice}} // @step:leaf
    }
}

// {{composite}}
class Bag implements BazarItem {
    private final String name;
    private final List<BazarItem> children = new ArrayList<>();
    Bag(String name) { this.name = name; }

    Bag add(BazarItem... items) { // {{anyChild}}
        children.addAll(List.of(items));
        return this;
    }

    @Override public String name() { return name; }

    @Override public int getPrice() {
        int sum = 0; // @step:open
        for (BazarItem child : children) {
            sum += child.getPrice(); // {{recurse}} // @step:recurse
        }
        return sum; // {{bagTotal}} // @step:bag-total
    }
}

// {{usage}}
Bag fishBag = new Bag("Fish bag").add(new Item("Ilish", 1200), new Item("Rui", 450));
Bag chiliBag = new Bag("Chili bag").add(new Item("Green chili", 40));
Bag vegBag = new Bag("Vegetable bag").add(new Item("Potato", 60), chiliBag); // {{bagInBag}}
Bag order = new Bag("Jute bag").add(fishBag, vegBag, new Item("Eggs", 150));

BazarItem picked = vegBag; // {{anyNode}} // @step:pick
int bill = picked.getPrice(); // {{sameCall}} // @step:call,done
`

const without = `
// {{withoutIntro}}
record Item(String name, int price) {}
record Bag(List<Item> items, List<Bag> bags) {}

static int billTotal(Bag order) {
    int sum = 0;
    for (Item item : order.items()) sum += item.price(); // {{loopLoose}} // @step:l1-loop-1
    for (Bag bag : order.bags()) {
        for (Item item : bag.items()) sum += item.price(); // {{loopBags}} // @step:l1-loop-2
        for (Bag inner : bag.bags()) { // {{withoutCopy}} // @step:l1-write-3
            for (Item item : inner.items()) sum += item.price(); // @step:l1-loop-3
            for (Bag deeper : inner.bags()) { // {{copyAgain}} // @step:l1-write-4
                for (Item item : deeper.items()) sum += item.price(); // @step:l1-loop-4
                // {{withoutTodo}} // @step:l1-skip
            }
        }
    }
    return sum; // @step:l1-total
}

// {{withoutUse}}
int bill = billTotal(mitusOrder); // @step:l1-call
charge(mitu, bill); // {{shortBill}} // @step:l1-result
`

const withPattern = `
// {{withAdd}}
class GiftBox implements BazarItem { // @step:build-class
    private static final int WRAP_FEE = 50; // {{wrapFee}}
    private final String name;
    private final List<BazarItem> children = new ArrayList<>();
    GiftBox(String name) { this.name = name; }

    GiftBox add(BazarItem... items) { children.addAll(List.of(items)); return this; }
    @Override public String name() { return name; }

    @Override public int getPrice() { // @step:build-sum
        int sum = WRAP_FEE; // @step:build-sum,gift-open
        for (BazarItem child : children) {
            sum += child.getPrice(); // {{sameRecursion}} // @step:build-sum,gift-child
        }
        return sum; // @step:build-sum,gift-total
    }
}

// {{withSame}}
GiftBox eidBox = new GiftBox("Eid gift box").add(new Item("Semai", 120), new Item("Sugar", 140)); // @step:gift-make
Bag order = new Bag("Jute bag").add(eidBox, new Item("Milk", 90)); // {{justAChild}} // @step:gift-make
int bill = order.getPrice(); // {{billUnchanged}} // @step:gift-call,gift-outer,gift-done

// {{withZero}}
`

export const java: CodeSet = {
  main: { filename: 'Bazar.java', source: main },
  without: { filename: 'BazarWithoutComposite.java', source: without },
  with: { filename: 'BazarWithComposite.java', source: withPattern },
}
