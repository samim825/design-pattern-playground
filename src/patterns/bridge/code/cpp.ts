import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
// {{implementor}}
class Channel {
public:
    virtual ~Channel() = default;
    virtual void deliver(const Customer& to, const std::string& text) = 0;
};

// {{concreteImpl}}
class SmsChannel : public Channel {
public:
    void deliver(const Customer& to, const std::string& text) override { smsGateway.send(to.phone, text); } // @step:sms
};
class EmailChannel : public Channel {
public:
    void deliver(const Customer& to, const std::string& text) override { mailer.send(to.email, "Haat Bazar", text); } // @step:email
};
class PushChannel : public Channel {
public:
    void deliver(const Customer& to, const std::string& text) override { push.notify(to.deviceId, text); } // @step:push
};

// {{abstraction}}
class Notification {
protected:
    std::unique_ptr<Channel> channel; // {{bridgeField}} // @step:wire
public:
    explicit Notification(std::unique_ptr<Channel> c) : channel(std::move(c)) {}
    virtual ~Notification() = default;
    virtual void send(const Customer& to) = 0;
};

// {{refined}}
class OtpNotification : public Notification {
public:
    using Notification::Notification;
    void send(const Customer& to) override {
        std::string text = "Your Haat Bazar OTP is " + newOtp(); // @step:otp
        channel->deliver(to, text); // {{delegate}} // @step:delegate-otp
    }
};

class PromoNotification : public Notification {
public:
    using Notification::Notification;
    void send(const Customer& to) override {
        std::string text = "Eid offer: 20% off on groceries!"; // @step:promo
        channel->deliver(to, text); // @step:delegate-promo
    }
};

class AlertNotification : public Notification {
public:
    using Notification::Notification;
    void send(const Customer& to) override {
        std::string text = "Your order " + to.orderId + " is on its way"; // @step:alert
        channel->deliver(to, text); // @step:delegate-alert
    }
};

// {{usage}}
auto notification = std::make_unique<PromoNotification>(std::make_unique<SmsChannel>()); // {{anyPair}} // @step:wire
notification->send(mitu); // @step:send,done
`

const without = `
// {{withoutIntro}}
class OtpSms {
public:
    void send(const Customer& to) {
        std::string text = "Your Haat Bazar OTP is " + newOtp(); // {{whatPart}} // @step:l1-format
        smsGateway.send(to.phone, text); // {{howPart}} // @step:l1-deliver
    }
};

class PromoEmail {
public:
    void send(const Customer& to) {
        mailer.send(to.email, "Haat Bazar", "Eid offer: 20% off on groceries!");
    }
};

// {{withoutCopy}}
class AlertPush { // @step:l1-write
public:
    void send(const Customer& to) {
        push.notify(to.deviceId, "Your order " + to.orderId + " is on its way"); // {{copyHow}}
    }
};

// {{withoutPick}}
AlertPush notification; // @step:l1-pick
notification.send(karim); // @step:l1-send,l1-result
// {{withoutTodo}} // @step:l1-count
`

const withPattern = `
// {{withAdd}}
class WhatsAppChannel : public Channel { // @step:build-channel
public:
    void deliver(const Customer& to, const std::string& text) override { // @step:build-deliver,wa-deliver
        whatsapp.sendMessage(to.phone, text); // {{onlyHow}} // @step:build-deliver,wa-send
    }
};

// {{withSame}}
OtpNotification otp(std::make_unique<WhatsAppChannel>()); // @step:wa-wire-otp
otp.send(karim); // @step:wa-run-otp
PromoNotification promo(std::make_unique<WhatsAppChannel>()); // @step:wa-wire-promo
promo.send(mitu); // @step:wa-run-promo

// {{withZero}}
`

export const cpp: CodeSet = {
  main: { filename: 'notifications.cpp', source: main },
  without: { filename: 'notifications_without_bridge.cpp', source: without },
  with: { filename: 'notifications_with_bridge.cpp', source: withPattern },
}
