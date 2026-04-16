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
    } else if (isUrl(content)) {
        return { type: 'external', target: content };
    }

    return { type: 'internal', target: content };
}

// --- カーソル位置からリンクを検出 ---

function findLinkAtCursor(line: string, charPos: number): string | null {
    for (let start = charPos; start >= 0; start--) {
        if (line[start] === '[') {
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
                    return line.substring(s + 1, start);
                }
            }
            return null;
        }
    }
    return null;
}

// --- ナビゲーション ---

function moveCursorTo(editor: vscode.TextEditor, line: number) {
    const pos = new vscode.Position(line, 0);
    editor.selection = new vscode.Selection(pos, pos);
    editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenter);
}

function findHeadingLines(doc: vscode.TextDocument): number[] {
    const lines: number[] = [];
    for (let i = 0; i < doc.lineCount; i++) {
        if (/^#{1,6}\s/.test(doc.lineAt(i).text)) {
            lines.push(i);
        }
    }
    return lines;
}

function findBlockStartLines(doc: vscode.TextDocument): number[] {
    const lines: number[] = [];
    for (let i = 0; i < doc.lineCount; i++) {
        if (doc.lineAt(i).text.length === 0) {
            continue;
        }
        if (i === 0 || doc.lineAt(i - 1).text.length === 0) {
            lines.push(i);
        }
    }
    return lines;
}

function jumpPrevious(editor: vscode.TextEditor, targets: number[]) {
    if (targets.length === 0) {
        return;
    }
    const current = editor.selection.active.line;
    for (let i = targets.length - 1; i >= 0; i--) {
        if (targets[i] < current) {
            moveCursorTo(editor, targets[i]);
            return;
        }
    }
    // ループ: 先頭より前 → 末尾へ
    moveCursorTo(editor, targets[targets.length - 1]);
}

function jumpNext(editor: vscode.TextEditor, targets: number[]) {
    if (targets.length === 0) {
        return;
    }
    const current = editor.selection.active.line;
    for (let i = 0; i < targets.length; i++) {
        if (targets[i] > current) {
            moveCursorTo(editor, targets[i]);
            return;
        }
    }
    // ループ: 末尾より後 → 先頭へ
    moveCursorTo(editor, targets[0]);
}

// --- コードブロック判定 ---

function buildCodeBlockSet(doc: vscode.TextDocument): Set<number> {
    const set = new Set<number>();
    let inCodeBlock = false;
    for (let i = 0; i < doc.lineCount; i++) {
        const text = doc.lineAt(i).text;
        if (/^`{3,}/.test(text)) {
            set.add(i);
            inCodeBlock = !inCodeBlock;
        } else if (inCodeBlock) {
            set.add(i);
        }
    }
    return set;
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
let separatorDecorationType: vscode.TextEditorDecorationType;

function updateDecorations() {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== 'scbdown') {
        return;
    }

    const decorationsByLevel: vscode.DecorationOptions[][] = INDENT_COLORS.map(() => []);
    const lineCount = editor.document.lineCount;
    const codeBlockLines = buildCodeBlockSet(editor.document);

    const separatorRanges: vscode.DecorationOptions[] = [];

    for (let i = 0; i < lineCount; i++) {
        if (codeBlockLines.has(i)) {
            continue;
        }
        const line = editor.document.lineAt(i);
        const text = line.text;

        if (/^[-=]/.test(text)) {
            separatorRanges.push({ range: new vscode.Range(i, 0, i, text.length) });
            continue;
        }

        const match = text.match(/^( +)/);
        if (match) {
            const indentLevel = Math.min(match[1].length, INDENT_COLORS.length) - 1;
            const range = new vscode.Range(i, 0, i, match[1].length);
            decorationsByLevel[indentLevel].push({ range });
        }
    }

    indentDecorationTypes.forEach((type, level) => {
        editor.setDecorations(type, decorationsByLevel[level]);
    });
    editor.setDecorations(separatorDecorationType, separatorRanges);
}

// --- アウトライン ---

class ScbdownDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
    provideDocumentSymbols(doc: vscode.TextDocument): vscode.DocumentSymbol[] {
        const result: vscode.DocumentSymbol[] = [];
        const stack: { level: number; symbol: vscode.DocumentSymbol }[] = [];

        for (let i = 0; i < doc.lineCount; i++) {
            const text = doc.lineAt(i).text;
            const match = text.match(/^(#{1,6})\s+(.*)/);
            if (!match) {
                continue;
            }

            const level = match[1].length;
            const name = match[2] || `H${level}`;
            const range = new vscode.Range(i, 0, i, text.length);
            const symbol = new vscode.DocumentSymbol(
                name,
                '',
                vscode.SymbolKind.String,
                range,
                range,
            );

            // スタックから現在のレベル以上のものを取り除く
            while (stack.length > 0 && stack[stack.length - 1].level >= level) {
                stack.pop();
            }

            if (stack.length > 0) {
                stack[stack.length - 1].symbol.children.push(symbol);
            } else {
                result.push(symbol);
            }

            stack.push({ level, symbol });
        }

        return result;
    }
}

// --- activate ---

export function activate(context: vscode.ExtensionContext) {
    // インデント装飾
    indentDecorationTypes = INDENT_COLORS.map((color) =>
        vscode.window.createTextEditorDecorationType({
            backgroundColor: color,
        }),
    );

    // 区切り線装飾
    separatorDecorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(150, 150, 150, 0.15)',
        borderWidth: '0 0 1px 0',
        borderStyle: 'solid',
        borderColor: 'rgba(150, 150, 150, 0.4)',
        isWholeLine: true,
    });

    context.subscriptions.push(
        ...indentDecorationTypes,
        separatorDecorationType,
        vscode.window.onDidChangeActiveTextEditor(updateDecorations),
        vscode.workspace.onDidChangeTextDocument((e) => {
            if (e.document === vscode.window.activeTextEditor?.document) {
                updateDecorations();
            }
        }),
    );

    updateDecorations();

    // アウトライン
    context.subscriptions.push(
        vscode.languages.registerDocumentSymbolProvider(
            { language: 'scbdown' },
            new ScbdownDocumentSymbolProvider(),
        ),
    );

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

    // 見出しジャンプ
    context.subscriptions.push(
        vscode.commands.registerCommand('scbdown.previousHeading', () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor || editor.document.languageId !== 'scbdown') { return; }
            jumpPrevious(editor, findHeadingLines(editor.document));
        }),
        vscode.commands.registerCommand('scbdown.nextHeading', () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor || editor.document.languageId !== 'scbdown') { return; }
            jumpNext(editor, findHeadingLines(editor.document));
        }),
    );

    // 行塊ジャンプ
    context.subscriptions.push(
        vscode.commands.registerCommand('scbdown.previousBlock', () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor || editor.document.languageId !== 'scbdown') { return; }
            jumpPrevious(editor, findBlockStartLines(editor.document));
        }),
        vscode.commands.registerCommand('scbdown.nextBlock', () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor || editor.document.languageId !== 'scbdown') { return; }
            jumpNext(editor, findBlockStartLines(editor.document));
        }),
    );
}

export function deactivate() {}
