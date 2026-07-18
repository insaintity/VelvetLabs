import { VelvetApp } from "@/components/velvet-app";
import { ShowcaseHome } from "@/components/showcase-home";

export default async function CatchAllPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  if (!slug?.length) return <ShowcaseHome />;
  return <VelvetApp />;
}
