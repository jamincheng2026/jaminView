import {EditorPage} from "@/components/editor/editor-page";

export default async function LocalizedEditorRoute({
  params,
}: {
  params: Promise<{projectId: string}>;
}) {
  const {projectId} = await params;
  return <EditorPage projectId={projectId} />;
}
