import { MeasuringInstrumentType, MeasuringComponentPart, MeasuringLabParameters } from '../types/measuringDevicesTypes';

export const MEASURING_INSTRUMENT_DETAILS = {
  [MeasuringInstrumentType.Galvanometer]: {
    name: 'الجلفانوميتر (Galvanometer)',
    description: 'جهاز لقياس التيارات الضعيفة جداً وتحديد اتجاهها.',
    targetConfig: ['magnet', 'coil', 'scale'],
  },
  [MeasuringInstrumentType.Ammeter]: {
    name: 'الأميتر (Ammeter)',
    description: 'جهاز قياس شدة التيار الكهربائي، يوصل في الدائرة على التوالي.',
    targetConfig: ['galvanometer_core', 'resistor_shunt'],
  },
  [MeasuringInstrumentType.Voltmeter]: {
    name: 'الفولتميتر (Voltmeter)',
    description: 'جهاز قياس فرق الجهد الكهربائي، يوصل في الدائرة على التوازي.',
    targetConfig: ['galvanometer_core', 'resistor_multiplier'],
  },
  [MeasuringInstrumentType.Ohmmeter]: {
    name: 'الأوميتر (Ohmmeter)',
    description: 'جهاز قياس المقاومة الكهربائية المجهولة.',
    targetConfig: ['galvanometer_core', 'battery', 'resistor_variable', 'resistor_standard'],
  },
};

export const MEASURING_AVAILABLE_PARTS: MeasuringComponentPart[] = [
  { id: 'magnet', name: 'مغناطيس مقعر', type: 'magnet', description: 'يولد مجالاً مغناطيسياً ثابتاً وقوياً.' },
  { id: 'coil', name: 'ملف متحرك وقلب حديدي', type: 'coil', description: 'يدور عند مرور التيار فيه بسبب عزم الازدواج.' },
  { id: 'scale_zero_center', name: 'تدريج صفر المنتصف', type: 'scale', description: 'لقياس اتجاه وشدة التيار.' },
  { id: 'galvanometer_core', name: 'جلفانوميتر حساس', type: 'core', value: 50, description: 'مقاومة ملفه Rg = 50Ω' },
  { id: 'shunt_res', name: 'مجزئ تيار (Shunt)', type: 'resistor_shunt', value: 0.1, description: 'مقاومة صغيرة جداً توصل على التوازي (Rs).' },
  { id: 'multiplier_res', name: 'مضاعف جهد (Multiplier)', type: 'resistor_multiplier', value: 1000, description: 'مقاومة كبيرة جداً توصل على التوالي (Rm).' },
  { id: 'battery_1.5', name: 'بطارية 1.5V', type: 'battery', value: 1.5, description: 'مصدر للطاقة الكهربائية.' },
  { id: 'variable_res', name: 'مقاومة متغيرة (Rheostat)', type: 'resistor_variable', value: 500, description: 'للتحكم في معايرة الجهاز.' },
  { id: 'standard_res', name: 'مقاومة عيارية', type: 'resistor_variable', value: 2000, description: 'لحماية الجهاز من التيارات العالية.' },
];

export const MEASURING_LAB_DEFAULTS: MeasuringLabParameters = {
  Rg: 50,          // 50 Ohms
  Ig: 0.001,       // 1mA
  
  // Ammeter defaults
  Rs: 0.05,
  targetI: 10,     // 10 Amps
  
  // Voltmeter defaults
  Rm: 950,
  targetV: 100,    // 100 Volts
  
  // Ohmmeter defaults
  Vb: 1.5,
  R_standard: 3000,
  R_variable: 0,
  Rx: 0
};
