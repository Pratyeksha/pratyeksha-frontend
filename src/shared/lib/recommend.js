/* Cart-aware dish recommendations.
   Inputs are only what this restaurant actually has: its own menu, its own categories and (optionally) its own
   "ordered together" history from the server. Nothing outside the tenant's menu is ever suggested. */

const KINDS = [
  ['dessert',  /dessert|sweet|ice ?cream|kulfi|gulab|halwa|cake|pastry|brownie|mithai/i],
  ['beverage', /beverage|drink|juice|shake|coffee|tea|chai|mocktail|lassi|soda|smoothie|cold|water|milk|buttermilk|chaas|mojito/i],
  ['bread',    /bread|roti|naan|paratha|kulcha|chapati|bhakri|puri|pav/i],
  ['starter',  /starter|appetizer|appetiser|snack|chaat|tikka|kebab|soup|fries|momo|manchurian|pakora|bhaji|vada|samosa/i],
  ['main',     /main|curry|gravy|biryani|rice|pulao|thali|sabzi|dal|pizza|burger|pasta|noodle|sandwich|wrap|combo|meal/i],
  ['side',     /side|salad|raita|papad|pickle|dip/i],
];
export const kindOf = (name = '') => { for (const [k, re] of KINDS) if (re.test(String(name))) return k; return 'other'; };

// what usually completes an order that already contains X (in priority order)
const COMPLEMENTS = {
  main: ['bread', 'side', 'beverage', 'dessert'], starter: ['main', 'beverage', 'dessert'], bread: ['main', 'side'],
  side: ['main', 'beverage'], beverage: ['starter', 'dessert', 'main'], dessert: ['beverage'], other: ['beverage', 'dessert', 'side'],
};

/**
 * @param {{cart:Object, allMenuItems:Array, categories:Array, pairings?:Array<{menuItemId:string,score:number}>, vegOnly?:boolean, limit?:number}} o
 * @returns {Array<{item:Object, reason:string, score:number}>}
 */
export function recommendForCart({ cart, allMenuItems, categories = [], pairings = [], vegOnly = false, limit = 4 }) {
  const cartIds = new Set(); const cartCats = new Set(); const cartKinds = new Set();
  const catName = new Map(categories.map(c => [String(c._id ?? c.categoryId), c.name]));
  const byId = new Map(allMenuItems.map(m => [String(m._id), m]));
  for (const key of Object.keys(cart || {})) {
    const id = key.includes('-') ? key.split('-')[0] : key; const it = byId.get(id); if (!it) continue;
    cartIds.add(id); cartCats.add(String(it.categoryId)); cartKinds.add(kindOf(catName.get(String(it.categoryId)) || it.name));
  }
  if (!cartIds.size) return [];
  const pair = new Map(pairings.map(p => [String(p.menuItemId), p.score]));
  const want = new Map(); // kind → priority bonus
  [...cartKinds].forEach(k => (COMPLEMENTS[k] || COMPLEMENTS.other).forEach((c, i) => { if (!cartKinds.has(c)) want.set(c, Math.max(want.get(c) || 0, 4 - i)); }));
  const out = [];
  for (const m of allMenuItems) {
    const id = String(m._id);
    if (cartIds.has(id) || m.isCombo || m.isAvailable === false) continue;
    if (!catName.has(String(m.categoryId))) continue;                 // must belong to one of THIS tenant's categories
    if (vegOnly && m.isVeg !== true) continue;
    const kind = kindOf(catName.get(String(m.categoryId)) || m.name);
    let score = 0, reason = '';
    if (pair.has(id)) { score += 6 + Math.min(4, pair.get(id)); reason = 'Often ordered together'; }
    if (want.has(kind)) { score += want.get(kind); reason = reason || (kind === 'beverage' ? 'Pairs with a drink' : kind === 'dessert' ? 'Finish with something sweet' : kind === 'bread' ? 'Goes with your curry' : kind === 'main' ? 'Make it a meal' : 'Goes well with your order'); }
    if (cartCats.has(String(m.categoryId))) { score += 0.5; reason = reason || 'More from this section'; }
    if (m.isBestSeller) { score += 1.2; reason = reason || 'Bestseller'; }
    if (m.isChefSpecial) { score += 1; reason = reason || "Chef's pick"; }
    if (score <= 0) continue;
    out.push({ item: m, reason, score });
  }
  out.sort((a, b) => b.score - a.score || String(a.item.name).localeCompare(String(b.item.name)));
  // keep variety: at most 2 per category in the visible list
  const per = new Map(); const picked = [];
  for (const r of out) { const c = String(r.item.categoryId); if ((per.get(c) || 0) >= 2) continue; per.set(c, (per.get(c) || 0) + 1); picked.push(r); if (picked.length >= limit) break; }
  return picked;
}
