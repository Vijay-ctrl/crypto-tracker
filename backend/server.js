require("dotenv").config();

const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const marketRoutes = require("./routes/marketRoutes");
const portfolioRoutes = require("./routes/portfolioRoutes");
const alertRoutes = require("./routes/alertRoutes");
const watchlistRoutes = require("./routes/watchlistRoutes");

const app = express();
const PORT = process.env.PORT || 4000;

// =========================================================
// Database Connection
// =========================================================

connectDB();

// =========================================================
// Middleware
// =========================================================

app.use(
   cors({
      origin: process.env.FRONTEND_URL,
      credentials: true,
   })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
   express.static(path.join(__dirname, "public"))
);

// =========================================================
// API Routes
// =========================================================

// Authentication
app.use("/api/auth", authRoutes);

// Cryptocurrency market data
app.use("/api/market", marketRoutes);

// Portfolio
app.use("/api/portfolio", portfolioRoutes);

// Price alerts
app.use("/api/alerts", alertRoutes);

// Watchlist
app.use("/api/watchlist", watchlistRoutes);

// =========================================================
// CoinGecko Coin List
// Used for /api/price/:coin
// =========================================================

let coinList = [];

// =========================================================
// Update Coin List
// =========================================================

async function updateCoinList() {
   try {
      if (!process.env.COINGECKO_API_KEY) {
         console.error(
            "COINGECKO_API_KEY is not configured in environment variables"
         );

         return;
      }

      const response = await axios.get(
         "https://api.coingecko.com/api/v3/coins/list",
         {
            headers: {
               Accept: "application/json",
               "x-cg-demo-api-key":
                  process.env.COINGECKO_API_KEY,
            },
            timeout: 10000,
         }
      );

      coinList = Array.isArray(response.data)
         ? response.data
         : [];

      console.log(
         `Coin list updated. Total coins: ${coinList.length}`
      );
   } catch (error) {
      console.error(
         "Failed to update coin list:",
         error.response?.data ||
         error.message
      );
   }
}

// =========================================================
// Load Coin List When Server Starts
// =========================================================

updateCoinList();

// =========================================================
// Refresh Coin List Every Hour
// =========================================================

setInterval(
   updateCoinList,
   60 * 60 * 1000
);

// =========================================================
// Home Route
// =========================================================

app.get("/", (req, res) => {
   const indexPath = path.join(
      __dirname,
      "public",
      "index.html"
   );

   res.sendFile(indexPath, (error) => {
      if (error) {
         console.error(
            "Unable to load index.html:",
            error.message
         );

         res.status(500).json({
            error: "Unable to load application",
         });
      }
   });
});

// =========================================================
// Coin Price API
//
// GET /api/price/:coin
//
// Examples:
// /api/price/bitcoin
// /api/price/btc
// /api/price/Bitcoin
// =========================================================

app.get(
   "/api/price/:coin",
   async (req, res) => {
      try {
         const rawQuery = req.params.coin;

         if (!rawQuery) {
            return res.status(400).json({
               error: "Coin is required",
            });
         }

         const query = String(rawQuery)
            .toLowerCase()
            .trim();

         // ------------------------------------------------
         // Find Coin
         // ------------------------------------------------

         const match = coinList.find(
            (coin) => {
               const coinId = String(
                  coin.id || ""
               )
                  .toLowerCase()
                  .trim();

               const symbol = String(
                  coin.symbol || ""
               )
                  .toLowerCase()
                  .trim();

               const name = String(
                  coin.name || ""
               )
                  .toLowerCase()
                  .trim();

               return (
                  coinId === query ||
                  symbol === query ||
                  name === query
               );
            }
         );

         // ------------------------------------------------
         // Coin Not Found
         // ------------------------------------------------

         if (!match) {
            return res.status(404).json({
               error: "Coin not found",
               user_input: rawQuery,
            });
         }

         // ------------------------------------------------
         // Check API Key
         // ------------------------------------------------

         if (!process.env.COINGECKO_API_KEY) {
            console.error(
               "COINGECKO_API_KEY is not configured in environment variables"
            );

            return res.status(500).json({
               error:
                  "CoinGecko API configuration is missing",
            });
         }

         // ------------------------------------------------
         // Fetch Current Price
         // ------------------------------------------------

         const response = await axios.get(
            "https://api.coingecko.com/api/v3/simple/price",
            {
               params: {
                  ids: match.id,
                  vs_currencies: "usd",
               },

               headers: {
                  Accept: "application/json",

                  "x-cg-demo-api-key":
                     process.env.COINGECKO_API_KEY,
               },

               timeout: 10000,
            }
         );

         const price =
            response.data?.[match.id]?.usd ?? null;

         // ------------------------------------------------
         // Return Price
         // ------------------------------------------------

         return res.status(200).json({
            user_input: rawQuery,

            matched_id: match.id,

            symbol: match.symbol
               ? match.symbol.toUpperCase()
               : "",

            name: match.name,

            price_usd: price,
         });
      } catch (error) {
         console.error(
            "CoinGecko price API error:",
            error.response?.data ||
            error.message
         );

         // -----------------------------------------------
         // CoinGecko Rate Limit
         // -----------------------------------------------

         if (error.response?.status === 429) {
            return res.status(429).json({
               error:
                  "CoinGecko API rate limit exceeded. Please try again later.",
            });
         }

         // -----------------------------------------------
         // CoinGecko Authentication Error
         // -----------------------------------------------

         if (
            error.response?.status === 401 ||
            error.response?.status === 403
         ) {
            return res.status(502).json({
               error:
                  "CoinGecko API authentication failed.",
            });
         }

         return res.status(500).json({
            error: "Unable to fetch price",
         });
      }
   }
);

// =========================================================
// Health Check
//
// GET /api/health
// =========================================================

app.get(
   "/api/health",
   (req, res) => {
      return res.status(200).json({
         status: "OK",

         message:
            "Crypto Tracker API is running",

         timestamp:
            new Date().toISOString(),
      });
   }
);

// =========================================================
// 404 API Handler
// =========================================================

app.use(
   "/api",
   (req, res) => {
      return res.status(404).json({
         error:
            "API endpoint not found",

         path:
            req.originalUrl,
      });
   }
);

// =========================================================
// Global Error Handler
// =========================================================

app.use(
   (error, req, res, next) => {
      console.error(
         "Server error:",
         error
      );

      if (res.headersSent) {
         return next(error);
      }

      return res.status(
         error.status || 500
      ).json({
         error:
            error.message ||
            "Internal server error",
      });
   }
);

// =========================================================
// Start Server
// =========================================================

app.listen(PORT, () => {
   console.log(
      `Server running on port ${PORT}`
   );

   console.log(
      `API URL: http://localhost:${PORT}/api`
   );
});