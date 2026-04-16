# 画像記法での Shift+Enter と デバッグ起動の注意点

## 画像記法での Shift+Enter（URLオープン）

### 問題
画像記法 `![url]` 上で Shift+Enter を押しても URL がブラウザで開かれなかった。

### 原因（2つ）

1. `findLinkAtCursor()` で画像記法（`!` + `[`）を明示的に除外していた
2. `parseLink()` で URL 単体（スペースなし）の場合に `external` と判定されず `internal` 扱いになっていた

### 修正内容

1. `findLinkAtCursor()`: `!` チェックによる `return null` を2箇所削除
2. `parseLink()`: `tokens.length >= 2` の分岐に加え、単一トークンでも `isUrl()` チェックする `else if` を追加

## デバッグ起動の注意点

### 問題（旧）
`code --extensionDevelopmentPath=vscode-scbdown`（相対パス）で起動すると、開発版の拡張がロードされず、インストール済みの 0.1.0 が使われてしまう。

### 旧対処（手動コマンド）
`--extensionDevelopmentPath` には絶対パスを指定する。

```
code --extensionDevelopmentPath=D:\work\github\stakiran_sub\scbdown\vscode-scbdown vscode-scbdown/samples/sample.smd
```

後半のファイル引数はシェルが解決するので相対パスでOKだが、`--extensionDevelopmentPath` は VS Code プロセス内部で解決されるため相対パスが正しく動かない。

以下は README に書いてた内容:

```bash
code --extensionDevelopmentPath=(full-path)/scbdown/vscode-scbdown (path)/scbdown/vscode-scbdown/samples/sample.smd
```

拡張機能が読み込まれた状態で VS Code が起動し、`sample.smd` が開く。

- Tips-1: extensionDevelopmentPath は絶対パス必須、後半は相対パスでも良さそう
    - 例: `code -extensionDevelopmentPath=D:\work\github\stakiran_sub\scbdown\vscode-scbdown vscode-scbdown/samples/sample.smd`
    - memo/image_link_open_and_debug_launch.md も参照

### 現対処（F5デバッグ実行） 2026/04/16
プロジェクトルートに `.vscode/launch.json` と `.vscode/tasks.json` を追加し、F5 で起動できるようにした。

- `.vscode/launch.json`: `extensionHost` タイプで `--extensionDevelopmentPath` と開くファイルを指定
- `.vscode/tasks.json`: `vscode-scbdown/` 内で `npm run build` を実行する `preLaunchTask`
- プロジェクトルート（`scbdown/`）を VSCode で開いた状態で F5 を押すだけでよい
- `${workspaceFolder}` を使うことで絶対パス問題も解消
