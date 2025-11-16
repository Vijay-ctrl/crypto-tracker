const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 4000;
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

let coinList = [];
async function updateCoinList() {
   try {
      const res = await axios.get("https://api.coingecko.com/api/v3/coins/list");
      coinList = res.data;
      console.log(`Coin list updated. Total coins: ${coinList.length}`);
   } catch (err) {
      console.error("Failed to update coin list:", err.message);
   }
}
updateCoinList();
setInterval(updateCoinList, 60 * 60 * 1000);

app.get("/", (req, res) => {
   res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/api/price/:coin", async (req, res) => {
   const query = req.params.coin.toLowerCase().trim();

   const match = coinList.find(
      c =>
         c.id.toLowerCase() === query ||
         c.symbol.toLowerCase() === query ||
         c.name.toLowerCase() === query
   );

   if (!match) {
      return res.status(404).json({ error: "Coin not found" });
   }

   try {
      const response = await axios.get(
         `https://api.coingecko.com/api/v3/simple/price?ids=${match.id}&vs_currencies=usd`
      );

      res.json({
         user_input: req.params.coin,
         matched_id: match.id,
         symbol: match.symbol.toUpperCase(),
         name: match.name,
         price_usd: response.data[match.id]?.usd || null
      });
   } catch (err) {
      res.status(500).json({ error: "Unable to fetch price", details: err.message });
   }
});

app.listen(PORT, () => {
   console.log(`Server running on port ${PORT}`);
});
