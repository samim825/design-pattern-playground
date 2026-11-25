import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
// {{component}}
class Snack {
public:
    virtual ~Snack() = default;
    virtual int cost() const = 0;
    virtual std::string describe() const = 0;
};

// {{concrete}}
class Fuchka : public Snack {
public:
    int cost() const override { return 60; } // {{basePrice}} // @step:core
    std::string describe() const override { return "Fuchka"; } // @step:describe
};

// {{decorator}}
class Topping : public Snack {
protected:
    std::unique_ptr<Snack> inner; // {{wrapsAny}}
public:
    explicit Topping(std::unique_ptr<Snack> s) : inner(std::move(s)) {} // @step:wrap-egg,wrap-chanachur,wrap-spicy
};

// {{concreteDecorators}}
class Egg : public Topping {
public:
    using Topping::Topping;
    int cost() const override { return inner->cost() + 20; } // {{passIn}} // @step:in-egg,out-egg
    std::string describe() const override { return inner->describe() + " + egg"; } // @step:describe
};

class Chanachur : public Topping {
public:
    using Topping::Topping;
    int cost() const override { return inner->cost() + 10; } // @step:in-chanachur,out-chanachur
    std::string describe() const override { return inner->describe() + " + chanachur"; } // @step:describe
};

class ExtraSpicy : public Topping {
public:
    using Topping::Topping;
    int cost() const override { return inner->cost() + 5; } // @step:in-spicy,out-spicy
    std::string describe() const override { return inner->describe() + " + extra spicy"; } // @step:describe
};

// {{usage}}
std::unique_ptr<Snack> plate = std::make_unique<Fuchka>(); // @step:base
plate = std::make_unique<Egg>(std::move(plate)); // {{wrapLayer}} // @step:wrap-egg
plate = std::make_unique<Chanachur>(std::move(plate)); // @step:wrap-chanachur
plate = std::make_unique<ExtraSpicy>(std::move(plate)); // @step:wrap-spicy

int total = plate->cost(); // {{oneCall}} // @step:call,done
std::string receipt = plate->describe(); // {{sameTrip}} // @step:describe
`

const without = `
// {{withoutIntro}}
class Fuchka {
public:
    virtual ~Fuchka() = default;
    virtual int cost() const { return 60; }
    virtual std::string describe() const { return "Fuchka"; }
};

class FuchkaWithEgg : public Fuchka {
public:
    int cost() const override { return 80; } // {{hardcoded}} // @step:l1-cost
    std::string describe() const override { return "Fuchka + egg"; } // @step:l1-describe
};

class FuchkaWithSpicy : public Fuchka {
public:
    int cost() const override { return 65; } // @step:l1-cost
    std::string describe() const override { return "Fuchka + extra spicy"; } // @step:l1-describe
};

// {{withoutCopy}}
class FuchkaWithEggAndSpicy : public Fuchka { // @step:l1-write
public:
    int cost() const override { return 85; } // {{copyPrice}} // @step:l1-cost
    std::string describe() const override { return "Fuchka + egg + extra spicy"; } // @step:l1-describe
};

// {{withoutPick}}
FuchkaWithEggAndSpicy plate; // @step:l1-pick
serve(karim, plate.describe(), plate.cost()); // @step:l1-serve,l1-result
// {{withoutTodo}} // @step:l1-count
`

const withPattern = `
// {{withAdd}}
class TokDoi : public Topping { // @step:build-class
public:
    using Topping::Topping;
    int cost() const override { return inner->cost() + 30; } // {{onlyNew}} // @step:build-cost,in-tokdoi,out-tokdoi
    std::string describe() const override { return inner->describe() + " + tok-doi"; } // @step:build-cost,describe-new
};

// {{withSame}}
std::unique_ptr<Snack> plate = std::make_unique<Fuchka>(); // @step:base-new
plate = std::make_unique<TokDoi>(std::move(plate)); // {{justWrap}} // @step:wrap-tokdoi
plate = std::make_unique<Chanachur>(std::move(plate)); // {{oldStillWork}} // @step:wrap-old

int total = plate->cost(); // {{costUnchanged}} // @step:call-new,inner-old,done-new
std::string receipt = plate->describe(); // @step:describe-new

// {{withZero}}
`

export const cpp: CodeSet = {
  main: { filename: 'fuchka.cpp', source: main },
  without: { filename: 'fuchka_without_decorator.cpp', source: without },
  with: { filename: 'fuchka_with_decorator.cpp', source: withPattern },
}
