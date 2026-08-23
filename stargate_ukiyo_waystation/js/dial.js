/**
 * Celestial Woodblock Compass Dial (天象木版方位儀)
 * Controls the off-center rotating woodblock selector dial,
 * chevron registration marks (kento), 10 station sectors,
 * smooth physical rotation interpolation, and click-to-dial interactions.
 */

class CelestialDial {
    constructor() {
        this.dialElem = null;
        this.innerRingElem = null;
        this.pointerElem = null;
        this.stationPadsElem = null;
        this.currentAngle = 0;
        this.targetAngle = 0;
        this.selectedIndex = -1;
        this.isSpinning = false;
        this.onStationLockedCallback = null;
    }

    init(containerId = 'dial-container', onStationLocked = null) {
        this.onStationLockedCallback = onStationLocked;
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.renderDialStructure();
        this.bindEvents();
    }

    renderDialStructure() {
        const totalStations = STATIONS_DATA.length;
        const angleStep = 360 / totalStations;

        let sectorsSvg = '';
        for (let i = 0; i < totalStations; i++) {
            const st = STATIONS_DATA[i];
            const angle = i * angleStep;

            sectorsSvg += `
                <g class="dial-sector" data-index="${i}" data-id="${st.id}" transform="rotate(${angle} 260 260)">
                    <!-- Outer Woodblock Rim Notch -->
                    <rect x="254" y="16" width="12" height="24" fill="#9e7b51" stroke="#1a1818" stroke-width="2"/>
                    <text x="260" y="32" font-family="'Noto Serif JP', serif" font-size="11" font-weight="900" fill="#1a1818" text-anchor="middle">${i + 1}</text>
                    
                    <!-- Station Seal Badge -->
                    <circle cx="260" cy="72" r="26" fill="#f4ecd4" stroke="#1a1818" stroke-width="3" class="sector-badge"/>
                    <text x="260" y="78" font-family="'Noto Serif JP', serif" font-size="16" font-weight="900" fill="#1a1818" text-anchor="middle">${st.kanji.charAt(0)}</text>
                    <text x="260" y="112" font-family="'Noto Serif JP', serif" font-size="10" font-weight="700" fill="#842618" text-anchor="middle">${st.kanji}</text>
                </g>
            `;
        }

        // Inner Trigrams
        const trigrams = ['乾 (Heaven)', '坎 (Water)', '艮 (Mountain)', '震 (Thunder)', '巽 (Wind)', '離 (Fire)', '坤 (Earth)', '兌 (Lake)'];
        let trigramsSvg = '';
        const triAngleStep = 360 / trigrams.length;
        for (let j = 0; j < trigrams.length; j++) {
            const a = j * triAngleStep;
            trigramsSvg += `
                <g transform="rotate(${a} 260 260)">
                    <line x1="260" y1="140" x2="260" y2="155" stroke="#1a1818" stroke-width="2"/>
                    <text x="260" y="168" font-family="'Noto Serif JP', serif" font-size="11" font-weight="900" fill="#1d3b53" text-anchor="middle">${trigrams[j].charAt(0)}</text>
                </g>
            `;
        }

        this.container.innerHTML = `
            <div class="dial-instrument-stack">
                <div class="celestial-dial-wrapper">
                    <!-- Outer decorative wooden ring with Kento alignment marks -->
                    <div class="kento-compass-ring">
                        <div class="kento-mark north"></div>
                        <div class="kento-mark east"></div>
                        <div class="kento-mark south"></div>
                        <div class="kento-mark west"></div>
                    </div>

                    <!-- Main SVG Dial Body -->
                    <svg viewBox="0 0 520 520" class="dial-svg" id="rotary-dial-svg">
                        <defs>
                            <radialGradient id="dialWoodGrad" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stop-color="#f5eedb"/>
                                <stop offset="70%" stop-color="#ecdcb8"/>
                                <stop offset="96%" stop-color="#cbb58c"/>
                                <stop offset="100%" stop-color="#8b6b43"/>
                            </radialGradient>
                            <radialGradient id="innerCoreGrad" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stop-color="#fcf8ec"/>
                                <stop offset="85%" stop-color="#eed8ac"/>
                                <stop offset="100%" stop-color="#1d3b53"/>
                            </radialGradient>
                        </defs>

                        <!-- Outer Timber Rim -->
                        <circle cx="260" cy="260" r="252" fill="url(#dialWoodGrad)" stroke="#1a1818" stroke-width="6"/>
                        <circle cx="260" cy="260" r="248" fill="none" stroke="#842618" stroke-width="2" stroke-dasharray="6 3"/>

                        <!-- Station Sectors Ring (Rotates) -->
                        <g id="dial-rotary-group">
                            <circle cx="260" cy="260" r="218" fill="#faf4e2" stroke="#1a1818" stroke-width="4"/>
                            ${sectorsSvg}
                            
                            <!-- Middle Ring with Trigrams -->
                            <circle cx="260" cy="260" r="140" fill="url(#innerCoreGrad)" stroke="#1a1818" stroke-width="3.5"/>
                            ${trigramsSvg}
                        </g>

                        <!-- Center Fixed Hub with Pointer Needle -->
                        <circle cx="260" cy="260" r="85" fill="#fdfaf0" stroke="#1a1818" stroke-width="5" class="center-hub"/>
                        
                        <!-- Fixed Top Station Registration Pointer (Kento Blade) -->
                        <g id="dial-pointer-needle" class="kento-needle">
                            <polygon points="260,18 248,60 272,60" fill="#c73d2a" stroke="#1a1818" stroke-width="3"/>
                            <circle cx="260" cy="62" r="5" fill="#e5b83b" stroke="#1a1818" stroke-width="1.5"/>
                        </g>

                        <!-- Center Seal & Hub Kanji -->
                        <g class="center-seal-group">
                            <circle cx="260" cy="260" r="62" fill="#c73d2a" stroke="#1a1818" stroke-width="3"/>
                            <text x="260" y="252" font-family="'Noto Serif JP', serif" font-size="16" font-weight="900" fill="#fdfaf0" text-anchor="middle">雲路</text>
                            <text x="260" y="276" font-family="'Noto Serif JP', serif" font-size="16" font-weight="900" fill="#fdfaf0" text-anchor="middle">関所</text>
                        </g>
                    </svg>
                </div>

                <!-- 10 Station Woodblock Stamp Touchpads (Placed Below Dial) -->
                <div class="station-pad-strip" id="station-pad-strip">
                    ${STATIONS_DATA.map((st, i) => `
                        <button class="station-pad-btn" data-index="${i}" data-id="${st.id}" title="${st.name}">
                            <span class="pad-num">${i + 1}</span>
                            <span class="pad-kanji">${st.kanji}</span>
                            <span class="pad-romaji">${st.romaji}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        this.dialSvg = document.getElementById('rotary-dial-svg');
        this.rotaryGroup = document.getElementById('dial-rotary-group');
    }

    bindEvents() {
        // Direct click on dial sectors
        const sectors = this.container.querySelectorAll('.dial-sector');
        sectors.forEach(sec => {
            sec.addEventListener('click', (e) => {
                const idx = parseInt(sec.getAttribute('data-index'), 10);
                this.rotateToStation(idx, true);
            });
        });

        // Click on station pad buttons
        const padBtns = this.container.querySelectorAll('.station-pad-btn');
        padBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(btn.getAttribute('data-index'), 10);
                this.rotateToStation(idx, true);
            });
        });
    }

    /**
     * Rotates dial to target station index (0-9)
     * @param {number} targetIdx
     * @param {boolean} isManual - If true, invokes onStationLockedCallback
     * @param {Function} onDone - Callback after rotation animation finishes
     */
    rotateToStation(targetIdx, isManual = false, onDone = null) {
        if (targetIdx < 0 || targetIdx >= STATIONS_DATA.length) return;
        this.selectedIndex = targetIdx;

        const targetDeg = -(targetIdx * (360 / STATIONS_DATA.length));
        
        // Calculate shortest angular delta
        let delta = (targetDeg - (this.currentAngle % 360)) % 360;
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;

        const finalAngle = this.currentAngle + delta;
        this.currentAngle = finalAngle;

        // Play wood brush and clapper sounds
        window.UkiyoeAudio.playBrushSweep();
        window.UkiyoeAudio.playClapper();

        // Highlight active pad
        const padBtns = this.container.querySelectorAll('.station-pad-btn');
        padBtns.forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.getAttribute('data-index'), 10) === targetIdx);
        });

        // Apply smooth transition
        if (this.rotaryGroup) {
            this.rotaryGroup.style.transition = 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)';
            this.rotaryGroup.style.transformOrigin = '260px 260px';
            this.rotaryGroup.style.transform = `rotate(${finalAngle}deg)`;
        }

        setTimeout(() => {
            if (isManual && this.onStationLockedCallback) {
                this.onStationLockedCallback(STATIONS_DATA[targetIdx]);
            }
            if (onDone) onDone(STATIONS_DATA[targetIdx]);
        }, 240);
    }

    resetDial() {
        this.currentAngle = 0;
        this.selectedIndex = -1;
        if (this.rotaryGroup) {
            this.rotaryGroup.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
            this.rotaryGroup.style.transform = 'rotate(0deg)';
        }
        const padBtns = this.container.querySelectorAll('.station-pad-btn');
        padBtns.forEach(btn => btn.classList.remove('active'));
    }
}

// Global instance
window.CelestialDial = new CelestialDial();
