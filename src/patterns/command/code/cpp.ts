import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
// {{command}}
class OrderCommand {
public:
    virtual ~OrderCommand() = default;
    virtual int price() const = 0; // {{slipPrice}}
    virtual void execute() = 0; // {{doIt}}
    virtual void undo() = 0; // {{undoIt}}
};

// {{receiver}}
class Kitchen {
public:
    void cook(const std::string& dish, int table) { /* … */ } // {{realWork}} // @step:cook
    void takeBack(const std::string& dish, int table) { /* … */ } // @step:uncook
    void addChili(const std::string& dish, int table) { /* … */ }
    void removeChili(const std::string& dish, int table) { /* … */ }
};

// {{concrete}}
class CookDishCommand : public OrderCommand {
public:
    CookDishCommand(Kitchen& kitchen, std::string dish, int table, int price)
        : kitchen_(kitchen), dish_(std::move(dish)), table_(table), price_(price) {}
    int price() const override { return price_; }
    void execute() override { kitchen_.cook(dish_, table_); } // {{delegates}} // @step:exec
    void undo() override { kitchen_.takeBack(dish_, table_); } // {{reverses}} // @step:undo-exec
private:
    Kitchen& kitchen_; // {{holdsReceiver}}
    std::string dish_;
    int table_, price_;
};

// {{invoker}}
class OrderRail {
public:
    void pin(std::unique_ptr<OrderCommand> slip) {
        queue_.push_back(std::move(slip)); // {{waits}} // @step:pin
    }
    void runNext() {
        if (queue_.empty()) return;
        auto slip = std::move(queue_.front()); // {{inOrder}} // @step:run
        queue_.pop_front();
        slip->execute(); // {{blind}} // @step:run
        history_.push_back(std::move(slip)); // {{remember}} // @step:cook
    }
    void undoLast() {
        if (history_.empty()) return;
        history_.back()->undo(); // {{lastFirst}} // @step:undo
        history_.pop_back();
    }
    int bill() const {
        int sum = 0;
        for (const auto& s : history_) sum += s->price(); // {{billFromHistory}} // @step:bill
        return sum;
    }
private:
    std::deque<std::unique_ptr<OrderCommand>> queue_; // {{queueField}}
    std::vector<std::unique_ptr<OrderCommand>> history_; // {{historyField}} // @step:tear
};

// {{client}}
Kitchen kitchen;
OrderRail rail;
rail.pin(std::make_unique<CookDishCommand>(kitchen, "kacchi", 4, 350)); // {{writeSlip}} // @step:write
rail.runNext(); // {{railRuns}} // @step:run
rail.undoLast(); // {{cancelIsUndo}} // @step:cancel
`

const without = `
// {{withoutIntro}}
class Waiter {
public:
    explicit Waiter(Kitchen& kitchen) : kitchen_(kitchen) {} // {{knowsKitchen}}

    void takeOrder(const std::string& dish, int table, int price) { // @step:l1-order
        if (dish == "kacchi") kitchen_.cookKacchi(table); // {{shoutNow}} // @step:l1-kacchi
        else if (dish == "roast") kitchen_.cookRoast(table); // @step:l1-roast
        else kitchen_.serveCold(dish, table); // {{busyLost}} // @step:l1-cold
        bill_ += price; // @step:l1-bill
    }
    void cancel(const std::string& dish, int table, int price) { // {{noRecord}} // @step:l1-cancel
        kitchen_.throwAway(dish, table); // {{hopeRight}} // @step:l1-undo
        bill_ -= price; // {{fixByHand}} // @step:l1-bill
    }
private:
    Kitchen& kitchen_;
    int bill_ = 0; // {{billInHead}}
};
// {{withoutCopy}} // @step:l1-copy
`

const withPattern = `
// {{withAdd}}
class MakeSpicyCommand : public OrderCommand { // {{sameInterface}} // @step:build-class
public:
    MakeSpicyCommand(Kitchen& kitchen, std::string dish, int table)
        : kitchen_(kitchen), dish_(std::move(dish)), table_(table) {}
    int price() const override { return 20; } // {{chiliPrice}}
    void execute() override { kitchen_.addChili(dish_, table_); } // {{chiliOn}} // @step:spicy-exec
    void undo() override { kitchen_.removeChili(dish_, table_); } // {{chiliOff}} // @step:spicy-undo
private:
    Kitchen& kitchen_; // {{askReceiver}} // @step:build-receiver
    std::string dish_;
    int table_;
};

// {{othersSame}}
class OrderRail { /* … */ }; // @step:rail-same
class CookDishCommand : public OrderCommand { /* … */ }; // @step:cook-same

// {{withUse}}
rail.pin(std::make_unique<CookDishCommand>(kitchen, "kacchi", 4, 350)); // @step:l3-order
rail.pin(std::make_unique<MakeSpicyCommand>(kitchen, "kacchi", 4)); // {{newSlip}} // @step:l3-spicy
rail.runNext(); // {{sameRail}} // @step:l3-run
rail.undoLast(); // {{tooHot}} // @step:l3-undo
// {{withZero}}
`

export const cpp: CodeSet = {
  main: { filename: 'order_rail.cpp', source: main },
  without: { filename: 'orders_without_command.cpp', source: without },
  with: { filename: 'orders_with_command.cpp', source: withPattern },
}
