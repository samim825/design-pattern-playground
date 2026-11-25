import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Go has no classes or inheritance: the abstraction is a struct holding the bridge field,
// and each message type embeds it (composition) and adds its own Send method.

const main = `
// {{implementor}}
type Channel interface {
    Deliver(to Customer, text string)
}

// {{concreteImpl}}
type SmsChannel struct{}
type EmailChannel struct{}
type PushChannel struct{}

func (SmsChannel) Deliver(to Customer, text string)   { smsGateway.Send(to.Phone, text) } // @step:sms
func (EmailChannel) Deliver(to Customer, text string) { mailer.Send(to.Email, "Haat Bazar", text) } // @step:email
func (PushChannel) Deliver(to Customer, text string)  { push.Notify(to.DeviceID, text) } // @step:push

// {{abstraction}}
type Notification struct {
    channel Channel // {{bridgeField}} // @step:wire
}

// {{refined}}
type OtpNotification struct{ Notification }
type PromoNotification struct{ Notification }
type AlertNotification struct{ Notification }

func (n OtpNotification) Send(to Customer) {
    text := "Your Haat Bazar OTP is " + newOTP() // @step:otp
    n.channel.Deliver(to, text) // {{delegate}} // @step:delegate-otp
}

func (n PromoNotification) Send(to Customer) {
    text := "Eid offer: 20% off on groceries!" // @step:promo
    n.channel.Deliver(to, text) // @step:delegate-promo
}

func (n AlertNotification) Send(to Customer) {
    text := "Your order " + to.OrderID + " is on its way" // @step:alert
    n.channel.Deliver(to, text) // @step:delegate-alert
}

// {{usage}}
notification := PromoNotification{Notification{channel: SmsChannel{}}} // {{anyPair}} // @step:wire
notification.Send(mitu) // @step:send,done
`

const without = `
// {{withoutIntro}}
type OtpSms struct{}

func (OtpSms) Send(to Customer) {
    text := "Your Haat Bazar OTP is " + newOTP() // {{whatPart}} // @step:l1-format
    smsGateway.Send(to.Phone, text) // {{howPart}} // @step:l1-deliver
}

type PromoEmail struct{}

func (PromoEmail) Send(to Customer) {
    mailer.Send(to.Email, "Haat Bazar", "Eid offer: 20% off on groceries!")
}

// {{withoutCopy}}
type AlertPush struct{} // @step:l1-write

func (AlertPush) Send(to Customer) {
    text := "Your order " + to.OrderID + " is on its way"
    push.Notify(to.DeviceID, text) // {{copyHow}}
}

// {{withoutPick}}
notification := AlertPush{} // @step:l1-pick
notification.Send(karim) // @step:l1-send,l1-result
// {{withoutTodo}} // @step:l1-count
`

const withPattern = `
// {{withAdd}}
type WhatsAppChannel struct{} // @step:build-channel

func (WhatsAppChannel) Deliver(to Customer, text string) { // @step:build-deliver,wa-deliver
    whatsapp.SendMessage(to.Phone, text) // {{onlyHow}} // @step:build-deliver,wa-send
}

// {{withSame}}
otp := OtpNotification{Notification{channel: WhatsAppChannel{}}} // @step:wa-wire-otp
otp.Send(karim) // @step:wa-run-otp
promo := PromoNotification{Notification{channel: WhatsAppChannel{}}} // @step:wa-wire-promo
promo.Send(mitu) // @step:wa-run-promo

// {{withZero}}
`

export const go: CodeSet = {
  main: { filename: 'notifications.go', source: main },
  without: { filename: 'notifications_without_bridge.go', source: without },
  with: { filename: 'notifications_with_bridge.go', source: withPattern },
}
