// Common food allergens a restaurant can tag on a dish. ids are stored on the menu item (lowercase letters only).
export const ALLERGENS = [
  { id: 'gluten', label: 'Gluten', mr: 'ग्लूटेन' }, { id: 'dairy', label: 'Dairy', mr: 'दूध/दुग्धजन्य' }, { id: 'nuts', label: 'Tree nuts', mr: 'सुकामेवा' },
  { id: 'peanuts', label: 'Peanuts', mr: 'शेंगदाणे' }, { id: 'egg', label: 'Egg', mr: 'अंडी' }, { id: 'soy', label: 'Soy', mr: 'सोया' },
  { id: 'fish', label: 'Fish', mr: 'मासे' }, { id: 'shellfish', label: 'Shellfish', mr: 'कवचधारी' }, { id: 'sesame', label: 'Sesame', mr: 'तीळ' },
  { id: 'mustard', label: 'Mustard', mr: 'मोहरी' },
];
export const allergenLabel = (id, lang = 'en') => { const a = ALLERGENS.find((x) => x.id === id); return a ? (lang === 'mr' ? a.mr : a.label) : id; };
