type SimulatorResponse =
  | { ok: true; data?: any }
  | { ok: false; error: string };

declare const Simulator: {
  init(shape: any): SimulatorResponse;
  setPhysicsParams(params: any): SimulatorResponse;
  addHeatPoint(point: any): SimulatorResponse;
  removeHeatPoint(id: number): SimulatorResponse;
  simulateNext(seconds: number): SimulatorResponse;
  reset(): SimulatorResponse;
  getState(): SimulatorResponse;
  getTime(): SimulatorResponse;
  getFailure(): SimulatorResponse;
  getGridView(): SimulatorResponse;
  getRenderSnapshot(stride: number): SimulatorResponse;
  getPoint(position: any): SimulatorResponse;
};