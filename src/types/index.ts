export type PackageType =
  | 'glass_jar'      // Стеклянная банка (хумус, соусы, джемы)
  | 'plastic_tub'    // Пластиковая банка / ведерко
  | 'cup'            // Стакан (йогурт, кофе, десерты)
  | 'bottle'         // Бутылка (напитки, масло, бытовая химия)
  | 'carton_box'     // Картонная коробка (хлопья, печенье, чай)
  | 'doypack'        // Пакет дой-пак (майонез, кофе, снэки)
  | 'vacuum_pack'    // Вакуумная упаковка (сыр, нарезка, брикет)
  | 'dough_roll'     // Тесто "Бабушка Аня" (продолговатый рулон в пленке с запайками)
  | 'dumpling_bag'   // Упаковка пельменей (пакет с клипсой или подушечный флоу-пак)
  | 'container'      // Прямоугольный контейнер (салаты, кулинария, творог)
  | 'tube';          // Туба (соусы, горчица, паста, крем)

export type MaterialType = 'glass' | 'plastic' | 'carton' | 'film' | 'metal';

export interface PackageDimensions {
  width: number;    // см (или диаметр для цилиндрических)
  height: number;   // см
  depth: number;    // см
  diameter?: number;// см
  thickness?: number; // толщина стенок / пленки (мм)
  neckHeight?: number; // высота горловины
  lidHeight?: number;  // высота крышки
}

export interface MaterialProperties {
  color: string;
  roughness: number;
  metalness: number;
  transmission: number; // прозрачность для стекла
  opacity: number;
  clearcoat: number;
  ior: number;          // индекс преломления (1.5 для стекла, 1.46 для пластика)
  lidColor: string;
  lidMetalness: number;
  lidRoughness: number;
  liquidColor?: string; // цвет содержимого для стекла
  hasLiquid?: boolean;
}

export interface ProductSKU {
  id: string;
  name: string;
  brand: string;
  packageType: PackageType;
  materialType: MaterialType;
  isCompetitor: boolean;
  competitorBrand?: string;
  dimensions: PackageDimensions;
  materialProps: MaterialProperties;
  textures: {
    front?: string;      // data URL
    side?: string;
    back?: string;
    top?: string;
    labelWrap?: string;
  };
  price: number;
  currency: string;
  volumeText: string;
  facings: number;       // количество фейсингов в ряд
  depthRows: number;     // рядов в глубину
  shelfIndex: number;    // 0: Верхняя, 1: Золотая (глаза), 2: Средняя (руки), 3: Нижняя
  shelfPositionX: number;// смещение вдоль полки (-0.5 до +0.5)
  gap: number;           // зазор между фейсингами (см)
  barcode: string;
  promoBadge?: string;   // например, "ХИТ", "АКЦИЯ -20%", "НОВИНКА"
}

export interface ShelfTier {
  id: number;
  name: string;
  shortLabel: string;
  isGolden: boolean;
  heightCm: number;
  yPosition: number;
  weightMultiplier: number; // коэффициент заметности (1.35 для золотой полки)
}

export type ViewMode = 'studio' | 'shelf' | 'analytics' | 'ai_lab';

export type CameraPreset = 'front' | 'eye_level' | 'angle_45' | 'top' | 'free';

export interface AIAuditResult {
  readabilityScore: number;
  shelfContrastScore: number;
  brandingImpactScore: number;
  shelfBlockingScore: number;
  overallVisibilityIndex: number;
  keyStrengths: string[];
  criticalFlaws: string[];
  actionableRecommendations: string[];
  goldenShelfAdvice: string;
}

export interface PackageTypeInfo {
  type: PackageType;
  title: string;
  defaultMaterial: MaterialType;
  description: string;
  categoryExamples: string;
  iconName: string;
  defaultDimensions: PackageDimensions;
}
