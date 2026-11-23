import { createContext, useContext, type MutableRefObject } from 'react';
import { useFrame, type RenderCallback } from '@react-three/fiber';

const defaultRef: MutableRefObject<boolean> = { current: true };

export const MapVisibleRefContext = createContext<MutableRefObject<boolean>>(defaultRef);

export function useMapVisibleRef(): MutableRefObject<boolean> {
  return useContext(MapVisibleRefContext);
}

/**
 * Drop-in replacement for R3F `useFrame` inside NeighborhoodMap children:
 * short-circuits immediately when the map is hidden (`visible={false}`).
 */
export function useMapFrame(callback: RenderCallback, priority?: number): void {
  const mapVisibleRef = useMapVisibleRef();
  useFrame((state, delta, xrFrame) => {
    if (!mapVisibleRef.current) return;
    callback(state, delta, xrFrame);
  }, priority);
}
