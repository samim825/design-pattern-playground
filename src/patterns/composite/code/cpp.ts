import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
// {{component}}
class BazarItem {
public:
    virtual ~BazarItem() = default;
    virtual int getPrice() const = 0;
};

// {{leaf}}
class Item : public BazarItem {
    std::string name;
    int price;
public:
    Item(std::string n, int p) : name(std::move(n)), price(p) {}
    int getPrice() const override {
        return price; // {{leafPrice}} // @step:leaf
    }
};

// {{composite}}
class Bag : public BazarItem {
    std::string name;
    std::vector<std::unique_ptr<BazarItem>> children;
public:
    explicit Bag(std::string n) : name(std::move(n)) {}

    void add(std::unique_ptr<BazarItem> item) { children.push_back(std::move(item)); } // {{anyChild}}

    int getPrice() const override {
        int sum = 0; // @step:open
        for (const auto& child : children) {
            sum += child->getPrice(); // {{recurse}} // @step:recurse
        }
        return sum; // {{bagTotal}} // @step:bag-total
    }
};

// {{usage}}
auto chiliBag = std::make_unique<Bag>("Chili bag");
chiliBag->add(std::make_unique<Item>("Green chili", 40));
auto vegBag = std::make_unique<Bag>("Vegetable bag");
vegBag->add(std::make_unique<Item>("Potato", 60));
vegBag->add(std::move(chiliBag)); // {{bagInBag}}

const BazarItem& picked = *vegBag; // {{anyNode}} // @step:pick
int bill = picked.getPrice(); // {{sameCall}} // @step:call,done
`

const without = `
// {{withoutIntro}}
struct Item { std::string name; int price; };
struct Bag { std::vector<Item> items; std::vector<Bag> bags; };

int billTotal(const Bag& order) {
    int sum = 0;
    for (const auto& item : order.items) sum += item.price; // {{loopLoose}} // @step:l1-loop-1
    for (const auto& bag : order.bags) {
        for (const auto& item : bag.items) sum += item.price; // {{loopBags}} // @step:l1-loop-2
        for (const auto& inner : bag.bags) { // {{withoutCopy}} // @step:l1-write-3
            for (const auto& item : inner.items) sum += item.price; // @step:l1-loop-3
            for (const auto& deeper : inner.bags) { // {{copyAgain}} // @step:l1-write-4
                for (const auto& item : deeper.items) sum += item.price; // @step:l1-loop-4
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
class GiftBox : public BazarItem { // @step:build-class
    static constexpr int wrapFee = 50; // {{wrapFee}}
    std::string name;
    std::vector<std::unique_ptr<BazarItem>> children;
public:
    explicit GiftBox(std::string n) : name(std::move(n)) {}
    void add(std::unique_ptr<BazarItem> item) { children.push_back(std::move(item)); }

    int getPrice() const override { // @step:build-sum
        int sum = wrapFee; // @step:build-sum,gift-open
        for (const auto& child : children) {
            sum += child->getPrice(); // {{sameRecursion}} // @step:build-sum,gift-child
        }
        return sum; // @step:build-sum,gift-total
    }
};

// {{withSame}}
auto eidBox = std::make_unique<GiftBox>("Eid gift box"); // @step:gift-make
eidBox->add(std::make_unique<Item>("Semai", 120));
order.add(std::move(eidBox)); // {{justAChild}} // @step:gift-make
int bill = order.getPrice(); // {{billUnchanged}} // @step:gift-call,gift-outer,gift-done

// {{withZero}}
`

export const cpp: CodeSet = {
  main: { filename: 'bazar.cpp', source: main },
  without: { filename: 'bazar_without_composite.cpp', source: without },
  with: { filename: 'bazar_with_composite.cpp', source: withPattern },
}
