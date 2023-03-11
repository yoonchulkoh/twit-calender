import { Client } from "twitter-api-sdk";
import { Configuration, OpenAIApi } from "openai";
import fetchAdapter from "@vespaiach/axios-fetch-adapter";
import * as querystring from "querystring";

export interface Env {
  TWITTER_BEARER_TOKEN: string;
  OPENAI_ORGANIZATION: string;
  OPENAI_API_KEY: string;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    try {
      const { searchParams } = new URL(request.url);
      const tweetUrl = searchParams.get("tweetUrl");

      if (tweetUrl === null) {
        return new Response("error: tweetUrl required.");
      }
      const url = require("url");
      const path = require("path");
      const tweetId = path.basename(url.parse(tweetUrl).pathname);
      const text = await getTweetTextById(env, tweetId);
      console.log("text: " + text);

      const eventInfoJSON = await parseEventInfoFromText(env, tweetUrl, text);
      console.log("eventInfoJSON: " + eventInfoJSON);

      const calendarUrl = await makeAddCalendarUrl(eventInfoJSON);
      console.log("calendarUrl: " + calendarUrl);

      return new Response(calendarUrl);
    } catch (error) {
      console.log(error);
      return new Response("error");
    }
  },
};

// Tweetからテキストを取得する
const getTweetTextById = async (env: Env, id: string) => {
  const client = new Client(env.TWITTER_BEARER_TOKEN);
  const tweet = await client.tweets.findTweetById(id);
  return tweet.data?.text ?? "";
};

const CHATGPT_SPELL = `
対象のテキストを下記パラメータに構造化したJSONにしてください。

# パラメーター構造化ルール

## パラメーター
| パラメーター | 必須 | 説明 |
| --- | --- | --- |
| action | 必須 | 『TEMPLATE』を設定します。 |
| text | 必須 | 予定のタイトル(件名)を指定します。予定のタイトルなので15文字程度で。省略した場合は元のタイトルをdetailsに入れてください。 |
| details | 任意 | 予定の詳細を指定します。textやlocationで省略したようなものは、ここに元情報として入れてください。最後に改行して、オリジナルツイートURLも含めてください。 |
| location | 任意 | 場所の設定です。Googleカレンダーの位置情報に利用するので、Google Mapで出てくる明確な内容が良いです。ふわっとした指定はここには入れない方がベターです。詳細な場所まで記述がある場合はdetailsに元データとして書いてください |
| dates | 任意 | 予定の開始日時と終了日時を指定します。 |
| trp | 任意 | 外部公開設定(true または false)をしていしますが、うまく動作しないので false で無難に設定するのが良いかと思います。 |
| sprop | 任意 | 予定にURLを設定できます。複数指定する場合、sprop=〇〇&sprop=△△ のように指定する。URLにスペースは入りません。 |

## 日付フォーマット
例	2021年4月1日 9時30分0秒 〜 2021年4月1日 10時0分0秒
記述方法	20210401T093000Z/20210401T100000Z

# 対象のテキスト

`;

// chatGPT APIを使って、テキストからイベント情報を構造化してJSONで取得する
const parseEventInfoFromText = async (
  env: Env,
  tweetUrl: string,
  text: string
) => {
  const configuration = new Configuration({
    organization: env.OPENAI_ORGANIZATION,
    apiKey: env.OPENAI_API_KEY,
    baseOptions: {
      adapter: fetchAdapter,
    },
  });
  const openai = new OpenAIApi(configuration);
  const inputContent =
    CHATGPT_SPELL + text + "\n\n# オリジナルツイートURL\n" + tweetUrl;
  console.log("content: " + inputContent);
  const result = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    temperature: 0.7,
    messages: [
      {
        role: "user",
        content: inputContent,
      },
    ],
  });
  const content = result.data.choices[0].message?.content;
  return content ?? "";
};

// Googleカレンダーに追加するURLを作成する
const makeAddCalendarUrl = (json: string) => {
  const params = JSON.parse(json);
  const url = "http://www.google.com/calendar/event";
  const urlParams = querystring.stringify(params);
  const calendarUrl = `${url}?${urlParams}`;
  return calendarUrl;
};
