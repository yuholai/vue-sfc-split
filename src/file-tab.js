import * as vscode from "vscode";

export const isFileTab = (tab) => tab.input != null && tab.input.uri != null;

export const isSameFileUri = (uri1, uri2) =>
  uri1.scheme === uri2.scheme && uri1.path === uri2.path;

export const isFileInTab = (uri, tab) =>
  isFileTab(tab) && isSameFileUri(tab.input.uri, uri);

export const showFileTab = (tabGroup, uri, textDocumentShowOptions) => {
  const tab = tabGroup.tabs.find((tab) => isFileInTab(uri, tab));

  if (!tab || tab === tabGroup.activeTab) return false;

  const viewColumn = tabGroup.viewColumn;

  vscode.window.showTextDocument(uri, {
    ...textDocumentShowOptions,
    viewColumn,
  });

  return true;
};
