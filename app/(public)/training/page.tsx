import { Navbar } from "@/components/layout/navbar/Navbar";
import { PublicTrainingCatalogue } from "@/components/training/PublicTrainingCatalogue";
import { getPublicTrainingCatalogue } from "@/features/training/catalogue";

const C = {
  canvas: "#EFF3EF",
} as const;

export default async function TrainingPage() {
  const rows = await getPublicTrainingCatalogue();

  return (
    <div style={{ minHeight: "100dvh", background: C.canvas, fontFamily: "var(--font-sans)" }}>
      <Navbar activePage="training" />
      <PublicTrainingCatalogue rows={rows} />
    </div>
  );
}
