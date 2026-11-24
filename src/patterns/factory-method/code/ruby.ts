import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
Parcel = Data.define(:item, :to)
Booking = Data.define(:tracking, :fee, :eta)

# {{product}}
class Transport
  def fee = raise(NotImplementedError)
  def deliver(to) = raise(NotImplementedError)
end

class RickshawVan < Transport
  def fee = 60
  def deliver(to) = "Through the lanes to #{to}, today" # @step:dhaka-deliver
end

class Truck < Transport
  def fee = 150
  def deliver(to) = "On the highway to #{to}, tomorrow" # @step:chattogram-deliver
end

class Launch < Transport
  def fee = 120
  def deliver(to) = "Down the river to #{to}, overnight" # @step:barishal-deliver
end

# {{creator}}
class CourierBranch
  # {{shared}}
  def send_parcel(parcel)
    transport = create_transport # {{noNew}} # @step:call-factory
    tracking = new_tracking_id # @step:book
    eta = transport.deliver(parcel.to) # @step:deliver
    Booking.new(tracking:, fee: transport.fee, eta:) # @step:done
  end

  private

  # {{factoryMethod}}
  def create_transport = raise(NotImplementedError)
end

# {{concreteCreators}}
class DhakaBranch < CourierBranch
  private def create_transport = RickshawVan.new # @step:dhaka-create
end

class ChattogramBranch < CourierBranch
  private def create_transport = Truck.new # @step:chattogram-create
end

class BarishalBranch < CourierBranch
  private def create_transport = Launch.new # @step:barishal-create
end

# {{usage}}
branch = BRANCHES.fetch(selected_city) # @step:pick-branch
booking = branch.send_parcel(Parcel.new(item: "Saree", to: destination)) # @step:client-send,done
`

const without = `
# {{withoutIntro}}
def send_parcel(parcel, city)
  transport =
    case city
    when "dhaka" then RickshawVan.new
    when "chattogram" then Truck.new
    when "barishal" then Launch.new
    else raise ArgumentError, "No transport for #{city}"
    end
  # {{withoutTodo}}

  tracking = new_tracking_id
  eta = transport.deliver(parcel.to)
  Booking.new(tracking:, fee: transport.fee, eta:)
end
`

const withPattern = `
# {{withAdd}}
class Drone < Transport
  def fee = 200
  def deliver(to) = "Flying over the hills to #{to}"
end

class SylhetBranch < CourierBranch
  private def create_transport = Drone.new
end

# {{withSame}}
SylhetBranch.new.send_parcel(Parcel.new(item: "Tea", to: "Srimangal"))
`

export const ruby: CodeSet = {
  main: { filename: 'courier.rb', source: main },
  without: { filename: 'courier_without_factory_method.rb', source: without },
  with: { filename: 'courier_with_factory_method.rb', source: withPattern },
}
