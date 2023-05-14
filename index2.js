const { Client, Events, GatewayIntentBits } = require("discord.js");
require("dotenv/config");
const { OpenAIApi, Configuration } = require("openai");
const express = require('express');
const bodyParser = require('body-parser');


const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.send('My name is alaya');
});

app.listen(3000, () => console.log('server started'));
const config = new Configuration({
  apiKey: process.env.OPENAI_KEY,
});

const openai = new OpenAIApi(config);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, (clientUser) => {
  console.log(`Logged in as ${clientUser.user.tag}`);
});

client.login(process.env.BOT_TOKEN);

const BOT_CHANNEL = "1106626752647811074";
const PAST_MESSAGES = 5;

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== BOT_CHANNEL) return;

  message.channel.sendTyping();

  let messages = Array.from(
    await message.channel.messages.fetch({
      limit: PAST_MESSAGES,
      before: message.id,
    })
  );
  messages = messages.map((m) => m[1]);
  messages.unshift(message);

  let users = [
    ...new Set([
      ...messages.map((m) => m.member?.displayName),
      client.user.username,
    ]),
  ];

  let lastUser = users.pop();

  let prompt = `The following is a conversation between ${users.join(
    ", "
  )}, and ${lastUser}. \n\n`;

  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    const displayName = m.member?.displayName || "unknown user";
    prompt += `${displayName}: ${m.content}\n`;
  }
  prompt += `${client.user.username}:`;
  console.log("prompt:", prompt);

  const response = await openai.createCompletion({
    prompt,
    model: "text-davinci-003",
    max_tokens: 500,
    stop: ["\n"],
  });

  console.log("response", response.data.choices[0].text);
  await message.reply(response.data.choices[0].text);
});
