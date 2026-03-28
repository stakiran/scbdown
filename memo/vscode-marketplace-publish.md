# VS Code Marketplace への公開手順

1. Azure DevOps で Personal Access Token (PAT) を取得する
   - https://dev.azure.com にサインイン
   - Personal Access Tokens → New Token
   - Scopes で「Marketplace > Manage」を有効にする

2. パブリッシャーを作成する
   - https://marketplace.visualstudio.com/manage でパブリッシャーを登録する

3. package.json に `publisher` を追加する
   ```json
   "publisher": "your-publisher-id"
   ```

4. 公開する
   ```bash
   npx @vscode/vsce login <publisher-id>
   npx @vscode/vsce publish
   ```

公開後は `ext install <publisher-id>.scbdown` で誰でもインストールできるようになる。

注意: Marketplace に公開すると誰でも見れる状態になる。個人用途なら vsix 方式で十分。
