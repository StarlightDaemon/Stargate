/**
 * Console readout: phase banner, chevron indicators, destination line,
 * iris control, and audio control.
 */

import type { ChevronState } from '../state/types';
import type { GateAddress } from '../state/addresses';
import type { IrisPhase } from './Gate';
import { TOTAL_CHEVRONS } from '../state/constants';

interface StatusPanelProps {
  phaseLabel: string;
  attract: boolean;
  chevrons: ChevronState[];
  activeAddress: GateAddress | null;
  connected: boolean;
  irisPhase: IrisPhase;
  irisBusy: boolean;
  onToggleIris: () => void;
  audioEnabled: boolean;
  onToggleAudio: () => void;
}

const IRIS_LABEL: Record<IrisPhase, string> = {
  open: 'IRIS OPEN',
  closing: 'IRIS CLOSING…',
  closed: 'IRIS SEALED',
  opening: 'IRIS OPENING…',
};

export function StatusPanel({
  phaseLabel,
  attract,
  chevrons,
  activeAddress,
  connected,
  irisPhase,
  irisBusy,
  onToggleIris,
  audioEnabled,
  onToggleAudio,
}: StatusPanelProps) {
  return (
    <header className="status">
      <div className="status__banner">
        <span className="status__phase" role="status">{phaseLabel}</span>
        {attract && <span className="status__attract">AUTO CYCLE — touch any control to resume</span>}
      </div>

      <div className="status__chevrons" aria-label="Chevron status">
        {chevrons.map((state, i) => (
          <span key={i} className={`status__chevron status__chevron--${state}`}>
            {i === TOTAL_CHEVRONS - 1 ? 'M' : i + 1}
          </span>
        ))}
      </div>

      <div className="status__dest">
        {connected && (
          <span>
            {activeAddress
              ? `${activeAddress.designation} — ${activeAddress.name} · ${activeAddress.note}`
              : 'UNCHARTED DESTINATION'}
          </span>
        )}
      </div>

      <div className="status__actions">
        <button
          type="button"
          className={`status__iris status__iris--${irisPhase}`}
          onClick={onToggleIris}
          disabled={irisBusy}
        >
          {IRIS_LABEL[irisPhase]}
        </button>
        <button type="button" className="status__audio" onClick={onToggleAudio}>
          {audioEnabled ? 'AUDIO ON' : 'AUDIO OFF'}
        </button>
      </div>
    </header>
  );
}
