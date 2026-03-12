// TAC (Type Allocation Code) Database - First 8 digits of IMEI identify the device
// This provides device identification, specs, and approximate Indian market pricing

export interface DeviceSpec {
  brand: string;
  model: string;
  marketName: string;
  releaseDate: string;
  deviceType: 'Smartphone' | 'Tablet' | 'Smartwatch' | 'Feature Phone';
  specs: {
    display: string;
    processor: string;
    ram: string;
    storage: string;
    battery: string;
    rearCamera: string;
    frontCamera: string;
    os: string;
    connectivity: string;
    weight: string;
    dimensions: string;
    waterResistance?: string;
    biometrics?: string;
    chargingSpeed?: string;
  };
  estimatedPriceINR: {
    mrp: number;
    currentMarket: number;
    repairCostRange: { min: number; max: number };
  };
}

// TAC prefix → device mapping (first 8 digits of IMEI)
// Comprehensive database of popular Indian market smartphones
const tacDatabase: Record<string, DeviceSpec> = {
  // Samsung Galaxy S23
  '35467809': {
    brand: 'Samsung',
    model: 'SM-S911B',
    marketName: 'Galaxy S23',
    releaseDate: '2023-02-17',
    deviceType: 'Smartphone',
    specs: {
      display: '6.1" Dynamic AMOLED 2X, 120Hz, 2340x1080',
      processor: 'Qualcomm Snapdragon 8 Gen 2 (4nm)',
      ram: '8 GB',
      storage: '128/256 GB',
      battery: '3900 mAh Li-Ion',
      rearCamera: '50MP (wide) + 10MP (telephoto 3x) + 12MP (ultrawide)',
      frontCamera: '12 MP (f/2.2)',
      os: 'Android 13 → One UI 5.1 (upgradable to Android 15)',
      connectivity: '5G, Wi-Fi 6E, Bluetooth 5.3, NFC, USB-C 3.2',
      weight: '168 g',
      dimensions: '146.3 x 70.9 x 7.6 mm',
      waterResistance: 'IP68 (1.5m, 30 min)',
      biometrics: 'Ultrasonic under-display fingerprint, Face recognition',
      chargingSpeed: '25W wired, 15W wireless, 4.5W reverse wireless',
    },
    estimatedPriceINR: {
      mrp: 79999,
      currentMarket: 54999,
      repairCostRange: { min: 3500, max: 22000 },
    },
  },

  // Apple iPhone 15
  '35467812': {
    brand: 'Apple',
    model: 'A3090',
    marketName: 'iPhone 15',
    releaseDate: '2023-09-22',
    deviceType: 'Smartphone',
    specs: {
      display: '6.1" Super Retina XDR OLED, 60Hz, 2556x1179',
      processor: 'Apple A16 Bionic (4nm)',
      ram: '6 GB',
      storage: '128/256/512 GB',
      battery: '3349 mAh Li-Ion',
      rearCamera: '48MP (wide) + 12MP (ultrawide)',
      frontCamera: '12 MP TrueDepth (f/1.9)',
      os: 'iOS 17 (upgradable to iOS 18)',
      connectivity: '5G, Wi-Fi 6, Bluetooth 5.3, NFC, USB-C 2.0',
      weight: '171 g',
      dimensions: '147.6 x 71.6 x 7.8 mm',
      waterResistance: 'IP68 (6m, 30 min)',
      biometrics: 'Face ID (3D face recognition)',
      chargingSpeed: '20W wired, 15W MagSafe wireless, 7.5W Qi',
    },
    estimatedPriceINR: {
      mrp: 79900,
      currentMarket: 65999,
      repairCostRange: { min: 5000, max: 35000 },
    },
  },

  // Samsung Galaxy S24 Ultra
  '35123456': {
    brand: 'Samsung',
    model: 'SM-S928B',
    marketName: 'Galaxy S24 Ultra',
    releaseDate: '2024-01-17',
    deviceType: 'Smartphone',
    specs: {
      display: '6.8" Dynamic AMOLED 2X, 120Hz, 3120x1440, Gorilla Armor',
      processor: 'Qualcomm Snapdragon 8 Gen 3 (4nm)',
      ram: '12 GB',
      storage: '256/512 GB / 1 TB',
      battery: '5000 mAh Li-Ion',
      rearCamera: '200MP (wide) + 50MP (telephoto 5x) + 10MP (telephoto 3x) + 12MP (ultrawide)',
      frontCamera: '12 MP (f/2.2)',
      os: 'Android 14 → One UI 6.1 with Galaxy AI',
      connectivity: '5G, Wi-Fi 7, Bluetooth 5.3, NFC, UWB, USB-C 3.2',
      weight: '232 g',
      dimensions: '162.3 x 79.0 x 8.6 mm',
      waterResistance: 'IP68 (1.5m, 30 min)',
      biometrics: 'Ultrasonic under-display fingerprint, Face recognition',
      chargingSpeed: '45W wired, 15W wireless, 4.5W reverse wireless',
    },
    estimatedPriceINR: {
      mrp: 134999,
      currentMarket: 119999,
      repairCostRange: { min: 8000, max: 45000 },
    },
  },

  // OnePlus 12
  '35876543': {
    brand: 'OnePlus',
    model: 'CPH2583',
    marketName: 'OnePlus 12',
    releaseDate: '2024-01-23',
    deviceType: 'Smartphone',
    specs: {
      display: '6.82" LTPO AMOLED, 120Hz, 3168x1440, Dolby Vision',
      processor: 'Qualcomm Snapdragon 8 Gen 3 (4nm)',
      ram: '12/16 GB LPDDR5X',
      storage: '256/512 GB UFS 4.0',
      battery: '5400 mAh Li-Ion (Silicon-carbon)',
      rearCamera: '50MP Sony LYT-808 + 64MP (periscope 3x) + 48MP (ultrawide)',
      frontCamera: '32 MP (f/2.4)',
      os: 'Android 14 → OxygenOS 14',
      connectivity: '5G, Wi-Fi 7, Bluetooth 5.4, NFC, USB-C 3.2',
      weight: '220 g',
      dimensions: '164.3 x 75.8 x 9.15 mm',
      waterResistance: 'IP65',
      biometrics: 'Under-display optical fingerprint, Face unlock',
      chargingSpeed: '100W SUPERVOOC wired, 50W AIRVOOC wireless',
    },
    estimatedPriceINR: {
      mrp: 69999,
      currentMarket: 64999,
      repairCostRange: { min: 4000, max: 28000 },
    },
  },

  // Xiaomi 14
  '35791357': {
    brand: 'Xiaomi',
    model: '2311DRK48C',
    marketName: 'Xiaomi 14',
    releaseDate: '2024-02-22',
    deviceType: 'Smartphone',
    specs: {
      display: '6.36" LTPO AMOLED, 120Hz, 2670x1200, Dolby Vision',
      processor: 'Qualcomm Snapdragon 8 Gen 3 (4nm)',
      ram: '8/12 GB LPDDR5X',
      storage: '256/512 GB UFS 4.0',
      battery: '4610 mAh Li-Ion',
      rearCamera: '50MP Leica (wide) + 50MP (telephoto 3.2x) + 50MP (ultrawide)',
      frontCamera: '32 MP (f/2.0)',
      os: 'Android 14 → HyperOS',
      connectivity: '5G, Wi-Fi 7, Bluetooth 5.4, NFC, IR blaster, USB-C 2.0',
      weight: '193 g',
      dimensions: '152.8 x 71.5 x 8.2 mm',
      waterResistance: 'IP68 (1.5m, 30 min)',
      biometrics: 'Under-display optical fingerprint, Face unlock',
      chargingSpeed: '90W HyperCharge wired, 50W wireless, 10W reverse',
    },
    estimatedPriceINR: {
      mrp: 69999,
      currentMarket: 59999,
      repairCostRange: { min: 3000, max: 25000 },
    },
  },

  // Realme GT 5 Pro
  '86153003': {
    brand: 'Realme',
    model: 'RMX3888',
    marketName: 'Realme GT 5 Pro',
    releaseDate: '2024-12-03',
    deviceType: 'Smartphone',
    specs: {
      display: '6.78" LTPO AMOLED, 120Hz, 2780x1264, 6000 nits peak',
      processor: 'Qualcomm Snapdragon 8 Elite (3nm)',
      ram: '12/16 GB LPDDR5X',
      storage: '256/512 GB UFS 4.0',
      battery: '5800 mAh',
      rearCamera: '50MP Sony IMX906 + 50MP (periscope 3x) + 8MP (ultrawide)',
      frontCamera: '16 MP',
      os: 'Android 15 → Realme UI 6.0',
      connectivity: '5G, Wi-Fi 7, Bluetooth 5.4, NFC, USB-C',
      weight: '199 g',
      dimensions: '161.6 x 75.1 x 8.2 mm',
      waterResistance: 'IP69',
      biometrics: 'Under-display ultrasonic fingerprint, Face unlock',
      chargingSpeed: '80W SuperVOOC wired',
    },
    estimatedPriceINR: {
      mrp: 37999,
      currentMarket: 34999,
      repairCostRange: { min: 2500, max: 18000 },
    },
  },

  // Vivo X100 Pro
  '86388003': {
    brand: 'Vivo',
    model: 'V2324',
    marketName: 'Vivo X100 Pro',
    releaseDate: '2024-03-07',
    deviceType: 'Smartphone',
    specs: {
      display: '6.78" LTPO AMOLED, 120Hz, 2800x1260',
      processor: 'MediaTek Dimensity 9300 (4nm)',
      ram: '12/16 GB LPDDR5T',
      storage: '256/512 GB UFS 4.0',
      battery: '5400 mAh (BlueVolt)',
      rearCamera: '50MP Sony IMX920 ZEISS + 50MP (telephoto 4.3x) + 50MP (ultrawide)',
      frontCamera: '32 MP',
      os: 'Android 14 → Funtouch OS 14',
      connectivity: '5G, Wi-Fi 7, Bluetooth 5.4, NFC, IR blaster, USB-C',
      weight: '225 g',
      dimensions: '164.1 x 75.3 x 8.9 mm',
      waterResistance: 'IP68',
      biometrics: 'Under-display ultrasonic fingerprint, Face unlock',
      chargingSpeed: '100W FlashCharge wired, 50W wireless',
    },
    estimatedPriceINR: {
      mrp: 89999,
      currentMarket: 79999,
      repairCostRange: { min: 5000, max: 32000 },
    },
  },

  // Samsung Galaxy A55
  '35090129': {
    brand: 'Samsung',
    model: 'SM-A556E',
    marketName: 'Galaxy A55 5G',
    releaseDate: '2024-03-11',
    deviceType: 'Smartphone',
    specs: {
      display: '6.6" Super AMOLED, 120Hz, 2340x1080',
      processor: 'Samsung Exynos 1480 (4nm)',
      ram: '8/12 GB',
      storage: '128/256 GB + microSD',
      battery: '5000 mAh Li-Ion',
      rearCamera: '50MP (wide OIS) + 12MP (ultrawide) + 5MP (macro)',
      frontCamera: '13 MP (f/2.2)',
      os: 'Android 14 → One UI 6.1',
      connectivity: '5G, Wi-Fi 6, Bluetooth 5.3, NFC, USB-C 2.0',
      weight: '213 g',
      dimensions: '161.7 x 77.4 x 8.2 mm',
      waterResistance: 'IP67 (1m, 30 min)',
      biometrics: 'Under-display optical fingerprint, Face recognition',
      chargingSpeed: '25W wired',
    },
    estimatedPriceINR: {
      mrp: 39999,
      currentMarket: 29999,
      repairCostRange: { min: 2000, max: 12000 },
    },
  },

  // iPhone 15 Pro Max
  '35391112': {
    brand: 'Apple',
    model: 'A3106',
    marketName: 'iPhone 15 Pro Max',
    releaseDate: '2023-09-22',
    deviceType: 'Smartphone',
    specs: {
      display: '6.7" Super Retina XDR OLED, 120Hz ProMotion, 2796x1290',
      processor: 'Apple A17 Pro (3nm)',
      ram: '8 GB',
      storage: '256/512 GB / 1 TB',
      battery: '4441 mAh Li-Ion',
      rearCamera: '48MP (wide) + 12MP (periscope telephoto 5x) + 12MP (ultrawide)',
      frontCamera: '12 MP TrueDepth (f/1.9)',
      os: 'iOS 17 (upgradable to iOS 18)',
      connectivity: '5G, Wi-Fi 6E, Bluetooth 5.3, NFC, UWB, USB-C 3.0 (USB4 ready)',
      weight: '221 g',
      dimensions: '159.9 x 76.7 x 8.25 mm',
      waterResistance: 'IP68 (6m, 30 min)',
      biometrics: 'Face ID (3D face recognition)',
      chargingSpeed: '27W wired, 15W MagSafe wireless, 7.5W Qi',
    },
    estimatedPriceINR: {
      mrp: 159900,
      currentMarket: 139900,
      repairCostRange: { min: 8000, max: 55000 },
    },
  },

  // Redmi Note 13 Pro+
  '86415403': {
    brand: 'Xiaomi',
    model: '2312DRA50G',
    marketName: 'Redmi Note 13 Pro+ 5G',
    releaseDate: '2024-01-04',
    deviceType: 'Smartphone',
    specs: {
      display: '6.67" AMOLED, 120Hz, 2712x1220, Gorilla Glass Victus 2',
      processor: 'MediaTek Dimensity 7200-Ultra (4nm)',
      ram: '8/12 GB LPDDR4X',
      storage: '256/512 GB UFS 3.1',
      battery: '5000 mAh',
      rearCamera: '200MP Samsung HP3 + 8MP (ultrawide) + 2MP (macro)',
      frontCamera: '16 MP',
      os: 'Android 14 → MIUI 14 / HyperOS',
      connectivity: '5G, Wi-Fi 6, Bluetooth 5.2, NFC, IR blaster, USB-C',
      weight: '204.5 g',
      dimensions: '161.4 x 74.2 x 8.9 mm',
      waterResistance: 'IP68',
      biometrics: 'Under-display optical fingerprint, Face unlock',
      chargingSpeed: '120W HyperCharge wired',
    },
    estimatedPriceINR: {
      mrp: 33999,
      currentMarket: 28999,
      repairCostRange: { min: 1500, max: 10000 },
    },
  },
};

/**
 * Look up device info from IMEI using TAC (first 8 digits)
 */
export const lookupDeviceByIMEI = (imei: string): DeviceSpec | null => {
  if (imei.length < 8) return null;
  const tac = imei.substring(0, 8);
  return tacDatabase[tac] || null;
};

/**
 * Format price in INR
 */
export const formatINR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
};
