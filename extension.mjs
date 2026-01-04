import * as vscode from "vscode";

import { builtInCommands } from "./src/commands.js";
import { isFileInTab, showFileTab } from "./src/file-tab.js";
import {
  findMajorBlockFoldingRanges,
  validateActiveEditorDocumentIsVueDocument,
} from "./src/vue-file.js";

const revealFileInGroups = (fileUri) => {
  for (const tabGroup of vscode.window.tabGroups.all) {
    if (1 > tabGroup.viewColumn || tabGroup.viewColumn > 3) continue;
    showFileTab(tabGroup, fileUri, {
      preserveFocus: true,
      preview: false,
    });
  }
};

const showMessageSaveBeforeClosing = async () =>
  await vscode.window.showWarningMessage("Please save before closing.", {
    modal: false,
  });

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
export function activate(context) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated

  const disposables = [
    vscode.commands.registerCommand(
      "vue-sfc-split.splitFile",
      async (...args) => {
        let documentOrUri = null;
        let uri = null;

        if (args.length === 0) {
          if (!validateActiveEditorDocumentIsVueDocument()) return;

          uri = (documentOrUri = vscode.window.activeTextEditor.document).uri;
        } else {
          uri = documentOrUri = args[0];
        }

        // open the file in view columns 1 to 3
        const viewColumns = [
          vscode.ViewColumn.One,
          vscode.ViewColumn.Two,
          vscode.ViewColumn.Three,
        ];

        const majorBlockFoldingRanges = findMajorBlockFoldingRanges(
          await vscode.window.withProgress(
            {
              location: vscode.ProgressLocation.Window,
              title: "Finding folding ranges",
              cancellable: false,
            },
            () =>
              vscode.commands.executeCommand(
                builtInCommands.executeFoldingRangeProvider,
                uri
              )
          )
        );

        const numberOfGroups = Math.min(
          viewColumns.length,
          majorBlockFoldingRanges.length
        );

        const progressLocation = vscode.ProgressLocation.Window;

        const majorBlockFoldingRangesStart = majorBlockFoldingRanges.map(
          (range) => range.start
        );

        const showTextDocument = async (viewColumn) =>
          vscode.window.showTextDocument(documentOrUri, {
            viewColumn,
            preserveFocus: false,
            preview: false,
          });

        await vscode.window.withProgress(
          {
            title: "Splitting file",
            cancellable: false,
            location: progressLocation,
          },
          async (progress) => {
            for (let i = 0; i < numberOfGroups; ++i) {
              const viewColumn = viewColumns[i];
              const toFold = [...majorBlockFoldingRangesStart];
              const toUnfold = toFold.splice(
                i,
                i < numberOfGroups - 1 ? 1 : Infinity
              );

              progress.report({
                message: `Opening file in editor group ${viewColumn}`,
              });

              const editor = await showTextDocument(viewColumn);

              if (!editor) documentOrUri = editor.document;

              progress.report({
                message: "Unfolding",
              });

              await vscode.commands.executeCommand(builtInCommands.unfold, {
                selectionLines: toUnfold,
                direction: "down",
                level: 1,
              });

              progress.report({
                message: "Folding",
              });

              await vscode.commands.executeCommand(builtInCommands.fold, {
                selectionLines: toFold,
                direction: "down",
                level: 1,
              });
            }
          }
        );
      }
    ),

    vscode.commands.registerCommand("vue-sfc-split.revealFile", (...args) => {
      let uri = null;

      if (args.length === 0) {
        if (!validateActiveEditorDocumentIsVueDocument()) return;

        uri = vscode.window.activeTextEditor.document.uri;
      } else {
        uri = args[0];
      }

      revealFileInGroups(uri);
    }),

    vscode.commands.registerCommand(
      "vue-sfc-split.closeFileTabs",
      async (...args) => {
        let uri = null;

        if (args.length === 0) {
          if (!validateActiveEditorDocumentIsVueDocument()) return;

          uri = vscode.window.activeTextEditor.document.uri;
        } else {
          uri = args[0];
        }

        const tabs = [];
        let containsDirtyTab = false;

        for (const tabGroup of vscode.window.tabGroups.all.filter(
          (tabGroup) => 1 <= tabGroup.viewColumn && tabGroup.viewColumn <= 3
        )) {
          const tab = tabGroup.tabs.find((tab) => isFileInTab(uri, tab));
          if (tab) {
            if (tab.isDirty) {
              containsDirtyTab = true;
              continue;
            }
            tabs.push(tab);
          }
        }

        vscode.window.tabGroups.close(tabs);

        if (containsDirtyTab) await showMessageSaveBeforeClosing();
      }
    ),

    vscode.commands.registerCommand(
      "vue-sfc-split.closeDuplicateFileTabs",
      async (...args) => {
        let uri = null;

        if (args.length === 0) {
          if (!validateActiveEditorDocumentIsVueDocument()) return;

          uri = vscode.window.activeTextEditor.document.uri;
        } else {
          uri = args[0];
        }

        const tabs = [];
        let containsDirtyTab = false;
        let skip = true;

        for (const tabGroup of vscode.window.tabGroups.all.filter(
          (tabGroup) => 1 <= tabGroup.viewColumn && tabGroup.viewColumn <= 3
        )) {
          const tab = tabGroup.tabs.find((tab) => isFileInTab(uri, tab));
          if (tab) {
            if (tab.isDirty) {
              containsDirtyTab = true;
              continue;
            }
            if (skip) skip = false;
            else tabs.push(tab);
          }
        }

        vscode.window.tabGroups.close(tabs);

        if (containsDirtyTab) await showMessageSaveBeforeClosing();
      }
    ),

    /* vscode.window.onDidChangeActiveTextEditor((textEditor) => {
      if (!textEditor || 1 > textEditor.viewColumn || textEditor.viewColumn > 3)
        return;

      const document = textEditor.document;

      if (!isVueDocument(document)) return;

      revealFileInGroups(document.uri);
    }), */
  ];

  context.subscriptions.push(...disposables);
}

// This method is called when your extension is deactivated
export function deactivate() {}

export default {
  activate,
  deactivate,
};
