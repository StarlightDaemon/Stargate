/* AUREOLE — isotope table and preset cams.
 * Twelve exhibition isotopes (all invented), seven Bohr shells K..Q, five
 * pushbutton preset cams. Everything here is fictional. */
window.AUREOLE_ISOTOPES = [
  { id: 'Vx', name: 'Vexium',    nm: 412, tone: 261.6 },
  { id: 'Qo', name: 'Quorine',   nm: 437, tone: 293.7 },
  { id: 'Jr', name: 'Jarrum',    nm: 461, tone: 329.6 },
  { id: 'Yx', name: 'Yxalt',     nm: 486, tone: 392.0 },
  { id: 'Kw', name: 'Kwendine',  nm: 508, tone: 440.0 },
  { id: 'Xa', name: 'Xantrium',  nm: 531, tone: 493.9 },
  { id: 'Wq', name: 'Wequill',   nm: 556, tone: 523.3 },
  { id: 'Fz', name: 'Fizzeron',  nm: 579, tone: 587.3 },
  { id: 'Gv', name: 'Gavrite',   nm: 601, tone: 659.3 },
  { id: 'Zq', name: 'Zerquine',  nm: 628, tone: 784.0 },
  { id: 'Py', name: 'Pyrrhalum', nm: 655, tone: 880.0 },
  { id: 'Ux', name: 'Uxenium',   nm: 683, tone: 987.8 }
];

/* Shells, innermost first. Real spectroscopic shell letters; invented use. */
window.AUREOLE_SHELLS = ['K', 'L', 'M', 'N', 'O', 'P', 'Q'];

/* Preset cams. A cam is a pre-cut tuning profile: the servo runs straight to
 * the cam stop for each shell instead of hunting for resonance by hand. That
 * is why a preset seats faster than hand tuning, and why it still walks every
 * shell in order — a cam cannot skip a stop. */
window.AUREOLE_PRESETS = [
  { id: 1, name: 'PALOMAR SPRINGS', note: 'Exposition twin pavilion · cam cut 1955',
    address: ['Vx', 'Kw', 'Gv', 'Qo', 'Py', 'Xa', 'Jr'] },
  { id: 2, name: 'SKYLINE MESA', note: 'Observatory terrace · cam cut 1956',
    address: ['Yx', 'Ux', 'Fz', 'Wq', 'Vx', 'Zq', 'Kw'] },
  { id: 3, name: 'MOONGLOW COURT', note: 'No answering resonance since the ’57 season',
    address: ['Zq', 'Jr', 'Ux', 'Kw', 'Yx', 'Py', 'Qo'], dark: true },
  { id: 4, name: 'CORAL TERRACE', note: 'Seaside lounge · cam cut 1958',
    address: ['Fz', 'Xa', 'Qo', 'Gv', 'Wq', 'Vx', 'Ux'] },
  { id: 5, name: 'TWILITE JUNCTION', note: 'Motor court & diner · cam cut 1959',
    address: ['Py', 'Wq', 'Kw', 'Zq', 'Jr', 'Fz', 'Yx'] }
];
