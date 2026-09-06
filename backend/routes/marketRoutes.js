const express = require("express");
const axios = require("axios");

const router = express.Router();

const COINGECKO_BASE_URL =
   "https://api.coingecko.com/api/v3";

const COINGECKO_HEADERS = {
   Accept: "application/json",
   "x-cg-demo-api-key":
      process.env.COINGECKO_API_KEY,
};


/* =========================================================
   LEGACY PORTFOLIO COINS

   These are kept so existing portfolio records continue
   working even if they don't have a coinId.
========================================================= */

const PORTFOLIO_COINS = {
   BTC: "bitcoin",
   ETH: "ethereum",
   BNB: "binancecoin",
   SOL: "solana",
   XRP: "ripple",
   ADA: "cardano",
   DOGE: "dogecoin",
};


/* =========================================================
   MARKET SETTINGS
========================================================= */

const MARKET_COINS_PER_PAGE = 10;


/* =========================================================
   HELPER
========================================================= */

const getCoinGeckoError = (error) => {
   return (
      error.response?.data?.error ||
      error.response?.data?.status?.error_message ||
      error.message ||
      "Unknown CoinGecko error"
   );
};


/* =========================================================
   MARKET OVERVIEW

   GET /api/market/overview
========================================================= */

router.get(
   "/overview",
   async (req, res) => {
      try {
         const response = await axios.get(
            `${COINGECKO_BASE_URL}/global`,
            {
               headers: COINGECKO_HEADERS,
               timeout: 10000,
            }
         );

         const data =
            response.data?.data || {};

         return res.status(200).json({
            marketCap:
               data.total_market_cap?.usd || 0,

            marketCapChange24h:
               data.market_cap_change_percentage_24h_usd ||
               0,

            volume24h:
               data.total_volume?.usd || 0,

            btcDominance:
               data.market_cap_percentage?.btc || 0,

            activeCryptocurrencies:
               data.active_cryptocurrencies || 0,

            markets:
               data.markets || 0,
         });
      } catch (error) {
         console.error(
            "CoinGecko market overview error:",
            getCoinGeckoError(error)
         );

         return res.status(
            error.response?.status >= 400 &&
               error.response?.status < 600
               ? error.response.status
               : 500
         ).json({
            message:
               "Failed to fetch market overview",

            error:
               getCoinGeckoError(error),
         });
      }
   }
);


/* =========================================================
   MARKET COINS

   GET /api/market/coins?page=1
========================================================= */

router.get(
   "/coins",
   async (req, res) => {
      try {
         let page =
            Number.parseInt(
               req.query.page,
               10
            ) || 1;

         if (
            !Number.isFinite(page) ||
            page < 1
         ) {
            page = 1;
         }

         const limit =
            MARKET_COINS_PER_PAGE;

         const response = await axios.get(
            `${COINGECKO_BASE_URL}/coins/markets`,
            {
               headers: COINGECKO_HEADERS,

               params: {
                  vs_currency: "usd",

                  order:
                     "market_cap_desc",

                  per_page:
                     limit,

                  page,

                  sparkline:
                     true,

                  price_change_percentage:
                     "1h,24h,7d",
               },

               timeout: 15000,
            }
         );

         let coins =
            Array.isArray(
               response.data
            )
               ? response.data
               : [];

         coins = coins.sort(
            (a, b) => {
               const rankA =
                  Number(
                     a.market_cap_rank
                  );

               const rankB =
                  Number(
                     b.market_cap_rank
                  );

               if (
                  Number.isFinite(rankA) &&
                  Number.isFinite(rankB)
               ) {
                  return rankA - rankB;
               }

               if (
                  Number.isFinite(rankA)
               ) {
                  return -1;
               }

               if (
                  Number.isFinite(rankB)
               ) {
                  return 1;
               }

               return 0;
            }
         );

         const hasPrevious =
            page > 1;

         const hasNext =
            coins.length === limit;

         return res.status(200).json({
            coins,
            page,
            limit,
            hasPrevious,
            hasNext,
            hasMore: hasNext,
         });
      } catch (error) {
         console.error(
            "CoinGecko coins error:",
            getCoinGeckoError(error)
         );

         return res.status(
            error.response?.status >= 400 &&
               error.response?.status < 600
               ? error.response.status
               : 500
         ).json({
            message:
               "Failed to fetch market coins",

            error:
               getCoinGeckoError(error),
         });
      }
   }
);


/* =========================================================
   SEARCH COINS

   GET /api/market/search?query=bitcoin
========================================================= */

router.get(
   "/search",
   async (req, res) => {
      try {
         const query =
            String(
               req.query.query || ""
            ).trim();

         if (!query) {
            return res.status(200).json({
               coins: [],
            });
         }

         if (query.length < 2) {
            return res.status(200).json({
               coins: [],
            });
         }

         const response = await axios.get(
            `${COINGECKO_BASE_URL}/search`,
            {
               headers: COINGECKO_HEADERS,

               params: {
                  query,
               },

               timeout: 10000,
            }
         );

         const coins =
            Array.isArray(
               response.data?.coins
            )
               ? response.data.coins
               : [];

         const results =
            coins
               .slice(0, 20)
               .map((coin) => ({
                  id:
                     coin.id || "",

                  name:
                     coin.name ||
                     "Unknown",

                  symbol:
                     coin.symbol ||
                     "",

                  image:
                     coin.large ||
                     coin.thumb ||
                     "",

                  marketCapRank:
                     coin.market_cap_rank ??
                     null,
               }))
               .filter(
                  (coin) =>
                     coin.id &&
                     coin.name
               );

         return res.status(200).json({
            coins: results,
         });
      } catch (error) {
         console.error(
            "CoinGecko coin search error:",
            getCoinGeckoError(error)
         );

         return res.status(
            error.response?.status >= 400 &&
               error.response?.status < 600
               ? error.response.status
               : 500
         ).json({
            message:
               "Failed to search cryptocurrencies",

            error:
               getCoinGeckoError(error),
         });
      }
   }
);


/* =========================================================
   TRENDING COINS

   GET /api/market/trending

   Returns:

   {
      coins: [
         {
            id,
            name,
            symbol,
            image,
            marketCapRank,
            priceBtc
         }
      ]
   }
========================================================= */

router.get(
   "/trending",
   async (req, res) => {
      try {
         const response =
            await axios.get(
               `${COINGECKO_BASE_URL}/search/trending`,
               {
                  headers:
                     COINGECKO_HEADERS,

                  timeout: 10000,
               }
            );

         const sourceCoins =
            Array.isArray(
               response.data?.coins
            )
               ? response.data.coins
               : [];

         const coins =
            sourceCoins
               .map((item) => {
                  const coin =
                     item?.item || {};

                  return {
                     id:
                        coin.id || null,

                     name:
                        coin.name ||
                        "Unknown",

                     symbol:
                        coin.symbol || "",

                     image:
                        coin.large ||
                        coin.thumb ||
                        "",

                     marketCapRank:
                        coin.market_cap_rank ??
                        null,

                     priceBtc:
                        coin.price_btc ??
                        null,
                  };
               })
               .filter(
                  (coin) =>
                     coin.id &&
                     coin.name
               )
               .slice(0, 5);

         console.log(
            "Trending coins:",
            coins
         );

         return res.status(200).json({
            coins,
         });
      } catch (error) {
         console.error(
            "CoinGecko trending error:",
            getCoinGeckoError(error)
         );

         return res.status(
            error.response?.status >= 400 &&
               error.response?.status < 600
               ? error.response.status
               : 500
         ).json({
            message:
               "Failed to fetch trending coins",

            error:
               getCoinGeckoError(error),
         });
      }
   }
);


/* =========================================================
   PORTFOLIO PRICES

   GET /api/market/portfolio-prices

   Supports:

   Old:
   ?symbols=BTC,ETH,SOL

   New:
   ?symbols=BTC,ETH&coinIds=bitcoin,ethereum
========================================================= */

router.get(
   "/portfolio-prices",
   async (req, res) => {
      try {
         const requestedSymbols =
            String(
               req.query.symbols || ""
            )
               .split(",")
               .map((symbol) =>
                  symbol
                     .trim()
                     .toUpperCase()
               )
               .filter(Boolean);

         const requestedCoinIds =
            String(
               req.query.coinIds || ""
            )
               .split(",")
               .map((id) =>
                  id.trim().toLowerCase()
               )
               .filter(Boolean);

         const prices = {};

         const symbolToCoinId = {};

         requestedSymbols.forEach(
            (symbol, index) => {
               const suppliedCoinId =
                  requestedCoinIds[index];

               if (suppliedCoinId) {
                  symbolToCoinId[symbol] =
                     suppliedCoinId;

                  return;
               }

               if (
                  PORTFOLIO_COINS[
                  symbol
                  ]
               ) {
                  symbolToCoinId[symbol] =
                     PORTFOLIO_COINS[
                     symbol
                     ];
               }
            }
         );

         requestedCoinIds.forEach(
            (coinId, index) => {
               const symbol =
                  requestedSymbols[index];

               if (
                  symbol &&
                  !symbolToCoinId[
                  symbol
                  ]
               ) {
                  symbolToCoinId[symbol] =
                     coinId;
               }
            }
         );

         const entries =
            Object.entries(
               symbolToCoinId
            );

         if (
            entries.length === 0
         ) {
            return res.status(200).json({
               prices: {},
            });
         }

         const coinIds = [
            ...new Set(
               entries.map(
                  ([, coinId]) =>
                     coinId
               )
            ),
         ];

         const response =
            await axios.get(
               `${COINGECKO_BASE_URL}/simple/price`,
               {
                  headers:
                     COINGECKO_HEADERS,

                  params: {
                     ids:
                        coinIds.join(","),

                     vs_currencies:
                        "usd",

                     include_24hr_change:
                        true,
                  },

                  timeout: 10000,
               }
            );

         const data =
            response.data || {};

         entries.forEach(
            ([symbol, coinId]) => {
               const coinData =
                  data[coinId];

               if (!coinData) {
                  return;
               }

               prices[symbol] = {
                  price:
                     Number(
                        coinData.usd
                     ) || 0,

                  change24h:
                     Number(
                        coinData.usd_24h_change
                     ) || 0,

                  coinId,
               };
            }
         );

         return res.status(200).json({
            prices,
         });
      } catch (error) {
         console.error(
            "CoinGecko portfolio prices error:",
            getCoinGeckoError(error)
         );

         return res.status(
            error.response?.status >= 400 &&
               error.response?.status < 600
               ? error.response.status
               : 500
         ).json({
            message:
               "Failed to fetch portfolio prices",

            error:
               getCoinGeckoError(error),
         });
      }
   }
);


module.exports = router;