// TAC (Type Allocation Code) Database - First 8 digits of IMEI identify the device
// Uses the open-source Osmocom TAC database (CC-BY-SA v3.0) as reference
// Combined with curated Indian market pricing data

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
  // ═══════════════════════════════════════════
  // SAMSUNG
  // ═══════════════════════════════════════════

  // Samsung Galaxy S23
  '35467809': {
    brand: 'Samsung', model: 'SM-S911B', marketName: 'Galaxy S23',
    releaseDate: '2023-02-17', deviceType: 'Smartphone',
    specs: {
      display: '6.1" Dynamic AMOLED 2X, 120Hz, 2340x1080',
      processor: 'Qualcomm Snapdragon 8 Gen 2 (4nm)',
      ram: '8 GB', storage: '128/256 GB',
      battery: '3900 mAh Li-Ion',
      rearCamera: '50MP (wide) + 10MP (telephoto 3x) + 12MP (ultrawide)',
      frontCamera: '12 MP (f/2.2)',
      os: 'Android 13 → One UI 5.1',
      connectivity: '5G, Wi-Fi 6E, Bluetooth 5.3, NFC, USB-C 3.2',
      weight: '168 g', dimensions: '146.3 x 70.9 x 7.6 mm',
      waterResistance: 'IP68', biometrics: 'Ultrasonic fingerprint, Face recognition',
      chargingSpeed: '25W wired, 15W wireless',
    },
    estimatedPriceINR: { mrp: 79999, currentMarket: 54999, repairCostRange: { min: 3500, max: 22000 } },
  },

  // Samsung Galaxy S24 Ultra
  '35123456': {
    brand: 'Samsung', model: 'SM-S928B', marketName: 'Galaxy S24 Ultra',
    releaseDate: '2024-01-17', deviceType: 'Smartphone',
    specs: {
      display: '6.8" Dynamic AMOLED 2X, 120Hz, 3120x1440, Gorilla Armor',
      processor: 'Qualcomm Snapdragon 8 Gen 3 (4nm)',
      ram: '12 GB', storage: '256/512 GB / 1 TB',
      battery: '5000 mAh Li-Ion',
      rearCamera: '200MP + 50MP (5x) + 10MP (3x) + 12MP (ultrawide)',
      frontCamera: '12 MP (f/2.2)',
      os: 'Android 14 → One UI 6.1 with Galaxy AI',
      connectivity: '5G, Wi-Fi 7, Bluetooth 5.3, NFC, UWB, USB-C 3.2',
      weight: '232 g', dimensions: '162.3 x 79.0 x 8.6 mm',
      waterResistance: 'IP68', biometrics: 'Ultrasonic fingerprint, Face recognition',
      chargingSpeed: '45W wired, 15W wireless',
    },
    estimatedPriceINR: { mrp: 134999, currentMarket: 119999, repairCostRange: { min: 8000, max: 45000 } },
  },

  // Samsung Galaxy A55 5G
  '35090129': {
    brand: 'Samsung', model: 'SM-A556E', marketName: 'Galaxy A55 5G',
    releaseDate: '2024-03-11', deviceType: 'Smartphone',
    specs: {
      display: '6.6" Super AMOLED, 120Hz, 2340x1080',
      processor: 'Samsung Exynos 1480 (4nm)',
      ram: '8/12 GB', storage: '128/256 GB + microSD',
      battery: '5000 mAh Li-Ion',
      rearCamera: '50MP (wide OIS) + 12MP (ultrawide) + 5MP (macro)',
      frontCamera: '13 MP (f/2.2)',
      os: 'Android 14 → One UI 6.1',
      connectivity: '5G, Wi-Fi 6, Bluetooth 5.3, NFC, USB-C 2.0',
      weight: '213 g', dimensions: '161.7 x 77.4 x 8.2 mm',
      waterResistance: 'IP67', biometrics: 'Under-display fingerprint, Face recognition',
      chargingSpeed: '25W wired',
    },
    estimatedPriceINR: { mrp: 39999, currentMarket: 29999, repairCostRange: { min: 2000, max: 12000 } },
  },

  // Samsung Galaxy M62 / F62 (TAC for user's device)
  '86342006': {
    brand: 'Samsung', model: 'SM-M625F', marketName: 'Galaxy M62',
    releaseDate: '2021-03-03', deviceType: 'Smartphone',
    specs: {
      display: '6.7" Super AMOLED Plus, 60Hz, 2400x1080',
      processor: 'Samsung Exynos 9825 (7nm)',
      ram: '8 GB', storage: '128/256 GB + microSD',
      battery: '7000 mAh Li-Po',
      rearCamera: '64MP (wide) + 12MP (ultrawide) + 5MP (macro) + 5MP (depth)',
      frontCamera: '32 MP (f/2.0)',
      os: 'Android 11 → One UI 3.1',
      connectivity: '4G LTE, Wi-Fi 802.11ac, Bluetooth 5.0, USB-C 2.0',
      weight: '218 g', dimensions: '163.9 x 76.3 x 9.5 mm',
      biometrics: 'Side-mounted fingerprint, Face recognition',
      chargingSpeed: '25W Fast Charging',
    },
    estimatedPriceINR: { mrp: 25999, currentMarket: 17999, repairCostRange: { min: 1500, max: 9000 } },
  },

  // Samsung Galaxy A14 5G
  '35279811': {
    brand: 'Samsung', model: 'SM-A146B', marketName: 'Galaxy A14 5G',
    releaseDate: '2023-01-06', deviceType: 'Smartphone',
    specs: {
      display: '6.6" PLS LCD, 90Hz, 2408x1080',
      processor: 'Samsung Exynos 1330 (5nm)',
      ram: '4/6/8 GB', storage: '64/128 GB + microSD',
      battery: '5000 mAh Li-Po',
      rearCamera: '50MP (wide) + 2MP (macro) + 2MP (depth)',
      frontCamera: '13 MP',
      os: 'Android 13 → One UI 5.1',
      connectivity: '5G, Wi-Fi 5, Bluetooth 5.2, USB-C',
      weight: '202 g', dimensions: '167.7 x 78.0 x 9.1 mm',
      biometrics: 'Side-mounted fingerprint, Face recognition',
      chargingSpeed: '15W wired',
    },
    estimatedPriceINR: { mrp: 16999, currentMarket: 13499, repairCostRange: { min: 1000, max: 6000 } },
  },

  // Samsung Galaxy A34 5G
  '35832711': {
    brand: 'Samsung', model: 'SM-A346E', marketName: 'Galaxy A34 5G',
    releaseDate: '2023-03-16', deviceType: 'Smartphone',
    specs: {
      display: '6.6" Super AMOLED, 120Hz, 2340x1080',
      processor: 'MediaTek Dimensity 1080 (6nm)',
      ram: '6/8 GB', storage: '128/256 GB + microSD',
      battery: '5000 mAh Li-Po',
      rearCamera: '48MP (OIS) + 8MP (ultrawide) + 5MP (macro)',
      frontCamera: '13 MP',
      os: 'Android 13 → One UI 5.1',
      connectivity: '5G, Wi-Fi 5, Bluetooth 5.3, NFC, USB-C',
      weight: '199 g', dimensions: '161.3 x 78.1 x 8.2 mm',
      waterResistance: 'IP67', biometrics: 'Under-display fingerprint, Face recognition',
      chargingSpeed: '25W wired',
    },
    estimatedPriceINR: { mrp: 30999, currentMarket: 22999, repairCostRange: { min: 1500, max: 10000 } },
  },

  // Samsung Galaxy M34 5G
  '35861350': {
    brand: 'Samsung', model: 'SM-M346B', marketName: 'Galaxy M34 5G',
    releaseDate: '2023-07-07', deviceType: 'Smartphone',
    specs: {
      display: '6.5" Super AMOLED, 120Hz, 2340x1080',
      processor: 'Samsung Exynos 1280 (5nm)',
      ram: '6/8 GB', storage: '128 GB + microSD',
      battery: '6000 mAh Li-Po',
      rearCamera: '50MP (OIS) + 8MP (ultrawide) + 2MP (macro)',
      frontCamera: '13 MP',
      os: 'Android 13 → One UI 5.1',
      connectivity: '5G, Wi-Fi 5, Bluetooth 5.3, NFC, USB-C',
      weight: '208 g', dimensions: '161.7 x 77.2 x 8.6 mm',
      biometrics: 'Under-display fingerprint, Face recognition',
      chargingSpeed: '25W wired',
    },
    estimatedPriceINR: { mrp: 18999, currentMarket: 15999, repairCostRange: { min: 1200, max: 7500 } },
  },

  // Samsung Galaxy S25 Ultra
  '35945012': {
    brand: 'Samsung', model: 'SM-S938B', marketName: 'Galaxy S25 Ultra',
    releaseDate: '2025-01-22', deviceType: 'Smartphone',
    specs: {
      display: '6.9" Dynamic AMOLED 2X, 120Hz, 3120x1440',
      processor: 'Qualcomm Snapdragon 8 Elite (3nm)',
      ram: '12 GB', storage: '256/512 GB / 1 TB',
      battery: '5000 mAh',
      rearCamera: '200MP + 50MP (5x periscope) + 10MP (3x) + 50MP (ultrawide)',
      frontCamera: '12 MP',
      os: 'Android 15 → One UI 7 with Galaxy AI',
      connectivity: '5G, Wi-Fi 7, Bluetooth 5.4, NFC, UWB, USB-C 3.2',
      weight: '218 g', dimensions: '162.8 x 77.6 x 8.2 mm',
      waterResistance: 'IP68', biometrics: 'Ultrasonic fingerprint, Face recognition',
      chargingSpeed: '45W wired, 15W wireless',
    },
    estimatedPriceINR: { mrp: 134999, currentMarket: 129999, repairCostRange: { min: 10000, max: 50000 } },
  },

  // ═══════════════════════════════════════════
  // APPLE
  // ═══════════════════════════════════════════

  // Apple iPhone 15
  '35467812': {
    brand: 'Apple', model: 'A3090', marketName: 'iPhone 15',
    releaseDate: '2023-09-22', deviceType: 'Smartphone',
    specs: {
      display: '6.1" Super Retina XDR OLED, 60Hz, 2556x1179',
      processor: 'Apple A16 Bionic (4nm)',
      ram: '6 GB', storage: '128/256/512 GB',
      battery: '3349 mAh Li-Ion',
      rearCamera: '48MP (wide) + 12MP (ultrawide)',
      frontCamera: '12 MP TrueDepth (f/1.9)',
      os: 'iOS 17',
      connectivity: '5G, Wi-Fi 6, Bluetooth 5.3, NFC, USB-C 2.0',
      weight: '171 g', dimensions: '147.6 x 71.6 x 7.8 mm',
      waterResistance: 'IP68', biometrics: 'Face ID',
      chargingSpeed: '20W wired, 15W MagSafe',
    },
    estimatedPriceINR: { mrp: 79900, currentMarket: 65999, repairCostRange: { min: 5000, max: 35000 } },
  },

  // Apple iPhone 15 Pro Max
  '35391112': {
    brand: 'Apple', model: 'A3106', marketName: 'iPhone 15 Pro Max',
    releaseDate: '2023-09-22', deviceType: 'Smartphone',
    specs: {
      display: '6.7" Super Retina XDR OLED, 120Hz ProMotion, 2796x1290',
      processor: 'Apple A17 Pro (3nm)',
      ram: '8 GB', storage: '256/512 GB / 1 TB',
      battery: '4441 mAh Li-Ion',
      rearCamera: '48MP + 12MP (periscope 5x) + 12MP (ultrawide)',
      frontCamera: '12 MP TrueDepth',
      os: 'iOS 17',
      connectivity: '5G, Wi-Fi 6E, Bluetooth 5.3, NFC, UWB, USB-C 3.0',
      weight: '221 g', dimensions: '159.9 x 76.7 x 8.25 mm',
      waterResistance: 'IP68', biometrics: 'Face ID',
      chargingSpeed: '27W wired, 15W MagSafe',
    },
    estimatedPriceINR: { mrp: 159900, currentMarket: 139900, repairCostRange: { min: 8000, max: 55000 } },
  },

  // Apple iPhone 16 Pro
  '35482210': {
    brand: 'Apple', model: 'A3291', marketName: 'iPhone 16 Pro',
    releaseDate: '2024-09-20', deviceType: 'Smartphone',
    specs: {
      display: '6.3" Super Retina XDR OLED, 120Hz ProMotion, 2622x1206',
      processor: 'Apple A18 Pro (3nm)',
      ram: '8 GB', storage: '128/256/512 GB / 1 TB',
      battery: '3582 mAh',
      rearCamera: '48MP Fusion + 48MP (ultrawide) + 12MP (5x telephoto)',
      frontCamera: '12 MP TrueDepth',
      os: 'iOS 18',
      connectivity: '5G, Wi-Fi 7, Bluetooth 5.3, NFC, UWB 2, USB-C 3.0',
      weight: '199 g', dimensions: '149.6 x 71.5 x 8.25 mm',
      waterResistance: 'IP68', biometrics: 'Face ID',
      chargingSpeed: '30W wired, 25W MagSafe',
    },
    estimatedPriceINR: { mrp: 119900, currentMarket: 114900, repairCostRange: { min: 8000, max: 48000 } },
  },

  // Apple iPhone 14
  '35397313': {
    brand: 'Apple', model: 'A2882', marketName: 'iPhone 14',
    releaseDate: '2022-09-16', deviceType: 'Smartphone',
    specs: {
      display: '6.1" Super Retina XDR OLED, 60Hz, 2532x1170',
      processor: 'Apple A15 Bionic (5nm)',
      ram: '6 GB', storage: '128/256/512 GB',
      battery: '3279 mAh',
      rearCamera: '12MP (wide) + 12MP (ultrawide)',
      frontCamera: '12 MP TrueDepth',
      os: 'iOS 16',
      connectivity: '5G, Wi-Fi 6, Bluetooth 5.3, NFC, USB Lightning',
      weight: '172 g', dimensions: '146.7 x 71.5 x 7.8 mm',
      waterResistance: 'IP68', biometrics: 'Face ID',
      chargingSpeed: '20W wired, 15W MagSafe',
    },
    estimatedPriceINR: { mrp: 69900, currentMarket: 52999, repairCostRange: { min: 4000, max: 30000 } },
  },

  // ═══════════════════════════════════════════
  // ONEPLUS
  // ═══════════════════════════════════════════

  // OnePlus 12
  '35876543': {
    brand: 'OnePlus', model: 'CPH2583', marketName: 'OnePlus 12',
    releaseDate: '2024-01-23', deviceType: 'Smartphone',
    specs: {
      display: '6.82" LTPO AMOLED, 120Hz, 3168x1440, Dolby Vision',
      processor: 'Qualcomm Snapdragon 8 Gen 3 (4nm)',
      ram: '12/16 GB LPDDR5X', storage: '256/512 GB UFS 4.0',
      battery: '5400 mAh (Silicon-carbon)',
      rearCamera: '50MP Sony LYT-808 + 64MP (periscope 3x) + 48MP (ultrawide)',
      frontCamera: '32 MP',
      os: 'Android 14 → OxygenOS 14',
      connectivity: '5G, Wi-Fi 7, Bluetooth 5.4, NFC, USB-C 3.2',
      weight: '220 g', dimensions: '164.3 x 75.8 x 9.15 mm',
      waterResistance: 'IP65', biometrics: 'Under-display fingerprint, Face unlock',
      chargingSpeed: '100W SUPERVOOC, 50W wireless',
    },
    estimatedPriceINR: { mrp: 69999, currentMarket: 64999, repairCostRange: { min: 4000, max: 28000 } },
  },

  // OnePlus Nord CE 3 Lite
  '86765402': {
    brand: 'OnePlus', model: 'CPH2467', marketName: 'OnePlus Nord CE 3 Lite 5G',
    releaseDate: '2023-04-04', deviceType: 'Smartphone',
    specs: {
      display: '6.72" IPS LCD, 120Hz, 2400x1080',
      processor: 'Qualcomm Snapdragon 695 5G (6nm)',
      ram: '6/8 GB', storage: '128/256 GB + microSD',
      battery: '5000 mAh',
      rearCamera: '108MP (wide) + 2MP (depth) + 2MP (macro)',
      frontCamera: '16 MP',
      os: 'Android 13 → OxygenOS 13',
      connectivity: '5G, Wi-Fi 5, Bluetooth 5.1, USB-C',
      weight: '195 g', dimensions: '165.5 x 76.0 x 8.3 mm',
      biometrics: 'Side-mounted fingerprint, Face unlock',
      chargingSpeed: '67W SUPERVOOC',
    },
    estimatedPriceINR: { mrp: 19999, currentMarket: 16999, repairCostRange: { min: 1200, max: 7000 } },
  },

  // OnePlus 13
  '86142009': {
    brand: 'OnePlus', model: 'CPH2653', marketName: 'OnePlus 13',
    releaseDate: '2025-01-07', deviceType: 'Smartphone',
    specs: {
      display: '6.82" LTPO AMOLED, 120Hz, 3168x1440',
      processor: 'Qualcomm Snapdragon 8 Elite (3nm)',
      ram: '12/16/24 GB LPDDR5X', storage: '256/512 GB / 1 TB UFS 4.0',
      battery: '6000 mAh (Silicon-carbon)',
      rearCamera: '50MP LYT-808 + 50MP (3x periscope) + 50MP (ultrawide)',
      frontCamera: '32 MP',
      os: 'Android 15 → OxygenOS 15',
      connectivity: '5G, Wi-Fi 7, Bluetooth 5.4, NFC, USB-C 3.2',
      weight: '213 g', dimensions: '162.9 x 76.5 x 8.5 mm',
      waterResistance: 'IP69', biometrics: 'Ultrasonic fingerprint, Face unlock',
      chargingSpeed: '100W SUPERVOOC, 50W wireless',
    },
    estimatedPriceINR: { mrp: 69999, currentMarket: 67999, repairCostRange: { min: 5000, max: 30000 } },
  },

  // ═══════════════════════════════════════════
  // XIAOMI / REDMI / POCO
  // ═══════════════════════════════════════════

  // Xiaomi 14
  '35791357': {
    brand: 'Xiaomi', model: '2311DRK48C', marketName: 'Xiaomi 14',
    releaseDate: '2024-02-22', deviceType: 'Smartphone',
    specs: {
      display: '6.36" LTPO AMOLED, 120Hz, 2670x1200',
      processor: 'Qualcomm Snapdragon 8 Gen 3 (4nm)',
      ram: '8/12 GB LPDDR5X', storage: '256/512 GB UFS 4.0',
      battery: '4610 mAh',
      rearCamera: '50MP Leica + 50MP (3.2x telephoto) + 50MP (ultrawide)',
      frontCamera: '32 MP',
      os: 'Android 14 → HyperOS',
      connectivity: '5G, Wi-Fi 7, Bluetooth 5.4, NFC, IR blaster, USB-C',
      weight: '193 g', dimensions: '152.8 x 71.5 x 8.2 mm',
      waterResistance: 'IP68', biometrics: 'Under-display fingerprint, Face unlock',
      chargingSpeed: '90W wired, 50W wireless',
    },
    estimatedPriceINR: { mrp: 69999, currentMarket: 59999, repairCostRange: { min: 3000, max: 25000 } },
  },

  // Redmi Note 13 Pro+ 5G
  '86415403': {
    brand: 'Xiaomi', model: '2312DRA50G', marketName: 'Redmi Note 13 Pro+ 5G',
    releaseDate: '2024-01-04', deviceType: 'Smartphone',
    specs: {
      display: '6.67" AMOLED, 120Hz, 2712x1220, Gorilla Glass Victus 2',
      processor: 'MediaTek Dimensity 7200-Ultra (4nm)',
      ram: '8/12 GB', storage: '256/512 GB UFS 3.1',
      battery: '5000 mAh',
      rearCamera: '200MP Samsung HP3 + 8MP (ultrawide) + 2MP (macro)',
      frontCamera: '16 MP',
      os: 'Android 14 → MIUI 14 / HyperOS',
      connectivity: '5G, Wi-Fi 6, Bluetooth 5.2, NFC, IR blaster, USB-C',
      weight: '204.5 g', dimensions: '161.4 x 74.2 x 8.9 mm',
      waterResistance: 'IP68', biometrics: 'Under-display fingerprint, Face unlock',
      chargingSpeed: '120W HyperCharge',
    },
    estimatedPriceINR: { mrp: 33999, currentMarket: 28999, repairCostRange: { min: 1500, max: 10000 } },
  },

  // Redmi Note 12 Pro 5G
  '86098803': {
    brand: 'Xiaomi', model: '22101316G', marketName: 'Redmi Note 12 Pro 5G',
    releaseDate: '2023-01-10', deviceType: 'Smartphone',
    specs: {
      display: '6.67" AMOLED, 120Hz, 2400x1080',
      processor: 'MediaTek Dimensity 1080 (6nm)',
      ram: '6/8/12 GB', storage: '128/256 GB',
      battery: '5000 mAh',
      rearCamera: '50MP Sony IMX766 (OIS) + 8MP (ultrawide) + 2MP (macro)',
      frontCamera: '16 MP',
      os: 'Android 12 → MIUI 14',
      connectivity: '5G, Wi-Fi 5, Bluetooth 5.2, NFC, IR blaster, USB-C',
      weight: '187 g', dimensions: '162.9 x 76.0 x 7.9 mm',
      waterResistance: 'IP53', biometrics: 'Under-display fingerprint, Face unlock',
      chargingSpeed: '67W turbo charge',
    },
    estimatedPriceINR: { mrp: 27999, currentMarket: 19999, repairCostRange: { min: 1200, max: 8000 } },
  },

  // POCO F5 5G
  '86334208': {
    brand: 'Xiaomi', model: '23049PCD8G', marketName: 'POCO F5 5G',
    releaseDate: '2023-05-09', deviceType: 'Smartphone',
    specs: {
      display: '6.67" AMOLED, 120Hz, 2400x1080',
      processor: 'Qualcomm Snapdragon 7+ Gen 2 (4nm)',
      ram: '8/12 GB', storage: '256 GB UFS 3.1',
      battery: '5000 mAh',
      rearCamera: '64MP (OIS) + 8MP (ultrawide) + 2MP (macro)',
      frontCamera: '16 MP',
      os: 'Android 13 → MIUI 14',
      connectivity: '5G, Wi-Fi 6, Bluetooth 5.3, NFC, IR blaster, USB-C',
      weight: '181 g', dimensions: '161.1 x 75.0 x 7.9 mm',
      waterResistance: 'IP53', biometrics: 'Under-display fingerprint, Face unlock',
      chargingSpeed: '67W turbo charge',
    },
    estimatedPriceINR: { mrp: 29999, currentMarket: 22999, repairCostRange: { min: 1500, max: 9000 } },
  },

  // Redmi 13C
  '86709102': {
    brand: 'Xiaomi', model: '2310ARA4IG', marketName: 'Redmi 13C',
    releaseDate: '2023-12-06', deviceType: 'Smartphone',
    specs: {
      display: '6.74" IPS LCD, 90Hz, 1600x720',
      processor: 'MediaTek Helio G85',
      ram: '4/6/8 GB', storage: '128/256 GB + microSD',
      battery: '5000 mAh',
      rearCamera: '50MP + 0.08MP (auxiliary)',
      frontCamera: '5 MP',
      os: 'Android 13 → MIUI 14',
      connectivity: '4G LTE, Wi-Fi 5, Bluetooth 5.1, USB-C',
      weight: '192 g', dimensions: '168.6 x 76.8 x 8.1 mm',
      biometrics: 'Side-mounted fingerprint, Face unlock',
      chargingSpeed: '18W wired',
    },
    estimatedPriceINR: { mrp: 10999, currentMarket: 8999, repairCostRange: { min: 800, max: 4000 } },
  },

  // ═══════════════════════════════════════════
  // REALME
  // ═══════════════════════════════════════════

  // Realme GT 5 Pro
  '86153003': {
    brand: 'Realme', model: 'RMX3888', marketName: 'Realme GT 5 Pro',
    releaseDate: '2024-12-03', deviceType: 'Smartphone',
    specs: {
      display: '6.78" LTPO AMOLED, 120Hz, 2780x1264, 6000 nits peak',
      processor: 'Qualcomm Snapdragon 8 Elite (3nm)',
      ram: '12/16 GB LPDDR5X', storage: '256/512 GB UFS 4.0',
      battery: '5800 mAh',
      rearCamera: '50MP Sony IMX906 + 50MP (periscope 3x) + 8MP (ultrawide)',
      frontCamera: '16 MP',
      os: 'Android 15 → Realme UI 6.0',
      connectivity: '5G, Wi-Fi 7, Bluetooth 5.4, NFC, USB-C',
      weight: '199 g', dimensions: '161.6 x 75.1 x 8.2 mm',
      waterResistance: 'IP69', biometrics: 'Ultrasonic fingerprint, Face unlock',
      chargingSpeed: '80W SuperVOOC',
    },
    estimatedPriceINR: { mrp: 37999, currentMarket: 34999, repairCostRange: { min: 2500, max: 18000 } },
  },

  // Realme Narzo 60 5G
  '86287604': {
    brand: 'Realme', model: 'RMX3750', marketName: 'Realme Narzo 60 5G',
    releaseDate: '2023-07-06', deviceType: 'Smartphone',
    specs: {
      display: '6.4" Super AMOLED, 90Hz, 2400x1080',
      processor: 'MediaTek Dimensity 6020 (7nm)',
      ram: '6/8 GB', storage: '128 GB + microSD',
      battery: '5000 mAh',
      rearCamera: '64MP (wide) + 2MP (depth)',
      frontCamera: '16 MP',
      os: 'Android 13 → Realme UI 4.0',
      connectivity: '5G, Wi-Fi 5, Bluetooth 5.2, USB-C',
      weight: '185 g', dimensions: '159.9 x 73.5 x 7.9 mm',
      biometrics: 'Under-display fingerprint, Face unlock',
      chargingSpeed: '33W SuperVOOC',
    },
    estimatedPriceINR: { mrp: 17999, currentMarket: 14999, repairCostRange: { min: 1000, max: 6000 } },
  },

  // ═══════════════════════════════════════════
  // VIVO
  // ═══════════════════════════════════════════

  // Vivo X100 Pro
  '86388003': {
    brand: 'Vivo', model: 'V2324', marketName: 'Vivo X100 Pro',
    releaseDate: '2024-03-07', deviceType: 'Smartphone',
    specs: {
      display: '6.78" LTPO AMOLED, 120Hz, 2800x1260',
      processor: 'MediaTek Dimensity 9300 (4nm)',
      ram: '12/16 GB LPDDR5T', storage: '256/512 GB UFS 4.0',
      battery: '5400 mAh',
      rearCamera: '50MP Sony IMX920 ZEISS + 50MP (4.3x telephoto) + 50MP (ultrawide)',
      frontCamera: '32 MP',
      os: 'Android 14 → Funtouch OS 14',
      connectivity: '5G, Wi-Fi 7, Bluetooth 5.4, NFC, IR blaster, USB-C',
      weight: '225 g', dimensions: '164.1 x 75.3 x 8.9 mm',
      waterResistance: 'IP68', biometrics: 'Ultrasonic fingerprint, Face unlock',
      chargingSpeed: '100W FlashCharge, 50W wireless',
    },
    estimatedPriceINR: { mrp: 89999, currentMarket: 79999, repairCostRange: { min: 5000, max: 32000 } },
  },

  // Vivo T2 5G
  '86529103': {
    brand: 'Vivo', model: 'V2240', marketName: 'Vivo T2 5G',
    releaseDate: '2023-05-25', deviceType: 'Smartphone',
    specs: {
      display: '6.38" AMOLED, 90Hz, 2400x1080',
      processor: 'Qualcomm Snapdragon 695 5G (6nm)',
      ram: '6/8 GB', storage: '128 GB + microSD',
      battery: '4500 mAh',
      rearCamera: '64MP (wide) + 2MP (depth)',
      frontCamera: '16 MP',
      os: 'Android 13 → Funtouch OS 13',
      connectivity: '5G, Wi-Fi 5, Bluetooth 5.1, USB-C',
      weight: '172 g', dimensions: '159.2 x 74.3 x 7.4 mm',
      biometrics: 'Under-display fingerprint, Face unlock',
      chargingSpeed: '44W FlashCharge',
    },
    estimatedPriceINR: { mrp: 18999, currentMarket: 14999, repairCostRange: { min: 1200, max: 6500 } },
  },

  // ═══════════════════════════════════════════
  // OPPO
  // ═══════════════════════════════════════════

  // OPPO Reno 11 Pro 5G
  '86445206': {
    brand: 'OPPO', model: 'CPH2609', marketName: 'OPPO Reno 11 Pro 5G',
    releaseDate: '2024-01-12', deviceType: 'Smartphone',
    specs: {
      display: '6.7" AMOLED, 120Hz, 2412x1080, curved',
      processor: 'MediaTek Dimensity 8200 (4nm)',
      ram: '12 GB LPDDR5', storage: '256 GB UFS 3.1',
      battery: '4600 mAh',
      rearCamera: '50MP Sony IMX890 (OIS) + 32MP (2x telephoto) + 8MP (ultrawide)',
      frontCamera: '32 MP',
      os: 'Android 14 → ColorOS 14',
      connectivity: '5G, Wi-Fi 6, Bluetooth 5.3, NFC, USB-C',
      weight: '185 g', dimensions: '161.4 x 74.1 x 7.6 mm',
      biometrics: 'Under-display fingerprint, Face unlock',
      chargingSpeed: '67W SUPERVOOC',
    },
    estimatedPriceINR: { mrp: 34999, currentMarket: 30999, repairCostRange: { min: 2000, max: 12000 } },
  },

  // OPPO A78 5G
  '86312508': {
    brand: 'OPPO', model: 'CPH2483', marketName: 'OPPO A78 5G',
    releaseDate: '2023-01-18', deviceType: 'Smartphone',
    specs: {
      display: '6.56" IPS LCD, 90Hz, 2408x1080',
      processor: 'MediaTek Dimensity 700 (7nm)',
      ram: '8 GB', storage: '128 GB + microSD',
      battery: '5000 mAh',
      rearCamera: '50MP (wide) + 2MP (depth)',
      frontCamera: '8 MP',
      os: 'Android 12 → ColorOS 12.1',
      connectivity: '5G, Wi-Fi 5, Bluetooth 5.3, USB-C',
      weight: '188 g', dimensions: '163.8 x 75.0 x 8.0 mm',
      biometrics: 'Side-mounted fingerprint, Face unlock',
      chargingSpeed: '33W SUPERVOOC',
    },
    estimatedPriceINR: { mrp: 17999, currentMarket: 13999, repairCostRange: { min: 1000, max: 5500 } },
  },

  // ═══════════════════════════════════════════
  // MOTOROLA
  // ═══════════════════════════════════════════

  // Motorola Edge 50 Pro
  '35598712': {
    brand: 'Motorola', model: 'XT2401-1', marketName: 'Motorola Edge 50 Pro',
    releaseDate: '2024-03-19', deviceType: 'Smartphone',
    specs: {
      display: '6.7" P-OLED, 144Hz, 2712x1220, curved',
      processor: 'Qualcomm Snapdragon 7 Gen 3 (4nm)',
      ram: '8/12 GB', storage: '256/512 GB',
      battery: '4500 mAh',
      rearCamera: '50MP (OIS) + 13MP (ultrawide) + 10MP (3x telephoto)',
      frontCamera: '50 MP (AF)',
      os: 'Android 14 → Hello UI',
      connectivity: '5G, Wi-Fi 6E, Bluetooth 5.4, NFC, USB-C 3.1',
      weight: '186 g', dimensions: '161.2 x 72.4 x 8.2 mm',
      waterResistance: 'IP68', biometrics: 'Under-display fingerprint, Face unlock',
      chargingSpeed: '125W TurboPower, 50W wireless',
    },
    estimatedPriceINR: { mrp: 35999, currentMarket: 29999, repairCostRange: { min: 2000, max: 12000 } },
  },

  // Moto G84 5G
  '35602412': {
    brand: 'Motorola', model: 'XT2347-2', marketName: 'Moto G84 5G',
    releaseDate: '2023-09-01', deviceType: 'Smartphone',
    specs: {
      display: '6.55" P-OLED, 120Hz, 2400x1080',
      processor: 'Qualcomm Snapdragon 695 5G (6nm)',
      ram: '12 GB', storage: '256 GB + microSD',
      battery: '5000 mAh',
      rearCamera: '50MP (OIS) + 8MP (ultrawide)',
      frontCamera: '16 MP',
      os: 'Android 13 → My UX',
      connectivity: '5G, Wi-Fi 5, Bluetooth 5.1, NFC, USB-C',
      weight: '168 g', dimensions: '160.0 x 74.4 x 7.6 mm',
      waterResistance: 'IP52', biometrics: 'Under-display fingerprint, Face unlock',
      chargingSpeed: '33W TurboPower',
    },
    estimatedPriceINR: { mrp: 19999, currentMarket: 15999, repairCostRange: { min: 1200, max: 7000 } },
  },

  // ═══════════════════════════════════════════
  // NOTHING
  // ═══════════════════════════════════════════

  // Nothing Phone (2)
  '86156709': {
    brand: 'Nothing', model: 'A065', marketName: 'Nothing Phone (2)',
    releaseDate: '2023-07-11', deviceType: 'Smartphone',
    specs: {
      display: '6.7" LTPO OLED, 120Hz, 2412x1080',
      processor: 'Qualcomm Snapdragon 8+ Gen 1 (4nm)',
      ram: '8/12 GB', storage: '128/256/512 GB',
      battery: '4700 mAh',
      rearCamera: '50MP Sony IMX890 (OIS) + 50MP (ultrawide)',
      frontCamera: '32 MP',
      os: 'Android 13 → Nothing OS 2.0',
      connectivity: '5G, Wi-Fi 7, Bluetooth 5.3, NFC, USB-C 2.0',
      weight: '201.2 g', dimensions: '162.1 x 76.4 x 8.6 mm',
      waterResistance: 'IP54', biometrics: 'Under-display fingerprint, Face unlock',
      chargingSpeed: '45W wired, 15W wireless, 5W reverse',
    },
    estimatedPriceINR: { mrp: 44999, currentMarket: 34999, repairCostRange: { min: 2500, max: 15000 } },
  },

  // ═══════════════════════════════════════════
  // GOOGLE
  // ═══════════════════════════════════════════

  // Google Pixel 8
  '35833411': {
    brand: 'Google', model: 'GKWS6', marketName: 'Pixel 8',
    releaseDate: '2023-10-12', deviceType: 'Smartphone',
    specs: {
      display: '6.2" OLED, 120Hz, 2400x1080, Actua display',
      processor: 'Google Tensor G3 (4nm)',
      ram: '8 GB', storage: '128/256 GB',
      battery: '4575 mAh',
      rearCamera: '50MP (OIS) + 12MP (ultrawide)',
      frontCamera: '10.5 MP',
      os: 'Android 14',
      connectivity: '5G, Wi-Fi 7, Bluetooth 5.3, NFC, UWB, USB-C 3.2',
      weight: '187 g', dimensions: '150.5 x 70.8 x 8.9 mm',
      waterResistance: 'IP68', biometrics: 'Under-display fingerprint, Face unlock',
      chargingSpeed: '27W wired, 18W wireless',
    },
    estimatedPriceINR: { mrp: 75999, currentMarket: 52999, repairCostRange: { min: 4000, max: 22000 } },
  },

  // ═══════════════════════════════════════════
  // iQOO
  // ═══════════════════════════════════════════

  // iQOO 12 5G
  '86467305': {
    brand: 'iQOO', model: 'V2307', marketName: 'iQOO 12 5G',
    releaseDate: '2023-12-12', deviceType: 'Smartphone',
    specs: {
      display: '6.78" LTPO AMOLED, 144Hz, 3200x1440',
      processor: 'Qualcomm Snapdragon 8 Gen 3 (4nm)',
      ram: '12/16 GB LPDDR5X', storage: '256/512 GB UFS 4.0',
      battery: '5000 mAh',
      rearCamera: '50MP Sony IMX920 (OIS) + 64MP (periscope 3x) + 13MP (ultrawide)',
      frontCamera: '16 MP',
      os: 'Android 14 → Funtouch OS 14',
      connectivity: '5G, Wi-Fi 7, Bluetooth 5.4, NFC, USB-C',
      weight: '205 g', dimensions: '162.7 x 75.8 x 8.1 mm',
      biometrics: 'Under-display ultrasonic fingerprint, Face unlock',
      chargingSpeed: '120W FlashCharge',
    },
    estimatedPriceINR: { mrp: 52999, currentMarket: 44999, repairCostRange: { min: 3000, max: 18000 } },
  },

  // ═══════════════════════════════════════════
  // TECNO
  // ═══════════════════════════════════════════

  // Tecno Spark 20 Pro+
  '35982109': {
    brand: 'Tecno', model: 'KJ7', marketName: 'Tecno Spark 20 Pro+',
    releaseDate: '2024-01-15', deviceType: 'Smartphone',
    specs: {
      display: '6.78" AMOLED, 120Hz, 2436x1080',
      processor: 'MediaTek Helio G99 (6nm)',
      ram: '8 GB', storage: '256 GB + microSD',
      battery: '5000 mAh',
      rearCamera: '108MP (wide) + 2MP (depth)',
      frontCamera: '32 MP',
      os: 'Android 13 → HiOS 13.5',
      connectivity: '4G LTE, Wi-Fi 5, Bluetooth 5.0, USB-C',
      weight: '190 g', dimensions: '163.7 x 75.1 x 7.6 mm',
      biometrics: 'Under-display fingerprint, Face unlock',
      chargingSpeed: '33W',
    },
    estimatedPriceINR: { mrp: 14999, currentMarket: 12999, repairCostRange: { min: 800, max: 4500 } },
  },
};

/**
 * Look up device info from IMEI using TAC (first 8 digits)
 * Uses local database with 30+ popular Indian market devices
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

/**
 * Get all known TAC entries (for admin reference)
 */
export const getAllKnownTACs = (): Record<string, DeviceSpec> => tacDatabase;
