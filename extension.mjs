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

        for (
          let i = 0,
            ie = Math.min(viewColumns.length, majorBlockFoldingRanges.length);
          i < ie;
          ++i
        ) {
          const viewColumn = viewColumns[i];
          const rangesToUnfold =
            ie - i > 1
              ? [majorBlockFoldingRanges[i]]
              : majorBlockFoldingRanges.slice(i);
          const rangesToFold = majorBlockFoldingRanges.filter(
            (range) => !rangesToUnfold.includes(range)
          );

          await vscode.window.showTextDocument(documentOrUri, {
            viewColumn,
            preserveFocus: false,
            preview: false,
          });
          await vscode.commands.executeCommand(builtInCommands.unfold, {
            level: 1,
            direction: "down",
            selectionLines: rangesToUnfold.map((range) => range.start),
          });
          await vscode.commands.executeCommand(builtInCommands.fold, {
            level: 1,
            direction: "down",
            selectionLines: rangesToFold.map((range) => range.start),
          });
        }
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
