import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
// {{abstractProducts}}
struct Dish { std::string name; int price = 0; virtual ~Dish() = default; };
struct MainDish : Dish {};
struct Side : Dish {};
struct Dessert : Dish {};

// {{concreteProducts}}
struct Kacchi : MainDish { Kacchi() { name = "Kacchi biryani"; price = 320; } };
struct Borhani : Side { Borhani() { name = "Borhani"; price = 60; } };
struct Firni : Dessert { Firni() { name = "Firni"; price = 70; } };
struct FriedRice : MainDish { FriedRice() { name = "Chicken fried rice"; price = 300; } };
struct CornSoup : Side { CornSoup() { name = "Corn soup"; price = 140; } };
struct Pudding : Dessert { Pudding() { name = "Custard pudding"; price = 80; } };

// {{abstractFactory}}
class Kitchen {
public:
    virtual ~Kitchen() = default;
    virtual std::unique_ptr<MainDish> createMain() const = 0;
    virtual std::unique_ptr<Side> createSide() const = 0;
    virtual std::unique_ptr<Dessert> createDessert() const = 0;
};

// {{concreteFactories}}
class DeshiKitchen : public Kitchen {
public:
    std::unique_ptr<MainDish> createMain() const override { return std::make_unique<Kacchi>(); } // @step:deshi-main
    std::unique_ptr<Side> createSide() const override { return std::make_unique<Borhani>(); } // @step:deshi-side
    std::unique_ptr<Dessert> createDessert() const override { return std::make_unique<Firni>(); } // @step:deshi-dessert
};

class ChineseKitchen : public Kitchen {
public:
    std::unique_ptr<MainDish> createMain() const override { return std::make_unique<FriedRice>(); } // @step:chinese-main
    std::unique_ptr<Side> createSide() const override { return std::make_unique<CornSoup>(); } // @step:chinese-side
    std::unique_ptr<Dessert> createDessert() const override { return std::make_unique<Pudding>(); } // @step:chinese-dessert
};

// {{client}}
Combo serveCombo(const Kitchen& kitchen) {
    auto main = kitchen.createMain(); // {{noNames}} // @step:deshi-main,chinese-main
    auto side = kitchen.createSide(); // @step:deshi-side,chinese-side
    auto dessert = kitchen.createDessert(); // @step:deshi-dessert,chinese-dessert
    return {std::move(main), std::move(side), std::move(dessert)}; // @step:serve
}

// {{usage}}
const Kitchen& kitchen = kitchenFor(selectedCuisine); // @step:pick-kitchen
Combo tray = serveCombo(kitchen); // @step:order,done
`

const without = `
// {{withoutIntro}}
Combo serveCombo(const std::string& main, const std::string& side, const std::string& dessert) { // @step:l1-start
    auto mainDish = createDish(main); // @step:l1-main
    auto sideDish = createDish(side); // @step:l1-side
    auto dessertDish = createDish(dessert); // @step:l1-dessert
    return {std::move(mainDish), std::move(sideDish), std::move(dessertDish)}; // @step:l1-result
}

std::unique_ptr<Dish> createDish(const std::string& name) {
    if (name == "kacchi") return std::make_unique<Kacchi>();
    if (name == "borhani") return std::make_unique<Borhani>();
    if (name == "firni") return std::make_unique<Firni>();
    if (name == "fried-rice") return std::make_unique<FriedRice>();
    if (name == "corn-soup") return std::make_unique<CornSoup>();
    if (name == "pudding") return std::make_unique<Pudding>();
    throw std::invalid_argument("Unknown dish: " + name);
}

// {{withoutMix}}
serveCombo("kacchi", "corn-soup", "firni"); // @step:l1-order
// {{withoutTodo}} // @step:l1-todo
`

const withPattern = `
// {{withAdd}}
struct PadThai : MainDish { PadThai() { name = "Pad thai"; price = 380; } }; // @step:build-kitchen
struct TomYum : Side { TomYum() { name = "Tom yum soup"; price = 180; } }; // @step:build-kitchen
struct MangoStickyRice : Dessert { MangoStickyRice() { name = "Mango sticky rice"; price = 90; } }; // @step:build-kitchen

class ThaiKitchen : public Kitchen { // @step:build-kitchen
public:
    std::unique_ptr<MainDish> createMain() const override { return std::make_unique<PadThai>(); } // @step:thai-main
    std::unique_ptr<Side> createSide() const override { return std::make_unique<TomYum>(); } // @step:thai-side
    std::unique_ptr<Dessert> createDessert() const override { return std::make_unique<MangoStickyRice>(); } // @step:thai-dessert
};

// {{withSame}}
Combo tray = serveCombo(ThaiKitchen{}); // @step:thai-order,thai-done
`

export const cpp: CodeSet = {
  main: { filename: 'restaurant.cpp', source: main },
  without: { filename: 'restaurant_without_abstract_factory.cpp', source: without },
  with: { filename: 'restaurant_with_abstract_factory.cpp', source: withPattern },
}
