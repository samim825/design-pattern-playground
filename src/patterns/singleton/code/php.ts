import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// PHP snippets start with <?php so the highlighter reads them as PHP, not HTML.

const main = `
<?php

// {{singleton}}
final class CashBox
{
    private static ?CashBox $instance = null; // {{theOne}}
    private int $total = 0;

    private function __construct() {} // {{noNew}} // @step:blocked

    public static function getInstance(): CashBox // @step:call
    {
        if (self::$instance === null) { // @step:check
            self::$instance = new CashBox(); // {{firstTime}} // @step:create
        }
        return self::$instance; // @step:return
    }

    public function add(int $amount): void { $this->total += $amount; } // @step:add
    public function total(): int { return $this->total; }
}

// {{client}}
class Salesperson
{
    public function __construct(public string $name) {}

    public function ringUp(int $amount): void
    {
        $box = CashBox::getInstance(); // {{sameBox}} // @step:call
        $box->add($amount); // @step:add
    }
}

// {{usage}}
(new Salesperson('Rahim'))->ringUp(1500); // @step:sell
(new Salesperson('Mitu'))->ringUp(1200);
$karim->count(CashBox::getInstance()->total()); // @step:count,done
`

const without = `
<?php

// {{withoutIntro}}
class CashBox
{
    public int $total = 0;
    public function add(int $amount): void { $this->total += $amount; } // @step:l1-add
}

$shopBox = new CashBox(); // {{withoutGlobal}} // @step:l1-open

$rahim->box = $shopBox; // @step:l1-shared
$mitu->box = new CashBox(); // {{withoutAnyone}} // @step:l1-new
$seller->box->add($sale->amount); // @step:l1-add

// {{withoutTodo}} // @step:l1-todo
$karim->count($shopBox->total); // @step:l1-count
`

const withPattern = `
<?php

// {{withAdd}}
class BkashCounter // @step:build-counter
{
    public function receive(int $amount): void // @step:b-receive
    {
        $box = CashBox::getInstance(); // {{sameBox}} // @step:build-counter,b-call
        $box->add($amount); // @step:b-add
    }
}

// {{withSame}}
(new BkashCounter())->receive(2000); // @step:b-start
$karim->count(CashBox::getInstance()->total()); // @step:b-count,b-done
`

export const php: CodeSet = {
  main: { filename: 'CashBox.php', source: main },
  without: { filename: 'CashBoxWithoutSingleton.php', source: without },
  with: { filename: 'CashBoxWithSingleton.php', source: withPattern },
}
