import * as React from "react";

import { EditorWorkbench } from "./editor-workbench";

type EditorPageProps = {
  projectId?: string;
  templateId?: string;
  projectName?: string;
};

export function EditorPage(props: EditorPageProps) {
  return (
    <EditorWorkbench
      projectId={props.projectId}
      projectName={props.projectName}
      templateId={props.templateId}
    />
  );
}

export default EditorPage;
