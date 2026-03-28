# vscode-scbdown

scbdown (.smd) ファイル用の VS Code 拡張機能。

## 開発者向け手順

### インストール

```bash
cd vscode-scbdown
npm install
npm run build
```

### 動作確認

```bash
code --extensionDevelopmentPath=(path)/scbdown/vscode-scbdown (path)/scbdown/vscode-scbdown/samples/sample.smd
```

拡張機能が読み込まれた状態で VS Code が起動し、`sample.smd` が開く。

### インストール（通常利用）

```bash
cd vscode-scbdown
npm run build
npx @vscode/vsce package
code --install-extension scbdown-0.1.0.vsix
```

`@vscode/vsce` が未インストールの場合は先に `npm install -g @vscode/vsce` しておく。

VS Code 上から入れる場合は `Ctrl+Shift+P` → 「Extensions: Install from VSIX...」で `.vsix` ファイルを選択する。

### 変更時の再確認

1. コードを修正する
2. `npm run build` を実行する
3. デバッグ用 VS Code ウィンドウを閉じる
4. 上記の動作確認コマンドを再実行する
