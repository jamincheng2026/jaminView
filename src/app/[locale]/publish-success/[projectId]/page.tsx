import {PublishSuccessPage} from "@/components/pages/publish-success-page";

export default async function LocalizedPublishSuccessRoute({
  params,
}: {
  params: Promise<{projectId: string}>;
}) {
  const {projectId} = await params;
  return <PublishSuccessPage projectId={projectId} />;
}
