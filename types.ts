export type Vector3 = [number, number, number];

export enum TreeState {
  FORMED = 'FORMED',
  CHAOS = 'CHAOS'
}

export interface PhotoData {
  id: string;
  url: string;
  aspectRatio: number;
}

export interface AppState {
  treeState: TreeState;
  chaosFactor: number; // 0 to 1
  webcamEnabled: boolean;
  hasCamera: boolean;
  userPhotos: PhotoData[];
  setTreeState: (state: TreeState) => void;
  setChaosFactor: (factor: number) => void;
  setWebcamEnabled: (enabled: boolean) => void;
  addPhotos: (photos: PhotoData[]) => void;
  cameraControl: { x: number; y: number }; // -1 to 1
  setCameraControl: (pos: { x: number; y: number }) => void;
}