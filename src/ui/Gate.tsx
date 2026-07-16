/**
 * The gate itself: fixed outer ring, rotating inner symbol ring (driven by
 * the rAF controller), nine chevrons, iris blades, and the event horizon
 * layered behind the iris.
 */

import { GLYPHS } from './glyphArt';
import { EventHorizon, type HorizonPhase } from './EventHorizon';
import { GLYPH_ANGLE_DEG, TOTAL_CHEVRONS } from '../state/constants';
import type { ChevronState } from '../state/types';

export type IrisPhase = 'open' | 'closing' | 'closed' | 'opening';

interface GateProps {
  rotation: number;
  chevrons: ChevronState[];
  horizonPhase: HorizonPhase;
  irisPhase: IrisPhase;
}

/** Chevron k sits at (k+1)*40° clockwise from top; index 8 is the master at 0°. */
function chevronAngle(index: number): number {
  return index === TOTAL_CHEVRONS - 1 ? 0 : (index + 1) * 40;
}

const IRIS_BLADES = 12;

export function Gate({ rotation, chevrons, horizonPhase, irisPhase }: GateProps) {
  return (
    <div className="gate">
      <div className="gate__horizon">
        <EventHorizon phase={horizonPhase} />
      </div>

      <svg className="gate__svg" viewBox="0 0 600 600" role="img" aria-label="Stargate">
        {/* Iris — sits over the horizon, under the ring. */}
        <g className={`iris iris--${irisPhase}`}>
          {Array.from({ length: IRIS_BLADES }, (_, i) => (
            <g key={i} transform={`rotate(${(360 / IRIS_BLADES) * i} 300 300)`}>
              <path
                className="iris__blade"
                d="M 300 300 L 240 108 A 200 200 0 0 1 360 108 Z"
              />
            </g>
          ))}
        </g>

        {/* Outer stationary ring */}
        <circle className="ring-outer" cx="300" cy="300" r="278" />
        <circle className="ring-outer ring-outer--inner-edge" cx="300" cy="300" r="196" />

        {/* Rotating symbol ring */}
        <g className="symbol-ring" transform={`rotate(${rotation} 300 300)`}>
          <circle className="symbol-ring__band" cx="300" cy="300" r="237" />
          {GLYPHS.map((glyph, gi) => (
            <g key={gi} transform={`rotate(${gi * GLYPH_ANGLE_DEG} 300 300)`}>
              <line className="symbol-ring__divider" x1="300" y1="22" x2="300" y2="60" />
              <g transform="translate(288 28) scale(1.05)">
                <polyline className="glyph__stroke" points={glyph.polyline} />
                {glyph.points.map(([x, y], pi) => (
                  <circle key={pi} className="glyph__star" cx={x} cy={y} r="1.7" />
                ))}
              </g>
            </g>
          ))}
        </g>

        {/* Chevrons */}
        {chevrons.map((state, ci) => (
          <g
            key={ci}
            className={`chevron chevron--${state}${ci === TOTAL_CHEVRONS - 1 ? ' chevron--master' : ''}`}
            transform={`rotate(${chevronAngle(ci)} 300 300)`}
          >
            <path className="chevron__housing" d="M 276 8 L 324 8 L 312 46 L 288 46 Z" />
            <path className="chevron__vee" d="M 288 14 L 312 14 L 300 40 Z" />
          </g>
        ))}
      </svg>
    </div>
  );
}
