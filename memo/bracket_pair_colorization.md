# ブラケットペアカラー化の誤認問題

## 現象
コードブロック内の `[これはリンクにならない]` がリンクとしてハイライトされているように見えた。

## 原因
VS Code の**ブラケットペアカラー化**（`editor.bracketPairColorization.enabled`）により `[` `]` が自動的に色付けされていた。スコープインスペクタで確認したところ、実際のスコープは `meta.embedded.block.scbdown` であり、リンクの文法は適用されていなかった。

## 対処
scbdown ファイルのみで無効化する場合、VS Code の settings.json に以下を追加:

```json
"[scbdown]": {
  "editor.bracketPairColorization.enabled": false
}
```
