import {redirect} from "next/navigation";

export default async function PreviewRedirectRoute({
  params,
}: {
  params: Promise<{projectId: string}>;
}) {
  const {projectId} = await params;
  redirect(`/zh-CN/preview/${projectId}`);
}
