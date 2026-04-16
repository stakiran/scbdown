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

### 問題
`code --extensionDevelopmentPath=vscode-scbdown`（相対パス）で起動すると、開発版の拡張がロードされず、インストール済みの 0.1.0 が使われてしまう。

### 対処
`--extensionDevelopmentPath` には絶対パスを指定する。

```
code --extensionDevelopmentPath=D:\work\github\stakiran_sub\scbdown\vscode-scbdown vscode-scbdown/samples/sample.smd
```

後半のファイル引数はシェルが解決するので相対パスでOKだが、`--extensionDevelopmentPath` は VS Code プロセス内部で解決されるため相対パスが正しく動かない。
