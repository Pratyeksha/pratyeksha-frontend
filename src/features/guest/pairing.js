// "Goes well with your order": suggestions that are actually related to the dishes in the cart.
// Order of trust: (1) pairings the owner configured on the dish (relatedItems), (2) classic food pairings driven by what is
// in the cart (curry -> bread/rice, biryani -> raita, pizza -> cold drink ...), (3) the course the meal is still missing
// (drink / dessert / bread). Diet is respected: an all-veg cart only ever gets veg suggestions. Nothing unrelated is
// shown as a fallback; with no good match the strip stays hidden.

const RE = {
  drink:   /drink|beverage|juice|coffee|\btea\b|chai|shake|lassi|soda|cola|mojito|mocktail|\bwater\b|latte|cappuccino|espresso|smoothie|buttermilk|chaas|chhas|sharbat|lemonade|nimbu|cold ?brew|sherbet|thandai|frappe/,
  dessert: /dessert|sweet|ice ?cream|cake|brownie|pastry|gulab|kulfi|cookie|waffle|halwa|rasmalai|rasgulla|jalebi|sundae|falooda|mousse|pudding|shrikhand|basundi|payasam/,
  bread:   /\bbread|roti|naan|kulcha|paratha|parantha|chapati|chapatti|phulka|bhakri|\bpuri\b|poori|\bpav\b|\bpaav\b|\bbun\b|garlic bread|tandoori roti|rumali/,
  rice:    /\brice\b|pulao|pulav|khichdi|jeera rice|steamed rice|fried rice/,
  soup:    /soup|shorba|broth/,
  side:    /raita|salad|papad|papadum|pickle|achar|chutney|\bdip\b|salan|\bcurd\b|\bdahi\b|kachumber|onion rings/,
  starter: /starter|appetizer|appetiser|tikka|kebab|kabab|\b65\b|manchurian|pakora|pakoda|bhaji|fries|crispy|chilli|lollipop|momo|spring roll|nugget|finger|bites|snack|samosa|vada pav|cutlet|tandoori/,
};
const CURRY = /masala|curry|gravy|kadai|kadhai|korma|makhani|handi|bhuna|\bdal\b|dal |sabzi|sabji|kofta|palak|chole|chana|rajma|paneer|shahi|lababdar|kolhapuri|saoji|patiala|mutter|matar|aloo gobi|butter chicken|tikka masala/;

// Dishes that merely contain a curry-ish word (Masala Dosa, Pizza Masala...) but are not gravy dishes.
const NOT_CURRY = /dosa|idli|uttapam|uttappam|vada|upma|appam|pizza|burger|noodle|pasta|sandwich|wrap|\broll\b|momo|biryani|pulao|pulav|thali|chai|coffee|tea\b/;
const isCurry = (name) => CURRY.test(name) && !NOT_CURRY.test(name);

const textOf = (m, catName) => `${m.name || ''} ${m.name_mr || ''} ${catName || ''} ${(Array.isArray(m.tags) ? m.tags.join(' ') : m.tags || '')}`.toLowerCase();

export const kindOf = (m, catName = '') => {
  const t = textOf(m, catName);
  const name = String(m.name || '').toLowerCase();
  const cat = String(catName || '').toLowerCase();
  if (RE.dessert.test(cat) || RE.dessert.test(name)) return 'dessert';
  if (RE.drink.test(cat) || RE.drink.test(name)) return 'drink';
  if (RE.soup.test(cat) || RE.soup.test(name)) return 'soup';
  if (RE.bread.test(cat) || (RE.bread.test(name) && !isCurry(name))) return 'bread';
  if (RE.side.test(cat) || (RE.side.test(name) && !isCurry(name))) return 'side';
  if (isCurry(name) && !/tikka(?! masala)|kebab|kabab/.test(name)) return 'main';
  if (RE.starter.test(cat) || RE.starter.test(name)) return 'starter';
  if (/rice|pulao|biryani|khichdi/.test(name)) return 'main';
  return 'main';
};

// cart-dish pattern  ->  what goes with it (tested against the candidate's name / category / tags) + strength
const RULES = [
  { when: /biryani|pulao|pulav/,                         want: [[/raita|salad|papad|salan|\bdahi\b|curd/, 6], [RE.drink, 3], [RE.dessert, 2]] },
  { when: /pizza|pasta|lasagna|garlic bread/,            want: [[/garlic bread|cheesy|dip|fries|wedges/, 5], [/cola|soda|shake|coke|pepsi|mojito|cold ?drink|iced/, 5], [RE.dessert, 2]] },
  { when: /burger|sandwich|wrap|roll|sub\b|frankie|hot ?dog/, want: [[/fries|wedges|nuggets|onion rings/, 6], [/shake|cola|soda|coke|pepsi|mojito|cold ?drink|iced|lemonade/, 5], [RE.dessert, 2]] },
  { when: /noodle|manchurian|hakka|schezwan|szechuan|chowmein|chow mein|fried rice|chinese|spring roll|momo|dim ?sum/, want: [[RE.soup, 5], [/spring roll|momo|manchurian|chilli|crispy/, 4], [RE.drink, 3]] },
  { when: /dosa|idli|uttapam|uttappam|vada\b|medu|sambar|upma|appam/, want: [[/filter coffee|filter kaapi|kaapi/, 8], [/coffee|\btea\b|chai/, 5], [/vada|idli|chutney|sambar|podi/, 4], [RE.dessert, 1]] },
  { when: /misal|usal|pav bhaji|vada pav|bhaji pav|sabudana|poha|thalipeeth/, want: [[/\bpav\b|paav|bhaji|papad/, 5], [/buttermilk|chaas|lassi|\btea\b|chai|kokum|sol kadhi/, 5]] },
  { when: /thali|meal/,                                  want: [[/lassi|buttermilk|chaas|sol kadhi/, 5], [RE.dessert, 4], [/papad|salad|pickle/, 3]] },
  { when: /tikka(?! masala)|kebab|kabab|tandoori|65|lollipop|pakora|pakoda|crispy|chilli/, want: [[CURRY, 5], [RE.bread, 4], [/raita|salad|chutney|dip/, 4], [RE.drink, 3]] },
  { when: /soup|shorba/,                                 want: [[RE.starter, 4], [CURRY, 3], [RE.bread, 2]] },
  { when: /sweet|dessert|cake|ice ?cream|gulab|brownie|kulfi|jalebi|halwa/, want: [[/coffee|\btea\b|chai|espresso|cappuccino/, 5], [/ice ?cream|vanilla/, 2]] },
  { light: true, when: /coffee|\btea\b|chai|latte|cappuccino|espresso/, want: [[RE.starter, 3], [/cookie|brownie|cake|pastry|sandwich|samosa|bun|toast|vada pav/, 5]] },
  { light: true, when: /shake|lassi|juice|cola|soda|mojito|lemonade|buttermilk/, want: [[RE.starter, 3], [RE.dessert, 2]] },
];
const NEEDS_CARB = [RE.bread, RE.rice];

// Menu structure is different for every restaurant, so the engine also works from the restaurant's OWN categories:
// a dish from the same category as something in the cart is a natural suggestion, and so is a dish from a related category
// (starters <-> mains <-> breads <-> drinks <-> desserts ...). Categories are grouped into families by their names.
const FAMILIES = [
  ['starter', /starter|appetizer|appetiser|snack|tandoor|kebab|tikka|chaat|fried|bites|finger|small plates/],
  ['soup',    /soup|shorba/],
  ['main',    /main|curry|gravy|sabzi|sabji|entree|entr[eé]e|thali|combo meal|non.?veg|veg\b|dal\b|sizzler|continental/],
  ['bread',   /bread|roti|naan|kulcha|paratha|tandoori roti/],
  ['rice',    /rice|biryani|pulao|khichdi/],
  ['chinese', /chinese|noodle|oriental|asian|momo|indo.?chinese/],
  ['fast',    /fast ?food|burger|pizza|pasta|sandwich|wrap|roll|italian|street/],
  ['south',   /south|dosa|idli|uttapam/],
  ['side',    /side|salad|raita|papad|accompaniment/],
  ['drink',   /drink|beverage|juice|shake|coffee|tea\b|chai|lassi|mocktail|cold|soda|smoothie|mojito/],
  ['dessert', /dessert|sweet|ice ?cream|cake|bakery|pastry/],
];
const familyOf = (catName) => { const n = String(catName || '').toLowerCase(); for (const [f, re] of FAMILIES) if (re.test(n)) return f; return 'other'; };
const RELATED = {
  starter: ['main', 'soup', 'bread', 'drink', 'side'], soup: ['starter', 'main', 'bread'], main: ['bread', 'rice', 'side', 'drink', 'dessert', 'starter'],
  bread: ['main', 'side'], rice: ['main', 'side', 'drink', 'dessert'], chinese: ['soup', 'starter', 'drink', 'dessert'], fast: ['drink', 'side', 'dessert', 'starter'],
  south: ['drink', 'side', 'dessert'], side: ['main', 'rice', 'bread'], drink: ['starter', 'fast', 'dessert', 'south'], dessert: ['drink'], other: [],
};

const cap = (v) => (Array.isArray(v) ? v : []).map((x) => String(x && (x._id || x.id || x))).filter(Boolean);

/**
 * @param cartItems    menu items currently in the cart (full menu objects)
 * @param menu         every menu item of the restaurant
 * @param categoryList [{ categoryId, name, ... }]
 * @param vegOnly      guest turned on the veg filter / restaurant is veg only
 * @returns up to `max` menu items, best first
 */
export function recommendPairings({ cartItems, menu, categoryList = [], vegOnly = false, max = 6 }) {
  cartItems = (cartItems || []).filter((m) => m && !m.isCombo);   // combos are bundles of dishes, not dishes
  menu = (menu || []).filter((m) => m && !m.isCombo);
  if (!cartItems.length || !menu.length) return [];
  const catName = (m) => String(
    categoryList.find((c) => String(c.categoryId) === String(m.categoryId))?.name ||
    categoryList.find((c) => String(c._id) === String(m.categoryId))?.name || ''
  ).toLowerCase();

  const inCart = new Set(cartItems.map((m) => String(m._id)));
  const cartNames = new Set(cartItems.map((m) => String(m.name || '').trim().toLowerCase()));
  const cartTexts = cartItems.map((m) => textOf(m, catName(m)));
  const cartKinds = new Set(cartItems.map((m) => kindOf(m, catName(m))));
  const curated = new Set(cartItems.flatMap((m) => cap(m.relatedItems)));
  const allVeg = cartItems.every((m) => m.isVeg === true);
  const mustBeVeg = !!vegOnly || allVeg;
  const cartCats = new Set(cartItems.map((m) => String(m.categoryId)));
  const cartFamilies = new Set(cartItems.map((m) => familyOf(catName(m))));
  const relatedFamilies = new Set([...cartFamilies].flatMap((f) => RELATED[f] || []));
  const hasCarb = cartItems.some((m, i) => NEEDS_CARB.some((r) => r.test(cartTexts[i])) || /biryani|pulao|thali|meal|khichdi/.test(cartTexts[i]));
  const hasCurry = cartItems.some((m, i) => kindOf(m, catName(m)) === 'main' && isCurry(String(m.name || '').toLowerCase()));

  // course the meal is still missing, in the order a guest would want it
  const gaps = [];
  if (hasCurry && !hasCarb) gaps.push('bread');
  if (!cartKinds.has('drink')) gaps.push('drink');
  if (!cartKinds.has('dessert')) gaps.push('dessert');

  const scored = [];
  for (const m of menu) {
    if (!m || inCart.has(String(m._id)) || m.isAvailable === false) continue;
    if (!(Number(m.priceHalf) > 0 || Number(m.priceFull) > 0 || Number(m.price) > 0)) continue;
    if (mustBeVeg && m.isVeg !== true) continue;
    const nm = String(m.name || '').trim().toLowerCase();
    if (!nm || cartNames.has(nm)) continue;
    const cn = catName(m);
    const t = textOf(m, cn);
    const kind = kindOf(m, cn);
    let score = 0, why = '';

    const isCurated = curated.has(String(m._id));
    // Never repeat a course the guest already has (a second drink / dessert / bread / soup), unless the owner curated it.
    if (!isCurated && ['drink', 'dessert', 'bread', 'soup'].includes(kind) && cartKinds.has(kind)) continue;
    if (isCurated) { score += 100; why = 'owner'; }                                          // (1) the owner's own pairing

    let rule = 0;                                                                            // (2) classic pairing for what is in the cart
    for (const r of RULES) {
      if (r.light && (cartKinds.has('main') || cartKinds.has('starter'))) continue;   // "coffee -> snack" is for light orders only
      if (!cartTexts.some((ct) => r.when.test(ct))) continue;
      for (const [re, w] of r.want) {
        if (re === CURRY && kind !== 'main') continue;          // a curry pairing only applies to real gravy dishes (not "Masala Chai")
        if (re.test(t) && w > rule) rule = w;
      }
    }
    if (rule) { score += rule * 3; why = why || 'rule'; }

    const gi = gaps.indexOf(kind);                                                          // (3) the missing course
    if (gi !== -1) { score += (3 - gi); why = why || 'gap'; }

    // From the restaurant's own menu structure: same category as a cart dish, or a category that goes with it.
    const sameCat = cartCats.has(String(m.categoryId));
    const relCat = !sameCat && relatedFamilies.has(familyOf(cn)) && !cartFamilies.has(familyOf(cn));
    if (sameCat) { score += 4; why = why || 'cat'; }
    else if (relCat) { score += 2; why = why || 'rel'; }

    // A second main course is only suggested if it is curated, a deliberate pairing, or a sibling from the same category.
    if (kind === 'main' && !why) continue;
    if (score <= 0) continue;
    score += (m.isBestSeller ? 1.5 : 0) + (m.isChefSpecial ? 1 : 0);
    scored.push({ m, score, kind });
  }
  scored.sort((a, b) => b.score - a.score);

  // diversity: no more than 2 suggestions of the same kind, so the strip is not six desserts
  const out = [], perKind = {};
  for (const s of scored) {
    if ((perKind[s.kind] || 0) >= 2 && s.score < 100) continue;
    perKind[s.kind] = (perKind[s.kind] || 0) + 1;
    out.push(s.m);
    if (out.length >= max) break;
  }
  return out;
}
