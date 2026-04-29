export interface TrainingProgrammeFallback {
  id: string;
  title: string;
  slug: string;
  fees: number;
  schedule: string;
  venue: string;
}

export const TRAINING_PROGRAMMES_FALLBACK: TrainingProgrammeFallback[] = [
  {
    id: "fallback-sustainable-crop-production",
    title: "Sustainable Crop Production & Post-Harvest Management",
    slug: "sustainable-crop-production",
    fees: 35000,
    schedule: "10-14 Mar 2025",
    venue: "Unijos Campus Farm",
  },
  {
    id: "fallback-food-safety-standards-haccp",
    title: "Food Safety Standards & HACCP",
    slug: "food-safety-standards-haccp",
    fees: 30000,
    schedule: "7-11 Apr 2025",
    venue: "Online",
  },
  {
    id: "fallback-climate-smart-agriculture",
    title: "Climate-Smart Agriculture Techniques",
    slug: "climate-smart-agriculture",
    fees: 35000,
    schedule: "22-26 Apr 2025",
    venue: "TCoEFS Demonstration Farm, Unijos",
  },
  {
    id: "fallback-irrigation-management-water-conservation",
    title: "Irrigation Management & Water Conservation",
    slug: "irrigation-management-water-conservation",
    fees: 35000,
    schedule: "5-9 May 2025",
    venue: "Unijos Campus Farm",
  },
];
