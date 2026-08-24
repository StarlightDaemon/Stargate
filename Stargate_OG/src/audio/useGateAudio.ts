/**
 * Bridges machine transitions to the procedural audio engine, keeping the
 * archived sdc build's principle: every interaction step has a sound.
 * Loops (ring rotation, wormhole hum) are started on phase entry and stopped
 * on exit; one-shots fire on state edges.
 */

import { useEffect, useRef } from 'react';
import type { ActorRefFrom, SnapshotFrom } from 'xstate';
import type { gateMachine } from '../state/gateMachine';
import { gateAudio } from './gateAudio';

type GateActor = ActorRefFrom<typeof gateMachine>;
type GateSnapshot = SnapshotFrom<typeof gateMachine>;

export function useGateAudio(actorRef: GateActor): void {
  const rotateHandle = useRef<number | null>(null);
  const humHandle = useRef<number | null>(null);

  useEffect(() => {
    let previous: GateSnapshot = actorRef.getSnapshot();

    const stopLoop = (ref: { current: number | null }) => {
      if (ref.current !== null) {
        gateAudio.stop(ref.current);
        ref.current = null;
      }
    };

    const sub = actorRef.subscribe((snapshot) => {
      const was = (v: Parameters<GateSnapshot['matches']>[0]) => previous.matches(v);
      const is = (v: Parameters<GateSnapshot['matches']>[0]) => snapshot.matches(v);
      const entered = (v: Parameters<GateSnapshot['matches']>[0]) => is(v) && !was(v);
      const exited = (v: Parameters<GateSnapshot['matches']>[0]) => was(v) && !is(v);

      // Ring rotation hum while a symbol is aligning.
      if (entered({ gate: { dialing: 'aligning' } })) {
        stopLoop(rotateHandle);
        rotateHandle.current = gateAudio.play('ringRotate', { loop: true, volume: 0.6 });
      }
      if (exited({ gate: { dialing: 'aligning' } })) stopLoop(rotateHandle);

      // Chevron engagement clunk; the master chevron lands heavier.
      if (entered({ gate: { dialing: 'lockVerify' } })) {
        const isFinal =
          snapshot.context.currentSymbolIndex === snapshot.context.sequenceLength - 1;
        gateAudio.play('chevronLock', { pitch: isFinal ? 0.78 : 1, volume: isFinal ? 1 : 0.85 });
      }

      // Connection sequence.
      if (entered({ gate: 'connecting' })) gateAudio.play('engage');
      if (entered({ gate: { connecting: 'kawoosh' } })) gateAudio.play('kawoosh');
      if (entered({ gate: { connecting: 'shieldedIgnition' } })) {
        gateAudio.play('kawoosh', { volume: 0.25, pitch: 0.7 }); // muffled behind the iris
      }
      if (entered({ gate: { connecting: 'stabilization' } })) {
        stopLoop(humHandle);
        humHandle.current = gateAudio.play('wormholeHum', { loop: true, volume: 0.5 });
      }
      if (exited({ gate: 'connecting' })) stopLoop(humHandle);

      // Teardown.
      if (entered({ gate: 'disconnecting' })) gateAudio.play('abort', { volume: 0.4, pitch: 1.3 });
      if (entered({ gate: 'aborting' })) gateAudio.play('abort');

      // Iris motion.
      if (entered({ iris: 'closing' })) gateAudio.play('irisClose');
      if (entered({ iris: 'opening' })) gateAudio.play('irisOpen');

      previous = snapshot;
    });

    return () => {
      sub.unsubscribe();
      stopLoop(rotateHandle);
      stopLoop(humHandle);
    };
  }, [actorRef]);
}
