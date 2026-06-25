export type ProductType =
  | "ebook"
  | "template"
  | "checklist"
  | "ai_prompt"
  | "course"
  | "swipe_file"
  | "resource"
  | "bundle"
  | "workbook"
  | "guide";

export type MonetizationPotential = "High" | "Very High" | "Medium";
export type Difficulty = "Easy" | "Medium" | "Hard";

export interface TrendingIdea {
  title: string;
  description: string;
  whyTrending: string;
  monetizationPotential: MonetizationPotential;
  difficulty: Difficulty;
  suggestedPrice: number;
  category: string;
  emoji: string;
  productType: ProductType;
  region?: string;
}
