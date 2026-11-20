// Sets the splash-screen message from the URL. Kept as an external file (not inline in index.html) so the
// Content-Security-Policy can forbid inline scripts.
;(function(){var p=location.pathname,m="Preparing your menu";if(p.indexOf("/owner")===0)m="Opening your dashboard";else if(p.indexOf("/kitchen")===0)m="Firing up the kitchen";else if(p.indexOf("/operator")===0)m="Setting up the floor";else if(p.indexOf("/master-admin")===0)m="Opening the control room";else if(p.indexOf("/landing")===0)m="Welcome to Pratyeksha";else if(p.indexOf("/feedback-suite")===0)m="Opening your feedback space";else if(p==="/"||p==="")m="Finding your favourite caf\u00e9s";var e=document.getElementById("pxs-msg");if(e)e.textContent=m})()

// Google Fonts without blocking first paint: the stylesheet is attached as media="print" (never render-blocking)
// and flipped to "all" once it has loaded. index.html still carries a <noscript> fallback and a preload hint.
;(function(){var u="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Poppins:wght@400;600;700;900&display=swap";var l=document.createElement("link");l.rel="stylesheet";l.href=u;l.media="print";l.onload=function(){l.media="all"};document.head.appendChild(l)})()
