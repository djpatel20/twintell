export interface CategoryDefinition {
  slug: string;
  name: string;
  iconName: string;
}

export const STATIC_CATEGORIES: CategoryDefinition[] = [
  {
    slug: 'industrial-plants-machinery',
    name: 'Industrial Plants & Machinery',
    iconName: 'Cog',
  },
  {
    slug: 'industrial-equipment-supplies',
    name: 'Industrial Equipment & Supplies',
    iconName: 'Wrench',
  },
  {
    slug: 'electrical-electronics',
    name: 'Electrical & Electronics',
    iconName: 'Cpu',
  },
  {
    slug: 'construction-building-materials',
    name: 'Construction & Building Materials',
    iconName: 'Building2',
  },
  {
    slug: 'textiles-apparel-fashion',
    name: 'Textiles, Apparel & Fashion',
    iconName: 'Shirt',
  },
  {
    slug: 'food-beverages-agriculture',
    name: 'Food, Beverages & Agriculture',
    iconName: 'Utensils',
  },
  {
    slug: 'chemicals',
    name: 'Chemicals',
    iconName: 'FlaskConical',
  },
  {
    slug: 'plastics-rubber',
    name: 'Plastics & Rubber',
    iconName: 'Layers',
  },
  {
    slug: 'metals-steel-minerals',
    name: 'Metals, Steel & Minerals',
    iconName: 'Hammer',
  },
  {
    slug: 'packaging-printing-paper',
    name: 'Packaging, Printing & Paper',
    iconName: 'Package',
  },
  {
    slug: 'beauty-personal-care-wellness',
    name: 'Beauty, Personal Care & Wellness',
    iconName: 'Sparkles',
  },
  {
    slug: 'automotive-spare-parts',
    name: 'Automotive & Spare Parts',
    iconName: 'Car',
  },
  {
    slug: 'it-software-digital-services',
    name: 'IT, Software & Digital Services',
    iconName: 'Laptop',
  },
];

export function getCategoryBySlug(slug: string): CategoryDefinition | undefined {
  return STATIC_CATEGORIES.find((c) => c.slug === slug);
}

export function getCategoryName(slug: string, fallback?: string): string {
  const cat = getCategoryBySlug(slug);
  return cat ? cat.name : fallback || slug;
}
