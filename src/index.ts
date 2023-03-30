import { Env, Hono, HonoRequest } from "hono";
import { Client } from "twitter-api-sdk";
import { Configuration, OpenAIApi } from "openai";
import fetchAdapter from "@vespaiach/axios-fetch-adapter";
import * as querystring from "querystring";
import url from "url";
import path from "path";

const app = new Hono();

app.get("/", async (c) => {
  try {
    const { searchParams } = new URL(c.req.url);
    const tweetUrl = searchParams.get("tweetUrl");

    if (tweetUrl === null) {
      return new Response("error: tweetUrl required.");
    }
    const tweetId = path.basename(url.parse(tweetUrl).pathname ?? "");

    const text = await getTweetTextById(
      c.env!.TWITTER_BEARER_TOKEN as string,
      tweetId
    );
    console.log("text: " + text);

    const openaiOrganization = c.env!.OPENAI_ORGANIZATION as string;
    const openaiApiKey = c.env!.OPENAI_API_KEY as string;
    const eventInfoJSON = await parseEventInfoFromText(
      openaiOrganization,
      openaiApiKey,
      tweetUrl,
      text
    );
    console.log("eventInfoJSON: " + eventInfoJSON);

    const calendarUrl = await makeAddCalendarUrl(eventInfoJSON);
    console.log("calendarUrl: " + calendarUrl);

    return new Response(calendarUrl);
  } catch (error) {
    console.log(error);
    return new Response("error");
  }

  return c.json({
    message: `Hello!`,
  });
});

export default app;

// Tweetからテキストを取得する
const getTweetTextById = async (twitterBearerToken: string, id: string) => {
  const client = new Client(twitterBearerToken);
  const tweet = await client.tweets.findTweetById(id);
  return tweet.data?.text ?? "";
};

// chatGPT APIを使って、テキストからイベント情報を構造化してJSONで取得する
const parseEventInfoFromText = async (
  openaiOrganization: string,
  openaiApiKey: string,
  tweetUrl: string,
  text: string
) => {
  const configuration = new Configuration({
    organization: openaiOrganization,
    apiKey: openaiApiKey,
    baseOptions: {
      adapter: fetchAdapter,
    },
  });
  const openai = new OpenAIApi(configuration);
  const now = new Date();
  const chatgpt_spell = `
	Twitterを元に、イベントをGoogleカレンダーに登録するアプリを作っています。
	下記tweetを、下記フォーマットに構造化して、JSONを返してください。
	回答はJSONデータのみ返してください。
	
	## 今日の日付
	${now}
	## tweet
	${text}
	## tweet URL
	${tweetUrl}
	
	## フォーマット
	action: "TEMPLATE"（固定）
	text: 予定のタイトル(件名)（15文字程度）
	details: tweet本文を入れてください。最終行に1行空けて、tweet URLを追加してください。
	location: 場所（15文字程度）。
	dates: 開始日時と終了日時。年が無い場合は今日の日付を元に、一番近い未来の日時にしてください。日時形式=20210401T093000Z/20210401T100000Z
	sprop: URL。複数指定する場合は「sprop=〇〇&sprop=△△」
	`;

  const inputContent = chatgpt_spell;
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
