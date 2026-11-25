import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
<?php
// {{component}}
interface BazarItem
{
    public function getPrice(): int;
}

// {{leaf}}
readonly class Item implements BazarItem
{
    public function __construct(public string $name, private int $price) {}

    public function getPrice(): int
    {
        return $this->price; // {{leafPrice}} // @step:leaf
    }
}

// {{composite}}
class Bag implements BazarItem
{
    /** @var BazarItem[] */
    private array $children = [];

    public function __construct(public readonly string $name) {}

    public function add(BazarItem ...$items): static // {{anyChild}}
    {
        array_push($this->children, ...$items);
        return $this;
    }

    public function getPrice(): int
    {
        $sum = 0; // @step:open
        foreach ($this->children as $child) {
            $sum += $child->getPrice(); // {{recurse}} // @step:recurse
        }
        return $sum; // {{bagTotal}} // @step:bag-total
    }
}

// {{usage}}
$fishBag = (new Bag('Fish bag'))->add(new Item('Ilish', 1200), new Item('Rui', 450));
$chiliBag = (new Bag('Chili bag'))->add(new Item('Green chili', 40));
$vegBag = (new Bag('Vegetable bag'))->add(new Item('Potato', 60), $chiliBag); // {{bagInBag}}
$order = (new Bag('Jute bag'))->add($fishBag, $vegBag, new Item('Eggs', 150));

$picked = $vegBag; // {{anyNode}} // @step:pick
$bill = $picked->getPrice(); // {{sameCall}} // @step:call,done
`

const without = `
<?php
// {{withoutIntro}}
function billTotal(array $order): int
{
    $sum = 0;
    foreach ($order['items'] as $item) $sum += $item['price']; // {{loopLoose}} // @step:l1-loop-1
    foreach ($order['bags'] as $bag) {
        foreach ($bag['items'] as $item) $sum += $item['price']; // {{loopBags}} // @step:l1-loop-2
        foreach ($bag['bags'] as $inner) { // {{withoutCopy}} // @step:l1-write-3
            foreach ($inner['items'] as $item) $sum += $item['price']; // @step:l1-loop-3
            foreach ($inner['bags'] as $deeper) { // {{copyAgain}} // @step:l1-write-4
                foreach ($deeper['items'] as $item) $sum += $item['price']; // @step:l1-loop-4
                // {{withoutTodo}} // @step:l1-skip
            }
        }
    }
    return $sum; // @step:l1-total
}

// {{withoutUse}}
$bill = billTotal($mitusOrder); // @step:l1-call
charge($mitu, $bill); // {{shortBill}} // @step:l1-result
`

const withPattern = `
<?php
// {{withAdd}}
class GiftBox implements BazarItem // @step:build-class
{
    private const WRAP_FEE = 50; // {{wrapFee}}
    private array $children = [];

    public function __construct(public readonly string $name) {}

    public function add(BazarItem ...$items): static
    {
        array_push($this->children, ...$items);
        return $this;
    }

    public function getPrice(): int // @step:build-sum
    {
        $sum = self::WRAP_FEE; // @step:build-sum,gift-open
        foreach ($this->children as $child) {
            $sum += $child->getPrice(); // {{sameRecursion}} // @step:build-sum,gift-child
        }
        return $sum; // @step:build-sum,gift-total
    }
}

// {{withSame}}
$eidBox = (new GiftBox('Eid gift box'))->add(new Item('Semai', 120), new Item('Sugar', 140)); // @step:gift-make
$order = (new Bag('Jute bag'))->add($eidBox, new Item('Milk', 90)); // {{justAChild}} // @step:gift-make
$bill = $order->getPrice(); // {{billUnchanged}} // @step:gift-call,gift-outer,gift-done

// {{withZero}}
`

export const php: CodeSet = {
  main: { filename: 'Bazar.php', source: main },
  without: { filename: 'BazarWithoutComposite.php', source: without },
  with: { filename: 'BazarWithComposite.php', source: withPattern },
}
