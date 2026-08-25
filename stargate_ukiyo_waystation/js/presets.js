/**
 * Travel Ledger Presets (道中記 登録路)
 * Preloaded itineraries across 2 route tiers:
 * Tier 1: Imperial Courier Routes (勅使早馬道) - Fast diplomatic arteries
 * Tier 2: Pilgrim Passes & Hidden Sanctuaries (巡礼秘境路) - Mystical high-alpine passages
 *
 * Implements genuine sequential auto-dialing with woodblock registration rhythm.
 * Lands in PENDING/READY state without auto-activating.
 * Disengage is functional throughout.
 */

const PRESETS_DATA = [
    {
        id: 'courier_dawn_tide',
        tier: 1,
        tierName: 'Imperial Courier Route (勅使早馬道)',
        name: 'Dawn Tide Express',
        kanji: '暁潮早馬路',
        origin: 'Akatsuki-kyō (暁橋)',
        destination: 'Hoshiai Coast (星合之浜)',
        desc: 'Official courier trail carrying imperial barrier passes along the eastern mist marshes.',
        sequence: ['AKATSUKI', 'MATSUKAZE', 'NAMINOMON', 'HOSHIAI', 'RINDO', 'TSUKIMI', 'AKATSUKI']
    },
    {
        id: 'courier_summer_pine',
        tier: 1,
        tierName: 'Imperial Courier Route (勅使早馬道)',
        name: 'Summer Pine Highway',
        kanji: '夏松大路',
        origin: 'Matsukaze-seki (松風関)',
        destination: 'Thunderclap Crags (雷平)',
        desc: 'Direct dispatch line traversing coastal pine bluffs through mountain waterfalls.',
        sequence: ['MATSUKAZE', 'KAGERO', 'RINDO', 'ASAGIRI', 'YUKINOTAKI', 'KAMINARI', 'MATSUKAZE']
    },
    {
        id: 'courier_star_crest',
        tier: 1,
        tierName: 'Imperial Courier Route (勅使早馬道)',
        name: 'Star-Crest Shore Route',
        kanji: '星波本道',
        origin: 'Hoshiai-no-hama (星合之浜)',
        destination: 'Bellflower Post (竜胆館)',
        desc: 'Coastal tidal passage synchronized with high stellar conjunction tides.',
        sequence: ['HOSHIAI', 'NAMINOMON', 'TSUKIMI', 'KAGERO', 'ASAGIRI', 'RINDO', 'HOSHIAI']
    },
    {
        id: 'pilgrim_autumn_moon',
        tier: 2,
        tierName: 'Pilgrim Mountain Pass (巡礼秘境路)',
        name: 'Autumn Moon Ascent',
        kanji: '秋月登嶺路',
        origin: 'Tsukimi-tōge (月見峠)',
        destination: 'High Ridge Crest (月見峠)',
        desc: 'Sacred mountain ascendance under golden crescent moons through bamboo gorges.',
        sequence: ['TSUKIMI', 'YUKINOTAKI', 'ASAGIRI', 'KAGERO', 'MATSUKAZE', 'KAMINARI', 'TSUKIMI']
    },
    {
        id: 'pilgrim_thunder_sanctuary',
        tier: 2,
        tierName: 'Pilgrim Mountain Pass (巡礼秘境路)',
        name: 'Thunderclap Sanctuary',
        kanji: '雷雲奥社道',
        origin: 'Kaminari-daira (雷平)',
        destination: 'Ancient Wave Gate (波之門)',
        desc: 'Hermit pilgrimage traversing basalt crags and hidden waterfall shrines.',
        sequence: ['KAMINARI', 'YUKINOTAKI', 'RINDO', 'TSUKIMI', 'NAMINOMON', 'AKATSUKI', 'KAMINARI']
    },
    {
        id: 'pilgrim_snow_cataract',
        tier: 2,
        tierName: 'Pilgrim Mountain Pass (巡礼秘境路)',
        name: 'Deep Snow Cataract',
        kanji: '深冬幽滝路',
        origin: 'Yuki-no-taki (雪之滝)',
        destination: 'Morning Mist Hamlet (朝霧村)',
        desc: 'Winter secluded trail carved into frozen icefalls and purple mountain haze.',
        sequence: ['YUKINOTAKI', 'ASAGIRI', 'KAGERO', 'TSUKIMI', 'HOSHIAI', 'MATSUKAZE', 'YUKINOTAKI']
    }
];

class PresetsManager {
    constructor() {
        this.container = null;
        this.isAutoDialing = false;
        this.currentTimer = null;
        this.activePresetId = null;
    }

    init(containerId = 'presets-ledger') {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        this.renderLedger();
        this.bindEvents();
    }

    renderLedger() {
        const tier1 = PRESETS_DATA.filter(p => p.tier === 1);
        const tier2 = PRESETS_DATA.filter(p => p.tier === 2);

        this.container.innerHTML = `
            <div class="ledger-scroll-frame">
                <div class="ledger-header">
                    <span class="ledger-title-kanji">道中記 登録路</span>
                    <span class="ledger-title-en">Waystation Travel Ledger</span>
                </div>
                
                <div class="ledger-tier-tabs">
                    <button class="tier-tab active" data-tier="1">勅使早馬道 (Courier)</button>
                    <button class="tier-tab" data-tier="2">巡礼秘境路 (Pilgrim)</button>
                </div>

                <div class="ledger-content">
                    <div class="preset-group tier-group-1 active">
                        ${tier1.map(p => this.renderPresetCard(p)).join('')}
                    </div>
                    <div class="preset-group tier-group-2">
                        ${tier2.map(p => this.renderPresetCard(p)).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    renderPresetCard(preset) {
        return `
            <div class="preset-card" data-id="${preset.id}">
                <div class="preset-card-header">
                    <span class="preset-kanji">${preset.kanji}</span>
                    <span class="preset-name">${preset.name}</span>
                </div>
                <div class="preset-desc">${preset.desc}</div>
                <div class="preset-route-chips">
                    ${preset.sequence.map((stId, idx) => {
                        const st = STATIONS_DATA.find(s => s.id === stId);
                        return `<span class="route-chip"><span class="chip-idx">${idx + 1}</span>${st ? st.kanji : stId}</span>`;
                    }).join('<span class="chip-arrow">›</span>')}
                </div>
                <button class="preset-dial-btn" data-id="${preset.id}">
                    <span class="btn-stamp">自動摺刻</span>
                    <span class="btn-text">Auto-Dial Route</span>
                </button>
            </div>
        `;
    }

    bindEvents() {
        // Tab switching
        const tabs = this.container.querySelectorAll('.tier-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tier = tab.getAttribute('data-tier');
                tabs.forEach(t => t.classList.toggle('active', t === tab));
                const g1 = this.container.querySelector('.tier-group-1');
                const g2 = this.container.querySelector('.tier-group-2');
                if (g1) g1.classList.toggle('active', tier === '1');
                if (g2) g2.classList.toggle('active', tier === '2');
                window.UkiyoeAudio.playPaperFriction(0.1, 0.2);
            });
        });

        // Dial buttons
        const dialBtns = this.container.querySelectorAll('.preset-dial-btn');
        dialBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = btn.getAttribute('data-id');
                this.startAutoDial(id);
            });
        });
    }

    /**
     * Genuinely auto-dials the preset sequence step by step.
     * Each station rotates the dial, stamps the print layers, and updates the fuda slots.
     * Lands in PENDING/READY state without auto-activating.
     * Disengage is functional throughout.
     */
    startAutoDial(presetId) {
        if (window.PortalController && window.PortalController.isActive) {
            console.warn('Cannot auto-dial while portal is active. Disengage first.');
            return;
        }

        const preset = PRESETS_DATA.find(p => p.id === presetId);
        if (!preset) return;

        // Disengage / Reset first
        if (window.PortalController) {
            window.PortalController.resetToIdle(false);
        }

        this.isAutoDialing = true;
        this.activePresetId = presetId;

        // Visual indicator on active card
        const cards = this.container.querySelectorAll('.preset-card');
        cards.forEach(c => c.classList.toggle('autodialing', c.getAttribute('data-id') === presetId));

        let stepIndex = 0;
        const totalSteps = preset.sequence.length;

        const executeStep = () => {
            if (!this.isAutoDialing) return; // Disengaged mid-sequence

            if (stepIndex >= totalSteps) {
                this.isAutoDialing = false;
                cards.forEach(c => c.classList.remove('autodialing'));
                if (window.PortalController) {
                    window.PortalController.onSequenceComplete();
                }
                return;
            }

            const stationId = preset.sequence[stepIndex];
            const station = STATIONS_DATA.find(s => s.id === stationId);
            const stationIdx = station ? station.index : 0;
            const currentLockIdx = stepIndex;

            // Rotate dial with isManual = false
            window.CelestialDial.rotateToStation(stationIdx, false, () => {
                if (!this.isAutoDialing) return;

                // Stamp the ring sector and woodblock print in sync (isFast = true for crisp auto-dial pacing)
                window.CelestialDial.animateSectorLock(stationIdx, station, true);
                window.WoodblockEngine.stampStation(station, currentLockIdx, () => {
                    if (!this.isAutoDialing) return;

                    if (window.PortalController) {
                        window.PortalController.registerLockedStation(station);
                    }
                    stepIndex++;

                    if (stepIndex >= totalSteps) {
                        this.isAutoDialing = false;
                        cards.forEach(c => c.classList.remove('autodialing'));
                        if (window.PortalController) {
                            window.PortalController.onSequenceComplete();
                        }
                    } else {
                        // Brief pause between stations
                        this.currentTimer = setTimeout(executeStep, 100);
                    }
                }, true);
            });
        };

        // Start first step
        executeStep();
    }

    cancelAutoDial() {
        this.isAutoDialing = false;
        if (this.currentTimer) {
            clearTimeout(this.currentTimer);
            this.currentTimer = null;
        }
        if (this.container) {
            const cards = this.container.querySelectorAll('.preset-card');
            cards.forEach(c => c.classList.remove('autodialing'));
        }
    }
}

// Global instance
window.PresetsManager = new PresetsManager();
