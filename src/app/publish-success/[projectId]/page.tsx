import {redirect} from "next/navigation";

export default async function PublishSuccessRedirectRoute({
  params,
}: {
  params: Promise<{projectId: string}>;
}) {
  const {projectId} = await params;
  redirect(`/zh-CN/publish-success/${projectId}`);
}
