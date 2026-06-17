import { startBot } from "./bot.js";
import http from "http";

// Server HTTP necessario per UptimeRobot
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Bot is online!");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server HTTP attivo sulla porta ${PORT}`);
});

// Avvio del bot
startBot();
console.log("Bot started.");
