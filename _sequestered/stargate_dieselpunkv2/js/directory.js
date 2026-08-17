// Fictional termini of the Pan-Continental Travelways beacon network.
// Address = travel band + carrier wavelength in metres. No real places,
// no real contact data. Presel 1–5 have factory-cut cams; The Palisades
// is newly opened and must be tuned by hand.

export const BANDS = ['A', 'B', 'C'];

export const DESTS = [
  { id: 'vermilion', name: 'Port Vermilion',      band: 0, metres: 214, presel: 1 },
  { id: 'lakeshore', name: 'Lakeshore Pavilion',  band: 0, metres: 268, presel: 2 },
  { id: 'castile',   name: 'New Castile',         band: 1, metres: 187, presel: 3 },
  { id: 'caldera',   name: 'Caldera Vista',       band: 1, metres: 243, presel: 4 },
  { id: 'aerodrome', name: 'Aerodrome Nine',      band: 2, metres: 156, presel: 5 },
  { id: 'palisades', name: 'The Palisades',       band: 2, metres: 292, presel: null },
];

export function destByPresel(n) {
  return DESTS.find(d => d.presel === n) || null;
}
