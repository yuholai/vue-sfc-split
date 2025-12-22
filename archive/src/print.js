import * as vscode from "vscode";
import {
  findMajorBlockFoldingRanges,
  validateActiveEditorDocumentIsVueDocument,
} from "../../src/vue-file.js";
import { builtInCommands } from "../../src/commands.js";

export const printActiveTab = () => {
  const tab = vscode.window.tabGroups.activeTabGroup?.activeTab;
  vscode.window.showInformationMessage(
    tab
      ? `Active tab: ${JSON.stringify(
          Object.fromEntries([
            ["label", tab.label],
            ["input", tab.input],
            ["group.viewColumn", tab.group.viewColumn],
          ]),
          null,
          2
        )}`
      : "No active tab",
    {
      modal: false,
    }
  );
};

export const printActiveTextEditorDocumentUri = () => {
  const uri = vscode.window.activeTextEditor?.document?.uri;
  vscode.window.showInformationMessage(
    uri
      ? `The URI of textDocument the active text editor associated with ${JSON.stringify(
          uri,
          null,
          2
        )}`
      : "No active text editor or documetn",
    {
      modal: false,
    }
  );
};

export const printActiveTextEditorChanged = (editor) => {
  if (editor) {
    vscode.window.showInformationMessage(
      `Active editor changed to: ${editor.document.fileName}(${editor.viewColumn})`,
      {
        modal: false,
      }
    );
  } else {
    vscode.window.showInformationMessage("No active editor", {
      modal: false,
    });
  }
};

export const printTabGroupsChanged = (event) => {
  const describeTabGroup = (tabGroup) => {
    return `${tabGroup.isActive ? "*" : ""}${tabGroup.viewColumn} (${
      tabGroup.activeTab ? tabGroup.activeTab.label.substring(0, 8) : ""
    })`;
  };

  vscode.window.showInformationMessage(
    Object.entries(event)
      .map(
        ([method, tabGroups]) =>
          `${method}: ${tabGroups.map(describeTabGroup).join(", ")}`
      )
      .join("\n"),
    {
      modal: false,
    }
  );
};

export const printFoldingRanges = async () => {
  if (!validateActiveEditorDocumentIsVueDocument()) return;

  const foldingRanges = await vscode.commands.executeCommand(
    builtInCommands.executeFoldingRangeProvider,
    vscode.window.activeTextEditor.document.uri
  );

  if (!foldingRanges) {
    console.log("No folding ranges");
    return;
  }

  console.log({
    foldingRanges,
    majorFoldingRanges: findMajorBlockFoldingRanges(foldingRanges),
  });
};

export const printEditorLayout = async () => {
  const layout = await vscode.commands.executeCommand(
    builtInCommands.getEditorLayout
  );
  console.log(layout);
};
