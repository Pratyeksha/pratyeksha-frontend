/ ══════════════════════════════════════════════════════════════════
// CUSTOMER RECOGNITION — 3 paste locations in PratyekshaPremiumMenu
// No new files. No new imports needed (axios, useState, useEffect
// already imported).
// ══════════════════════════════════════════════════════════════════


// ════════════════════════════════════════
// PASTE 1 — Add these state vars near the
// top with your other useState declarations
// (after the alert useState line)
// ════════════════════════════════════════

const [welcomeCard, setWelcomeCard]         = useState(null);
// null | { name, lastVisit, lastOrderItems, favDish, visitCount }
const [welcomePhone, setWelcomePhone]       = useState('');
const [welcomePhoneInput, setWelcomePhoneInput] = useState('');
const [welcomeLoading, setWelcomeLoading]   = useState(false);
const [welcomeDismissed, setWelcomeDismissed] = useState(false);
const [showPhonePrompt, setShowPhonePrompt] = useState(false);


// ════════════════════════════════════════
// PASTE 2 — Add this useEffect near your
// other useEffects (after the tenantId
// setup useEffect is a good place)
// ════════════════════════════════════════

// ── Customer recognition on QR scan ──
useEffect(() => {
  if (!tenantId || tableNumber === 'Counter') return; // only for table QR scans
  if (welcomeDismissed) return;

  const recognizeCustomer = async (phone) => {
    if (!phone || phone.length !== 10) return;
    setWelcomeLoading(true);
    try {
      const res = await axios.get(
        `${BASE_URL}/customers/recognize/${tenantId}/${phone}`
      );
      if (res.data?.found) {
        setWelcomeCard(res.data);
        setWelcomePhone(phone);
      }
    } catch { /* not found — silently ignore */ }
    finally { setWelcomeLoading(false); }
  };

  // Check localStorage for saved phone
  const saved = localStorage.getItem(`pratyeksha_phone_${tenantId}`);
  if (saved && saved.length === 10) {
    recognizeCustomer(saved);
  } else {
    // Show phone prompt after 1.2s so menu loads first
    const t = setTimeout(() => setShowPhonePrompt(true), 1200);
    return () => clearTimeout(t);
  }
}, [tenantId, tableNumber, welcomeDismissed]);


// ════════════════════════════════════════
// PASTE 3 — Add this JSX block inside
// your main return(), immediately AFTER
// the opening <div style={styles.body}>
// and BEFORE the <AnimatePresence> alerts
// ════════════════════════════════════════

{/* ── WELCOME RECOGNITION CARD ── */}
<AnimatePresence>
  {welcomeCard && !welcomeDismissed && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 8000,
        background: 'rgba(0,0,0,0.88)',
        display: 'flex', alignItems: 'flex-end',
        justifyContent: 'center', padding: '0 0 28px',
        fontFamily: 'Poppins, sans-serif'
      }}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        style={{
          width: '100%', maxWidth: '420px',
          background: '#0d0d0d',
          border: '1px solid rgba(211,191,162,0.15)',
          borderRadius: '26px 26px 20px 20px',
          overflow: 'hidden', margin: '0 14px'
        }}
      >
        {/* Gold top line */}
        <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, rgba(211,191,162,0.6), transparent)' }} />

        {/* Header */}
        <div style={{
          padding: '22px 22px 16px',
          background: 'linear-gradient(180deg, rgba(211,191,162,0.06) 0%, transparent 100%)',
          borderBottom: '1px solid rgba(211,191,162,0.07)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Avatar */}
              <div style={{
                width: '46px', height: '46px', borderRadius: '14px', flexShrink: 0,
                background: 'rgba(211,191,162,0.08)',
                border: '1px solid rgba(211,191,162,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.4rem'
              }}>
                {welcomeCard.visitCount >= 5 ? '🏅' : welcomeCard.visitCount >= 2 ? '⭐' : '👋'}
              </div>
              <div>
                <div style={{ fontSize: '0.52rem', color: 'rgba(211,191,162,0.35)', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '3px' }}>
                  {welcomeCard.visitCount >= 5
                    ? (language === 'mr' ? 'लॉयल गेस्ट' : 'LOYAL GUEST')
                    : welcomeCard.visitCount >= 2
                    ? (language === 'mr' ? 'परत आलात!' : 'WELCOME BACK!')
                    : (language === 'mr' ? 'स्वागत' : 'WELCOME')}
                </div>
                <div style={{ fontSize: '1rem', fontWeight: '900', color: '#d3bfa2', letterSpacing: '-0.3px' }}>
                  {language === 'mr' ? 'नमस्कार' : 'Good'}{' '}
                  {language === 'en' && (() => {
                    const h = new Date().getHours();
                    return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
                  })()}{', '}
                  {welcomeCard.name?.split(' ')[0]}!
                </div>
              </div>
            </div>
            <button onClick={() => setWelcomeDismissed(true)} style={{
              width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              color: '#555', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '18px 22px 20px' }}>

          {/* Last visit */}
          {welcomeCard.lastVisit && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 13px', marginBottom: '10px',
              background: '#111', border: '1px solid rgba(211,191,162,0.07)',
              borderRadius: '11px'
            }}>
              <Timer size={13} color="rgba(211,191,162,0.35)" strokeWidth={1.5} />
              <div>
                <div style={{ fontSize: '0.5rem', color: 'rgba(211,191,162,0.25)', fontWeight: '900', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                  {language === 'mr' ? 'शेवटची भेट' : 'Last Visit'}
                </div>
                <div style={{ fontSize: '0.76rem', fontWeight: '700', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                  {new Date(welcomeCard.lastVisit).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>
          )}

          {/* Last order items */}
          {welcomeCard.lastOrderItems?.length > 0 && (
            <div style={{
              padding: '10px 13px', marginBottom: '10px',
              background: '#111', border: '1px solid rgba(211,191,162,0.07)',
              borderRadius: '11px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
                <UtensilsCrossed size={12} color="rgba(211,191,162,0.35)" strokeWidth={1.5} />
                <span style={{ fontSize: '0.5rem', color: 'rgba(211,191,162,0.25)', fontWeight: '900', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                  {language === 'mr' ? 'शेवटची ऑर्डर' : 'Last Order'}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {welcomeCard.lastOrderItems.slice(0, 4).map((item, i) => (
                  <div key={i} style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', fontWeight: '500' }}>
                    <span style={{ color: 'rgba(211,191,162,0.4)', fontFamily: 'monospace', fontSize: '0.68rem' }}>{item.quantity}×</span>
                    {' '}{item.name}
                  </div>
                ))}
                {welcomeCard.lastOrderItems.length > 4 && (
                  <div style={{ fontSize: '0.62rem', color: 'rgba(211,191,162,0.2)' }}>
                    +{welcomeCard.lastOrderItems.length - 4} more items
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fav dish + visit count */}
          {(welcomeCard.favDish || welcomeCard.visitCount > 1) && (
            <div style={{ display: 'grid', gridTemplateColumns: welcomeCard.favDish && welcomeCard.visitCount > 1 ? '1fr 1fr' : '1fr', gap: '9px', marginBottom: '16px' }}>
              {welcomeCard.favDish && (
                <div style={{ padding: '10px 13px', background: 'rgba(211,191,162,0.05)', border: '1px solid rgba(211,191,162,0.12)', borderRadius: '11px' }}>
                  <div style={{ fontSize: '0.48rem', color: 'rgba(211,191,162,0.3)', fontWeight: '900', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                    {language === 'mr' ? 'आवडता पदार्थ' : 'Favourite Dish'}
                  </div>
                  <div style={{ fontSize: '0.76rem', fontWeight: '800', color: '#d3bfa2', lineHeight: 1.3 }}>
                    {welcomeCard.favDish.name}
                  </div>
                  {welcomeCard.favDish.count > 1 && (
                    <div style={{ fontSize: '0.6rem', color: 'rgba(211,191,162,0.35)', marginTop: '3px' }}>
                      {language === 'mr' ? `${welcomeCard.favDish.count} वेळा` : `ordered ${welcomeCard.favDish.count}×`}
                    </div>
                  )}
                </div>
              )}
              {welcomeCard.visitCount > 1 && (
                <div style={{ padding: '10px 13px', background: 'rgba(211,191,162,0.05)', border: '1px solid rgba(211,191,162,0.12)', borderRadius: '11px' }}>
                  <div style={{ fontSize: '0.48rem', color: 'rgba(211,191,162,0.3)', fontWeight: '900', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                    {language === 'mr' ? 'भेटी' : 'Total Visits'}
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#d3bfa2', lineHeight: 1, fontFamily: 'monospace' }}>
                    {welcomeCard.visitCount}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: 'rgba(211,191,162,0.35)', marginTop: '3px' }}>
                    {welcomeCard.visitCount >= 5
                      ? (language === 'mr' ? 'लॉयल गेस्ट 🏅' : 'Loyal Guest 🏅')
                      : (language === 'mr' ? 'भेटी' : 'visits')}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={() => {
              localStorage.setItem(`pratyeksha_phone_${tenantId}`, welcomePhone);
              setWelcomeDismissed(true);
            }}
            style={{
              width: '100%', padding: '15px',
              background: 'linear-gradient(135deg,#d3bfa2,#bda88a)',
              border: 'none', borderRadius: '13px',
              color: '#0c0c0c', fontWeight: '900', fontSize: '0.86rem',
              cursor: 'pointer', letterSpacing: '0.5px', textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px',
              boxShadow: '0 6px 20px rgba(211,191,162,0.18)'
            }}
          >
            <Utensils size={15} strokeWidth={2.5} />
            {language === 'mr' ? 'चला ऑर्डर देऊया!' : "LET'S ORDER →"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

{/* ── PHONE PROMPT (new customers / unrecognized) ── */}
<AnimatePresence>
  {showPhonePrompt && !welcomeCard && !welcomeDismissed && !isCounterScan && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 8000,
        background: 'rgba(0,0,0,0.82)',
        display: 'flex', alignItems: 'flex-end',
        justifyContent: 'center', padding: '0 0 28px',
        fontFamily: 'Poppins, sans-serif'
      }}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        style={{
          width: '100%', maxWidth: '420px',
          background: '#0d0d0d',
          border: '1px solid rgba(211,191,162,0.12)',
          borderRadius: '24px 24px 18px 18px',
          overflow: 'hidden', margin: '0 14px'
        }}
      >
        <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, rgba(211,191,162,0.4), transparent)' }} />

        <div style={{ padding: '22px 22px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
            <div>
              <div style={{ fontSize: '0.56rem', color: 'rgba(211,191,162,0.3)', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '5px' }}>
                {restaurantData?.name}
              </div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '900', color: '#fff', letterSpacing: '-0.3px' }}>
                {language === 'mr' ? 'तुम्ही आधी आलेले आहात का?' : 'Been here before?'}
              </h3>
              <p style={{ margin: '5px 0 0', fontSize: '0.68rem', color: 'rgba(255,255,255,0.2)', lineHeight: 1.6 }}>
                {language === 'mr'
                  ? 'नंबर द्या — शेवटची ऑर्डर दाखवतो!'
                  : 'Enter your number and we\'ll show your last order.'}
              </p>
            </div>
            <button onClick={() => { setShowPhonePrompt(false); setWelcomeDismissed(true); }} style={{
              width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
              background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
              color: '#444', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <X size={14} />
            </button>
          </div>

          {/* Phone input */}
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem', color: 'rgba(211,191,162,0.4)', fontWeight: '700', pointerEvents: 'none' }}>+91</span>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="9876543210"
              value={welcomePhoneInput}
              onInput={e => setWelcomePhoneInput(e.target.value.replace(/\D/g,'').slice(0,10))}
              style={{
                width: '100%', padding: '14px 16px 14px 52px',
                background: '#111', border: '1px solid rgba(211,191,162,0.15)',
                color: '#fff', borderRadius: '12px', fontSize: '1rem',
                outline: 'none', boxSizing: 'border-box',
                fontFamily: 'Poppins, sans-serif', letterSpacing: '1.5px',
                transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(211,191,162,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(211,191,162,0.15)'}
              onKeyDown={e => { if (e.key === 'Enter' && welcomePhoneInput.length === 10) document.getElementById('recognize-btn').click(); }}
              autoFocus
            />
          </div>

          <button
            id="recognize-btn"
            disabled={welcomePhoneInput.length !== 10 || welcomeLoading}
            onClick={async () => {
              const phone = welcomePhoneInput;
              localStorage.setItem(`pratyeksha_phone_${tenantId}`, phone);
              setWelcomeLoading(true);
              try {
                const res = await axios.get(`${BASE_URL}/customers/recognize/${tenantId}/${phone}`);
                if (res.data?.found) {
                  setWelcomePhone(phone);
                  setWelcomeCard(res.data);
                  setShowPhonePrompt(false);
                } else {
                  // New customer — just dismiss
                  setShowPhonePrompt(false);
                  setWelcomeDismissed(true);
                }
              } catch {
                setShowPhonePrompt(false);
                setWelcomeDismissed(true);
              } finally { setWelcomeLoading(false); }
            }}
            style={{
              width: '100%', padding: '14px',
              background: welcomePhoneInput.length === 10
                ? 'linear-gradient(135deg,#d3bfa2,#bda88a)'
                : 'rgba(211,191,162,0.05)',
              border: welcomePhoneInput.length === 10 ? 'none' : '1px solid rgba(211,191,162,0.1)',
              color: welcomePhoneInput.length === 10 ? '#0c0c0c' : 'rgba(211,191,162,0.2)',
              borderRadius: '12px', fontWeight: '900', fontSize: '0.82rem',
              cursor: welcomePhoneInput.length === 10 ? 'pointer' : 'not-allowed',
              letterSpacing: '0.5px', textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            {welcomeLoading
              ? (language === 'mr' ? 'शोधत आहे...' : 'Checking...')
              : (language === 'mr' ? 'तपासा' : 'CHECK MY HISTORY')}
            {!welcomeLoading && <ChevronRight size={15} />}
          </button>

          <button
            onClick={() => { setShowPhonePrompt(false); setWelcomeDismissed(true); }}
            style={{
              width: '100%', marginTop: '10px', padding: '11px',
              background: 'transparent', border: 'none',
              color: 'rgba(255,255,255,0.15)', fontSize: '0.72rem',
              cursor: 'pointer', fontWeight: '700'
            }}
          >
            {language === 'mr' ? 'वगळा' : 'Skip'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>


════════════════════════════════════════
BACKEND ROUTE TO ADD IN server.js
════════════════════════════════════════

GET /api/customers/recognize/:tenantId/:phone

app.get('/api/customers/recognize/:tenantId/:phone', async (req, res) => {
  try {
    const { tenantId, phone } = req.params;
    const customer = await Customer.findOne({ tenantId, phone });
    if (!customer) return res.json({ found: false });

    // Get last order for this customer's phone
    const lastOrder = await Order.findOne({
      tenantId,
      customerPhone: phone,
      status: { $in: ['served','settled'] }
    }).sort({ createdAt: -1 });

    // Count all orders by this customer
    const visitCount = await Order.countDocuments({
      tenantId, customerPhone: phone
    });

    // Find favourite dish
    const allOrders = await Order.find({ tenantId, customerPhone: phone });
    const dishCount = {};
    allOrders.forEach(o => {
      (o.items || []).forEach(item => {
        dishCount[item.name] = (dishCount[item.name] || 0) + (item.quantity || 1);
      });
    });
    const favDishName = Object.keys(dishCount).sort((a,b) => dishCount[b]-dishCount[a])[0];

    res.json({
      found: true,
      name: customer.name,
      lastVisit: customer.lastVisit || lastOrder?.createdAt,
      lastOrderItems: lastOrder?.items?.slice(0,5) || [],
      favDish: favDishName ? { name: favDishName, count: dishCount[favDishName] } : null,
      visitCount: visitCount || 1
    });
  } catch(err) { res.status(500).json({ found: false }); }
});
