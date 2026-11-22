/* Pratyeksha Concierge — the brain. A pure, dependency-free engine that answers from the same live data the home screen shows
 * (outlets, menu index, offers, opening hours, distance). Nothing here is sent to a server: no API key, no cost, works offline
 * from the cached list. English, Marathi and Hinglish phrasing are understood; replies follow the language of the guest's message
 * (falling back to the app language).
 *
 *   const engine = createEngine(kit);
 *   const out = engine.reply('veg biryani near rajarampuri', { tenants, menu, pos, lang, now }, memory);
 *   // out = { blocks, suggest, memory, wantsLocation }
 *
 * Block types: text · places {ids,title,more} · place {id} · offers {items} · steps {title,steps} · action {kind}
 */

const STOP = new Set(('a an the is are am was be to of in on at for with and or me my i you we it its this that there here please pls can could would should do does did ' +
  'show tell give find get want need looking look any some best good nice top place places restaurant restaurants cafe cafes near nearby around open now today ' +
  'which what where who how when about from so just also more only veg pure offers offer deals deal food eat eating hungry suggest recommend ' +
  'आहे आहेत मला मी तू तुम्ही काय कुठे कोणते कोणता जवळ जवळपास दाखव सांग mere meri mujhe paas kuch khana chahiye hai hain ke ka ki mein me aur ek koi kahan batao dikhao').split(' '));
const NAME_STOP = new Set(['cafe', 'café', 'restaurant', 'hotel', 'the', 'and', 'bar', 'kitchen', 'house', 'family', 'veg', 'food', 'foods', 'point', 'corner']);

const strip = (s) => String(s || '').normalize('NFKC').toLowerCase().replace(/[’'`]/g, '').replace(/[^\p{L}\p{N}\s%]/gu, ' ').replace(/\s+/g, ' ').trim();
const hasDeva = (s) => /[ऀ-ॿ]/.test(s);

function lev(a, b, max = 2) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (cur[j] < best) best = cur[j];
    }
    if (best > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

/* ── intent patterns (English + Marathi + common Hinglish) ── */
const R = {
  greet: /^(hi+|hello+|hey+|hii+|hola|yo|namaste|namaskar|namaskaar|नमस्कार|नमस्ते|हाय|हॅलो|good (morning|afternoon|evening|night))\b/,
  thanks: /\b(thanks?|thank you|thx|ty|dhanyavad|shukriya)\b|धन्यवाद|आभार/,
  bye: /^(bye|goodbye|see you|tata|ok bye|good night)\b|टाटा/,
  help: /\b(help|what can you do|how do you work|what do you do|options|commands)\b|मदत|काय करू शकतोस/,
  offers: /\b(offers?|deals?|discounts?|coupons?|promos?|cashback|off|sale|savings?)\b|ऑफर|सूट|डिस्काउंट|सवलत/,
  openNow: /\b(open now|open right now|currently open|open today|open late|whos open|who is open|which.*\bopen\b|khula|khule)\b|उघडे|सुरू आहे|सुरु आहे/,
  near: /\b(near ?me|nearby|near by|closest|nearest|around me|close by|close to me|walking distance|around here|next to me)\b|जवळ|जवळपास|आसपास/,
  surprise: /\b(surprise|recommend|recommendation|suggest|pick (one|something|for me)|anything|random|dunno|dont know|bored|what should i (eat|have|order)|something good|feeling lucky|choose for me)\b|सुचव|काहीही|सरप्राईज|काय खाऊ/,
  veg: /\b(pure veg|veg only|vegetarian|jain|veg)\b|शाकाहारी|व्हेज/,
  nonveg: /\bnon ?veg\b|मांसाहारी|नॉन ?व्हेज/,
  cafe: /\b(caf[eé]s?|coffee ?shops?)\b|कॅफे|कैफे/,
  restaurant: /\b(restaurants?|dine ?in|dining|fine dining|hotels?)\b|रेस्टॉरंट|हॉटेल/,
  reserve: /\b(reserve|reservation|book (a )?table|table booking|book a seat)\b|आरक्षण|टेबल बुक/,
  waitlist: /\b(wait ?list|waiting list|queue|crowd)\b|रांग/,
  pickup: /\b(pick ?up|take ?away|take-away|parcel|to go)\b|पार्सल|पिकअप/,
  howOrder: /\b(how (do|to|can|should) (i |we )?(order|use|scan|start)|scan|qr|order (food|online|here)|place an order)\b|ऑर्डर कसे|कसे ऑर्डर|स्कॅन/,
  pay: /\b(pay|payment|upi|gpay|phonepe|paytm|bill|gst|invoice|receipt|split)\b|बिल|पेमेंट/,
  hours: /\b(timings?|hours|time|closes?|closing|opens?|opening|until when|till when|when)\b|वेळ|कधी|किती वाजता/,
  address: /\b(where|address|location|located|route|reach|directions?|navigate|map|how far|distance)\b|पत्ता|कुठे|दिशा|किती दूर/,
  phone: /\b(phone|call|contact|number|whatsapp)\b|नंबर|फोन|संपर्क/,
  menu: /\b(menu|dishes|serves?|specials?|famous|popular|signature|what (do|does).*(have|serve)|order)\b|मेनू|प्रसिद्ध/,
  about: /\b(who are you|what is pratyeksha|about pratyeksha|about you|your name|are you (a )?(bot|ai|human|real))\b|तू कोण|तुम्ही कोण/,
  owner: /\b(list my (restaurant|cafe|place)|add my (restaurant|cafe|place)|i own|i am an owner|partner with|join pratyeksha|onboard)\b/,
  more: /^(more|show more|next|others?|another|any other|aur|और|आणखी|अजून)\b/,
  reset: /\b(start over|reset|clear chat|new chat)\b/,
  location: /\b(my location|use my location|share location)\b/,
  fav: /\b(saved|favou?rites?|my list|wishlist)\b|जतन|आवडते/,
  yes: /^(yes|yeah|yep|sure|ok|okay|haan|ho|होय|हो|हां)\b/,
};
const ORD = [[/\b(first|1st|one|1)\b|पहिला|पहिले/, 0], [/\b(second|2nd|two|2)\b|दुसरा|दुसरे/, 1], [/\b(third|3rd|three|3)\b|तिसरा|तिसरे/, 2], [/\b(fourth|4th|four|4)\b|चौथा/, 3], [/\b(fifth|5th|five|5)\b|पाचवा/, 4], [/\b(last)\b|शेवटचा/, -1]];

const DICT = {
  en: {
    greet: (n, part) => `${part}${n ? `, ${n}` : ''}! I'm your Pratyeksha concierge. Tell me what you're craving and I'll find where to get it — dishes, cafés, offers, who's open, what's close.`,
    help: 'Here is what I can do for you:',
    helpSteps: [
      ['Find food', 'Try “veg biryani”, “cold coffee” or “misal in Rajarampuri”.'],
      ['Know before you go', 'Ask for timings, directions, phone numbers or whether a place is open now.'],
      ['Save money', 'Say “offers” to see live discounts and promo codes.'],
      ['Decide for you', 'Say “surprise me” and I’ll pick something good that is open.'],
    ],
    noMore: "That's everything I have for this search. Try another dish, area or filter?",
    thanks: ['Happy to help! Anything else you are craving?', 'Anytime! Want me to find something else?', 'My pleasure. Hungry for more ideas?'],
    bye: 'See you soon — enjoy your meal! 🍽️',
    noData: "I don't have the restaurant list yet. Check your connection and I'll be right with you.",
    found: (n, what) => `I found ${n} ${n === 1 ? 'place' : 'places'}${what ? ` ${what}` : ''}. Here ${n === 1 ? 'it is' : 'are the best'}:`,
    foundDish: (n, what) => `${n} ${n === 1 ? 'place serves' : 'places serve'} ${what}. Here ${n === 1 ? 'it is' : 'are the best matches'}:`,
    none: (what) => `I couldn't find ${what || 'a match'} right now.`,
    noneTry: 'Try a dish like “biryani”, a type like “café”, or an area name.',
    didYouMean: (w) => `Did you mean “${w}”? Let me search that.`,
    openNow: 'open right now',
    withOffers: 'with live offers',
    inArea: (a) => `in ${a}`,
    nearest: 'sorted nearest first',
    pureVeg: 'pure veg',
    needLoc: 'To sort by distance I need your location. Tap allow when your phone asks.',
    locDenied: "I couldn't get your location, so I'm showing the best picks instead. You can allow location in your browser settings.",
    offersTitle: (n) => `${n} live ${n === 1 ? 'offer' : 'offers'} right now:`,
    noOffers: 'No live offers at the moment — check back soon. Meanwhile, here are popular places:',
    surprise: (name) => `How about ${name}? ✨ It's a good pick right now.`,
    placeIntro: (name) => `Here's ${name}:`,
    hoursLine: (name, s, wd, we) => `${name}: ${s}. Mon–Fri ${wd}, Sat–Sun ${we}.`,
    hoursUnknown: (name) => `${name} hasn't shared opening hours yet.`,
    addr: (name, a, d) => `${name} is at ${a}${d ? ` — about ${d} from you` : ''}.`,
    addrUnknown: (name) => `${name} hasn't shared an address yet.`,
    phoneLine: (name, p) => `You can call ${name} on ${p}.`,
    phoneUnknown: (name) => `${name} hasn't listed a phone number.`,
    menuLine: (name, cats, dishes) => `${name} serves ${[...dishes, ...cats].slice(0, 6).join(', ')}.`,
    menuNone: (name) => `${name}'s menu highlights aren't published here, but you can open the full menu.`,
    placeOffers: (name, list) => `${name} has: ${list}.`,
    placeNoOffers: (name) => `${name} has no live offers right now.`,
    askWhich: 'Which one did you mean?',
    pickPlace: { hours: 'Which place’s timings do you want? Pick one, or type a name.', address: 'Which place do you want directions to? Pick one, or type a name.', phone: 'Which place’s number do you want? Pick one, or type a name.', menu: 'Which place’s menu do you want to see? Pick one, or type a name.', reserve: 'Where would you like to reserve a table? Pick one, or type a name.', pickup: 'Where would you like to order pickup from? Pick one, or type a name.' },
    fav: (n) => `You have ${n} saved ${n === 1 ? 'place' : 'places'}. Here they are:`,
    favNone: "You haven't saved any places yet. Tap the heart on a place to keep it handy.",
    howOrderTitle: 'Ordering is simple:',
    howOrder: [['Pick a place', 'Search here or scan the QR code on your table.'], ['Choose your food', 'Browse the menu, view 3D dishes, add to cart.'], ['Place the order', 'Dine-in, pickup, or reserve a table — your choice.'], ['Pay your way', 'UPI, cash or split the bill. GST invoice included.']],
    reserveHow: 'Every place supports table reservations, pickup and waitlist. Open a place and tap “Reserve a table”. Which place?',
    pickupHow: 'You can order pickup from any place — open it, choose “Order pickup”, and skip the wait.',
    waitHow: 'If a place is full, open it and tap “Join waitlist” — you will be notified when your table is ready.',
    payHow: 'Pay by UPI, cash or split the bill with friends. Every order gets a GST invoice you can download.',
    about: "I'm Pratyeksha's concierge — I know every restaurant and café on this page: menus, offers, hours and distance. I'm a guide, not a human, and I only use what the restaurants have published.",
    owner: 'Own a café or restaurant? Pratyeksha gives you QR menus, a kitchen display, GST billing and guest marketing in one system. Contact hello.pratyeksha@gmail.com to get listed.',
    fallbackHead: "I didn't quite catch that, but I can help with:",
    chips: { surprise: 'Surprise me', offers: 'Live offers', open: 'Open now', near: 'Near me', cafes: 'Cafés', veg: 'Pure veg', how: 'How to order', more: 'Show more', menu: 'Menu', hours: 'Timings', dir: 'Directions', call: 'Call', cheaper: 'With offers' },
    weekdays: 'Mon–Fri', closedDay: 'closed',
    hoursLine2: (name, status, day, range) => `${name}${status ? ` is ${status.charAt(0).toLowerCase()}${status.slice(1)}` : ''}. Today${day ? ` (${day})` : ''}: ${range}.`,
    tempClosed: (name) => `${name} is temporarily closed right now.`,
    addrPin: (name) => `${name} has a map pin but no written address yet. Directions will use the pin.`,
    reserveAt: (name) => `You can reserve a table at ${name}. Open the place and tap “Reserve”.`,
    pickupAt: (name) => `You can order pickup from ${name}. Open the place and tap “Pickup”.`,
    f: { today: (day) => (day ? `Today · ${day}` : 'Today'), closed: 'Closed', weekend: 'Sat–Sun', closedOn: 'Closed on', address: 'Address', area: 'Area', distance: 'From you', categories: 'Categories', dishes: 'Popular dishes' },
  },
  mr: {
    greet: (n, part) => `${part}${n ? `, ${n}` : ''}! मी तुमचा Pratyeksha कन्सिअर्ज आहे. काय खावेसे वाटते ते सांगा — डिश, कॅफे, ऑफर, कोण उघडे आहे, कोणते जवळ आहे ते शोधून देतो.`,
    help: 'मी तुमच्यासाठी हे करू शकतो:',
    helpSteps: [
      ['जेवण शोधा', '“व्हेज बिर्याणी”, “कोल्ड कॉफी” किंवा “राजारामपुरीत मिसळ” असे विचारा.'],
      ['जाण्यापूर्वी जाणून घ्या', 'वेळ, दिशा, फोन नंबर किंवा ठिकाण आत्ता उघडे आहे का ते विचारा.'],
      ['पैसे वाचवा', '“ऑफर” म्हणा आणि चालू सवलती व कोड पहा.'],
      ['मी ठरवतो', '“सरप्राईज” म्हणा — मी उघडे असलेले चांगले ठिकाण निवडतो.'],
    ],
    noMore: 'या शोधासाठी माझ्याकडे एवढेच आहे. दुसरी डिश, परिसर किंवा फिल्टर वापरून पाहू का?',
    thanks: ['आनंद झाला! आणखी काही हवे आहे का?', 'नेहमी तयार! आणखी काही शोधू का?'],
    bye: 'लवकरच भेटू — जेवणाचा आनंद घ्या! 🍽️',
    noData: 'मला अजून ठिकाणांची यादी मिळालेली नाही. कनेक्शन तपासा, मी लगेच मदत करतो.',
    found: (n, what) => `${n} ठिकाणे सापडली${what ? ` ${what}` : ''}. ही सर्वोत्तम:`,
    foundDish: (n, what) => `${n} ठिकाणी ${what} मिळते. ही सर्वोत्तम जुळणारी:`,
    none: (what) => `आत्ता ${what || 'काहीही जुळले नाही'} सापडले नाही.`,
    noneTry: '“बिर्याणी” सारखी डिश, “कॅफे” सारखा प्रकार किंवा परिसराचे नाव वापरून पहा.',
    didYouMean: (w) => `तुम्हाला “${w}” म्हणायचे आहे का? तेच शोधतो.`,
    openNow: 'आत्ता उघडे',
    withOffers: 'चालू ऑफरसह',
    inArea: (a) => `${a} मध्ये`,
    nearest: 'जवळचे आधी',
    pureVeg: 'शुद्ध शाकाहारी',
    needLoc: 'अंतरानुसार लावण्यासाठी तुमचे लोकेशन हवे आहे. फोनने विचारल्यावर परवानगी द्या.',
    locDenied: 'लोकेशन मिळाले नाही, म्हणून सर्वोत्तम निवडी दाखवतो. ब्राउझर सेटिंगमध्ये परवानगी देता येईल.',
    offersTitle: (n) => `आत्ता ${n} चालू ऑफर:`,
    noOffers: 'सध्या कोणतीही ऑफर चालू नाही — लवकरच पुन्हा पहा. तोपर्यंत ही लोकप्रिय ठिकाणे:',
    surprise: (name) => `${name} कसे वाटते? ✨ आत्ता चांगली निवड आहे.`,
    placeIntro: (name) => `हे आहे ${name}:`,
    hoursLine: (name, s, wd, we) => `${name}: ${s}. सोम–शुक्र ${wd}, शनि–रवि ${we}.`,
    hoursUnknown: (name) => `${name} ने अजून वेळा दिलेल्या नाहीत.`,
    addr: (name, a, d) => `${name} येथे आहे: ${a}${d ? ` — तुमच्यापासून सुमारे ${d}` : ''}.`,
    addrUnknown: (name) => `${name} ने अजून पत्ता दिलेला नाही.`,
    phoneLine: (name, p) => `${name} ला ${p} वर कॉल करा.`,
    phoneUnknown: (name) => `${name} ने फोन नंबर दिलेला नाही.`,
    menuLine: (name, cats, dishes) => `${name} येथे ${[...dishes, ...cats].slice(0, 6).join(', ')} मिळते.`,
    menuNone: (name) => `${name} चे मेनू हायलाइट्स येथे नाहीत, पण पूर्ण मेनू उघडता येईल.`,
    placeOffers: (name, list) => `${name} येथे: ${list}.`,
    placeNoOffers: (name) => `${name} येथे सध्या ऑफर नाही.`,
    askWhich: 'तुम्हाला कोणते म्हणायचे आहे?',
    pickPlace: { hours: 'कोणत्या ठिकाणाच्या वेळा हव्या आहेत? एक निवडा किंवा नाव टाइप करा.', address: 'कोणत्या ठिकाणी जायचे आहे? एक निवडा किंवा नाव टाइप करा.', phone: 'कोणत्या ठिकाणाचा नंबर हवा आहे? एक निवडा किंवा नाव टाइप करा.', menu: 'कोणत्या ठिकाणाचा मेनू पाहायचा आहे? एक निवडा किंवा नाव टाइप करा.', reserve: 'कुठे टेबल आरक्षित करायचे आहे? एक निवडा किंवा नाव टाइप करा.', pickup: 'कुठून पिकअप ऑर्डर करायची आहे? एक निवडा किंवा नाव टाइप करा.' },
    fav: (n) => `तुम्ही ${n} ठिकाणे जतन केली आहेत:`,
    favNone: 'अजून काहीही जतन केलेले नाही. आवडत्या ठिकाणावर हृदय दाबा.',
    howOrderTitle: 'ऑर्डर करणे सोपे आहे:',
    howOrder: [['ठिकाण निवडा', 'येथे शोधा किंवा टेबलवरील QR स्कॅन करा.'], ['जेवण निवडा', 'मेनू पहा, 3D डिश पहा, कार्टमध्ये टाका.'], ['ऑर्डर द्या', 'डाइन-इन, पिकअप किंवा टेबल आरक्षण.'], ['पैसे द्या', 'UPI, रोख किंवा बिल विभागा. GST बिल मिळते.']],
    reserveHow: 'प्रत्येक ठिकाणी टेबल आरक्षण, पिकअप आणि वेटलिस्ट आहे. ठिकाण उघडा आणि “टेबल आरक्षित करा” दाबा. कोणते ठिकाण?',
    pickupHow: 'कोणत्याही ठिकाणाहून पिकअप ऑर्डर करता येते — ठिकाण उघडा आणि “पिकअप ऑर्डर” निवडा.',
    waitHow: 'ठिकाण भरलेले असेल तर उघडून “वेटलिस्टमध्ये सामील व्हा” दाबा — टेबल तयार झाल्यावर कळवू.',
    payHow: 'UPI, रोख किंवा मित्रांसोबत बिल विभागून पैसे द्या. प्रत्येक ऑर्डरला GST बिल मिळते.',
    about: 'मी Pratyeksha चा कन्सिअर्ज आहे — या पानावरील प्रत्येक रेस्टॉरंट व कॅफेचे मेनू, ऑफर, वेळा आणि अंतर मला माहीत आहे. मी मार्गदर्शक आहे, माणूस नाही; फक्त ठिकाणांनी प्रसिद्ध केलेली माहिती वापरतो.',
    owner: 'कॅफे किंवा रेस्टॉरंट आहे का? Pratyeksha QR मेनू, किचन डिस्प्ले, GST बिलिंग आणि मार्केटिंग एकत्र देते. hello.pratyeksha@gmail.com वर संपर्क करा.',
    fallbackHead: 'मला नीट समजले नाही, पण मी हे करू शकतो:',
    chips: { surprise: 'सरप्राईज', offers: 'ऑफर', open: 'आत्ता उघडे', near: 'जवळचे', cafes: 'कॅफे', veg: 'शुद्ध शाकाहारी', how: 'ऑर्डर कसे', more: 'आणखी', menu: 'मेनू', hours: 'वेळा', dir: 'दिशा', call: 'कॉल', cheaper: 'ऑफरसह' },
    weekdays: 'सोम–शुक्र', closedDay: 'बंद',
    hoursLine2: (name, status, day, range) => `${name}${status ? `: ${status}` : ''}. आज${day ? ` (${day})` : ''}: ${range}.`,
    tempClosed: (name) => `${name} सध्या तात्पुरते बंद आहे.`,
    addrPin: (name) => `${name} चा मॅप पिन आहे पण लिखित पत्ता नाही. दिशा पिननुसार मिळतील.`,
    reserveAt: (name) => `${name} येथे टेबल आरक्षित करता येते. ठिकाण उघडून “आरक्षण” दाबा.`,
    pickupAt: (name) => `${name} येथून पिकअप ऑर्डर करता येते. ठिकाण उघडून “पिकअप” दाबा.`,
    f: { today: (day) => (day ? `आज · ${day}` : 'आज'), closed: 'बंद', weekend: 'शनि–रवि', closedOn: 'बंद दिवस', address: 'पत्ता', area: 'परिसर', distance: 'तुमच्यापासून', categories: 'विभाग', dishes: 'लोकप्रिय डिश' },
  },
};

export function createEngine(kit) {
  const { openStatus, statusLabel, bestOffer, offerValue, offerTerms, distanceKm, fmtKm, areaOf, isCafe, addressLine, hoursRange, matchWhy, isFeatured, L } = kit;

  /* The vocabulary is derived from the menu index once per data set (cached on the menu object). */
  const vocabCache = new WeakMap();
  function vocab(menu) {
    if (!menu) return { words: new Set(), phrases: [] };
    let v = vocabCache.get(menu);
    if (v) return v;
    const phrases = new Set();
    const words = new Set();
    for (const e of menu.map.values()) {
      for (const x of [...e.cats, ...e.dishes]) {
        const lc = x.lc;
        if (!lc || lc.length < 3) continue;
        phrases.add(lc);
        for (const w of lc.split(' ')) if (w.length >= 3 && !STOP.has(w)) words.add(w);
      }
    }
    v = { words, phrases: [...phrases] };
    vocabCache.set(menu, v);
    return v;
  }

  const sigTokens = (name) => strip(name).split(' ').filter((w) => w.length >= 3 && !NAME_STOP.has(w));

  function findPlace(q, tenants) {
    let best = null;
    let tie = false;
    for (const t of tenants) {
      const full = strip(t.name);
      if (!full) continue;
      let s = 0;
      if (full.length >= 3 && ` ${q} `.includes(` ${full} `)) s = 10 + full.length / 100;
      else {
        const toks = sigTokens(t.name);
        if (toks.length) {
          const qt = q.split(' ');
          const hit = (tok) => qt.some((w) => w === tok || (tok.length >= 5 && w.length >= 4 && lev(w, tok, 1) <= 1));
          const m = toks.filter(hit).length;
          if (m === toks.length) s = 6 + toks.length / 10;
          else if (m >= 2 && m / toks.length >= 0.6) s = 5 + m / 10;   // "royal biryani" -> "Royal Biryani Darbar"
          else if (toks.length > 1 && m === 1 && toks.some((tok) => tok.length >= 5 && hit(tok))) s = 3;
        }
      }
      if (s > 0 && (!best || s > best.s)) { best = { t, s }; tie = false; } else if (s > 0 && best && s === best.s) tie = true;
    }
    return best && best.s >= 4 ? { t: best.t, tie } : null;
  }

  function findArea(q, tenants) {
    const areas = new Map();
    for (const t of tenants) { const a = areaOf(t); if (a) areas.set(strip(a), a); }
    let hit = null;
    for (const [k, label] of areas) {
      if (k.length < 3) continue;
      if (` ${q} `.includes(` ${k} `)) { if (!hit || k.length > hit.k.length) hit = { k, label }; }
    }
    if (hit) return hit;
    for (const w of q.split(' ')) {
      if (w.length < 5) continue;
      for (const [k, label] of areas) if (!k.includes(' ') && lev(w, k, 1) <= 1) return { k, label };
    }
    return null;
  }

  /* Longest n-gram of the message that names a dish or category some outlet serves. */
  function findTerm(q, tenants, menu) {
    if (!menu) return null;
    const words = q.split(' ').filter(Boolean);
    const v = vocab(menu);
    const tryNeedle = (needle) => {
      const hits = [];
      for (const t of tenants) {
        const m = matchWhy(t, needle, menu);
        if (m && ((m.category && m.category.length) || (m.dish && m.dish.length))) hits.push(t); // `w` reports the strongest reason (often the outlet name), so check the menu hits directly
      }
      return hits;
    };
    for (let n = Math.min(3, words.length); n >= 1; n--) {
      for (let i = 0; i + n <= words.length; i++) {
        const slice = words.slice(i, i + n);
        if (slice.every((w) => STOP.has(w))) continue;
        const needle = slice.join(' ');
        if (needle.length < 3 || (n === 1 && STOP.has(needle))) continue;
        const hits = tryNeedle(needle);
        if (hits.length) return { needle, hits };
      }
    }
    // typo rescue: "biriyani" -> "biryani"
    for (const w of words) {
      if (w.length < 5 || STOP.has(w) || v.words.has(w)) continue;
      let best = null;
      for (const cand of v.words) { const d = lev(w, cand, 1); if (d <= 1 && (!best || d < best.d)) best = { cand, d }; }
      if (best) { const hits = tryNeedle(best.cand); if (hits.length) return { needle: best.cand, hits, corrected: best.cand }; }
    }
    return null;
  }

  const closed = (t, now) => openStatus(t.hours, now)?.state === 'closed';
  const isOpen = (t, now) => openStatus(t.hours, now)?.state === 'open';

  function rank(list, env, f) {
    const { pos, now } = env;
    const km = (t) => (pos ? distanceKm(pos, t) ?? 1e9 : 1e9);
    return [...list].sort((a, b) => {
      if (f.near && pos) return km(a) - km(b);
      const s = (t) => (isFeatured(t) ? 3 : 0) + (isOpen(t, now) ? 2 : closed(t, now) ? -2 : 0) + (bestOffer(t) ? 1 : 0);
      return (s(b) - s(a)) || (km(a) - km(b));
    });
  }

  function applyFilters(env, f) {
    const { tenants, now } = env;
    return tenants.filter((t) => {
      if (f.type === 'cafe' && !isCafe(t)) return false;
      if (f.type === 'restaurant' && isCafe(t)) return false;
      if (f.veg && t.config?.onlyVeg !== true) return false;
      if (f.open && !isOpen(t, now)) return false;
      if (f.offers && !(t.activeOffers || []).length) return false;
      if (f.area && strip(areaOf(t)) !== f.area.k) return false;
      if (f.hits && !f.hits.has(t.tenantId)) return false;
      if (f.ids && !f.ids.includes(t.tenantId)) return false;
      return true;
    });
  }

  const partOfDay = (now, d) => {
    const h = new Date(now + 330 * 60000).getUTCHours();
    const en = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    return d === DICT.mr ? (h < 12 ? 'शुभ प्रभात' : h < 17 ? 'शुभ दुपार' : 'शुभ संध्याकाळ') : en;
  };

  const offerLine = (t, tr) => (t.activeOffers || []).slice(0, 3).map((o) => `${o.title ? `${o.title} — ` : ''}${offerValue(o)}${offerTerms(o, tr) ? ` (${offerTerms(o, tr)})` : ''}`).join('; ');

  function suggestions(d, ctx) {
    const c = d.chips;
    if (ctx?.place) return [{ label: c.menu, send: 'menu' }, { label: c.hours, send: 'timings' }, { label: c.dir, send: 'directions' }, { label: c.call, send: 'call' }, { label: c.surprise, send: 'surprise me' }];
    if (ctx?.more) return [{ label: c.more, send: 'more' }, { label: c.near, send: 'near me' }, { label: c.open, send: 'open now' }, { label: c.cheaper, send: 'with offers' }];
    return [{ label: c.surprise, send: 'surprise me' }, { label: c.offers, send: 'offers' }, { label: c.open, send: 'open now' }, { label: c.near, send: 'near me' }, { label: c.cafes, send: 'cafes' }, { label: c.veg, send: 'pure veg' }, { label: c.how, send: 'how to order' }];
  }

  /* ── main entry ── */
  function reply(raw, env, mem = {}) {
    const text = String(raw || '').slice(0, 400);
    const q = strip(text);
    const lang = hasDeva(text) || env.lang === 'mr' ? 'mr' : 'en';
    const d = DICT[lang];
    const tr = L[lang];
    const now = env.now || Date.now();
    const e = { ...env, now };
    const out = (blocks, extra = {}) => ({ blocks, suggest: suggestions(d, extra.ctx), memory: extra.memory || mem, wantsLocation: !!extra.wantsLocation, lang });
    const txt = (s) => ({ t: 'text', text: s });
    const places = (list, title, more = 0) => ({ t: 'places', ids: list.map((x) => x.tenantId), title, more });
    const keepList = (list, shown) => ({ ...mem, list: list.map((x) => x.tenantId), shown, place: list.length === 1 ? list[0].tenantId : mem.place });

    if (!q) return out([txt(d.help)], {});
    if (!e.tenants.length) return out([txt(d.noData)], {});
    const byId = (id) => e.tenants.find((t) => t.tenantId === id);

    // ── small talk
    if (R.reset.test(q)) return { ...out([txt(d.greet(e.name, partOfDay(now, d)))], { memory: {} }), reset: true };
    if (R.greet.test(q) && q.split(' ').length <= 4) return out([txt(d.greet(e.name, partOfDay(now, d)))], { memory: { ...mem } });
    if (R.thanks.test(q) && q.split(' ').length <= 6) return out([txt(d.thanks[Math.floor((now / 1000) % d.thanks.length)])], {});
    if (R.bye.test(q)) return out([txt(d.bye)], {});
    if (R.about.test(q)) return out([txt(d.about)], {});
    if (R.owner.test(q)) return out([txt(d.owner)], {});
    if (R.help.test(q) && q.split(' ').length <= 6) return out([txt(d.help), { t: 'steps', steps: d.helpSteps }], {});

    // ── how-to / policy
    if (R.howOrder.test(q) && !findPlace(q, e.tenants)) return out([{ t: 'steps', title: d.howOrderTitle, steps: d.howOrder }], {});
    if (R.reserve.test(q) && !findPlace(q, e.tenants) && !mem.place) return out([txt(d.reserveHow)], {});
    if (R.waitlist.test(q) && !findPlace(q, e.tenants)) return out([txt(d.waitHow)], {});
    if (R.pickup.test(q) && !findPlace(q, e.tenants) && q.split(' ').length <= 5) return out([txt(d.pickupHow)], {});
    if (R.pay.test(q) && !findPlace(q, e.tenants) && q.split(' ').length <= 7) return out([txt(d.payHow)], {});

    // ── favourites
    if (R.fav.test(q)) {
      const list = e.tenants.filter((t) => (e.favs || []).includes(t.tenantId));
      return list.length ? out([txt(d.fav(list.length)), places(list.slice(0, 5), '')], { memory: keepList(list, 5), ctx: { more: list.length > 5 } }) : out([txt(d.favNone)], {});
    }

    // ── "more"
    if (R.more.test(q) && mem.list?.length) {
      const all = mem.list.map(byId).filter(Boolean);
      const from = mem.shown || 0;
      const next = all.slice(from, from + 5);
      if (!next.length) return out([txt(d.noMore)], {});
      const left = Math.max(0, all.length - from - next.length);
      return out([places(next, '', left)], { memory: { ...mem, shown: from + next.length }, ctx: { more: left > 0 } });
    }

    // ── a named place (or "it" / "the second one" from the last answer)
    let target = null;
    let ambiguous = false;
    const named = findPlace(q, e.tenants);
    if (named) { target = named.t; ambiguous = named.tie; }
    else if (mem.list?.length && q.split(' ').length <= 7) {
      for (const [re, idx] of ORD) {
        if (re.test(q) && !R.near.test(q)) { const id = idx < 0 ? mem.list[mem.list.length - 1] : mem.list[idx]; if (id) { target = byId(id); break; } }
      }
    }
    const attr = {
      hours: R.hours.test(q) && !R.near.test(q), address: R.address.test(q), phone: R.phone.test(q),
      menu: R.menu.test(q), offers: R.offers.test(q), reserve: R.reserve.test(q), pickup: R.pickup.test(q),
    };
    // "timings", "call", "directions" continue about the last place; "offers" does too only when the guest says "it / there / this place".
    const pronoun = /\b(it|its|this|that|there|here|this place|that place)\b|हे|ते|तिथे|इथे/.test(q);
    const placeAttr = attr.hours || attr.address || attr.phone || attr.menu || (attr.offers && pronoun) || attr.reserve || attr.pickup;
    if (!target && mem.place && placeAttr && !findTerm(q, e.tenants, e.menu) && !R.near.test(q) && !R.openNow.test(q) && !(attr.offers && !pronoun)) target = byId(mem.place);
    if (!target && !mem.place) {
      const kind = ['hours', 'address', 'phone', 'menu', 'reserve', 'pickup'].find((k) => attr[k]);
      if (kind && !findTerm(q, e.tenants, e.menu) && !R.near.test(q) && !R.openNow.test(q)) {
        const rank = (t) => (openStatus(t.hours, now)?.state === 'open' ? 0 : 1) * 1e6 + (e.pos ? (distanceKm(e.pos, t) ?? 9999) : 0);
        const cand = [...e.tenants].sort((a, b) => rank(a) - rank(b) || String(a.name).localeCompare(String(b.name))).slice(0, 4);
        if (cand.length) return out([txt(d.pickPlace[kind]), places(cand, '')], { memory: { ...keepList(cand, cand.length), pendingAttr: kind } });
      }
    }
    if (target && !placeAttr && mem.pendingAttr && attr[mem.pendingAttr] !== undefined) attr[mem.pendingAttr] = true;
    if (target && ambiguous) {
      const cand = e.tenants.filter((t) => { const m = findPlace(q, [t]); return !!m; }).slice(0, 4);
      return out([txt(d.askWhich), places(cand, '')], { memory: keepList(cand, cand.length) });
    }
    if (target) {
      const t = target;
      const blocks = [];
      const km = e.pos ? distanceKm(e.pos, t) : null;
      const mem2 = { ...mem, place: t.tenantId };
      const acts = (...k) => ({ t: 'actions', id: t.tenantId, items: k });
      const hasMap = !!kit.hasPlace?.(t);
      const phone = String(t.contact || t.phone || '').trim();
      const hasPhone = phone.replace(/\D/g, '').length >= 7;
      let compact = true;
      if (attr.hours) {
        const st = openStatus(t.hours, now);
        const s = statusLabel(st, tr);
        const th = kit.todayHours ? kit.todayHours(t.hours, now, lang) : (t.hours ? { day: '', range: hoursRange(t.hours.weekday), off: [], temp: false } : null);
        if (!t.hours || !th) blocks.push(txt(d.hoursUnknown(t.name)), acts('menu'));
        else {
          blocks.push(txt(th.temp ? d.tempClosed(t.name) : d.hoursLine2(t.name, s?.text || '', th.today, th.range)));
          const rows = [[d.f.today(th.day), th.temp ? d.f.closed : th.range, 1], [d.weekdays, hoursRange(t.hours.weekday)], [d.f.weekend, hoursRange(t.hours.weekend)]];
          if (th.off.length) rows.push([d.f.closedOn, th.off.join(', ')]);
          blocks.push({ t: 'facts', rows, tone: s?.tone || '' }, acts('menu', hasMap ? 'maps' : null, hasPhone ? 'call' : null));
        }
      } else if (attr.address) {
        const a = addressLine(t);
        if (!a && !hasMap) blocks.push(txt(d.addrUnknown(t.name)));
        else {
          blocks.push(txt(a ? d.addr(t.name, a, km != null ? fmtKm(km) : '') : d.addrPin(t.name)));
          const rows = []; if (a) rows.push([d.f.address, a]); const ar = areaOf(t); if (ar && !String(a).includes(ar)) rows.push([d.f.area, ar]); if (km != null) rows.push([d.f.distance, fmtKm(km)]);
          if (rows.length) blocks.push({ t: 'facts', rows });
          blocks.push(acts('maps', 'menu', hasPhone ? 'call' : null));
        }
      } else if (attr.phone) {
        blocks.push(txt(hasPhone ? d.phoneLine(t.name, phone) : d.phoneUnknown(t.name)), acts(hasPhone ? 'call' : null, hasMap ? 'maps' : null, 'menu'));
      } else if (attr.offers) {
        blocks.push(txt((t.activeOffers || []).length ? d.placeOffers(t.name, offerLine(t, tr)) : d.placeNoOffers(t.name)), acts('menu'));
      } else if (attr.menu) {
        const m = e.menu?.map.get(t.tenantId);
        const cats = (m?.cats || []).slice(0, 6).map((x) => x.raw);
        const dishes = (m?.dishes || []).slice(0, 8).map((x) => x.raw);
        if (cats.length || dishes.length) {
          blocks.push(txt(d.menuLine(t.name, cats.slice(0, 4), dishes.slice(0, 4))));
          const rows = []; if (cats.length) rows.push([d.f.categories, cats.join(' · ')]); if (dishes.length) rows.push([d.f.dishes, dishes.join(' · ')]);
          blocks.push({ t: 'facts', rows }, acts('menu', t.config?.customerFeatures?.pickup !== false ? 'pickup' : null, t.config?.customerFeatures?.reservation !== false ? 'reserve' : null));
        } else blocks.push(txt(d.menuNone(t.name)), acts('menu'));
      } else if (attr.reserve || attr.pickup) {
        blocks.push(txt(attr.reserve ? d.reserveAt(t.name) : d.pickupAt(t.name)), acts(attr.reserve ? 'reserve' : 'pickup', 'menu'));
      } else { blocks.push(txt(d.placeIntro(t.name))); compact = false; }
      if (!compact) blocks.push({ t: 'place', id: t.tenantId });
      return out(blocks, { memory: mem2, ctx: { place: true } });
    }

    // ── entity-driven search
    const f = {};
    if (R.veg.test(q) && !R.nonveg.test(q)) f.veg = true;
    if (R.cafe.test(q)) f.type = 'cafe'; else if (R.restaurant.test(q)) f.type = 'restaurant';
    if (R.openNow.test(q)) f.open = true;
    if (R.offers.test(q)) f.offers = true;
    if (R.near.test(q) || R.location.test(q)) f.near = true;
    const area = findArea(q, e.tenants);
    if (area) f.area = area;
    const term = findTerm(q, e.tenants, e.menu);
    if (term) f.hits = new Set(term.hits.map((t) => t.tenantId));

    // follow-up refinement: "only open ones", "with offers" apply to the previous list
    const REFINE = /\b(only|just|those|these|them|ones|among|filter|also|and|with|which of)\b|फक्त|त्यातील/;
    const refine = !term && !area && !f.type && mem.list?.length && (f.open || f.offers || f.near || f.veg) && q.split(' ').length <= 5 && REFINE.test(q);
    if (refine) f.ids = mem.list;

    const surprise = R.surprise.test(q) && !term && !area;
    const searching = Object.keys(f).length > 0;

    if (f.near && !e.pos) {
      return out([txt(d.needLoc)], { wantsLocation: true, memory: { ...mem, pending: text } });
    }

    if (surprise && !searching) {
      const pool = rank(applyFilters(e, { open: true }), e, {}).slice(0, 8);
      const list = pool.length ? pool : rank(e.tenants, e, {}).slice(0, 8);
      const pick = list[Math.floor(((now / 1000) + (mem.seed || 0)) % list.length)];
      return out([txt(d.surprise(pick.name)), { t: 'place', id: pick.tenantId }], { memory: { ...mem, place: pick.tenantId, list: list.map((x) => x.tenantId), shown: 1, seed: (mem.seed || 0) + 1 }, ctx: { place: true } });
    }

    if (searching) {
      let list = rank(applyFilters(e, f), e, f);
      const bits = [];
      if (f.veg) bits.push(d.pureVeg);
      if (f.open) bits.push(d.openNow);
      if (f.offers) bits.push(d.withOffers);
      if (f.area) bits.push(d.inArea(f.area.label));
      if (f.near && e.pos) bits.push(d.nearest);
      const what = bits.join(', ');
      if (f.offers && !term && !f.area && !f.type && !f.open && !f.veg && !f.near && list.length) {
        const items = [];
        for (const t of list) for (const o of (t.activeOffers || [])) items.push({ id: t.tenantId, offer: o });
        items.sort((a, b) => kit.offerRank(b.offer) - kit.offerRank(a.offer));
        return out([txt(d.offersTitle(items.length)), { t: 'offers', items: items.slice(0, 6) }], { memory: keepList(list, 0), ctx: { more: false } });
      }
      if (!list.length) {
        if (f.offers && !term) {
          const alt = rank(e.tenants, e, {}).slice(0, 4);
          return out([txt(d.noOffers), places(alt, '')], { memory: keepList(alt, 4) });
        }
        // relax: drop the strictest filters one by one so the guest never hits a dead end
        const relaxed = rank(applyFilters(e, { ...f, open: false, offers: false, veg: false }), e, f);
        if (relaxed.length) {
          const top = relaxed.slice(0, 5);
          return out([txt(`${d.none(term ? term.corrected || term.needle : what)} ${lang === 'mr' ? 'त्याच्या जवळची निवड:' : 'Here are close alternatives:'}`), places(top, '', Math.max(0, relaxed.length - 5))], { memory: keepList(relaxed, 5), ctx: { more: relaxed.length > 5 } });
        }
        return out([txt(`${d.none(term ? term.needle : what)} ${d.noneTry}`)], {});
      }
      const top = list.slice(0, 5);
      const head = term
        ? `${term.corrected ? `${d.didYouMean(term.corrected)} ` : ''}${d.foundDish(list.length, `“${term.corrected || term.needle}”${what ? ` ${what}` : ''}`)}`
        : d.found(list.length, what);
      const why = {};
      if (term) for (const t of top) { const m = matchWhy(t, term.needle, e.menu); if (m) why[t.tenantId] = [...m.dish, ...m.category].slice(0, 2).join(' · '); }
      const blk = places(top, '', Math.max(0, list.length - top.length));
      blk.why = why;
      return out([txt(head), blk], { memory: { ...keepList(list, top.length), pending: '' }, ctx: { more: list.length > top.length } });
    }

    // ── a lone word that is a dish typo / a loose phrase: last chance
    const words = q.split(' ').filter((w) => w.length >= 3 && !STOP.has(w));
    if (words.length && words.length <= 3 && e.menu) {
      const v = vocab(e.menu);
      for (const w of words) {
        if (v.words.has(w)) continue;
        let best = null;
        for (const cand of v.words) { const dd = lev(w, cand, 2); if (dd <= 2 && w.length >= 5 && (!best || dd < best.d)) best = { cand, d: dd }; }
        if (best) return reply(best.cand, env, mem);
      }
    }
    if (R.yes.test(q) && mem.place) return reply('menu', env, mem);

    if (words.length && words.length <= 4) return out([txt(`${d.none(`“${words.join(' ')}”`)} ${d.noneTry}`)], {});
    return out([txt(d.fallbackHead), { t: 'steps', steps: d.helpSteps }], {});
  }

  /* The opening line shown when the chat first opens. */
  function welcome(env) {
    const lang = env.lang === 'mr' ? 'mr' : 'en';
    const d = DICT[lang];
    return { text: d.greet(env.name, partOfDay(env.now || Date.now(), d)), suggest: suggestions(d, null), lang };
  }

  return { reply, welcome, dict: DICT };
}

export { strip as normalizeText, lev as editDistance };
