import * as vscode from 'vscode';

const INDENT_COLORS = [
    'rgba(255, 135, 135, 0.12)', // レベル1: 赤系
    'rgba(255, 200, 80, 0.12)',  // レベル2: 黄系
    'rgba(80, 200, 120, 0.12)',  // レベル3: 緑系
    'rgba(80, 160, 220, 0.12)',  // レベル4: 青系
    'rgba(180, 120, 220, 0.12)', // レベル5+: 紫系
];

let indentDecorationTypes: vscode.TextEditorDecorationType[];

export function activate(context: vscode.ExtensionContext) {
    indentDecorationTypes = INDENT_COLORS.map((color) =>
        vscode.window.createTextEditorDecorationType({
            backgroundColor: color,
        }),
    );

    const updateDecorations = () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'scbdown') {
            return;
        }

        const decorationsByLevel: vscode.DecorationOptions[][] = INDENT_COLORS.map(() => []);
        const lineCount = editor.document.lineCount;

        for (let i = 0; i < lineCount; i++) {
            const line = editor.document.lineAt(i);
            const match = line.text.match(/^( +)/);
            if (match) {
                const indentLevel = Math.min(match[1].length, INDENT_COLORS.length) - 1;
                const range = new vscode.Range(i, 0, i, match[1].length);
                decorationsByLevel[indentLevel].push({ range });
            }
        }

        indentDecorationTypes.forEach((type, level) => {
            editor.setDecorations(type, decorationsByLevel[level]);
        });
    };

    context.subscriptions.push(
        ...indentDecorationTypes,
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
