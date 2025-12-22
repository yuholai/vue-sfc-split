import * as vscode from "vscode";
import { builtInCommands } from "../../src/commands.js";

export const fold = async () => {
  const input = await vscode.window.showInputBox({
    prompt: "Enter the start line to fold",
  });

  if (input === undefined) return;

  const start = Number.parseInt(input);

  if (Number.isNaN(start)) return;

  await vscode.commands.executeCommand(builtInCommands.fold, {
    selectionLines: [start],
  });
};

export const unfold = async () => {
  const input = await vscode.window.showInputBox({
    prompt: "Enter the start line to fold",
  });

  if (input === undefined) return;

  const start = Number.parseInt(input);

  if (Number.isNaN(start)) return;

  await vscode.commands.executeCommand(builtInCommands.unfold, {
    selectionLines: [start],
  });
};
