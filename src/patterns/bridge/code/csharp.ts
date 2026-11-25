import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
// {{implementor}}
public interface IChannel
{
    void Deliver(Customer to, string text);
}

// {{concreteImpl}}
public class SmsChannel : IChannel
{
    public void Deliver(Customer to, string text) => SmsGateway.Send(to.Phone, text); // @step:sms
}
public class EmailChannel : IChannel
{
    public void Deliver(Customer to, string text) => Mailer.Send(to.Email, "Haat Bazar", text); // @step:email
}
public class PushChannel : IChannel
{
    public void Deliver(Customer to, string text) => Push.Notify(to.DeviceId, text); // @step:push
}

// {{abstraction}}
public abstract class Notification(IChannel channel)
{
    protected readonly IChannel Channel = channel; // {{bridgeField}} // @step:wire
    public abstract void Send(Customer to);
}

// {{refined}}
public class OtpNotification(IChannel channel) : Notification(channel)
{
    public override void Send(Customer to)
    {
        var text = "Your Haat Bazar OTP is " + NewOtp(); // @step:otp
        Channel.Deliver(to, text); // {{delegate}} // @step:delegate-otp
    }
}

public class PromoNotification(IChannel channel) : Notification(channel)
{
    public override void Send(Customer to)
    {
        var text = "Eid offer: 20% off on groceries!"; // @step:promo
        Channel.Deliver(to, text); // @step:delegate-promo
    }
}

public class AlertNotification(IChannel channel) : Notification(channel)
{
    public override void Send(Customer to)
    {
        var text = "Your order " + to.OrderId + " is on its way"; // @step:alert
        Channel.Deliver(to, text); // @step:delegate-alert
    }
}

// {{usage}}
Notification notification = new PromoNotification(new SmsChannel()); // {{anyPair}} // @step:wire
notification.Send(mitu); // @step:send,done
`

const without = `
// {{withoutIntro}}
public class OtpSms
{
    public void Send(Customer to)
    {
        var text = "Your Haat Bazar OTP is " + NewOtp(); // {{whatPart}} // @step:l1-format
        SmsGateway.Send(to.Phone, text); // {{howPart}} // @step:l1-deliver
    }
}

public class PromoEmail
{
    public void Send(Customer to) =>
        Mailer.Send(to.Email, "Haat Bazar", "Eid offer: 20% off on groceries!");
}

// {{withoutCopy}}
public class AlertPush // @step:l1-write
{
    public void Send(Customer to) =>
        Push.Notify(to.DeviceId, "Your order " + to.OrderId + " is on its way"); // {{copyHow}}
}

// {{withoutPick}}
var notification = new AlertPush(); // @step:l1-pick
notification.Send(karim); // @step:l1-send,l1-result
// {{withoutTodo}} // @step:l1-count
`

const withPattern = `
// {{withAdd}}
public class WhatsAppChannel : IChannel // @step:build-channel
{
    public void Deliver(Customer to, string text) => // @step:build-deliver,wa-deliver
        WhatsApp.SendMessage(to.Phone, text); // {{onlyHow}} // @step:build-deliver,wa-send
}

// {{withSame}}
Notification otp = new OtpNotification(new WhatsAppChannel()); // @step:wa-wire-otp
otp.Send(karim); // @step:wa-run-otp
Notification promo = new PromoNotification(new WhatsAppChannel()); // @step:wa-wire-promo
promo.Send(mitu); // @step:wa-run-promo

// {{withZero}}
`

export const csharp: CodeSet = {
  main: { filename: 'Notifications.cs', source: main },
  without: { filename: 'NotificationsWithoutBridge.cs', source: without },
  with: { filename: 'NotificationsWithBridge.cs', source: withPattern },
}
