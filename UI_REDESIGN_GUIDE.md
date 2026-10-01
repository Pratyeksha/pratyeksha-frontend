# PRATYEKSHa UI Redesign Guide

The redesign preserves the existing charcoal / warm beige / sage / ivory / white visual language.

## Global layer
- `src/ui-redesign.css` contains the shared responsive UI layer.
- `src/index.css` is the neutral application foundation.
- `src/App.css` retains only scrollbar compatibility utilities.

## Surfaces covered
- Customer directory and operational customer flow
- Public PRATYEKSHa site
- Operator Portal
- Owner Portal
- Master Admin
- Kitchen / KDS
- PRATYEKSHa Assistant
- PWA install controls

## Responsive targets
- 320–560px: phone
- 561–820px: large phone / small tablet
- 821–1100px: tablet / compact desktop
- 1101px+: desktop

## UX principles
- No horizontal page overflow.
- Touch targets are at least 40–44px where practical.
- Tables scroll inside their own containers rather than widening the viewport.
- Modals respect safe viewport height.
- Sidebars become drawers on small screens.
- Logos use `object-fit: contain` and retain the beige/ivory contrast treatment.
- Reduced-motion users receive minimal animation.
- Existing business logic, API contracts and product color palette are not intentionally changed by the redesign layer.
