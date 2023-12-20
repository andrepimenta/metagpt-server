const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");
const express = require("express");
var cors = require("cors");
require("dotenv").config();

const client = new OpenAIClient(
  process.env.AZURE_GPT_URL,
  new AzureKeyCredential(process.env.AZURE_GPT_KEY)
);

const app = express();
const port = 3000;
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function chatgpt(messages) {
  const deploymentId = "gpt-4";

  const events = client.listChatCompletions(deploymentId, messages);

  let text = "";

  for await (const event of events) {
    for (const choice of event.choices) {
      const delta = choice.delta?.content;
      if (delta !== undefined) {
        text += delta;
      }
    }
  }

  return text;
}

app.get("/", async (req, res) => {
  res.send("The API is live!");
});

app.post("/", async (req, res) => {
  const { prompt, conversation } = req.body;

  const messages = [
    {
      role: "system",
      content: prompt.content,
    },
  ];

  conversation.speeches.forEach((speech) => {
    messages.push({
      role: speech.speaker.race === "HUMAN" ? "user" : "assistant",
      content: speech.content,
    });
  });

  const response = await chatgpt(messages);

  res.send(response);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
