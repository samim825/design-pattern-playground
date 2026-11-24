import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
struct Parcel { std::string item, to; };
struct Booking { std::string tracking; int fee; std::string eta; };

// {{product}}
class Transport {
public:
    virtual ~Transport() = default;
    virtual int fee() const = 0;
    virtual std::string deliver(const std::string& to) const = 0;
};

class RickshawVan : public Transport {
public:
    int fee() const override { return 60; }
    std::string deliver(const std::string& to) const override { return "Through the lanes to " + to + ", today"; } // @step:dhaka-deliver
};

class Truck : public Transport {
public:
    int fee() const override { return 150; }
    std::string deliver(const std::string& to) const override { return "On the highway to " + to + ", tomorrow"; } // @step:chattogram-deliver
};

class Launch : public Transport {
public:
    int fee() const override { return 120; }
    std::string deliver(const std::string& to) const override { return "Down the river to " + to + ", overnight"; } // @step:barishal-deliver
};

// {{creator}}
class CourierBranch {
public:
    virtual ~CourierBranch() = default;

    // {{shared}}
    Booking sendParcel(const Parcel& parcel) const {
        auto transport = createTransport(); // {{noConcrete}} // @step:call-factory
        auto tracking = newTrackingId(); // @step:book
        auto eta = transport->deliver(parcel.to); // @step:deliver
        return {tracking, transport->fee(), eta}; // @step:done
    }

protected:
    // {{factoryMethod}}
    virtual std::unique_ptr<Transport> createTransport() const = 0;
};

// {{concreteCreators}}
class DhakaBranch : public CourierBranch {
    std::unique_ptr<Transport> createTransport() const override { return std::make_unique<RickshawVan>(); } // @step:dhaka-create
};

class ChattogramBranch : public CourierBranch {
    std::unique_ptr<Transport> createTransport() const override { return std::make_unique<Truck>(); } // @step:chattogram-create
};

class BarishalBranch : public CourierBranch {
    std::unique_ptr<Transport> createTransport() const override { return std::make_unique<Launch>(); } // @step:barishal-create
};

// {{usage}}
const CourierBranch& branch = branchFor(selectedCity); // @step:pick-branch
Booking booking = branch.sendParcel({"Saree", destination}); // @step:client-send,done
`

const without = `
// {{withoutIntro}}
Booking sendParcel(const Parcel& parcel, const std::string& city) { // @step:l1-start
    std::unique_ptr<Transport> transport;

    if (city == "dhaka") { // @step:l1-switch
        transport = std::make_unique<RickshawVan>(); // @step:l1-new-van
    } else if (city == "chattogram") {
        transport = std::make_unique<Truck>(); // @step:l1-new-truck
    } else if (city == "barishal") {
        transport = std::make_unique<Launch>(); // @step:l1-new-launch
    } else {
        throw std::invalid_argument("No transport for " + city);
    }
    // {{withoutTodo}} // @step:l1-todo

    auto tracking = newTrackingId();
    auto eta = transport->deliver(parcel.to); // @step:l1-deliver
    return {tracking, transport->fee(), eta}; // @step:l1-result
}
`

const withPattern = `
// {{withAdd}}
class Drone : public Transport { // @step:build-product
public:
    int fee() const override { return 200; }
    std::string deliver(const std::string& to) const override { return "Flying over the hills to " + to; } // @step:sylhet-deliver
};

class SylhetBranch : public CourierBranch { // @step:build-creator
    std::unique_ptr<Transport> createTransport() const override { return std::make_unique<Drone>(); } // @step:build-creator,sylhet-create
};

// {{withSame}}
SylhetBranch().sendParcel({"Tea", "Srimangal"}); // @step:sylhet-send,sylhet-done
`

export const cpp: CodeSet = {
  main: { filename: 'courier.cpp', source: main },
  without: { filename: 'courier_without_factory_method.cpp', source: without },
  with: { filename: 'courier_with_factory_method.cpp', source: withPattern },
}
