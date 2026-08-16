# CORS Unblocker

ブラウザ拡張機能（Manifest V3）。[ナラティブ・スプラウト](https://narrative-sprout.pages.dev)において、ブラウザから直接 LLM API を呼び出す際に、CORS でアクセスを拒否する API プロバイダのレスポンスへ CORS ヘッダを付与してアクセスを許可する拡張機能です。

## 特徴

- 対象ホストは 1 つずつ個別に設定（`chrome.permissions` でそのホストへのアクセス権限をユーザーに確認）
- `declarativeNetRequest` によりレスポンスヘッダへ CORS ヘッダを追加（サーバー側の変更は不要）
- 設定したホストは `chrome.storage.sync` でブラウザ間同期

## 仕組み

登録されたホストへのリクエストに対して、以下のレスポンスヘッダを追加します。

- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD`
- `Access-Control-Allow-Headers: *`
- `Access-Control-Max-Age: 86400`

## インストール（Microsoft Edge）

1. このリポジトリをクローンまたは ZIP でダウンロードして展開します。
2. Edge を開き、アドレスバーに `edge://extensions` と入力して拡張機能ページを開きます。
3. 左下の「開発者モード」をオンにします。
4. 「展開」→「展開して読み込む」をクリックし、展開したフォルダ（`manifest.json` を含むフォルダ）を選択します。

## 使い方

1. ツールバーの拡張機能アイコンをクリックし、「Manage hosts…」を開きます。
2. アンブロックしたい API ホストを入力して「Add」を押します。
   - 例: `integrate.api.nvidia.com`
3. 表示されるアクセス許可の確認で「許可」を選択します。
4. 以降、そのホストへのリクエストに CORS ヘッダが付与されます。解除する場合はリストの「Remove」を押します。

> **注意**: セキュリティ上の影響があるため、信頼できる API ホストのみを登録してください。

## ファイル構成

| ファイル | 説明 |
| --- | --- |
| `manifest.json` | 拡張機能のマニフェスト（MV3） |
| `background.js` | 動的ルールの適用とホスト管理のバックグラウンド処理 |
| `popup.html` / `popup.js` | ポップアップ（登録ホスト一覧表示） |
| `options.html` / `options.js` | 設定ページ（ホストの追加・削除） |
| `unblocker*.png` | アイコン |

## ライセンス

[MIT](LICENSE)