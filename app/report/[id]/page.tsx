import ReportPageClient from "@/components/report/ReportPageClient";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ReportPage({ params }: PageProps) {
  const { id } = await params;
  return <ReportPageClient reportId={id} />;
}

