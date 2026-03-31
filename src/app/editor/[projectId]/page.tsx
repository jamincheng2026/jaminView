import {redirect} from "next/navigation";

export default async function EditorRedirectPage({
  params,
}: {
  params: Promise<{projectId: string}>;
}) {
  const {projectId} = await params;
  redirect(`/zh-CN/editor/${projectId}`);
}
