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
- VSCode でプロジェクトルート（`scbdown/`）を開き、F5 を押す
- ビルドが走り、Extension Development Host が起動して `sample.smd` が開かれる
- 設定は `.vscode/launch.json` と `.vscode/tasks.json` を参照

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
