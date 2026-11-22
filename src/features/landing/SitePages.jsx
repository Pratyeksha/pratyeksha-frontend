import React from "react";

/* Content for the multi-page landing site. Everything here describes what Pratyeksha does today, with no invented figures,
   prices or customer claims. `I` is the landing page's icon component, `go` navigates between site pages. */


const ROLE_BENEFITS = [
  { icon: "chart", who: "Owner", head: "See the whole business, not just today's till.", points: ["Executive insights, revenue and P&L in one place", "GST compliance view and exportable reports", "Menu intelligence: what earns, what only sells", "Staff, attendance and payroll alongside sales", "Day close with cash reconciliation, plus an audit trail of sensitive actions"] },
  { icon: "layers", who: "Manager and counter", head: "One portal for the floor, the counter and the bill.", points: ["Live orders and a floor view of every table", "Waitlist, reservation and pickup queue in one list", "Bills, bill requests, cash, UPI and card in one flow", "Stock alerts and instant sold-out control", "Offers, push notifications and gift cards"] },
  { icon: "kitchen", who: "Kitchen", head: "Tickets that stay clear when it gets busy.", points: ["Live tickets in the order they arrived", "Per-item cooking timers", "Changed orders are flagged so nothing is cooked twice", "Sold-out dishes disappear from the guest menu at once"] },
  { icon: "phone", who: "Guest", head: "Order without waiting for anyone, in their own language.", points: ["Scan the table QR; no app to install", "English and Marathi, with voice search", "3D dish preview, veg filter and allergen filter", "Change an order or booking before the restaurant confirms it", "Pay by UPI and get a digital invoice"] },
];

const OUTCOMES = [
  ["Fewer missed orders", "Guest, kitchen and counter see the same order at the same time."],
  ["Fewer stock surprises", "Dishes are tied to ingredients, so low stock and sold-out states reach the menu."],
  ["Clearer margins", "Dish cost, wastage and profit sit next to sales instead of in a separate sheet."],
  ["Easier GST days", "CGST and SGST are worked out on every bill, with sequential invoices and exports."],
  ["Guests who come back", "Remembered dishes, feedback, birthdays and campaigns keep the relationship going after the bill."],
  ["More new guests", "Your place appears on the Pratyeksha guest home with deals, specials and events that guests can act on."],
];

const SURFACES = [
  ["qr", "Guest menu", "Scan the table QR to browse, order, request service, pay and get an invoice. Waitlist, reservation and pickup live here too."],
  ["kitchen", "Kitchen display", "A live ticket screen with timers, so the kitchen always knows what to cook next."],
  ["layers", "Operator portal", "Orders, tables, billing, the counter queue, stock, staff, offers and day close for the people on shift."],
  ["chart", "Owner dashboard", "Insights, money, operations and guest growth across the business, from any phone."],
  ["map", "Guest home", "The directory where guests find your café or restaurant, see deals and claim them."],
];

const PRINCIPLES = [
  ["Built for service pressure", "Screens are designed for a busy floor first: one clear next action, not a feature checklist."],
  ["Indian by default", "Rupees, GST, UPI, English and Marathi are built in, not bolted on."],
  ["Each restaurant on its own", "Every restaurant's menu, orders and customers are kept separate from every other."],
  ["Protected tables", "Signed QR codes and device-bound tables keep an order tied to the table it came from."],
];

const BOOKING_FEATURES = [
  ["Waitlist", "Guests join the queue from their phone, see their position, and are notified when a table is ready."],
  ["Reservation", "Date, time, party size and notes, with an optional pre-order, confirmed by your team."],
  ["Pickup", "Scheduled pickup with the order placed in advance and a notification when it is ready."],
  ["Change before confirmed", "Guests can edit their dishes and details until the restaurant confirms. Your team sees an Edited by guest tag."],
];

export function PageHero({ I, eyebrow, title, em, lead, go, cta = true }) {
  return (
    <section className="nx-pghero">
      <div className="nx-wrap">
        <span className="nx-eyebrow">{eyebrow}</span>
        <h1>{title} <em>{em}</em></h1>
        <p>{lead}</p>
        {cta && <div className="nx-actions"><button type="button" className="nx-btn is-gold" onClick={() => go("/landing/demo")}>Book a private demo <I name="arrow" size={16} /></button></div>}
      </div>
    </section>
  );
}

export function CtaBand({ I, go, title = "See it running in your restaurant.", text = "A private walkthrough, focused on how your café or restaurant works today." }) {
  return (
    <section className="nx-sec nx-cta-band">
      <div className="nx-wrap">
        <h2>{title}</h2>
        <p>{text}</p>
        <button type="button" className="nx-btn is-gold" onClick={() => go("/landing/demo")}>Book a private demo <I name="arrow" size={16} /></button>
      </div>
    </section>
  );
}

export function ExploreRow({ I, go }) {
  const cards = [["/landing/features", "Features", "Everything in the system, from the guest's scan to the owner's report."], ["/landing/benefits", "Benefits", "What changes for owners, managers, the kitchen and guests."], ["/landing/about", "About", "What Pratyeksha is, who it is for and how it is built."], ["/landing/demo", "Book a demo", "See it with your own menu and your own workflow."]];
  return (
    <section className="nx-sec nx-explore">
      <div className="nx-wrap">
        <div className="nx-explore-grid">
          {cards.map(([path, t, d]) => (
            <button type="button" key={path} onClick={() => go(path)}><b>{t}</b><span>{d}</span><I name="arrow" size={16} /></button>
          ))}
        </div>
      </div>
    </section>
  );
}

export function BookingFeatures({ I }) {
  return (
    <section className="nx-sec nx-booking">
      <div className="nx-wrap">
        <header className="nx-head is-center">
          <span className="nx-eyebrow">WAITLIST · RESERVATION · PICKUP</span>
          <h2>Every way a guest reaches you, <em>handled.</em></h2>
          <p>Guests can queue, book ahead or order for pickup without a phone call, and they stay in control until you confirm.</p>
        </header>
        <div className="nx-use-grid">
          {BOOKING_FEATURES.map(([t, d], i) => (
            <article className="nx-use" key={t}><span className="nx-use-n">0{i + 1}</span><h3>{t}</h3><p>{d}</p><span className="nx-use-go"><I name="check" size={18} /></span></article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function RoleBenefits({ I }) {
  return (
    <section className="nx-sec nx-roles">
      <div className="nx-wrap">
        <header className="nx-head">
          <span className="nx-eyebrow">WHO IT HELPS</span>
          <h2>One system, <em>four better days.</em></h2>
          <p>Each person in the restaurant gets the view they need, driven by the same live information.</p>
        </header>
        <div className="nx-roles-grid">
          {ROLE_BENEFITS.map((r) => (
            <article className="nx-role" key={r.who}>
              <span className="nx-role-ic"><I name={r.icon} size={20} /></span>
              <small>{r.who.toUpperCase()}</small>
              <h3>{r.head}</h3>
              <ul>{r.points.map((p) => <li key={p}><I name="check" size={12} />{p}</li>)}</ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Outcomes({ I }) {
  return (
    <section className="nx-sec nx-outcomes">
      <div className="nx-wrap">
        <header className="nx-head is-center">
          <span className="nx-eyebrow">WHAT IMPROVES</span>
          <h2>The everyday problems, <em>connected away.</em></h2>
        </header>
        <div className="nx-bento">
          {OUTCOMES.map(([t, d], i) => (
            <article className="nx-cell" key={t}><span className="nx-cell-ic"><I name="check" size={20} /></span><span className="nx-cell-n">{String(i + 1).padStart(2, "0")}</span><h3>{t}</h3><p>{d}</p></article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AboutSystem({ I, go, contact }) {
  return (
    <>
      <section className="nx-sec nx-about-intro">
        <div className="nx-wrap nx-about-grid">
          <div>
            <span className="nx-eyebrow">WHAT PRATYEKSHA IS</span>
            <h2>A restaurant experience system, <em>in one place.</em></h2>
          </div>
          <div className="nx-about-copy">
            <p>Pratyeksha connects the guest's phone, the kitchen, the counter and the owner's dashboard into one live system for cafés and restaurants. An order placed at a table reaches the kitchen, the bill, the stock and the reports without anyone retyping it.</p>
            <p>It is built in Maharashtra, India, for the way Indian cafés and restaurants actually run: GST billing, UPI payments, English and Marathi, and a busy floor that cannot wait for software.</p>
          </div>
        </div>
      </section>

      <section className="nx-sec nx-surfaces">
        <div className="nx-wrap">
          <header className="nx-head"><span className="nx-eyebrow">THE FIVE SCREENS</span><h2>Five screens, <em>one system.</em></h2></header>
          <ol className="nx-surface-list">
            {SURFACES.map(([ic, t, d], i) => (
              <li key={t}><span className="nx-surface-n">{String(i + 1).padStart(2, "0")}</span><span className="nx-surface-ic"><I name={ic} size={20} /></span><div><h3>{t}</h3><p>{d}</p></div></li>
            ))}
          </ol>
          <button type="button" className="nx-link" onClick={() => go("/landing/features")}>See every feature <I name="arrow" size={15} /></button>
        </div>
      </section>

      <section className="nx-sec nx-principles">
        <div className="nx-wrap">
          <header className="nx-head"><span className="nx-eyebrow">HOW IT IS BUILT</span><h2>Four principles <em>behind every screen.</em></h2></header>
          <div className="nx-pillar-grid">
            {PRINCIPLES.map(([t, d], i) => (
              <article className="nx-pillar" key={t}><span className="nx-pillar-n">0{i + 1}</span><h3>{t}</h3><p>{d}</p></article>
            ))}
          </div>
        </div>
      </section>

      <section className="nx-sec nx-contact-band">
        <div className="nx-wrap">
          <header className="nx-head"><span className="nx-eyebrow">TALK TO US</span><h2>Questions before a demo? <em>Just ask.</em></h2></header>
          <div className="nx-contact-row">
            {contact.map(([href, label, ic]) => <a key={href} href={href}><I name={ic} size={15} />{label}</a>)}
            <span><I name="map" size={15} />Maharashtra, India</span>
          </div>
        </div>
      </section>
    </>
  );
}
