import type { FinalConnectionState } from '@xyflow/react';
import { atom } from 'jotai';

export const anchorPositionAtom = atom<{ x: number; y: number }>({ x: 0, y: 0 });
export const dropPositionAtom = atom<{ x: number; y: number }>({ x: 0, y: 0 });
export const showMenuAtom = atom<boolean>(false);
export const incomingNodeMetadetailsAtom = atom<FinalConnectionState | null>(null);

export const setAnchorPositionAtom = atom(null, (get, set, position: { x: number; y: number }) => {
  set(anchorPositionAtom, position);
});

export const setDropPositionAtom = atom(null, (get, set, position: { x: number; y: number }) => {
  set(dropPositionAtom, position);
});

export const setShowMenuAtom = atom(null, (get, set, show: boolean) => {
  set(showMenuAtom, show);
});

export const setIncomingNodeMetadetailsAtom = atom(
  null,
  (get, set, detail: FinalConnectionState | null) => {
    set(incomingNodeMetadetailsAtom, detail);
  }
);

export type AddNodeOnEdgeDropState = {
  anchorPosition: { x: number; y: number };
  dropPosition: { x: number; y: number };
  showMenu: boolean;
  incomingNodeMetadetails: FinalConnectionState | null;
};
