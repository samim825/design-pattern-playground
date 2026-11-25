import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
<?php
// {{command}}
interface OrderCommand
{
    public function price(): int; // {{slipPrice}}
    public function execute(): void; // {{doIt}}
    public function undo(): void; // {{undoIt}}
}

// {{receiver}}
class Kitchen
{
    public function cook(string $dish, int $table): void { /* … */ } // {{realWork}} // @step:cook
    public function takeBack(string $dish, int $table): void { /* … */ } // @step:uncook
    public function addChili(string $dish, int $table): void { /* … */ }
    public function removeChili(string $dish, int $table): void { /* … */ }
}

// {{concrete}}
final readonly class CookDishCommand implements OrderCommand
{
    public function __construct(
        private Kitchen $kitchen, // {{holdsReceiver}}
        private string $dish,
        private int $table,
        private int $price,
    ) {}

    public function price(): int { return $this->price; }
    public function execute(): void
    {
        $this->kitchen->cook($this->dish, $this->table); // {{delegates}} // @step:exec
    }
    public function undo(): void
    {
        $this->kitchen->takeBack($this->dish, $this->table); // {{reverses}} // @step:undo-exec
    }
}

// {{invoker}}
final class OrderRail
{
    private array $queue = []; // {{queueField}}
    private array $history = []; // {{historyField}} // @step:tear

    public function pin(OrderCommand $slip): void
    {
        $this->queue[] = $slip; // {{waits}} // @step:pin
    }
    public function runNext(): void
    {
        $slip = array_shift($this->queue); // {{inOrder}} // @step:run
        if ($slip === null) return;
        $slip->execute(); // {{blind}} // @step:run
        $this->history[] = $slip; // {{remember}} // @step:cook
    }
    public function undoLast(): void
    {
        array_pop($this->history)?->undo(); // {{lastFirst}} // @step:undo
    }
    public function bill(): int
    {
        return array_sum(array_map(fn ($s) => $s->price(), $this->history)); // {{billFromHistory}} // @step:bill
    }
}

// {{client}}
$kitchen = new Kitchen();
$rail = new OrderRail();
$rail->pin(new CookDishCommand($kitchen, 'kacchi', 4, 350)); // {{writeSlip}} // @step:write
$rail->runNext(); // {{railRuns}} // @step:run
$rail->undoLast(); // {{cancelIsUndo}} // @step:cancel
`

const without = `
<?php
// {{withoutIntro}}
class Waiter
{
    private int $bill = 0; // {{billInHead}}

    public function __construct(private Kitchen $kitchen) {} // {{knowsKitchen}}

    public function takeOrder(string $dish, int $table, int $price): void // @step:l1-order
    {
        match ($dish) {
            'kacchi' => $this->kitchen->cookKacchi($table), // {{shoutNow}} // @step:l1-kacchi
            'roast' => $this->kitchen->cookRoast($table), // @step:l1-roast
            default => $this->kitchen->serveCold($dish, $table), // {{busyLost}} // @step:l1-cold
        };
        $this->bill += $price; // @step:l1-bill
    }

    public function cancel(string $dish, int $table, int $price): void // {{noRecord}} // @step:l1-cancel
    {
        $this->kitchen->throwAway($dish, $table); // {{hopeRight}} // @step:l1-undo
        $this->bill -= $price; // {{fixByHand}} // @step:l1-bill
    }
}
// {{withoutCopy}} // @step:l1-copy
`

const withPattern = `
<?php
// {{withAdd}}
final readonly class MakeSpicyCommand implements OrderCommand // {{sameInterface}} // @step:build-class
{
    public function __construct(
        private Kitchen $kitchen, // {{askReceiver}} // @step:build-receiver
        private string $dish,
        private int $table,
    ) {}

    public function price(): int { return 20; } // {{chiliPrice}}
    public function execute(): void
    {
        $this->kitchen->addChili($this->dish, $this->table); // {{chiliOn}} // @step:spicy-exec
    }
    public function undo(): void
    {
        $this->kitchen->removeChili($this->dish, $this->table); // {{chiliOff}} // @step:spicy-undo
    }
}

// {{othersSame}}
final class OrderRail { /* … */ } // @step:rail-same
final readonly class CookDishCommand implements OrderCommand { /* … */ } // @step:cook-same

// {{withUse}}
$rail->pin(new CookDishCommand($kitchen, 'kacchi', 4, 350)); // @step:l3-order
$rail->pin(new MakeSpicyCommand($kitchen, 'kacchi', 4)); // {{newSlip}} // @step:l3-spicy
$rail->runNext(); // {{sameRail}} // @step:l3-run
$rail->undoLast(); // {{tooHot}} // @step:l3-undo
// {{withZero}}
`

export const php: CodeSet = {
  main: { filename: 'OrderRail.php', source: main },
  without: { filename: 'OrdersWithoutCommand.php', source: without },
  with: { filename: 'OrdersWithCommand.php', source: withPattern },
}
