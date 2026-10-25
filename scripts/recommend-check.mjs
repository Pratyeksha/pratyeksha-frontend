import assert from 'node:assert/strict';
import { recommendForCart, kindOf } from '../src/recommend.js';
const cats = [{ _id: 'c1', name: 'Starters' }, { _id: 'c2', name: 'Main Course' }, { _id: 'c3', name: 'Breads' }, { _id: 'c4', name: 'Beverages' }, { _id: 'c5', name: 'Desserts' }];
const m = (id, categoryId, name, extra = {}) => ({ _id: id, categoryId, name, isAvailable: true, isVeg: true, ...extra });
const menu = [m('a1', 'c1', 'Paneer Tikka'), m('b1', 'c2', 'Dal Tadka'), m('b2', 'c2', 'Butter Chicken', { isVeg: false }), m('r1', 'c3', 'Butter Naan'), m('r2', 'c3', 'Tandoori Roti'), m('d1', 'c4', 'Masala Chaas'), m('d2', 'c4', 'Cold Coffee'), m('s1', 'c5', 'Gulab Jamun'), m('x1', 'c5', 'Out of stock sweet', { isAvailable: false }), m('z1', 'zzz', 'Ghost item of another menu'), m('combo_1', '__combos__', 'Thali', { isCombo: true })];
assert.equal(kindOf('Main Course'), 'main'); assert.equal(kindOf('Breads'), 'bread'); assert.equal(kindOf('Beverages'), 'beverage');
// mains in cart → bread/side/drink/dessert suggested, never the carted dish, nothing unavailable/foreign/combo
let r = recommendForCart({ cart: { b1: 1 }, allMenuItems: menu, categories: cats });
const ids = r.map(x => x.item._id); console.log('main →', ids.join(','));
assert.ok(!ids.includes('b1') && !ids.includes('x1') && !ids.includes('z1') && !ids.includes('combo_1'));
assert.ok(ids.includes('r1') || ids.includes('r2')); assert.ok(r.every(x => x.reason));
assert.ok(r.filter(x => x.item.categoryId === 'c3').length <= 2);
// veg-only never suggests non-veg
r = recommendForCart({ cart: { a1: 1 }, allMenuItems: menu, categories: cats, vegOnly: true }); assert.ok(!r.some(x => x.item._id === 'b2'));
// real order history outranks the rules
r = recommendForCart({ cart: { b1: 1 }, allMenuItems: menu, categories: cats, pairings: [{ menuItemId: 's1', score: 5 }] }); assert.equal(r[0].item._id, 's1'); assert.equal(r[0].reason, 'Often ordered together');
// portion keys + empty cart
assert.ok(recommendForCart({ cart: { 'b1-Half': 1 }, allMenuItems: menu, categories: cats }).length > 0);
assert.deepEqual(recommendForCart({ cart: {}, allMenuItems: menu, categories: cats }), []);
// drinks only → starters/desserts
r = recommendForCart({ cart: { d1: 2 }, allMenuItems: menu, categories: cats }); console.log('drink →', r.map(x => x.item._id).join(',')); assert.ok(r.some(x => x.item._id === 'a1' || x.item._id === 's1'));
console.log('recommend checks passed');
