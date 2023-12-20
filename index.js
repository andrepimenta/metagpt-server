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
  const messages = [
    {
      role: "system",
      content: `Here are the rules:
        - Use the window.ethereum provider by metamask only\\n
        - If it needs my address, use ethereum.selectedAddress and never set gas unless explicitly asked for\\n
        - If you need to put variables that you don't know, ask me back what you should put, in this case, don't show anything else other than the question. \n
        - If you know all variables, the response should only contain the line of code which is the object inside "request", in this case, don't show anything else other than the line of code. \n
        - If you need contract addresses, you find them the actual value. If you need other info like deadlines or minimum amounts, assume there are none. \n
        - Always put everything in the window.ethereum code. No comments on the text or code. Don't show anything else on the response, no extra notes or text.
        `,
    },
    {
      role: "user",
      content: `I want to swap 1 ETH for USDT on mainnet.`,
    },
  ];

  const response = await chatgpt(messages);
  res.send(response);
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
