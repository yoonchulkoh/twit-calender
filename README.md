# twit-calender

iPhoneのTwitterアプリで見つけたイベントを、Googleカレンダーに予定登録するツール。
ChatGPT APIを使ってメッセージ内容から予定登録に必要な情報をparseしています。

# 使い方

## Requirements
* Twitter API
* ChatGPT API
* Cloudflare Workers
* Googleカレンダー
* iPhoneのショートカットアプリ

## Cloudflare Workersセットアップ

CLIツールのwranglerをインストール
```
yarn add wrangler
```

TODO: セットアップ

## Cloudflareにデプロイ

環境変数を設定。コマンドを打つと、値を入力するプロンプトが出るので、1行ずつ入力してください。
```
wrangler secret put TWITTER_BEARER_TOKEN
wrangler secret put OPENAI_API_KEY
wrangler secret put OPENAI_ORGANIZATION
```

デプロイ
```
wrangler publish
```

ローカルで立ち上げる場合はこちら
```
wrangler dev
```

## iPhoneショートカットの設定
この通りに設定して、テキストのURL部分だけデプロイしたものに差し替えてください。

TODO: 画像貼る

`共有シートに表示` をONにする。これで共有のメニューに登録したショートカットが表示されるようになります。

## 使ってみる
1. イベント情報が載っているツイートをTwitterアプリで開く
1. 共有から追加したショートカットを呼び出す
1. Googleカレンダーに遷移すると情報が入力状態になっているので、あとはよしなに！

# 課題
* ChatGPT APIが、parse処理として使うには遅い。12秒くらいかかります。
* Googleカレンダーアプリが、locationを受け付けない。Webでは問題ないのでおそらくバグかなと思っています。
