import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
// {{implementor}}
interface Channel {
    void deliver(Customer to, String text);
}

// {{concreteImpl}}
class SmsChannel implements Channel {
    @Override public void deliver(Customer to, String text) { smsGateway.send(to.phone(), text); } // @step:sms
}
class EmailChannel implements Channel {
    @Override public void deliver(Customer to, String text) { mailer.send(to.email(), "Haat Bazar", text); } // @step:email
}
class PushChannel implements Channel {
    @Override public void deliver(Customer to, String text) { push.notify(to.deviceId(), text); } // @step:push
}

// {{abstraction}}
abstract class Notification {
    protected final Channel channel; // {{bridgeField}} // @step:wire
    Notification(Channel channel) { this.channel = channel; }
    abstract void send(Customer to);
}

// {{refined}}
class OtpNotification extends Notification {
    OtpNotification(Channel channel) { super(channel); }
    @Override void send(Customer to) {
        String text = "Your Haat Bazar OTP is " + newOtp(); // @step:otp
        channel.deliver(to, text); // {{delegate}} // @step:delegate-otp
    }
}

class PromoNotification extends Notification {
    PromoNotification(Channel channel) { super(channel); }
    @Override void send(Customer to) {
        String text = "Eid offer: 20% off on groceries!"; // @step:promo
        channel.deliver(to, text); // @step:delegate-promo
    }
}

class AlertNotification extends Notification {
    AlertNotification(Channel channel) { super(channel); }
    @Override void send(Customer to) {
        String text = "Your order " + to.orderId() + " is on its way"; // @step:alert
        channel.deliver(to, text); // @step:delegate-alert
    }
}

// {{usage}}
Notification notification = new PromoNotification(new SmsChannel()); // {{anyPair}} // @step:wire
notification.send(mitu); // @step:send,done
`

const without = `
// {{withoutIntro}}
class OtpSms {
    void send(Customer to) {
        String text = "Your Haat Bazar OTP is " + newOtp(); // {{whatPart}} // @step:l1-format
        smsGateway.send(to.phone(), text); // {{howPart}} // @step:l1-deliver
    }
}

class PromoEmail {
    void send(Customer to) {
        String text = "Eid offer: 20% off on groceries!";
        mailer.send(to.email(), "Haat Bazar", text);
    }
}

// {{withoutCopy}}
class AlertPush { // @step:l1-write
    void send(Customer to) {
        String text = "Your order " + to.orderId() + " is on its way";
        push.notify(to.deviceId(), text); // {{copyHow}}
    }
}

// {{withoutPick}}
var notification = new AlertPush(); // @step:l1-pick
notification.send(karim); // @step:l1-send,l1-result
// {{withoutTodo}} // @step:l1-count
`

const withPattern = `
// {{withAdd}}
class WhatsAppChannel implements Channel { // @step:build-channel
    @Override public void deliver(Customer to, String text) { // @step:build-deliver,wa-deliver
        whatsapp.sendMessage(to.phone(), text); // {{onlyHow}} // @step:build-deliver,wa-send
    }
}

// {{withSame}}
Notification otp = new OtpNotification(new WhatsAppChannel()); // @step:wa-wire-otp
otp.send(karim); // @step:wa-run-otp
Notification promo = new PromoNotification(new WhatsAppChannel()); // @step:wa-wire-promo
promo.send(mitu); // @step:wa-run-promo

// {{withZero}}
`

export const java: CodeSet = {
  main: { filename: 'Notifications.java', source: main },
  without: { filename: 'NotificationsWithoutBridge.java', source: without },
  with: { filename: 'NotificationsWithBridge.java', source: withPattern },
}
