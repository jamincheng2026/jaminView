import {EditorPage} from "@/components/editor/editor-page";
import {decodeRouteSegment} from "@/lib/project-utils";

export default async function LocalizedEditorRoute({
  params,
  searchParams,
}: {
  params: Promise<{projectId: string}>;
  searchParams: Promise<{template?: string; name?: string}>;
}) {
  const {projectId} = await params;
  const {template, name} = await searchParams;
  return (
    <EditorPage
      projectId={decodeRouteSegment(projectId)}
      templateId={template}
      projectName={name}
    />
  );
}
