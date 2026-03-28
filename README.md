# scbdown
Cosense記法 + Markdown記法の良いとこどりをした新記法。

<img width="707" height="507" alt="Image" src="https://github.com/user-attachments/assets/42be6f8d-b127-4f68-b56b-334255014227" />

## 利用者向け
今のところ個人用だが、試せる程度には出来てるはず 2026/03/28 14:03:36

- インストール
    - vscode-scbdown/README.md のインストール（通常利用）に従う、ただしvsixファイルは[Releaseページからもダウンロードできる](https://github.com/stakiran/scbdown/releases)
- 使い方
    - VSCode で .smd ファイルを開く → ハイライトされるはず
    - 文法:
        - 基本的に markdown だけど、リスト記法とリンクは Cosense
    - 操作:
        - ctrl + up/down: 前後の行塊（空行で区切られた行の塊）に移動
        - alt + up/down: 前後の見出しに移動
        - `[この中でshift+enter]`: リンク先を開く。ない場合はファイル新規
