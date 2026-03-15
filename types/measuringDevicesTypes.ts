export enum MeasuringInstrumentType {
  Galvanometer = 'galvanometer',
  Ammeter = 'ammeter',
  Voltmeter = 'voltmeter',
  Ohmmeter = 'ohmmeter',
}

export interface MeasuringComponentPart {
  id: string;
  name: string; // Arabic name
  type: 'core' | 'resistor_shunt' | 'resistor_multiplier' | 'resistor_variable' | 'battery' | 'scale' | 'magnet' | 'coil';
  value?: number; // resistance in ohms, voltage in volts, etc.
  description: string;
}

export interface MeasuringAssemblySlot {
  id: string;
  name: string;
  acceptedTypes: string[];
  occupiedBy: MeasuringComponentPart | null;
  position: { x: number; y: number }; // relative position for visualization
  isParallel?: boolean; // visual hint
}

export interface MeasuringSimulationState {
  inputValue: number; // Current (A), Voltage (V), or Resistance (Ohm) depending on context
  needleAngle: number; // 0 to 180 degrees
  isFried: boolean; // if current exceeds limit
}

export interface MeasuringLabParameters {
  Rg: number;       // Galvanometer Resistance (Ohms)
  Ig: number;       // Max Galvanometer Current (Amps) - usually very small e.g. 0.001
  
  // Ammeter
  Rs: number;       // Shunt Resistance
  targetI: number;  // Desired Max Current (Amps)
  
  // Voltmeter
  Rm: number;       // Multiplier Resistance
  targetV: number;  // Desired Max Voltage (Volts)
  
  // Ohmmeter
  Vb: number;       // Battery Voltage
  R_standard: number; // Fixed internal resistance
  R_variable: number; // Rheostat
  Rx: number;       // Unknown resistance for testing
}
