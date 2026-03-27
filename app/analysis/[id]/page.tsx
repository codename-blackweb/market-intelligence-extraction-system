import SharedAnalysisPageClient from "@/components/report/SharedAnalysisPageClient";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function SharedAnalysisPage({ params }: PageProps) {
  const { id } = await params;
  return <SharedAnalysisPageClient analysisId={id} />;
}
