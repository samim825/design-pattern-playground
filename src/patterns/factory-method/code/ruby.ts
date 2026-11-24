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
def send_parcel(parcel, city) # @step:l1-start
  transport =
    case city # @step:l1-switch
    when "dhaka" then RickshawVan.new # @step:l1-new-van
    when "chattogram" then Truck.new # @step:l1-new-truck
    when "barishal" then Launch.new # @step:l1-new-launch
    else raise ArgumentError, "No transport for #{city}"
    end
  # {{withoutTodo}} # @step:l1-todo

  tracking = new_tracking_id
  eta = transport.deliver(parcel.to) # @step:l1-deliver
  Booking.new(tracking:, fee: transport.fee, eta:) # @step:l1-result
end
`

const withPattern = `
# {{withAdd}}
class Drone < Transport # @step:build-product
  def fee = 200
  def deliver(to) = "Flying over the hills to #{to}" # @step:sylhet-deliver
end

class SylhetBranch < CourierBranch # @step:build-creator
  private def create_transport = Drone.new # @step:build-creator,sylhet-create
end

# {{withSame}}
SylhetBranch.new.send_parcel(Parcel.new(item: "Tea", to: "Srimangal")) # @step:sylhet-send,sylhet-done
`

export const ruby: CodeSet = {
  main: { filename: 'courier.rb', source: main },
  without: { filename: 'courier_without_factory_method.rb', source: without },
  with: { filename: 'courier_with_factory_method.rb', source: withPattern },
}
