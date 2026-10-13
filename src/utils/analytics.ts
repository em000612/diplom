import { ProductSKU } from '../types';
import { SHELF_TIERS } from './constants';

export interface MerchandisingMetrics {
  totalFacings: number;
  heroFacings: number;
  competitorFacings: number;
  shareOfShelfByFacings: number; // %
  totalLinearWidthCm: number;
  heroLinearWidthCm: number;
  shareOfShelfByWidth: number; // %
  heroFrontalAreaCm2: number;
  competitorFrontalAreaCm2: number;
  visibilityIndex: number; // 0 - 100
  shelfLevelName: string;
  isGoldenShelf: boolean;
  complianceRating: 'excellent' | 'good' | 'fair' | 'poor';
  complianceIssues: string[];
  competitorComparison: {
    skuId: string;
    brand: string;
    name: string;
    facings: number;
    linearWidthCm: number;
    frontalAreaCm2: number;
    visibilityScore: number;
    sharePercent: number;
    price: number;
  }[];
}

export function calculateMerchandisingMetrics(
  skus: ProductSKU[],
  heroSkuId: string
): MerchandisingMetrics {
  const heroSku = skus.find((s) => s.id === heroSkuId) || skus[0];
  const targetShelfIndex = heroSku ? heroSku.shelfIndex : 1;
  const currentTier = SHELF_TIERS.find((t) => t.id === targetShelfIndex) || SHELF_TIERS[1];

  // Filter SKUs on the same shelf tier for competitive shelf share
  const shelfSkus = skus.filter((s) => s.shelfIndex === targetShelfIndex);

  let totalFacings = 0;
  let heroFacings = 0;
  let totalLinearWidthCm = 0;
  let heroLinearWidthCm = 0;
  let heroFrontalAreaCm2 = 0;
  let competitorFrontalAreaCm2 = 0;

  const compList: MerchandisingMetrics['competitorComparison'] = [];

  shelfSkus.forEach((sku) => {
    const skuWidth = (sku.dimensions.width || 8) * sku.facings + (sku.gap || 0.8) * (sku.facings - 1);
    const frontalArea = (sku.dimensions.width || 8) * (sku.dimensions.height || 10) * sku.facings;

    totalFacings += sku.facings;
    totalLinearWidthCm += skuWidth;

    if (!sku.isCompetitor) {
      heroFacings += sku.facings;
      heroLinearWidthCm += skuWidth;
      heroFrontalAreaCm2 += frontalArea;
    } else {
      competitorFrontalAreaCm2 += frontalArea;
    }

    // Visibility score for individual SKU
    const tierMultiplier = currentTier.weightMultiplier;
    const facingMultiplier = Math.min(2.0, 1.0 + (sku.facings - 1) * 0.25);
    const visScore = Math.round(Math.min(100, 45 * tierMultiplier * facingMultiplier));

    compList.push({
      skuId: sku.id,
      brand: sku.brand,
      name: sku.name,
      facings: sku.facings,
      linearWidthCm: Math.round(skuWidth * 10) / 10,
      frontalAreaCm2: Math.round(frontalArea),
      visibilityScore: visScore,
      sharePercent: 0, // will compute after total is known
      price: sku.price,
    });
  });

  // Calculate percentages
  const shareOfShelfByFacings = totalFacings > 0 ? Math.round((heroFacings / totalFacings) * 100) : 0;
  const shareOfShelfByWidth =
    totalLinearWidthCm > 0 ? Math.round((heroLinearWidthCm / totalLinearWidthCm) * 100) : 0;

  compList.forEach((c) => {
    c.sharePercent = totalFacings > 0 ? Math.round((c.facings / totalFacings) * 100) : 0;
  });

  // Base visibility calculation for hero
  const tierWeight = currentTier.weightMultiplier;
  const facingBoost = heroFacings >= 3 ? 1.3 : heroFacings === 2 ? 1.15 : 0.9;
  const contrastBoost = 1.1; // contrast coefficient
  const calculatedVI = Math.min(98, Math.round(52 * tierWeight * facingBoost * contrastBoost));

  // Compliance rating and actionable flags
  const issues: string[] = [];
  if (!currentTier.isGolden) {
    issues.push('Товар размещен не на "Золотой полке" (уровень глаз). Потеря до 35% импульсных покупок.');
  }
  if (heroFacings < 2) {
    issues.push('Менее 2 фейсингов: высокий риск размытия в поле зрения среди конкурентов.');
  }
  if (shareOfShelfByFacings < 30) {
    issues.push('Доля полки (Share of Shelf) ниже 30%: конкуренты доминируют визуально.');
  }
  if (heroSku && heroSku.gap > 2.0) {
    issues.push('Слишком большой зазор между товарами (> 2 см) разрушает цельность бренд-блока.');
  }

  let complianceRating: MerchandisingMetrics['complianceRating'] = 'excellent';
  if (issues.length >= 3) complianceRating = 'poor';
  else if (issues.length === 2) complianceRating = 'fair';
  else if (issues.length === 1) complianceRating = 'good';

  return {
    totalFacings,
    heroFacings,
    competitorFacings: totalFacings - heroFacings,
    shareOfShelfByFacings,
    totalLinearWidthCm: Math.round(totalLinearWidthCm * 10) / 10,
    heroLinearWidthCm: Math.round(heroLinearWidthCm * 10) / 10,
    shareOfShelfByWidth,
    heroFrontalAreaCm2: Math.round(heroFrontalAreaCm2),
    competitorFrontalAreaCm2: Math.round(competitorFrontalAreaCm2),
    visibilityIndex: calculatedVI,
    shelfLevelName: currentTier.name,
    isGoldenShelf: currentTier.isGolden,
    complianceRating,
    complianceIssues: issues,
    competitorComparison: compList,
  };
}
