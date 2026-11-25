import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Swift prefers protocols + structs over class inheritance: Notification is a protocol
// that requires the bridge field, and each message type is a struct that stores it.

const main = `
// {{implementor}}
protocol Channel {
    func deliver(to: Customer, text: String)
}

// {{concreteImpl}}
struct SmsChannel: Channel {
    func deliver(to: Customer, text: String) { smsGateway.send(to.phone, text) } // @step:sms
}
struct EmailChannel: Channel {
    func deliver(to: Customer, text: String) { mailer.send(to.email, "Haat Bazar", text) } // @step:email
}
struct PushChannel: Channel {
    func deliver(to: Customer, text: String) { push.notify(to.deviceID, text) } // @step:push
}

// {{abstraction}}
protocol Notification {
    var channel: any Channel { get } // {{bridgeField}} // @step:wire
    func send(to: Customer)
}

// {{refined}}
struct OtpNotification: Notification {
    let channel: any Channel
    func send(to: Customer) {
        let text = "Your Haat Bazar OTP is " + newOTP() // @step:otp
        channel.deliver(to: to, text: text) // {{delegate}} // @step:delegate-otp
    }
}

struct PromoNotification: Notification {
    let channel: any Channel
    func send(to: Customer) {
        let text = "Eid offer: 20% off on groceries!" // @step:promo
        channel.deliver(to: to, text: text) // @step:delegate-promo
    }
}

struct AlertNotification: Notification {
    let channel: any Channel
    func send(to: Customer) {
        let text = "Your order " + to.orderID + " is on its way" // @step:alert
        channel.deliver(to: to, text: text) // @step:delegate-alert
    }
}

// {{usage}}
let notification = PromoNotification(channel: SmsChannel()) // {{anyPair}} // @step:wire
notification.send(to: mitu) // @step:send,done
`

const without = `
// {{withoutIntro}}
struct OtpSms {
    func send(to: Customer) {
        let text = "Your Haat Bazar OTP is " + newOTP() // {{whatPart}} // @step:l1-format
        smsGateway.send(to.phone, text) // {{howPart}} // @step:l1-deliver
    }
}

struct PromoEmail {
    func send(to: Customer) {
        mailer.send(to.email, "Haat Bazar", "Eid offer: 20% off on groceries!")
    }
}

// {{withoutCopy}}
struct AlertPush { // @step:l1-write
    func send(to: Customer) {
        let text = "Your order " + to.orderID + " is on its way"
        push.notify(to.deviceID, text) // {{copyHow}}
    }
}

// {{withoutPick}}
let notification = AlertPush() // @step:l1-pick
notification.send(to: karim) // @step:l1-send,l1-result
// {{withoutTodo}} // @step:l1-count
`

const withPattern = `
// {{withAdd}}
struct WhatsAppChannel: Channel { // @step:build-channel
    func deliver(to: Customer, text: String) { // @step:build-deliver,wa-deliver
        whatsApp.sendMessage(to.phone, text) // {{onlyHow}} // @step:build-deliver,wa-send
    }
}

// {{withSame}}
let otp = OtpNotification(channel: WhatsAppChannel()) // @step:wa-wire-otp
otp.send(to: karim) // @step:wa-run-otp
let promo = PromoNotification(channel: WhatsAppChannel()) // @step:wa-wire-promo
promo.send(to: mitu) // @step:wa-run-promo

// {{withZero}}
`

export const swift: CodeSet = {
  main: { filename: 'Notifications.swift', source: main },
  without: { filename: 'NotificationsWithoutBridge.swift', source: without },
  with: { filename: 'NotificationsWithBridge.swift', source: withPattern },
}
