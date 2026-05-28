// Glyph symbols (using geometric shapes as placeholders)
// In a real implementation, these would be custom SVG or font glyphs
const GLYPH_SYMBOLS = [
    '⊕', // 0 - Point of Origin (Earth)
    'Α', 'Β', 'Γ', 'Δ', 'Ε', 'Ζ', 'Η', 'Θ', 'Ι', // 1-9
    'Κ', 'Λ', 'Μ', 'Ν', 'Ξ', 'Ο', 'Π', 'Ρ', 'Σ', 'Τ', // 10-19
    'Υ', 'Φ', 'Χ', 'Ψ', 'Ω', '◊', '△', '□', '○', '☆', // 20-29
    '◇', '▽', '⬡', '⬢', '◈', '⊗', '⊛', '⊜', '⊝' // 30-38
];

// Glyph names (constellation-inspired)
const GLYPH_NAMES = [
    'Earth', 'Crater', 'Virgo', 'Boötes', 'Centaurus',
    'Libra', 'Serpens', 'Norma', 'Scorpius', 'Corona',
    'Scutum', 'Sagittarius', 'Aquila', 'Microscopium', 'Capricornus',
    'Piscis', 'Aquarius', 'Pegasus', 'Sculptor', 'Pisces',
    'Andromeda', 'Triangulum', 'Aries', 'Perseus', 'Cetus',
    'Taurus', 'Auriga', 'Eridanus', 'Orion', 'Canis',
    'Monoceros', 'Gemini', 'Hydra', 'Lynx', 'Cancer',
    'Sextans', 'Leo', 'Crater Minor', 'Point of Origin'
];

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ADDRESSES, GLYPH_SYMBOLS, GLYPH_NAMES };
}
