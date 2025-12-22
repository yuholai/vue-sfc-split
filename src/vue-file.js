import * as vscode from "vscode";

export const isVueDocument = (document) => document.languageId === "vue";

export const validateActiveEditorDocumentIsVueDocument = () => {
  const activeTextEditor = vscode.window.activeTextEditor;

  // no active editor
  if (!activeTextEditor) {
    vscode.window.showInformationMessage("No active editor", {
      modal: false,
    });
    return false;
  }

  const document = activeTextEditor.document;

  // active file is not a vue file
  if (!isVueDocument(document)) {
    vscode.window.showInformationMessage("This is not a vue file", {
      modal: false,
    });
    return false;
  }

  return true;
};

export const findMajorBlockFoldingRanges = (foldingRanges) => {
  const result = [];
  if (Array.isArray(foldingRanges))
    for (let i = 0, end = -1; i < foldingRanges.length; ++i) {
      const range = foldingRanges[i];
      // comment, region and imports
      if (range.kind !== undefined) continue;
      if (range.start <= end) continue;
      end = range.end;
      result.push(range);
    }
  return result;
};
