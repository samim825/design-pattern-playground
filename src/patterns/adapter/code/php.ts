import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// PHP snippets start with <?php so the highlighter reads them as PHP, not HTML.

const main = `
<?php

// {{target}}
interface PaymentProcessor
{
    public function pay(float $amount): Receipt;
}

// {{existing}}
class BkashProcessor implements PaymentProcessor
{
    public function pay(float $amount): Receipt { return Bkash::charge($amount); } // @step:bkash-pay
}

// {{adapter}}
class PadmaBankAdapter implements PaymentProcessor
{
    // {{adaptee}}
    public function __construct(private PadmaBankSdk $sdk) {}

    public function pay(float $amount): Receipt // @step:adapter-pay
    {
        $res = $this->sdk->makeTransfer([ // {{translateCall}} // @step:translate
            'amountInPaisa' => (int) round($amount * 100), // {{toPaisa}} // @step:to-paisa
            'currency' => 'BDT',
            'ref' => newRef(),
        ]);
        if ($res['status'] !== 'OK') throw new PaymentException(); // @step:check-status
        return new Receipt('Padma Bank', $amount, $res['txnId']); // {{toReceipt}} // @step:to-receipt
    }
}

// {{client}}
class Checkout
{
    public function __construct(private PaymentProcessor $processor) {}

    public function pay(float $amount): Receipt
    {
        return $this->processor->pay($amount); // {{onlyTarget}} // @step:client-pay
    }
}

// {{usage}}
$checkout = new Checkout(processorFor($order)); // @step:wire
$receipt = $checkout->pay($order->total); // @step:order,done
`

const without = `
<?php

// {{withoutIntro}}
function checkout(Order $order): Receipt // @step:l1-call
{
    $res = $padma->makeTransfer([ // {{withoutShape}} // @step:l1-method
        'amountInPaisa' => (int) round($order->total * 100), // {{withoutPaisa}} // @step:l1-amount
        'currency' => 'BDT',
        'ref' => $order->id,
    ]);
    if ($res['status'] !== 'OK') throw new PaymentException(); // @step:l1-result
    return new Receipt('Padma Bank', $order->total, $res['txnId']); // @step:l1-check
}
// {{withoutTodo}} // @step:l1-todo
`

const withPattern = `
<?php

// {{withAdd}}
class JamunaWalletAdapter implements PaymentProcessor // @step:build-adapter
{
    public function __construct(private JamunaWalletSdk $wallet) {}

    public function pay(float $amount): Receipt // @step:j-pay
    {
        $ok = $this->wallet->debit(number_format($amount, 2, '.', ''), 'BDT'); // {{toText}} // @step:build-adapter,j-translate
        if (!$ok) throw new PaymentException(); // @step:j-check
        return new Receipt('Jamuna Wallet', $amount, newRef()); // @step:j-receipt
    }
}

// {{withSame}}
$checkout = new Checkout(new JamunaWalletAdapter(new JamunaWalletSdk())); // @step:j-wire
$checkout->pay(780); // @step:j-order,j-done
`

export const php: CodeSet = {
  main: { filename: 'Payments.php', source: main },
  without: { filename: 'PaymentsWithoutAdapter.php', source: without },
  with: { filename: 'PaymentsWithAdapter.php', source: withPattern },
}
