import AnalysisDetailPageClient from "@/components/analysis/AnalysisDetailPageClient";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function SharedAnalysisPage({ params }: PageProps) {
  const { id } = await params;
  return <AnalysisDetailPageClient analysisId={id} />;
}
