import type { CodeSet } from '@/types/pattern'

/*
 * Conventions (see CLAUDE.md):
 *   // {{key}}        → translated comment from content.<lang>.ts → codeComments[key]
 *   // @step:a,b      → this line lights up while visual step a or b runs (stripped on display)
 */

const main = `
// {{implementor}}
interface Channel {
  deliver(to: Customer, text: string): void;
}

// {{concreteImpl}}
class SmsChannel implements Channel {
  deliver(to: Customer, text: string) { smsGateway.send(to.phone, text); } // @step:sms
}
class EmailChannel implements Channel {
  deliver(to: Customer, text: string) { mailer.send(to.email, 'Haat Bazar', text); } // @step:email
}
class PushChannel implements Channel {
  deliver(to: Customer, text: string) { push.notify(to.deviceId, text); } // @step:push
}

// {{abstraction}}
abstract class Notification {
  constructor(protected readonly channel: Channel) {} // {{bridgeField}} // @step:wire
  abstract send(to: Customer): void;
}

// {{refined}}
class OtpNotification extends Notification {
  send(to: Customer) {
    const text = 'Your Haat Bazar OTP is ' + newOtp(); // @step:otp
    this.channel.deliver(to, text); // {{delegate}} // @step:delegate-otp
  }
}

class PromoNotification extends Notification {
  send(to: Customer) {
    const text = 'Eid offer: 20% off on groceries!'; // @step:promo
    this.channel.deliver(to, text); // @step:delegate-promo
  }
}

class AlertNotification extends Notification {
  send(to: Customer) {
    const text = 'Your order ' + to.orderId + ' is on its way'; // @step:alert
    this.channel.deliver(to, text); // @step:delegate-alert
  }
}

// {{usage}}
const notification = new PromoNotification(new SmsChannel()); // {{anyPair}} // @step:wire
notification.send(mitu); // @step:send,done
`

const without = `
// {{withoutIntro}}
class OtpSms {
  send(to: Customer) {
    const text = 'Your Haat Bazar OTP is ' + newOtp(); // {{whatPart}} // @step:l1-format
    smsGateway.send(to.phone, text); // {{howPart}} // @step:l1-deliver
  }
}

class PromoEmail {
  send(to: Customer) {
    const text = 'Eid offer: 20% off on groceries!';
    mailer.send(to.email, 'Haat Bazar', text);
  }
}

// {{withoutCopy}}
class AlertPush { // @step:l1-write
  send(to: Customer) {
    const text = 'Your order ' + to.orderId + ' is on its way';
    push.notify(to.deviceId, text); // {{copyHow}}
  }
}

// {{withoutPick}}
const notification = new AlertPush(); // @step:l1-pick
notification.send(karim); // @step:l1-send,l1-result
// {{withoutTodo}} // @step:l1-count
`

const withPattern = `
// {{withAdd}}
class WhatsAppChannel implements Channel { // @step:build-channel
  deliver(to: Customer, text: string) { // @step:build-deliver,wa-deliver
    whatsapp.sendMessage(to.phone, text); // {{onlyHow}} // @step:build-deliver,wa-send
  }
}

// {{withSame}}
const otp = new OtpNotification(new WhatsAppChannel()); // @step:wa-wire-otp
otp.send(karim); // @step:wa-run-otp
const promo = new PromoNotification(new WhatsAppChannel()); // @step:wa-wire-promo
promo.send(mitu); // @step:wa-run-promo

// {{withZero}}
`

export const ts: CodeSet = {
  main: { filename: 'notifications.ts', source: main },
  without: { filename: 'notifications-without-bridge.ts', source: without },
  with: { filename: 'notifications-with-bridge.ts', source: withPattern },
}

