import { Controls, type ReactFlowState, useReactFlow } from '@xyflow/react';
import { atom, useAtomValue } from 'jotai';
import { MaximizeIcon, MinusIcon, PlusIcon } from 'lucide-react';
import CustomControlButton from './custom-control-button';

const ZOOM_DURATION = 500;

const storeAtom = atom<ReactFlowState | null>(null);
const minZoomReachedAtom = atom((get) => {
  const store = get(storeAtom);
  return store ? store.transform[2] <= store.minZoom : false;
});
const maxZoomReachedAtom = atom((get) => {
  const store = get(storeAtom);
  return store ? store.transform[2] >= store.maxZoom : false;
});

export default function CustomControls() {
  const minZoomReached = useAtomValue(minZoomReachedAtom);
  const maxZoomReached = useAtomValue(maxZoomReachedAtom);
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <Controls showFitView={false} showZoom={false} showInteractive={false} position={'bottom-left'}>
      <CustomControlButton
        onClick={() => zoomIn({ duration: ZOOM_DURATION })}
        disabled={maxZoomReached}
      >
        <PlusIcon />
      </CustomControlButton>

      <CustomControlButton
        onClick={() => zoomOut({ duration: ZOOM_DURATION })}
        disabled={minZoomReached}
      >
        <MinusIcon />
      </CustomControlButton>

      <CustomControlButton onClick={() => fitView({ duration: ZOOM_DURATION })}>
        <MaximizeIcon />
      </CustomControlButton>
    </Controls>
  );
}
