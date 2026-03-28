import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// --- ファイル名置換 ---

const INVALID_FILENAME_CHARS = /[<>:"/\\|?*]/g;

export function sanitizeFilename(name: string): string {
    return name.replace(INVALID_FILENAME_CHARS, '_').replace(/ /g, '_');
}

// --- リンク解析 ---

function isUrl(text: string): boolean {
    return /^https?:\/\//.test(text);
}

interface LinkInfo {
    type: 'internal' | 'external' | 'icon';
    target: string; // internal: ファイル名(拡張子なし), external: URL, icon: 名前
}

function parseLink(content: string): LinkInfo {
    if (content.endsWith('.icon')) {
        return { type: 'icon', target: content };
    }

    const tokens = content.split(' ');
    if (tokens.length >= 2) {
        const first = tokens[0];
        const last = tokens[tokens.length - 1];
        if (isUrl(first)) {
            return { type: 'external', target: first };
        }
        if (isUrl(last)) {
            return { type: 'external', target: last };
        }
    }

    return { type: 'internal', target: content };
}

// --- カーソル位置からリンクを検出 ---

function findLinkAtCursor(line: string, charPos: number): string | null {
    for (let start = charPos; start >= 0; start--) {
        if (line[start] === '[') {
            if (start > 0 && line[start - 1] === '!') {
                return null; // 画像記法は対象外
            }
            const end = line.indexOf(']', start + 1);
            if (end !== -1 && charPos <= end) {
                return line.substring(start + 1, end);
            }
            return null;
        }
        if (line[start] === ']') {
            if (start !== charPos) {
                return null;
            }
            // カーソルが ] 上 → その ] に対応する [ を探す
            for (let s = start - 1; s >= 0; s--) {
                if (line[s] === '[') {
                    if (s > 0 && line[s - 1] === '!') {
                        return null;
                    }
                    return line.substring(s + 1, start);
                }
            }
            return null;
        }
    }
    return null;
}

// --- インデント装飾 ---

const INDENT_COLORS = [
    'rgba(255, 135, 135, 0.12)', // レベル1: 赤系
    'rgba(255, 200, 80, 0.12)',  // レベル2: 黄系
    'rgba(80, 200, 120, 0.12)',  // レベル3: 緑系
    'rgba(80, 160, 220, 0.12)',  // レベル4: 青系
    'rgba(180, 120, 220, 0.12)', // レベル5+: 紫系
];

let indentDecorationTypes: vscode.TextEditorDecorationType[];

function updateDecorations() {
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
}

// --- activate ---

export function activate(context: vscode.ExtensionContext) {
    // インデント装飾
    indentDecorationTypes = INDENT_COLORS.map((color) =>
        vscode.window.createTextEditorDecorationType({
            backgroundColor: color,
        }),
    );

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

    // リンクを開くコマンド
    const openLinkCommand = vscode.commands.registerCommand('scbdown.openLink', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'scbdown') {
            return;
        }

        const position = editor.selection.active;
        const lineText = editor.document.lineAt(position.line).text;
        const linkContent = findLinkAtCursor(lineText, position.character);

        if (!linkContent) {
            return;
        }

        const linkInfo = parseLink(linkContent);

        switch (linkInfo.type) {
            case 'icon':
                return;

            case 'external':
                await vscode.env.openExternal(vscode.Uri.parse(linkInfo.target));
                return;

            case 'internal': {
                const currentDir = path.dirname(editor.document.uri.fsPath);
                const filename = sanitizeFilename(linkInfo.target) + '.smd';
                const filePath = path.join(currentDir, filename);

                if (fs.existsSync(filePath)) {
                    const doc = await vscode.workspace.openTextDocument(filePath);
                    await vscode.window.showTextDocument(doc);
                } else {
                    const uri = vscode.Uri.file(filePath).with({ scheme: 'untitled' });
                    const doc = await vscode.workspace.openTextDocument(uri);
                    await vscode.window.showTextDocument(doc);
                }
                return;
            }
        }
    });

    context.subscriptions.push(openLinkCommand);
}

export function deactivate() {}
