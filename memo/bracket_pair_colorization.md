# ブラケットペアカラー化の誤認問題

## 現象
コードブロック内の `[これはリンクにならない]` がリンクとしてハイライトされているように見えた。

## 原因
VS Code の**ブラケットペアカラー化**（`editor.bracketPairColorization.enabled`）により `[` `]` が自動的に色付けされていた。スコープインスペクタで確認したところ、実際のスコープは `meta.embedded.block.scbdown` であり、リンクの文法は適用されていなかった。

## 対処
拡張機能の `configurationDefaults` でデフォルト無効に設定済みだが、VS Code ではユーザー設定が拡張機能のデフォルト設定より優先される。そのためユーザー設定で `editor.bracketPairColorization.enabled: true` になっている場合は上書きされてしまう。

この場合、ユーザーが自分の settings.json に以下を手動で追加する必要がある:

```json
"[scbdown]": {
  "editor.bracketPairColorization.enabled": false
}
```

拡張機能側でプログラム的にユーザー設定を変更する方法もあるが、ユーザー設定を勝手に書き換えるのは行儀が悪いため採用しない。
