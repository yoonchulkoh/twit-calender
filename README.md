# twit-calender

iPhoneのTwitterアプリで見つけたイベントを、Googleカレンダーに予定登録するツール。
ChatGPT APIを使ってメッセージ内容から予定登録に必要な情報をparseしています。

https://user-images.githubusercontent.com/420161/224550353-9ae9d7d8-8582-4026-aeeb-8ca036fe933f.MOV

# 使い方

## Requirements
* Twitter API
* ChatGPT API
* Cloudflare Workers
* Googleカレンダー
* iPhoneのショートカットアプリ

## Cloudflareにデプロイ

CLIツールのwranglerをインストール
```
yarn add wrangler
```

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

<img width="300px" src="https://user-images.githubusercontent.com/420161/224551257-883e7b65-e3fa-40a5-ab24-e9b5805670e7.PNG">

`共有シートに表示` をONにする。これで共有のメニューに登録したショートカットが表示されるようになります。

## 使ってみる
1. イベント情報が載っているツイートをTwitterアプリで開く
1. 共有から追加したショートカットを呼び出す
1. Googleカレンダーに遷移すると情報が入力状態になっているので、あとはよしなに！

# 課題
* ChatGPT APIが、parse処理として使うには遅い。12秒くらいかかります。
* Googleカレンダーアプリが、locationを受け付けない。Webでは問題ないのでおそらくバグかなと思っています。
