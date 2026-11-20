import { createEngine } from './chatEngine.js'
const n = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim()
const L = { en: { openNow: 'Open now', closesAt: 'closes', closedNow: 'Closed', validTill: 'Valid till', minBill: 'Min', useCode: 'Code', closingSoon: 'Closing soon', minShort: 'min', open24: '24h', tempClosed: 'Temp closed', opensSoon: 'Opens in {n}', tomorrow: 'tomorrow', opensAt: 'opens', days: [] }, mr: {} }; L.mr = L.en
const kit = {
  L, openStatus: (h) => (h ? { state: h.open ? 'open' : 'closed' } : null), statusLabel: (s) => (s ? { text: s.state } : null),
  bestOffer: (t) => (t.activeOffers || [])[0] || null, offerValue: (o) => `${o.value}% OFF`, offerTerms: () => '', offerRank: (o) => o.value,
  distanceKm: (p, t) => (p && t.address?.lat ? Math.hypot(p.lat - t.address.lat, p.lng - t.address.lng) * 111 : null), fmtKm: (k) => `${k.toFixed(1)} km`,
  areaOf: (t) => t.address?.area || '', isCafe: (t) => /cafe/i.test(t.businessType), addressLine: (t) => [t.address?.street, t.address?.area].filter(Boolean).join(', '),
  hoursRange: () => '9 AM – 10 PM', isFeatured: (t) => !!t.featured,
  matchWhy: (t, q, menu) => { const m = menu.map.get(t.tenantId); if (!m) return null; const cat = m.cats.filter((c) => c.lc.includes(q)).map((c) => c.raw); const dish = m.dishes.filter((c) => c.lc.includes(q)).map((c) => c.raw); return cat.length || dish.length ? { w: cat.length ? 'category' : 'dish', category: cat, dish } : null },
}
const T = (id, name, type, area, extra = {}) => ({ tenantId: id, name, businessType: type, address: { area, street: 'Main Rd', lat: 16.7 + Math.random() / 100, lng: 74.2 }, hours: { open: extra.open !== false }, activeOffers: extra.offers || [], config: { onlyVeg: !!extra.veg }, contact: extra.phone || '', ...extra.rest })
const tenants = [T('a', 'Brew Lab Cafe', 'Cafe', 'Rajarampuri', { offers: [{ value: 20, title: 'Happy' }], phone: '+91 98765 43210' }), T('b', 'Misal House', 'Restaurant', 'Shahupuri', { veg: true }), T('c', 'Royal Biryani Darbar', 'Restaurant', 'Rajarampuri', { open: false }), T('d', 'Green Leaf Veg', 'Restaurant', 'Tarabai Park', { veg: true, offers: [{ value: 10 }] })]
const raw = { tenants: { a: { c: ['Coffee', 'Cold Coffee', 'Sandwich'], d: ['Cold Coffee', 'Cappuccino'] }, b: { c: ['Misal'], d: ['Kolhapuri Misal', 'Vada Pav'] }, c: { c: ['Biryani'], d: ['Chicken Biryani', 'Mutton Biryani'] }, d: { c: ['Thali'], d: ['Veg Biryani', 'Paneer Thali'] } } }
const map = new Map(); for (const [id, e] of Object.entries(raw.tenants)) map.set(id, { cats: e.c.map((x) => ({ raw: x, lc: n(x) })), dishes: e.d.map((x) => ({ raw: x, lc: n(x) })) })
const menu = { map, top: [] }
const eng = createEngine(kit)
let mem = {}; let pos = null; let fails = 0
const ask = (q, opts = {}) => { const r = eng.reply(q, { tenants, menu, pos, lang: opts.lang || 'en', now: Date.now(), name: 'Shree', favs: opts.favs }, mem); mem = r.memory; return r }
const names = (r) => r.blocks.flatMap((b) => b.ids ? b.ids.map((i) => tenants.find((t) => t.tenantId === i).name) : b.id ? [tenants.find((t) => t.tenantId === b.id).name] : b.items ? b.items.map((i) => 'OFFER:' + i.id) : [])
const T1 = (q, check, label) => { const r = ask(q); const ok = (() => { try { return check(r) } catch { return false } })(); if (!ok) { fails++; console.log('FAIL', q, JSON.stringify(r.blocks).slice(0, 300)) } else console.log('ok  ', q.padEnd(34), '->', (r.blocks[0].text || r.blocks[0].t).slice(0, 58), '|', names(r).join(', ')) }
T1('hi', (r) => /Shree/.test(r.blocks[0].text))
T1('biryani', (r) => names(r).includes('Royal Biryani Darbar') && names(r).includes('Green Leaf Veg'))
T1('veg biryani', (r) => names(r).join() === 'Green Leaf Veg')
T1('biriyani please', (r) => /Did you mean/.test(r.blocks[0].text) && names(r).length >= 1)
T1('cold coffee in rajarampuri', (r) => names(r).join() === 'Brew Lab Cafe')
T1('the first one', (r) => names(r).join() === 'Brew Lab Cafe')
T1('what are its timings', (r) => /Brew Lab/.test(r.blocks[0].text) && /Mon/.test(r.blocks[0].text))
T1('call', (r) => /98765/.test(r.blocks[0].text))
T1('directions', (r) => /Main Rd/.test(r.blocks[0].text))
T1('offers', (r) => r.blocks.some((b) => b.t === 'offers' && b.items.length === 2))
T1('open now', (r) => !names(r).includes('Royal Biryani Darbar') && names(r).length === 3)
T1('cafes', (r) => names(r).join() === 'Brew Lab Cafe')
T1('pure veg', (r) => names(r).sort().join() === 'Green Leaf Veg,Misal House')
T1('only with offers', (r) => names(r).join() === 'OFFER:d')
T1('tell me about royal biryani', (r) => names(r).join() === 'Royal Biryani Darbar')
T1('is brew lab open', (r) => names(r).join() === 'Brew Lab Cafe')
T1('surprise me', (r) => r.blocks.some((b) => b.t === 'place'))
T1('near me', (r) => r.wantsLocation)
pos = { lat: 16.7, lng: 74.2 }
T1('nearest cafe', (r) => !r.wantsLocation && names(r).join() === 'Brew Lab Cafe')
T1('how do i order', (r) => r.blocks[0].t === 'steps')
T1('misal', (r) => names(r).join() === 'Misal House')
T1('mere paas pizza', (r) => /couldn/i.test(r.blocks[0].text))
T1('asdfgh', (r) => r.blocks[0].t === 'text')
T1('कोल्ड कॉफी', (r) => r.blocks[0].t === 'text')
T1('ऑफर', (r) => r.lang === 'mr' && r.blocks.some((b) => b.t === 'offers'))
T1('namaste', (r) => r.lang === 'mr' || r.blocks[0].t === 'text')
T1('thanks', (r) => r.blocks[0].t === 'text')
T1('biryani', (r) => r.suggest.length > 0)
T1('more', (r) => /everything|Here/.test(r.blocks[0].text || ''))
console.log(fails ? `${fails} FAILED` : 'ALL PASSED')
