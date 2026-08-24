import { useCallback, useState } from 'react';
import { useMachine } from '@xstate/react';
import { gateMachine } from './state/gateMachine';
import { Gate, type IrisPhase } from './ui/Gate';
import type { HorizonPhase } from './ui/EventHorizon';
import { Dhd } from './ui/Dhd';
import { StatusPanel } from './ui/StatusPanel';
import { useRingController } from './ui/useRingController';
import { useGateAudio } from './audio/useGateAudio';
import { gateAudio } from './audio/gateAudio';

function horizonPhaseOf(m: (v: unknown) => boolean): HorizonPhase {
  if (m({ gate: { connecting: 'ignition' } })) return 'ignition';
  if (m({ gate: { connecting: 'kawoosh' } })) return 'kawoosh';
  if (m({ gate: { connecting: 'shieldedIgnition' } })) return 'shielded';
  if (m({ gate: { connecting: 'stabilization' } })) return 'stabilization';
  if (m({ gate: { connecting: 'steady' } })) return 'steady';
  if (m({ gate: 'disconnecting' })) return 'collapse';
  return 'off';
}

function irisPhaseOf(m: (v: unknown) => boolean): IrisPhase {
  if (m({ iris: 'closing' })) return 'closing';
  if (m({ iris: 'closed' })) return 'closed';
  if (m({ iris: 'opening' })) return 'opening';
  return 'open';
}

export default function App() {
  const [snapshot, send, actorRef] = useMachine(gateMachine);
  useGateAudio(actorRef);
  const [audioEnabled, setAudioEnabled] = useState(true);

  const { context } = snapshot;
  const dialing = snapshot.matches({ gate: 'dialing' });
  const connecting = snapshot.matches({ gate: 'connecting' });
  const aligning = snapshot.matches({ gate: { dialing: 'aligning' } });
  const idle = snapshot.matches({ gate: 'idle' });

  const onRotationComplete = useCallback(() => send({ type: 'ROTATION_COMPLETE' }), [send]);
  const rotation = useRingController({
    aligning,
    targetGlyph: context.targetGlyph,
    symbolIndex: context.currentSymbolIndex,
    onRotationComplete,
  });

  const phaseLabel = context.attract
    ? `AUTO DIAL - ${context.activeAddress?.designation ?? 'CYCLING'}`
    : dialing
      ? `ENCODING CHEVRON ${Math.min(context.currentSymbolIndex + 1, context.sequenceLength)} OF ${context.sequenceLength}`
      : snapshot.matches({ gate: { connecting: 'steady' } })
        ? 'WORMHOLE ESTABLISHED'
        : connecting
          ? 'WORMHOLE FORMING'
          : snapshot.matches({ gate: 'disconnecting' })
            ? 'WORMHOLE COLLAPSING'
            : snapshot.matches({ gate: 'cooldown' })
              ? 'GATE COOLING DOWN'
              : snapshot.matches({ gate: 'aborting' })
                ? 'SEQUENCE ABORTED'
                : 'STANDING BY';

  // Any pointer contact unlocks audio (autoplay policy) and, if the attract
  // loop is running, hands the gate back to the operator.
  const wake = () => {
    gateAudio.unlock();
    if (context.attract) send({ type: 'WAKE' });
  };

  const pressSymbol = (glyph: number) => {
    gateAudio.play('dhdPress');
    send({ type: 'INPUT_SYMBOL', glyph });
  };

  return (
    <div className="console" onPointerDown={wake}>
      <StatusPanel
        phaseLabel={phaseLabel}
        attract={context.attract}
        chevrons={context.chevrons}
        activeAddress={context.activeAddress}
        connected={connecting}
        irisPhase={irisPhaseOf((v) => snapshot.matches(v as never))}
        irisBusy={snapshot.matches({ iris: 'closing' }) || snapshot.matches({ iris: 'opening' })}
        onToggleIris={() => send({ type: 'TOGGLE_IRIS' })}
        audioEnabled={audioEnabled}
        onToggleAudio={() => setAudioEnabled(gateAudio.toggle())}
      />

      <main className="console__stage">
        <Gate
          rotation={rotation}
          chevrons={context.chevrons}
          horizonPhase={horizonPhaseOf((v) => snapshot.matches(v as never))}
          irisPhase={irisPhaseOf((v) => snapshot.matches(v as never))}
        />

        <Dhd
          buffer={context.addressBuffer}
          canDial={idle && context.addressBuffer.length === 7}
          busy={dialing}
          connected={connecting}
          onSymbol={pressSymbol}
          onRemove={() => send({ type: 'REMOVE_SYMBOL' })}
          onClear={() => send({ type: 'CLEAR_ADDRESS' })}
          onLoad={(glyphs) => send({ type: 'LOAD_ADDRESS', glyphs })}
          onDial={() => {
            gateAudio.play('engage', { volume: 0.5 });
            send({ type: 'DIAL' });
          }}
          onAbort={() => send({ type: 'ABORT' })}
          onDisconnect={() => send({ type: 'DISCONNECT' })}
        />
      </main>

      <footer className="console__footer">
        STARGATE - client-side gate interface - noncommercial fan project. All addresses fictional.
      </footer>
    </div>
  );
}
