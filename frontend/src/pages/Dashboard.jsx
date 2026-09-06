import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
   RefreshCw,
   TrendingUp,
   TrendingDown,
   ArrowRight,
   ChevronLeft,
   ChevronRight,
} from "lucide-react";

import "./Dashboard.css";
import MarketStats from "../components/MarketStats";

/* =========================================================
   API CONFIGURATION
========================================================= */

const API_BASE_URL = (
   import.meta.env.VITE_API_URL ||
   "http://localhost:4000/api"
)
   .replace(/\/+$/, "")
   .replace(/\/api$/, "");

const API_MARKET_URL = `${API_BASE_URL}/api/market`;

/* =========================================================
   DASHBOARD CONFIGURATION
========================================================= */

const COINS_PER_PAGE = 10;
const TRENDING_LIMIT = 5;
const AUTO_REFRESH_INTERVAL = 60 * 1000;

/* =========================================================
   AUTH TOKEN
========================================================= */

const getToken = () => {
   return (
      localStorage.getItem("token") ||
      localStorage.getItem("crypto_token")
   );
};

/* =========================================================
   FORMAT CURRENCY
========================================================= */

const formatCurrency = (value) => {
   const number = Number(value);

   if (!Number.isFinite(number)) {
      return "$0.00";
   }

   if (number >= 1_000_000_000_000) {
      return `$${(
         number / 1_000_000_000_000
      ).toFixed(2)}T`;
   }

   if (number >= 1_000_000_000) {
      return `$${(
         number / 1_000_000_000
      ).toFixed(2)}B`;
   }

   if (number >= 1_000_000) {
      return `$${(
         number / 1_000_000
      ).toFixed(2)}M`;
   }

   if (number >= 1_000) {
      return `$${(
         number / 1_000
      ).toFixed(2)}K`;
   }

   if (number >= 1) {
      return `$${number.toLocaleString("en-US", {
         minimumFractionDigits: 2,
         maximumFractionDigits: 2,
      })}`;
   }

   return `$${number.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
   })}`;
};

/* =========================================================
   FORMAT PERCENTAGE
========================================================= */

const formatPercent = (value) => {
   const number = Number(value);

   if (!Number.isFinite(number)) {
      return "0.00%";
   }

   return `${number >= 0 ? "+" : ""}${number.toFixed(2)}%`;
};

/* =========================================================
   GET PRICE CHANGE
========================================================= */

const getChangeValue = (coin, period) => {
   const possibleFields = {
      "1h": [
         "price_change_percentage_1h_in_currency",
         "price_change_percentage_1h",
         "change_1h",
         "change1h",
      ],

      "24h": [
         "price_change_percentage_24h_in_currency",
         "price_change_percentage_24h",
         "change_24h",
         "change24h",
      ],

      "7d": [
         "price_change_percentage_7d_in_currency",
         "price_change_percentage_7d",
         "change_7d",
         "change7d",
      ],
   };

   const fields = possibleFields[period] || [];

   for (const field of fields) {
      const value = Number(coin?.[field]);

      if (Number.isFinite(value)) {
         return value;
      }
   }

   return 0;
};

/* =========================================================
   CHANGE BADGE
========================================================= */

const ChangeBadge = ({ value }) => {
   const number = Number(value) || 0;
   const positive = number >= 0;

   return (
      <span
         className={`dashboard-change ${positive ? "positive" : "negative"
            }`}
      >
         {positive ? (
            <TrendingUp size={13} />
         ) : (
            <TrendingDown size={13} />
         )}

         {formatPercent(number)}
      </span>
   );
};

/* =========================================================
   7 DAY MINI CHART
========================================================= */

const SevenDayChart = ({ prices }) => {
   if (
      !Array.isArray(prices) ||
      prices.length < 2
   ) {
      return (
         <div className="seven-day-chart empty">
            <span>No chart</span>
         </div>
      );
   }

   const maxPoints = 40;

   let chartPoints = prices;

   if (prices.length > maxPoints) {
      const step = prices.length / maxPoints;

      chartPoints = Array.from(
         { length: maxPoints },
         (_, index) =>
            prices[Math.floor(index * step)]
      );
   }

   const numericPrices = chartPoints
      .map(Number)
      .filter(Number.isFinite);

   if (numericPrices.length < 2) {
      return (
         <div className="seven-day-chart empty">
            <span>No chart</span>
         </div>
      );
   }

   const min = Math.min(...numericPrices);
   const max = Math.max(...numericPrices);
   const range = max - min || 1;

   const width = 120;
   const height = 42;
   const padding = 3;

   const points = numericPrices
      .map((price, index) => {
         const x =
            padding +
            (index /
               (numericPrices.length - 1)) *
            (width - padding * 2);

         const y =
            height -
            padding -
            ((price - min) / range) *
            (height - padding * 2);

         return `${x},${y}`;
      })
      .join(" ");

   const startPrice = numericPrices[0];
   const endPrice =
      numericPrices[numericPrices.length - 1];

   const chartPositive =
      endPrice >= startPrice;

   return (
      <div
         className={`seven-day-chart ${chartPositive
               ? "chart-positive"
               : "chart-negative"
            }`}
         title={`7D ${chartPositive ? "Up" : "Down"
            }`}
      >
         <svg
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            aria-hidden="true"
         >
            <polyline
               points={points}
               fill="none"
               stroke="currentColor"
               strokeWidth="2"
               strokeLinecap="round"
               strokeLinejoin="round"
            />
         </svg>
      </div>
   );
};

/* =========================================================
   NORMALIZE TRENDING COIN

   Handles:

   1. CoinGecko:
      { item: {...} }

   2. Direct coin:
      {...}

   3. Nested:
      { data: { item: {...} } }
========================================================= */

const normalizeTrendingCoin = (entry) => {
   if (!entry) {
      return null;
   }

   let coin = entry;

   if (entry?.item) {
      coin = entry.item;
   }

   if (coin?.data?.item) {
      coin = coin.data.item;
   }

   if (coin?.data && !coin.id) {
      coin = coin.data;
   }

   const id =
      coin?.id ||
      coin?.coin_id ||
      coin?.item?.id ||
      null;

   if (!id) {
      return null;
   }

   return {
      ...coin,

      id,

      name:
         coin?.name ||
         coin?.item?.name ||
         "Unknown Coin",

      symbol:
         coin?.symbol ||
         coin?.item?.symbol ||
         "",

      image:
         coin?.large ||
         coin?.small ||
         coin?.thumb ||
         coin?.image ||
         coin?.item?.large ||
         coin?.item?.small ||
         coin?.item?.thumb ||
         coin?.item?.image ||
         "",

      marketCapRank:
         coin?.market_cap_rank ||
         coin?.market_cap_rank_usd ||
         coin?.item?.market_cap_rank ||
         null,

      price:
         coin?.current_price ??
         coin?.data?.market_data?.current_price?.usd ??
         null,

      change24h:
         coin?.price_change_percentage_24h ??
         coin?.data?.market_data
            ?.price_change_percentage_24h ??
         0,
   };
};

/* =========================================================
   EXTRACT TRENDING ARRAY

   Handles different backend response structures.
========================================================= */

const extractTrendingArray = (response) => {
   if (!response) {
      return [];
   }

   /* Direct array */
   if (Array.isArray(response)) {
      return response;
   }

   /* { coins: [...] } */
   if (Array.isArray(response.coins)) {
      return response.coins;
   }

   /* { results: [...] } */
   if (Array.isArray(response.results)) {
      return response.results;
   }

   /* { data: [...] } */
   if (Array.isArray(response.data)) {
      return response.data;
   }

   /* { data: { coins: [...] } } */
   if (
      response.data &&
      Array.isArray(response.data.coins)
   ) {
      return response.data.coins;
   }

   /* { data: { results: [...] } } */
   if (
      response.data &&
      Array.isArray(response.data.results)
   ) {
      return response.data.results;
   }

   return [];
};

/* =========================================================
   DASHBOARD
========================================================= */

const Dashboard = () => {
   const navigate = useNavigate();

   /* ======================================================
      STATE
   ====================================================== */

   const [overview, setOverview] =
      useState(null);

   const [trending, setTrending] =
      useState([]);

   const [coins, setCoins] =
      useState([]);

   const [coinsLoading, setCoinsLoading] =
      useState(true);

   const [trendingLoading, setTrendingLoading] =
      useState(true);

   const [refreshing, setRefreshing] =
      useState(false);

   const [error, setError] =
      useState("");

   const [page, setPage] =
      useState(1);

   const [hasMore, setHasMore] =
      useState(true);

   /* ======================================================
      FETCH MARKET OVERVIEW + TRENDING
   ====================================================== */

   const fetchDashboardData = useCallback(
      async (showRefresh = false) => {
         try {
            if (showRefresh) {
               setRefreshing(true);
            }

            setError("");
            setTrendingLoading(true);

            const token = getToken();

            const headers = {
               Accept: "application/json",
            };

            if (token) {
               headers.Authorization =
                  `Bearer ${token}`;
            }

            const [
               overviewResponse,
               trendingResponse,
            ] = await Promise.all([
               fetch(
                  `${API_MARKET_URL}/overview`,
                  {
                     headers,
                  }
               ),

               fetch(
                  `${API_MARKET_URL}/trending`,
                  {
                     headers,
                  }
               ),
            ]);

            /* =============================================
               OVERVIEW
            ============================================= */

            if (!overviewResponse.ok) {
               throw new Error(
                  "Failed to fetch market overview"
               );
            }

            const overviewData =
               await overviewResponse.json();

            setOverview(overviewData);

            /* =============================================
               TRENDING
            ============================================= */

            if (!trendingResponse.ok) {
               throw new Error(
                  "Failed to fetch trending cryptocurrencies"
               );
            }

            const trendingData =
               await trendingResponse.json();

            console.log(
               "Trending API response:",
               trendingData
            );

            const trendingArray =
               extractTrendingArray(
                  trendingData
               );

            console.log(
               "Trending coins received:",
               trendingArray
            );

            const normalizedTrending =
               trendingArray
                  .map(
                     normalizeTrendingCoin
                  )
                  .filter(Boolean);

            console.log(
               "Normalized trending coins:",
               normalizedTrending
            );

            setTrending(
               normalizedTrending.slice(
                  0,
                  TRENDING_LIMIT
               )
            );
         } catch (err) {
            console.error(
               "Dashboard market data error:",
               err
            );

            setError(
               err?.message ||
               "Failed to load market data"
            );

            setTrending([]);
         } finally {
            setTrendingLoading(false);

            if (showRefresh) {
               setRefreshing(false);
            }
         }
      },
      []
   );

   /* ======================================================
      FETCH TOP CRYPTOCURRENCIES
   ====================================================== */

   const fetchCoins = useCallback(
      async (pageNumber = 1) => {
         try {
            setCoinsLoading(true);

            const token = getToken();

            const headers = {
               Accept: "application/json",
            };

            if (token) {
               headers.Authorization =
                  `Bearer ${token}`;
            }

            const response =
               await fetch(
                  `${API_MARKET_URL}/coins?page=${pageNumber}&limit=${COINS_PER_PAGE}`,
                  {
                     headers,
                  }
               );

            if (!response.ok) {
               throw new Error(
                  "Failed to fetch cryptocurrencies"
               );
            }

            const data =
               await response.json();

            const coinList =
               Array.isArray(data?.coins)
                  ? data.coins
                  : Array.isArray(data)
                     ? data
                     : [];

            setCoins(coinList);

            if (
               typeof data?.hasMore ===
               "boolean"
            ) {
               setHasMore(
                  data.hasMore
               );
            } else {
               setHasMore(
                  coinList.length ===
                  COINS_PER_PAGE
               );
            }
         } catch (err) {
            console.error(
               "Dashboard coins error:",
               err
            );

            setError(
               err?.message ||
               "Failed to load cryptocurrencies"
            );

            setCoins([]);
            setHasMore(false);
         } finally {
            setCoinsLoading(false);
         }
      },
      []
   );

   /* ======================================================
      INITIAL DATA
   ====================================================== */

   useEffect(() => {
      fetchDashboardData();
   }, [fetchDashboardData]);

   /* ======================================================
      FETCH COINS WHEN PAGE CHANGES
   ====================================================== */

   useEffect(() => {
      fetchCoins(page);
   }, [fetchCoins, page]);

   /* ======================================================
      AUTO REFRESH
   ====================================================== */

   useEffect(() => {
      const interval = setInterval(() => {
         fetchDashboardData(false);
         fetchCoins(page);
      }, AUTO_REFRESH_INTERVAL);

      return () => {
         clearInterval(interval);
      };
   }, [
      fetchDashboardData,
      fetchCoins,
      page,
   ]);

   /* ======================================================
      MANUAL REFRESH
   ====================================================== */

   const handleRefresh = async () => {
      await Promise.all([
         fetchDashboardData(true),
         fetchCoins(page),
      ]);
   };

   /* ======================================================
      PAGINATION
   ====================================================== */

   const handleNextPage = () => {
      if (
         !coinsLoading &&
         hasMore &&
         coins.length > 0
      ) {
         setPage(
            (currentPage) =>
               currentPage + 1
         );
      }
   };

   const handlePreviousPage = () => {
      if (
         !coinsLoading &&
         page > 1
      ) {
         setPage(
            (currentPage) =>
               currentPage - 1
         );
      }
   };

   /* ======================================================
      COIN DETAILS
   ====================================================== */

   const handleCoinClick = (coin) => {
      if (!coin?.id) {
         return;
      }

      navigate(
         `/markets/${coin.id}`
      );
   };

   /* ======================================================
      MARKET DATA
   ====================================================== */

   const globalData =
      overview?.data ||
      overview ||
      {};

   const marketCap =
      globalData
         ?.total_market_cap
         ?.usd || 0;

   const marketVolume =
      globalData
         ?.total_volume
         ?.usd || 0;

   const marketCapChange =
      globalData
         ?.market_cap_change_percentage_24h_usd ||
      0;

   const btcDominance =
      globalData
         ?.market_cap_percentage
         ?.btc || 0;

   /* ======================================================
      TOP 5 TRENDING
   ====================================================== */

   const topTrendingCoins =
      trending.slice(
         0,
         TRENDING_LIMIT
      );

   /* ======================================================
      PAGE RANGE
   ====================================================== */

   const pageStart =
      (page - 1) *
      COINS_PER_PAGE +
      1;

   const pageEnd =
      (page - 1) *
      COINS_PER_PAGE +
      coins.length;

   /* ======================================================
      RENDER
   ====================================================== */

   return (
      <div className="dashboard-page">
         <div className="dashboard-content">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="dashboard-header">

               <div>
                  <div className="dashboard-eyebrow">
                     <span className="eyebrow-dot" />
                     MARKET OVERVIEW
                  </div>

                  <h1>
                     Dashboard
                  </h1>

                  <p>
                     Track the cryptocurrency
                     market and discover
                     trending assets.
                  </p>
               </div>

               <button
                  type="button"
                  className="refresh-dashboard-btn"
                  onClick={
                     handleRefresh
                  }
                  disabled={
                     refreshing
                  }
               >
                  <RefreshCw
                     size={16}
                     className={
                        refreshing
                           ? "refresh-spinning"
                           : ""
                     }
                  />

                  {refreshing
                     ? "Refreshing..."
                     : "Refresh"}
               </button>

            </div>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
               <div className="dashboard-error">
                  {error}
               </div>
            )}

            {/* =================================================
                MARKET STATS
            ================================================= */}

            {overview && (
               <MarketStats
                  overview={overview}
                  marketCap={marketCap}
                  marketVolume={
                     marketVolume
                  }
                  marketCapChange={
                     marketCapChange
                  }
                  btcDominance={
                     btcDominance
                  }
               />
            )}

            {/* =================================================
                TRENDING NOW
            ================================================= */}

            <section className="dashboard-section">

               <div className="section-heading-row">

                  <div>
                     <div className="section-eyebrow">
                        TRENDING NOW
                     </div>

                     <h2>
                        Top Trending Currencies
                     </h2>
                  </div>

                  <button
                     type="button"
                     className="view-all-btn"
                     onClick={() =>
                        navigate(
                           "/markets"
                        )
                     }
                  >
                     View all

                     <ArrowRight
                        size={14}
                     />
                  </button>

               </div>

               <div className="trending-grid">

                  {trendingLoading ? (
                     <div className="dashboard-empty trending-loading">
                        <span className="loading-spinner" />
                        Loading trending currencies...
                     </div>
                  ) : topTrendingCoins.length > 0 ? (

                     topTrendingCoins.map(
                        (coin, index) => {

                           const change24h =
                              getChangeValue(
                                 coin,
                                 "24h"
                              );

                           return (
                              <button
                                 type="button"
                                 className="trending-card"
                                 key={
                                    coin.id ||
                                    `${coin.symbol}-${index}`
                                 }
                                 onClick={() =>
                                    handleCoinClick(
                                       coin
                                    )
                                 }
                              >

                                 {/* Rank */}

                                 <div className="trending-rank">
                                    #{index + 1}
                                 </div>

                                 {/* Coin Image */}

                                 <div className="trending-coin-image">

                                    {coin.image ? (
                                       <img
                                          src={
                                             coin.image
                                          }
                                          alt={
                                             coin.name
                                          }
                                          loading="lazy"
                                          onError={(
                                             event
                                          ) => {
                                             event.currentTarget.style.display =
                                                "none";
                                          }}
                                       />
                                    ) : (
                                       <span>
                                          {(
                                             coin.symbol ||
                                             coin.name ||
                                             "?"
                                          )
                                             .slice(
                                                0,
                                                1
                                             )
                                             .toUpperCase()}
                                       </span>
                                    )}

                                 </div>

                                 {/* Information */}

                                 <div className="trending-info">

                                    <strong>
                                       {coin.name}
                                    </strong>

                                    <span>
                                       {(
                                          coin.symbol ||
                                          ""
                                       ).toUpperCase()}
                                    </span>

                                    {coin.marketCapRank && (
                                       <small>
                                          Market Rank #
                                          {
                                             coin.marketCapRank
                                          }
                                       </small>
                                    )}

                                 </div>

                                 {/* Right Side */}

                                 <div className="trending-right">

                                    {Number.isFinite(
                                       Number(
                                          coin.price
                                       )
                                    ) && (
                                          <strong>
                                             {formatCurrency(
                                                coin.price
                                             )}
                                          </strong>
                                       )}

                                    <ChangeBadge
                                       value={
                                          change24h
                                       }
                                    />

                                 </div>

                              </button>
                           );
                        }
                     )

                  ) : (

                     <div className="dashboard-empty">
                        No trending
                        cryptocurrencies
                        available.
                     </div>

                  )}

               </div>

            </section>

            {/* =================================================
                TOP CRYPTOCURRENCIES
            ================================================= */}

            <section className="dashboard-section">

               <div className="section-heading-row">

                  <div>
                     <div className="section-eyebrow">
                        MARKET
                     </div>

                     <h2>
                        Top Cryptocurrencies
                     </h2>
                  </div>

                  <button
                     type="button"
                     className="view-all-btn"
                     onClick={() =>
                        navigate(
                           "/markets"
                        )
                     }
                  >
                     View all

                     <ArrowRight
                        size={14}
                     />
                  </button>

               </div>

               <div className="dashboard-table-card">

                  <div className="dashboard-table-wrapper">

                     <table className="dashboard-table">

                        <thead>
                           <tr>
                              <th>#</th>
                              <th>Asset</th>
                              <th>Price</th>
                              <th>1H</th>
                              <th>24H</th>
                              <th>7D</th>
                              <th>7D Chart</th>
                              <th>Market Cap</th>
                              <th>Volume</th>
                           </tr>
                        </thead>

                        <tbody>

                           {coinsLoading ? (

                              <tr>
                                 <td
                                    colSpan={9}
                                    className="table-loading"
                                 >
                                    <div className="table-loading-content">
                                       <span className="loading-spinner" />
                                       Loading
                                       cryptocurrencies...
                                    </div>
                                 </td>
                              </tr>

                           ) : coins.length > 0 ? (

                              coins.map(
                                 (
                                    coin,
                                    index
                                 ) => {

                                    const change1h =
                                       getChangeValue(
                                          coin,
                                          "1h"
                                       );

                                    const change24h =
                                       getChangeValue(
                                          coin,
                                          "24h"
                                       );

                                    const change7d =
                                       getChangeValue(
                                          coin,
                                          "7d"
                                       );

                                    const globalRank =
                                       (page - 1) *
                                       COINS_PER_PAGE +
                                       index +
                                       1;

                                    const sevenDayPrices =
                                       Array.isArray(
                                          coin
                                             ?.sparkline_in_7d
                                             ?.price
                                       )
                                          ? coin
                                             .sparkline_in_7d
                                             .price
                                          : [];

                                    return (
                                       <tr
                                          key={
                                             coin?.id ||
                                             index
                                          }
                                          onClick={() =>
                                             handleCoinClick(
                                                coin
                                             )
                                          }
                                          className="coin-row"
                                       >

                                          {/* Rank */}

                                          <td>
                                             <span className="coin-rank">
                                                {
                                                   globalRank
                                                }
                                             </span>
                                          </td>

                                          {/* Asset */}

                                          <td>
                                             <div className="dashboard-coin">

                                                {coin?.image ? (
                                                   <img
                                                      src={
                                                         coin.image
                                                      }
                                                      alt={
                                                         coin?.name ||
                                                         "Coin"
                                                      }
                                                      className="dashboard-coin-image"
                                                      loading="lazy"
                                                   />
                                                ) : (
                                                   <div className="dashboard-coin-fallback">
                                                      {(
                                                         coin?.symbol ||
                                                         "?"
                                                      )
                                                         .slice(
                                                            0,
                                                            1
                                                         )
                                                         .toUpperCase()}
                                                   </div>
                                                )}

                                                <div className="dashboard-coin-details">

                                                   <strong>
                                                      {
                                                         coin?.name
                                                      }
                                                   </strong>

                                                   <span>
                                                      {(
                                                         coin?.symbol ||
                                                         ""
                                                      ).toUpperCase()}
                                                   </span>

                                                </div>

                                             </div>
                                          </td>

                                          {/* Price */}

                                          <td>
                                             <strong className="coin-price">
                                                {formatCurrency(
                                                   coin?.current_price
                                                )}
                                             </strong>
                                          </td>

                                          {/* 1H */}

                                          <td>
                                             <ChangeBadge
                                                value={
                                                   change1h
                                                }
                                             />
                                          </td>

                                          {/* 24H */}

                                          <td>
                                             <ChangeBadge
                                                value={
                                                   change24h
                                                }
                                             />
                                          </td>

                                          {/* 7D */}

                                          <td>
                                             <ChangeBadge
                                                value={
                                                   change7d
                                                }
                                             />
                                          </td>

                                          {/* 7D Chart */}

                                          <td>
                                             <SevenDayChart
                                                prices={
                                                   sevenDayPrices
                                                }
                                             />
                                          </td>

                                          {/* Market Cap */}

                                          <td>
                                             <span className="table-number">
                                                {formatCurrency(
                                                   coin?.market_cap
                                                )}
                                             </span>
                                          </td>

                                          {/* Volume */}

                                          <td>
                                             <span className="table-number">
                                                {formatCurrency(
                                                   coin?.total_volume
                                                )}
                                             </span>
                                          </td>

                                       </tr>
                                    );
                                 }
                              )

                           ) : (

                              <tr>
                                 <td
                                    colSpan={9}
                                    className="dashboard-empty"
                                 >
                                    No cryptocurrency
                                    data available.
                                 </td>
                              </tr>

                           )}

                        </tbody>

                     </table>

                  </div>

                  {/* Pagination */}

                  <div className="dashboard-pagination">

                     <button
                        type="button"
                        onClick={
                           handlePreviousPage
                        }
                        disabled={
                           page === 1 ||
                           coinsLoading
                        }
                     >
                        <ChevronLeft
                           size={16}
                        />

                        Previous
                     </button>

                     <span>
                        {coins.length > 0
                           ? `${pageStart}-${pageEnd}`
                           : `Page ${page}`}
                     </span>

                     <button
                        type="button"
                        onClick={
                           handleNextPage
                        }
                        disabled={
                           !hasMore ||
                           coinsLoading ||
                           coins.length === 0
                        }
                     >
                        Next

                        <ChevronRight
                           size={16}
                        />
                     </button>

                  </div>

               </div>

            </section>

         </div>
      </div>
   );
};

export default Dashboard;