import type { CodeSet } from '@/types/pattern'

/*
 * Conventions (see CLAUDE.md):
 *   // {{key}}        → translated comment from content.<lang>.ts → codeComments[key]
 *   // @step:a,b      → this line lights up while visual step a or b runs (stripped on display)
 */

const main = `
// {{abstractProducts}}
interface Dish { readonly name: string; readonly price: number }
interface MainDish extends Dish {}
interface Side extends Dish {}
interface Dessert extends Dish {}

// {{concreteProducts}}
class Kacchi implements MainDish { name = 'Kacchi biryani'; price = 320; }
class Borhani implements Side { name = 'Borhani'; price = 60; }
class Firni implements Dessert { name = 'Firni'; price = 70; }
class FriedRice implements MainDish { name = 'Chicken fried rice'; price = 300; }
class CornSoup implements Side { name = 'Corn soup'; price = 140; }
class Pudding implements Dessert { name = 'Custard pudding'; price = 80; }

// {{abstractFactory}}
interface Kitchen {
  createMain(): MainDish;
  createSide(): Side;
  createDessert(): Dessert;
}

// {{concreteFactories}}
class DeshiKitchen implements Kitchen {
  createMain() { return new Kacchi(); } // @step:deshi-main
  createSide() { return new Borhani(); } // @step:deshi-side
  createDessert() { return new Firni(); } // @step:deshi-dessert
}

class ChineseKitchen implements Kitchen {
  createMain() { return new FriedRice(); } // @step:chinese-main
  createSide() { return new CornSoup(); } // @step:chinese-side
  createDessert() { return new Pudding(); } // @step:chinese-dessert
}

// {{client}}
function serveCombo(kitchen: Kitchen): Dish[] {
  const main = kitchen.createMain(); // {{noNames}} // @step:deshi-main,chinese-main
  const side = kitchen.createSide(); // @step:deshi-side,chinese-side
  const dessert = kitchen.createDessert(); // @step:deshi-dessert,chinese-dessert
  return [main, side, dessert]; // @step:serve
}

// {{usage}}
const kitchen: Kitchen = kitchens[selectedCuisine]; // @step:pick-kitchen
const tray = serveCombo(kitchen); // @step:order,done
`

const without = `
// {{withoutIntro}}
function serveCombo(main: string, side: string, dessert: string): Dish[] { // @step:l1-start
  const mainDish = createDish(main); // @step:l1-main
  const sideDish = createDish(side); // @step:l1-side
  const dessertDish = createDish(dessert); // @step:l1-dessert
  return [mainDish, sideDish, dessertDish]; // @step:l1-result
}

function createDish(name: string): Dish {
  if (name === 'kacchi') return new Kacchi();
  if (name === 'borhani') return new Borhani();
  if (name === 'firni') return new Firni();
  if (name === 'fried-rice') return new FriedRice();
  if (name === 'corn-soup') return new CornSoup();
  if (name === 'pudding') return new Pudding();
  throw new Error('Unknown dish: ' + name);
}

// {{withoutMix}}
serveCombo('kacchi', 'corn-soup', 'firni'); // @step:l1-order
// {{withoutTodo}} // @step:l1-todo
`

const withPattern = `
// {{withAdd}}
class PadThai implements MainDish { name = 'Pad thai'; price = 380; } // @step:build-kitchen
class TomYum implements Side { name = 'Tom yum soup'; price = 180; } // @step:build-kitchen
class MangoStickyRice implements Dessert { name = 'Mango sticky rice'; price = 90; } // @step:build-kitchen

class ThaiKitchen implements Kitchen { // @step:build-kitchen
  createMain() { return new PadThai(); } // @step:thai-main
  createSide() { return new TomYum(); } // @step:thai-side
  createDessert() { return new MangoStickyRice(); } // @step:thai-dessert
}

// {{withSame}}
const tray = serveCombo(new ThaiKitchen()); // @step:thai-order,thai-done
`

export const ts: CodeSet = {
  main: { filename: 'restaurant.ts', source: main },
  without: { filename: 'restaurant-without-abstract-factory.ts', source: without },
  with: { filename: 'restaurant-with-abstract-factory.ts', source: withPattern },
}
