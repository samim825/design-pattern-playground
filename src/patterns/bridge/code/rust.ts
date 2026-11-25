import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Rust has no inheritance: the abstraction is a trait, and each message type is a struct
// that holds its own bridge field (a Box<dyn Channel>) and implements that trait.

const main = `
// {{implementor}}
pub trait Channel {
    fn deliver(&self, to: &Customer, text: &str);
}

// {{concreteImpl}}
pub struct SmsChannel;
pub struct EmailChannel;
pub struct PushChannel;

impl Channel for SmsChannel {
    fn deliver(&self, to: &Customer, text: &str) { sms_gateway::send(&to.phone, text); } // @step:sms
}
impl Channel for EmailChannel {
    fn deliver(&self, to: &Customer, text: &str) { mailer::send(&to.email, "Haat Bazar", text); } // @step:email
}
impl Channel for PushChannel {
    fn deliver(&self, to: &Customer, text: &str) { push::notify(&to.device_id, text); } // @step:push
}

// {{abstraction}}
pub trait Notification {
    fn send(&self, to: &Customer);
}

// {{refined}}
pub struct OtpNotification { pub channel: Box<dyn Channel> } // {{bridgeField}} // @step:wire
pub struct PromoNotification { pub channel: Box<dyn Channel> }
pub struct AlertNotification { pub channel: Box<dyn Channel> }

impl Notification for OtpNotification {
    fn send(&self, to: &Customer) {
        let text = format!("Your Haat Bazar OTP is {}", new_otp()); // @step:otp
        self.channel.deliver(to, &text); // {{delegate}} // @step:delegate-otp
    }
}
impl Notification for PromoNotification {
    fn send(&self, to: &Customer) {
        let text = "Eid offer: 20% off on groceries!"; // @step:promo
        self.channel.deliver(to, text); // @step:delegate-promo
    }
}
impl Notification for AlertNotification {
    fn send(&self, to: &Customer) {
        let text = format!("Your order {} is on its way", to.order_id); // @step:alert
        self.channel.deliver(to, &text); // @step:delegate-alert
    }
}

// {{usage}}
let notification = PromoNotification { channel: Box::new(SmsChannel) }; // {{anyPair}} // @step:wire
notification.send(&mitu); // @step:send,done
`

const without = `
// {{withoutIntro}}
pub struct OtpSms;
impl OtpSms {
    pub fn send(&self, to: &Customer) {
        let text = format!("Your Haat Bazar OTP is {}", new_otp()); // {{whatPart}} // @step:l1-format
        sms_gateway::send(&to.phone, &text); // {{howPart}} // @step:l1-deliver
    }
}

pub struct PromoEmail;
impl PromoEmail {
    pub fn send(&self, to: &Customer) {
        mailer::send(&to.email, "Haat Bazar", "Eid offer: 20% off on groceries!");
    }
}

// {{withoutCopy}}
pub struct AlertPush; // @step:l1-write
impl AlertPush {
    pub fn send(&self, to: &Customer) {
        let text = format!("Your order {} is on its way", to.order_id);
        push::notify(&to.device_id, &text); // {{copyHow}}
    }
}

// {{withoutPick}}
let notification = AlertPush; // @step:l1-pick
notification.send(&karim); // @step:l1-send,l1-result
// {{withoutTodo}} // @step:l1-count
`

const withPattern = `
// {{withAdd}}
pub struct WhatsAppChannel; // @step:build-channel
impl Channel for WhatsAppChannel {
    fn deliver(&self, to: &Customer, text: &str) { // @step:build-deliver,wa-deliver
        whatsapp::send_message(&to.phone, text); // {{onlyHow}} // @step:build-deliver,wa-send
    }
}

// {{withSame}}
let otp = OtpNotification { channel: Box::new(WhatsAppChannel) }; // @step:wa-wire-otp
otp.send(&karim); // @step:wa-run-otp
let promo = PromoNotification { channel: Box::new(WhatsAppChannel) }; // @step:wa-wire-promo
promo.send(&mitu); // @step:wa-run-promo

// {{withZero}}
`

export const rust: CodeSet = {
  main: { filename: 'notifications.rs', source: main },
  without: { filename: 'notifications_without_bridge.rs', source: without },
  with: { filename: 'notifications_with_bridge.rs', source: withPattern },
}
