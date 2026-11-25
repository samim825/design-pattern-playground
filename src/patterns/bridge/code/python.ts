import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
from abc import ABC, abstractmethod
from typing import Protocol

# {{implementor}}
class Channel(Protocol):
    def deliver(self, to: Customer, text: str) -> None: ...

# {{concreteImpl}}
class SmsChannel:
    def deliver(self, to: Customer, text: str) -> None:
        sms_gateway.send(to.phone, text)  # @step:sms

class EmailChannel:
    def deliver(self, to: Customer, text: str) -> None:
        mailer.send(to.email, "Haat Bazar", text)  # @step:email

class PushChannel:
    def deliver(self, to: Customer, text: str) -> None:
        push.notify(to.device_id, text)  # @step:push

# {{abstraction}}
class Notification(ABC):
    def __init__(self, channel: Channel) -> None:
        self.channel = channel  # {{bridgeField}}  # @step:wire

    @abstractmethod
    def send(self, to: Customer) -> None: ...

# {{refined}}
class OtpNotification(Notification):
    def send(self, to: Customer) -> None:
        text = f"Your Haat Bazar OTP is {new_otp()}"  # @step:otp
        self.channel.deliver(to, text)  # {{delegate}}  # @step:delegate-otp

class PromoNotification(Notification):
    def send(self, to: Customer) -> None:
        text = "Eid offer: 20% off on groceries!"  # @step:promo
        self.channel.deliver(to, text)  # @step:delegate-promo

class AlertNotification(Notification):
    def send(self, to: Customer) -> None:
        text = f"Your order {to.order_id} is on its way"  # @step:alert
        self.channel.deliver(to, text)  # @step:delegate-alert

# {{usage}}
notification = PromoNotification(SmsChannel())  # {{anyPair}}  # @step:wire
notification.send(mitu)  # @step:send,done
`

const without = `
# {{withoutIntro}}
class OtpSms:
    def send(self, to: Customer) -> None:
        text = f"Your Haat Bazar OTP is {new_otp()}"  # {{whatPart}}  # @step:l1-format
        sms_gateway.send(to.phone, text)  # {{howPart}}  # @step:l1-deliver

class PromoEmail:
    def send(self, to: Customer) -> None:
        text = "Eid offer: 20% off on groceries!"
        mailer.send(to.email, "Haat Bazar", text)

# {{withoutCopy}}
class AlertPush:  # @step:l1-write
    def send(self, to: Customer) -> None:
        text = f"Your order {to.order_id} is on its way"
        push.notify(to.device_id, text)  # {{copyHow}}

# {{withoutPick}}
notification = AlertPush()  # @step:l1-pick
notification.send(karim)  # @step:l1-send,l1-result
# {{withoutTodo}}  # @step:l1-count
`

const withPattern = `
# {{withAdd}}
class WhatsAppChannel:  # @step:build-channel
    def deliver(self, to: Customer, text: str) -> None:  # @step:build-deliver,wa-deliver
        whatsapp.send_message(to.phone, text)  # {{onlyHow}}  # @step:build-deliver,wa-send

# {{withSame}}
otp = OtpNotification(WhatsAppChannel())  # @step:wa-wire-otp
otp.send(karim)  # @step:wa-run-otp
promo = PromoNotification(WhatsAppChannel())  # @step:wa-wire-promo
promo.send(mitu)  # @step:wa-run-promo

# {{withZero}}
`

export const python: CodeSet = {
  main: { filename: 'notifications.py', source: main },
  without: { filename: 'notifications_without_bridge.py', source: without },
  with: { filename: 'notifications_with_bridge.py', source: withPattern },
}
