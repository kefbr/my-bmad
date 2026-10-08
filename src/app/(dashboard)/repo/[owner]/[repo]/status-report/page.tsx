import { redirect, notFound } from "next/navigation";
import { StatusReportDeck } from "@/components/dashboard/status-report-deck";
import {
  getAuthenticatedUserId,
  getAuthenticatedRepoConfig,
} from "@/lib/db/helpers";

interface StatusReportPageProps {
  params: Promise<{ owner: string; repo: string }>;
}

export default async function StatusReportPage({ params }: StatusReportPageProps) {
  const { owner, repo: repoName } = await params;
  const userId = await getAuthenticatedUserId();
  if (!userId) redirect("/login");

  const repoConfig = await getAuthenticatedRepoConfig(userId, owner, repoName);
  if (!repoConfig) return notFound();

  return (
    <div className="space-y-4 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Status Report</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Apresentação de 08/10/2026, com as cores e os dados do status
          semanal. As setas do teclado trocam o slide.
        </p>
      </div>
      <StatusReportDeck />
    </div>
  );
}
