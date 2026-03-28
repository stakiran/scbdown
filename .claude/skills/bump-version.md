---
name: bump-version
description: バージョン番号を更新し、package.json と CHANGELOG.md を更新する
user_invocable: true
---

# bump-version

以下の手順を順番に実行せよ。

## Step 1: 現在のバージョンを表示

`vscode-scbdown/package.json` の `version` フィールドを読み取り、現在のバージョンを表示する。

## Step 2: 更新するか確認

ユーザーに「バージョンを更新しますか？」と質問する。ユーザーが更新しないと答えた場合は終了する。

## Step 3: 新しいバージョンを入力してもらう

ユーザーに新しいバージョン番号を入力してもらう。

## Step 4: package.json を更新

`vscode-scbdown/package.json` の `"version"` フィールドを新しいバージョンに更新する。

## Step 5: CHANGELOG.md を更新

`CHANGELOG.md` の**先頭に** 以下の形式で追記する（prepend）。既存の内容の前に挿入すること。

```
# {今日の日付 YYYY-MM-DD} v{新バージョン}
-
```

末尾の `- ` の後は空にしておく（ユーザーが後で記入する）。

## Step 6: 完了報告

更新した内容をまとめて表示する。
