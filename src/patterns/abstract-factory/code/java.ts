import type { CodeSet } from '@/types/pattern'

// Same story and @step ids as ts.ts — see CLAUDE.md for the conventions.

const main = `
// {{abstractProducts}}
interface Dish { String name(); int price(); }
interface MainDish extends Dish {}
interface Side extends Dish {}
interface Dessert extends Dish {}

// {{concreteProducts}}
record Kacchi(String name, int price) implements MainDish {}
record Borhani(String name, int price) implements Side {}
record Firni(String name, int price) implements Dessert {}
record FriedRice(String name, int price) implements MainDish {}
record CornSoup(String name, int price) implements Side {}
record Pudding(String name, int price) implements Dessert {}

// {{abstractFactory}}
interface Kitchen {
    MainDish createMain();
    Side createSide();
    Dessert createDessert();
}

// {{concreteFactories}}
class DeshiKitchen implements Kitchen {
    public MainDish createMain() { return new Kacchi("Kacchi biryani", 320); } // @step:deshi-main
    public Side createSide() { return new Borhani("Borhani", 60); } // @step:deshi-side
    public Dessert createDessert() { return new Firni("Firni", 70); } // @step:deshi-dessert
}

class ChineseKitchen implements Kitchen {
    public MainDish createMain() { return new FriedRice("Chicken fried rice", 300); } // @step:chinese-main
    public Side createSide() { return new CornSoup("Corn soup", 140); } // @step:chinese-side
    public Dessert createDessert() { return new Pudding("Custard pudding", 80); } // @step:chinese-dessert
}

// {{client}}
List<Dish> serveCombo(Kitchen kitchen) {
    MainDish main = kitchen.createMain(); // {{noNames}} // @step:deshi-main,chinese-main
    Side side = kitchen.createSide(); // @step:deshi-side,chinese-side
    Dessert dessert = kitchen.createDessert(); // @step:deshi-dessert,chinese-dessert
    return List.of(main, side, dessert); // @step:serve
}

// {{usage}}
Kitchen kitchen = kitchens.get(selectedCuisine); // @step:pick-kitchen
List<Dish> tray = serveCombo(kitchen); // @step:order,done
`

const without = `
// {{withoutIntro}}
List<Dish> serveCombo(String main, String side, String dessert) { // @step:l1-start
    Dish mainDish = createDish(main); // @step:l1-main
    Dish sideDish = createDish(side); // @step:l1-side
    Dish dessertDish = createDish(dessert); // @step:l1-dessert
    return List.of(mainDish, sideDish, dessertDish); // @step:l1-result
}

Dish createDish(String name) {
    return switch (name) {
        case "kacchi" -> new Kacchi("Kacchi biryani", 320);
        case "borhani" -> new Borhani("Borhani", 60);
        case "firni" -> new Firni("Firni", 70);
        case "fried-rice" -> new FriedRice("Chicken fried rice", 300);
        case "corn-soup" -> new CornSoup("Corn soup", 140);
        case "pudding" -> new Pudding("Custard pudding", 80);
        default -> throw new IllegalArgumentException("Unknown dish: " + name);
    };
}

// {{withoutMix}}
serveCombo("kacchi", "corn-soup", "firni"); // @step:l1-order
// {{withoutTodo}} // @step:l1-todo
`

const withPattern = `
// {{withAdd}}
record PadThai(String name, int price) implements MainDish {} // @step:build-kitchen
record TomYum(String name, int price) implements Side {} // @step:build-kitchen
record MangoStickyRice(String name, int price) implements Dessert {} // @step:build-kitchen

class ThaiKitchen implements Kitchen { // @step:build-kitchen
    public MainDish createMain() { return new PadThai("Pad thai", 380); } // @step:thai-main
    public Side createSide() { return new TomYum("Tom yum soup", 180); } // @step:thai-side
    public Dessert createDessert() { return new MangoStickyRice("Mango sticky rice", 90); } // @step:thai-dessert
}

// {{withSame}}
List<Dish> tray = serveCombo(new ThaiKitchen()); // @step:thai-order,thai-done
`

export const java: CodeSet = {
  main: { filename: 'Restaurant.java', source: main },
  without: { filename: 'RestaurantWithoutAbstractFactory.java', source: without },
  with: { filename: 'RestaurantWithAbstractFactory.java', source: withPattern },
}
