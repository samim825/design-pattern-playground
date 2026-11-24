import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// PHP snippets start with <?php so the highlighter reads them as PHP, not HTML.

const main = `
<?php

readonly class Receipt
{
    public function __construct(
        public string $method, public float $amount, public float $fee, public float $total,
    ) {}
}

// {{interface}}
interface PaymentStrategy
{
    public function pay(float $amount): Receipt;
}

class BkashPayment implements PaymentStrategy
{
    public function pay(float $amount): Receipt
    {
        $fee = $amount * 0.0185; // {{bkashFee}} // @step:bkash-fee
        verifyOtp($customer->phone); // @step:bkash-otp
        confirmPin($customer->phone); // @step:bkash-pin
        return new Receipt('bKash', $amount, $fee, $amount + $fee); // @step:bkash-receipt
    }
}

class NagadPayment implements PaymentStrategy
{
    public function pay(float $amount): Receipt
    {
        $fee = $amount * 0.01; // {{nagadFee}} // @step:nagad-fee
        verifyOtp($customer->phone); // @step:nagad-otp
        return new Receipt('Nagad', $amount, $fee, $amount + $fee); // @step:nagad-receipt
    }
}

class CardPayment implements PaymentStrategy
{
    public function pay(float $amount): Receipt
    {
        $fee = $amount * 0.025; // {{cardFee}} // @step:card-fee
        run3DSecure($customer->card); // @step:card-3ds
        authorizeWithBank($customer->card, $amount + $fee); // @step:card-bank
        return new Receipt('Card', $amount, $fee, $amount + $fee); // @step:card-receipt
    }
}

// {{context}}
class Checkout
{
    public function __construct(private PaymentStrategy $strategy) {}

    // {{swap}}
    public function setStrategy(PaymentStrategy $strategy): void
    {
        $this->strategy = $strategy; // @step:set-strategy
    }

    public function pay(float $amount): Receipt
    {
        // {{delegate}}
        return $this->strategy->pay($amount); // @step:delegate
    }
}

// {{usage}}
$checkout = new Checkout(new BkashPayment());
$checkout->setStrategy($selectedMethod); // @step:set-strategy
$receipt = $checkout->pay(1250); // @step:client-pay,done
`

const without = `
<?php

// {{withoutIntro}}
function checkout(float $amount, string $method): Receipt // @step:l1-start
{
    switch ($method) {
        case 'bkash': // @step:l1-bkash
            $fee = $amount * 0.0185;
            verifyOtp($customer->phone); // @step:l1-bkash-otp
            confirmPin($customer->phone); // @step:l1-bkash-pin
            break;
        case 'nagad': // @step:l1-nagad
            $fee = $amount * 0.01;
            verifyOtp($customer->phone); // @step:l1-nagad-otp
            break;
        case 'card': // @step:l1-card
            $fee = $amount * 0.025;
            run3DSecure($customer->card); // @step:l1-card-3ds
            authorizeWithBank($customer->card, $amount + $fee); // @step:l1-card-bank
            break;
        default:
            throw new InvalidArgumentException('Unknown payment method: ' . $method);
    }
    // {{withoutTodo}} // @step:l1-todo

    return new Receipt($method, $amount, $fee, $amount + $fee); // @step:l1-result
}
`

const withPattern = `
<?php

// {{withAdd}}
class RocketPayment implements PaymentStrategy // @step:build-strategy
{
    public function pay(float $amount): Receipt
    {
        $fee = $amount * 0.018; // @step:rocket-fee
        verifyOtp($customer->phone); // @step:rocket-otp
        return new Receipt('Rocket', $amount, $fee, $amount + $fee); // @step:rocket-receipt
    }
}

$checkout = new Checkout(new BkashPayment());
$checkout->pay(1250);

$checkout->setStrategy(new RocketPayment()); // {{withSwap}} // @step:build-plug,rocket-set
$checkout->pay(1250); // @step:rocket-pay,rocket-done
`

export const php: CodeSet = {
  main: { filename: 'Checkout.php', source: main },
  without: { filename: 'CheckoutWithoutStrategy.php', source: without },
  with: { filename: 'CheckoutWithStrategy.php', source: withPattern },
}
