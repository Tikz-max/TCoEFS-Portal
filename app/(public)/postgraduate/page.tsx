import { Navbar } from "@/components/layout/navbar/Navbar";
import { PublicPostgraduateCatalogue } from "@/components/postgraduate/PublicPostgraduateCatalogue";
import { getPublicPostgraduateCatalogue } from "@/features/postgraduate/catalogue";

const C = {
  canvas: "#EFF3EF",
} as const;

export default async function PostgraduateIndexPage() {
  const programmes = await getPublicPostgraduateCatalogue();

  return (
    <div style={{ minHeight: "100dvh", background: C.canvas, fontFamily: "var(--font-sans)" }}>
      <Navbar activePage="applications" />
      <PublicPostgraduateCatalogue programmes={programmes} />
    </div>
  );
}
