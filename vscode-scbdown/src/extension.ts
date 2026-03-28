import * as vscode from 'vscode';

const INDENT_BG_COLOR = 'rgba(80, 160, 220, 0.15)';

let indentDecorationType: vscode.TextEditorDecorationType;

export function activate(context: vscode.ExtensionContext) {
    indentDecorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: INDENT_BG_COLOR,
    });

    const updateDecorations = () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'scbdown') {
            return;
        }

        const decorations: vscode.DecorationOptions[] = [];
        const lineCount = editor.document.lineCount;

        for (let i = 0; i < lineCount; i++) {
            const line = editor.document.lineAt(i);
            const match = line.text.match(/^( +)/);
            if (match) {
                const range = new vscode.Range(i, 0, i, match[1].length);
                decorations.push({ range });
            }
        }

        editor.setDecorations(indentDecorationType, decorations);
    };

    context.subscriptions.push(
        indentDecorationType,
        vscode.window.onDidChangeActiveTextEditor(updateDecorations),
        vscode.workspace.onDidChangeTextDocument((e) => {
            if (e.document === vscode.window.activeTextEditor?.document) {
                updateDecorations();
            }
        }),
    );

    updateDecorations();
}

export function deactivate() {}
