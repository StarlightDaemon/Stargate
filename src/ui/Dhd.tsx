/**
 * Dial-home device: the 39-glyph input grid (point of origin included, fixing
 * the archived FUSION build's 1..38 loop gap), plus engage/clear controls and
 * the quick-dial address book. Addresses are fictional in-universe entries.
 */

import { ADDRESS_BOOK } from '../state/addresses';
import { ADDRESS_LENGTH } from '../state/constants';
import { GLYPHS } from './glyphArt';

interface DhdProps {
  buffer: number[];
  canDial: boolean;
  busy: boolean;
  connected: boolean;
  onSymbol: (glyph: number) => void;
  onRemove: () => void;
  onClear: () => void;
  onLoad: (glyphs: readonly number[]) => void;
  onDial: () => void;
  onAbort: () => void;
  onDisconnect: () => void;
}

export function Dhd({
  buffer,
  canDial,
  busy,
  connected,
  onSymbol,
  onRemove,
  onClear,
  onLoad,
  onDial,
  onAbort,
  onDisconnect,
}: DhdProps) {
  return (
    <section className="dhd" aria-label="Dial home device">
      <div className="dhd__buffer" aria-label="Address buffer">
        {Array.from({ length: ADDRESS_LENGTH }, (_, i) => {
          const glyph = buffer[i];
          return (
            <span key={i} className={`dhd__slot${glyph !== undefined ? ' dhd__slot--set' : ''}`}>
              {glyph !== undefined ? (
                <svg viewBox="0 0 24 24" aria-label={`Glyph ${glyph}`}>
                  <polyline className="glyph__stroke" points={GLYPHS[glyph].polyline} />
                </svg>
              ) : (
                '·'
              )}
            </span>
          );
        })}
      </div>

      <div className="dhd__grid" role="group" aria-label="Glyph keys">
        {GLYPHS.map((glyph, gi) => (
          <button
            key={gi}
            type="button"
            className={`dhd__key${buffer.includes(gi) ? ' dhd__key--lit' : ''}${gi === 0 ? ' dhd__key--origin' : ''}`}
            disabled={busy || buffer.includes(gi)}
            onClick={() => onSymbol(gi)}
            title={gi === 0 ? 'Point of origin' : `Glyph ${gi}`}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <polyline className="glyph__stroke" points={glyph.polyline} />
              {glyph.points.map(([x, y], pi) => (
                <circle key={pi} className="glyph__star" cx={x} cy={y} r="1.2" />
              ))}
            </svg>
          </button>
        ))}
      </div>

      <div className="dhd__controls">
        {connected ? (
          <button type="button" className="dhd__engage dhd__engage--shutdown" onClick={onDisconnect}>
            SHUT DOWN
          </button>
        ) : busy ? (
          <button type="button" className="dhd__engage dhd__engage--abort" onClick={onAbort}>
            ABORT
          </button>
        ) : (
          <button type="button" className="dhd__engage" disabled={!canDial} onClick={onDial}>
            ENGAGE
          </button>
        )}
        <button type="button" className="dhd__aux" disabled={busy || buffer.length === 0} onClick={onRemove}>
          DEL
        </button>
        <button type="button" className="dhd__aux" disabled={busy || buffer.length === 0} onClick={onClear}>
          CLR
        </button>
      </div>

      <div className="dhd__book" aria-label="Address book">
        <h2>GATE DIRECTORY</h2>
        {ADDRESS_BOOK.map((address) => (
          <button
            key={address.designation}
            type="button"
            className="dhd__entry"
            disabled={busy || connected}
            onClick={() => onLoad(address.glyphs)}
          >
            <span className="dhd__entry-designation">{address.designation}</span>
            <span className="dhd__entry-name">{address.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
