import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
<?php
// {{implementor}}
interface Channel
{
    public function deliver(Customer $to, string $text): void;
}

// {{concreteImpl}}
class SmsChannel implements Channel
{
    public function deliver(Customer $to, string $text): void { SmsGateway::send($to->phone, $text); } // @step:sms
}
class EmailChannel implements Channel
{
    public function deliver(Customer $to, string $text): void { Mailer::send($to->email, 'Haat Bazar', $text); } // @step:email
}
class PushChannel implements Channel
{
    public function deliver(Customer $to, string $text): void { Push::notify($to->deviceId, $text); } // @step:push
}

// {{abstraction}}
abstract class Notification
{
    public function __construct(protected readonly Channel $channel) {} // {{bridgeField}} // @step:wire

    abstract public function send(Customer $to): void;
}

// {{refined}}
class OtpNotification extends Notification
{
    public function send(Customer $to): void
    {
        $text = 'Your Haat Bazar OTP is ' . newOtp(); // @step:otp
        $this->channel->deliver($to, $text); // {{delegate}} // @step:delegate-otp
    }
}

class PromoNotification extends Notification
{
    public function send(Customer $to): void
    {
        $text = 'Eid offer: 20% off on groceries!'; // @step:promo
        $this->channel->deliver($to, $text); // @step:delegate-promo
    }
}

class AlertNotification extends Notification
{
    public function send(Customer $to): void
    {
        $text = 'Your order ' . $to->orderId . ' is on its way'; // @step:alert
        $this->channel->deliver($to, $text); // @step:delegate-alert
    }
}

// {{usage}}
$notification = new PromoNotification(new SmsChannel()); // {{anyPair}} // @step:wire
$notification->send($mitu); // @step:send,done
`

const without = `
<?php
// {{withoutIntro}}
class OtpSms
{
    public function send(Customer $to): void
    {
        $text = 'Your Haat Bazar OTP is ' . newOtp(); // {{whatPart}} // @step:l1-format
        SmsGateway::send($to->phone, $text); // {{howPart}} // @step:l1-deliver
    }
}

class PromoEmail
{
    public function send(Customer $to): void
    {
        Mailer::send($to->email, 'Haat Bazar', 'Eid offer: 20% off on groceries!');
    }
}

// {{withoutCopy}}
class AlertPush // @step:l1-write
{
    public function send(Customer $to): void
    {
        Push::notify($to->deviceId, 'Your order ' . $to->orderId . ' is on its way'); // {{copyHow}}
    }
}

// {{withoutPick}}
$notification = new AlertPush(); // @step:l1-pick
$notification->send($karim); // @step:l1-send,l1-result
// {{withoutTodo}} // @step:l1-count
`

const withPattern = `
<?php
// {{withAdd}}
class WhatsAppChannel implements Channel // @step:build-channel
{
    public function deliver(Customer $to, string $text): void // @step:build-deliver,wa-deliver
    {
        WhatsApp::sendMessage($to->phone, $text); // {{onlyHow}} // @step:build-deliver,wa-send
    }
}

// {{withSame}}
$otp = new OtpNotification(new WhatsAppChannel()); // @step:wa-wire-otp
$otp->send($karim); // @step:wa-run-otp
$promo = new PromoNotification(new WhatsAppChannel()); // @step:wa-wire-promo
$promo->send($mitu); // @step:wa-run-promo

// {{withZero}}
`

export const php: CodeSet = {
  main: { filename: 'Notifications.php', source: main },
  without: { filename: 'NotificationsWithoutBridge.php', source: without },
  with: { filename: 'NotificationsWithBridge.php', source: withPattern },
}
