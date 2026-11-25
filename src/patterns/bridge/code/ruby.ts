import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.
// Ruby's Object#send is a core method, so the notification method is called notify instead.

const main = `
# {{implementor}}
module Channel
  def deliver(to, text) = raise(NotImplementedError)
end

# {{concreteImpl}}
class SmsChannel
  include Channel
  def deliver(to, text) = SmsGateway.send_sms(to.phone, text) # @step:sms
end

class EmailChannel
  include Channel
  def deliver(to, text) = Mailer.deliver(to.email, "Haat Bazar", text) # @step:email
end

class PushChannel
  include Channel
  def deliver(to, text) = Push.notify(to.device_id, text) # @step:push
end

# {{abstraction}}
class Notification
  def initialize(channel)
    @channel = channel # {{bridgeField}} # @step:wire
  end

  def notify(to) = raise(NotImplementedError)
end

# {{refined}}
class OtpNotification < Notification
  def notify(to)
    text = "Your Haat Bazar OTP is #{new_otp}" # @step:otp
    @channel.deliver(to, text) # {{delegate}} # @step:delegate-otp
  end
end

class PromoNotification < Notification
  def notify(to)
    text = "Eid offer: 20% off on groceries!" # @step:promo
    @channel.deliver(to, text) # @step:delegate-promo
  end
end

class AlertNotification < Notification
  def notify(to)
    text = "Your order #{to.order_id} is on its way" # @step:alert
    @channel.deliver(to, text) # @step:delegate-alert
  end
end

# {{usage}}
notification = PromoNotification.new(SmsChannel.new) # {{anyPair}} # @step:wire
notification.notify(mitu) # @step:send,done
`

const without = `
# {{withoutIntro}}
class OtpSms
  def notify(to)
    text = "Your Haat Bazar OTP is #{new_otp}" # {{whatPart}} # @step:l1-format
    SmsGateway.send_sms(to.phone, text) # {{howPart}} # @step:l1-deliver
  end
end

class PromoEmail
  def notify(to) = Mailer.deliver(to.email, "Haat Bazar", "Eid offer: 20% off on groceries!")
end

# {{withoutCopy}}
class AlertPush # @step:l1-write
  def notify(to)
    text = "Your order #{to.order_id} is on its way"
    Push.notify(to.device_id, text) # {{copyHow}}
  end
end

# {{withoutPick}}
notification = AlertPush.new # @step:l1-pick
notification.notify(karim) # @step:l1-send,l1-result
# {{withoutTodo}} # @step:l1-count
`

const withPattern = `
# {{withAdd}}
class WhatsAppChannel # @step:build-channel
  include Channel

  def deliver(to, text) # @step:build-deliver,wa-deliver
    WhatsApp.send_message(to.phone, text) # {{onlyHow}} # @step:build-deliver,wa-send
  end
end

# {{withSame}}
otp = OtpNotification.new(WhatsAppChannel.new) # @step:wa-wire-otp
otp.notify(karim) # @step:wa-run-otp
promo = PromoNotification.new(WhatsAppChannel.new) # @step:wa-wire-promo
promo.notify(mitu) # @step:wa-run-promo

# {{withZero}}
`

export const ruby: CodeSet = {
  main: { filename: 'notifications.rb', source: main },
  without: { filename: 'notifications_without_bridge.rb', source: without },
  with: { filename: 'notifications_with_bridge.rb', source: withPattern },
}
