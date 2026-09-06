import {
   useCallback,
   useEffect,
   useMemo,
   useRef,
   useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
   ArrowRight,
   ArrowUpRight,
   BarChart3,
   ChevronRight,
   CircleDollarSign,
   Eye,
   RefreshCw,
   Search,
   Star,
   Trash2,
   TrendingDown,
   TrendingUp,
   WalletCards,
   X,
} from "lucide-react";

import api from "../services/api";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import "./Watchlist.css";


/* =========================================================
   FORMATTERS
========================================================= */

const formatUSD = (value) => {
   const number = Number(value);

   if (!Number.isFinite(number) || number <= 0) {
      return "$0.00";
   }

   if (number >= 1) {
      return number.toLocaleString("en-US", {
         style: "currency",
         currency: "USD",
         maximumFractionDigits: 2,
      });
   }

   return `$${number.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
   })}`;
};


const formatPercentage = (value) => {
   const number = Number(value);

   if (!Number.isFinite(number)) {
      return "0.00%";
   }

   return `${number >= 0 ? "+" : ""}${number.toFixed(2)}%`;
};


const formatCompact = (value) => {
   const number = Number(value);

   if (!Number.isFinite(number) || number <= 0) {
      return "—";
   }

   return new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 2,
   }).format(number);
};


const formatUpdatedTime = (date) => {
   if (!date) {
      return "";
   }

   return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
   });
};


/* =========================================================
   AUTH
========================================================= */

const getAuthToken = () => {
   const token = localStorage.getItem("token");

   if (
      typeof token === "string" &&
      token.trim()
   ) {
      return token.trim();
   }

   return null;
};


/* =========================================================
   EXTRACT WATCHLIST
========================================================= */

const extractWatchlist = (data) => {
   if (Array.isArray(data)) {
      return data;
   }

   if (Array.isArray(data?.watchlist)) {
      return data.watchlist;
   }

   if (Array.isArray(data?.data)) {
      return data.data;
   }

   if (Array.isArray(data?.data?.watchlist)) {
      return data.data.watchlist;
   }

   return [];
};


/* =========================================================
   NORMALIZE WATCHLIST
========================================================= */

const normalizeWatchlist = (items) => {
   if (!Array.isArray(items)) {
      return [];
   }

   const map = new Map();

   items.forEach((item) => {
      if (!item || typeof item !== "object") {
         return;
      }

      const coinId = String(
         item.coinId ||
         item.id ||
         ""
      ).trim();

      if (!coinId) {
         return;
      }

      const coinName = String(
         item.coin ||
         item.name ||
         item.symbol ||
         "Unknown"
      ).trim();

      const symbol = String(
         item.symbol ||
         ""
      )
         .trim()
         .toUpperCase();

      map.set(coinId, {
         ...item,

         _id: item._id || null,

         coinId,

         coin: coinName,

         name: coinName,

         symbol,

         image:
            typeof item.image === "string"
               ? item.image
               : "",

         current_price:
            Number.isFinite(Number(item.current_price))
               ? Number(item.current_price)
               : 0,

         price_change_percentage_24h:
            Number.isFinite(
               Number(item.price_change_percentage_24h)
            )
               ? Number(item.price_change_percentage_24h)
               : 0,

         market_cap:
            Number.isFinite(Number(item.market_cap))
               ? Number(item.market_cap)
               : 0,

         total_volume:
            Number.isFinite(Number(item.total_volume))
               ? Number(item.total_volume)
               : 0,

         high_24h:
            Number.isFinite(Number(item.high_24h))
               ? Number(item.high_24h)
               : 0,

         low_24h:
            Number.isFinite(Number(item.low_24h))
               ? Number(item.low_24h)
               : 0,

         market_cap_rank:
            Number.isFinite(Number(item.market_cap_rank))
               ? Number(item.market_cap_rank)
               : null,
      });
   });

   return Array.from(map.values());
};


/* =========================================================
   PRICE DATA
========================================================= */

const extractPriceData = (data) => {
   if (
      data?.prices &&
      typeof data.prices === "object"
   ) {
      return data.prices;
   }

   if (
      data?.data &&
      typeof data.data === "object"
   ) {
      return data.data;
   }

   return {};
};


/* =========================================================
   COMPONENT
========================================================= */

const Watchlist = () => {
   const navigate = useNavigate();

   const mountedRef = useRef(false);
   const requestRef = useRef(false);

   const [watchlist, setWatchlist] = useState([]);

   const [marketCoins, setMarketCoins] = useState([]);

   const [livePrices, setLivePrices] = useState({});

   const [loading, setLoading] = useState(true);

   const [refreshing, setRefreshing] = useState(false);

   const [error, setError] = useState("");

   const [removingCoinId, setRemovingCoinId] =
      useState(null);

   const [lastUpdated, setLastUpdated] =
      useState(null);

   const [search, setSearch] = useState("");


   /* ======================================================
      MOUNT
   ====================================================== */

   useEffect(() => {
      mountedRef.current = true;

      return () => {
         mountedRef.current = false;
      };
   }, []);


   /* ======================================================
      LOAD WATCHLIST
   ====================================================== */

   const loadWatchlist = useCallback(async () => {
      const token = getAuthToken();

      if (!token) {
         if (mountedRef.current) {
            setError(
               "Your login session is unavailable. Please log in again."
            );
            setWatchlist([]);
         }

         return [];
      }

      try {
         const response = await api.get(
            "/watchlist",
            {
               headers: {
                  Authorization: `Bearer ${token}`,
               },
            }
         );

         const items = extractWatchlist(
            response.data
         );

         const normalized =
            normalizeWatchlist(items);

         if (mountedRef.current) {
            setWatchlist(normalized);
            setError("");
            setLastUpdated(new Date());
         }

         console.log(
            "WATCHLIST LOADED:",
            normalized.length
         );

         return normalized;
      } catch (requestError) {
         console.error(
            "WATCHLIST LOAD ERROR:",
            requestError
         );

         if (mountedRef.current) {
            if (
               requestError.response?.status === 401
            ) {
               setError(
                  "Your login session has expired. Please log in again."
               );
            } else {
               setError(
                  requestError.response?.data?.message ||
                  "Unable to load your watchlist."
               );
            }

            setWatchlist([]);
         }

         return [];
      }
   }, []);


   /* ======================================================
      LOAD MARKET DATA
   ====================================================== */

   const loadMarketData = useCallback(async () => {
      try {
         const response = await api.get(
            "/market/coins?page=1"
         );

         const coins = Array.isArray(
            response.data?.coins
         )
            ? response.data.coins
            : [];

         if (mountedRef.current) {
            setMarketCoins(coins);
         }

         return coins;
      } catch (requestError) {
         console.error(
            "MARKET DATA ERROR:",
            requestError
         );

         return [];
      }
   }, []);


   /* ======================================================
      LOAD LIVE PRICES
   ====================================================== */

   const loadLivePrices = useCallback(
      async (items) => {
         if (
            !Array.isArray(items) ||
            items.length === 0
         ) {
            if (mountedRef.current) {
               setLivePrices({});
            }

            return {};
         }

         const coinIds = [
            ...new Set(
               items
                  .map((item) =>
                     String(
                        item.coinId || ""
                     ).trim()
                  )
                  .filter(Boolean)
            ),
         ];

         if (coinIds.length === 0) {
            return {};
         }

         try {
            const response = await api.get(
               "/market/portfolio-prices",
               {
                  params: {
                     coinIds:
                        coinIds.join(","),
                  },
               }
            );

            const prices =
               extractPriceData(
                  response.data
               );

            if (mountedRef.current) {
               setLivePrices(prices);
            }

            return prices;
         } catch (requestError) {
            console.error(
               "LIVE PRICE ERROR:",
               requestError
            );

            return {};
         }
      },
      []
   );


   /* ======================================================
      LOAD ALL DATA
   ====================================================== */

   const loadAllData = useCallback(
      async () => {
         if (requestRef.current) {
            return;
         }

         requestRef.current = true;

         try {
            /*
               Watchlist is loaded first.
               MongoDB is the source of truth.
            */

            const savedItems =
               await loadWatchlist();

            /*
               Supplementary data can load
               independently.
            */

            await Promise.all([
               loadMarketData(),
               loadLivePrices(savedItems),
            ]);
         } finally {
            requestRef.current = false;
         }
      },
      [
         loadWatchlist,
         loadMarketData,
         loadLivePrices,
      ]
   );


   /* ======================================================
      INITIAL LOAD
   ====================================================== */

   useEffect(() => {
      const initialize = async () => {
         setLoading(true);

         await loadAllData();

         if (mountedRef.current) {
            setLoading(false);
         }
      };

      initialize();
   }, [loadAllData]);


   /* ======================================================
      REFRESH
   ====================================================== */

   const handleRefresh = async () => {
      if (
         refreshing ||
         requestRef.current
      ) {
         return;
      }

      setRefreshing(true);

      try {
         await loadAllData();
      } finally {
         if (mountedRef.current) {
            setRefreshing(false);
         }
      }
   };


   /* ======================================================
      WINDOW FOCUS
   ====================================================== */

   useEffect(() => {
      const handleFocus = () => {
         if (
            document.visibilityState ===
            "visible"
         ) {
            loadAllData();
         }
      };

      window.addEventListener(
         "focus",
         handleFocus
      );

      return () => {
         window.removeEventListener(
            "focus",
            handleFocus
         );
      };
   }, [loadAllData]);


   /* ======================================================
      MERGE DATA
   ====================================================== */

   const mergedWatchlist = useMemo(() => {
      return watchlist.map((savedCoin) => {
         const coinId =
            String(
               savedCoin.coinId || ""
            ).trim();

         const marketCoin =
            marketCoins.find(
               (coin) =>
                  String(
                     coin.id || ""
                  ).trim() === coinId
            );

         const priceEntry =
            livePrices?.[coinId];

         let currentPrice =
            Number(
               savedCoin.current_price
            ) || 0;

         if (
            priceEntry &&
            typeof priceEntry === "object"
         ) {
            const price =
               priceEntry.usd ??
               priceEntry.price ??
               null;

            if (
               Number.isFinite(
                  Number(price)
               )
            ) {
               currentPrice =
                  Number(price);
            }
         } else if (
            Number.isFinite(
               Number(priceEntry)
            )
         ) {
            currentPrice =
               Number(priceEntry);
         }

         return {
            ...savedCoin,

            coinId,

            coin:
               marketCoin?.name ||
               savedCoin.coin ||
               savedCoin.name ||
               "Unknown",

            name:
               marketCoin?.name ||
               savedCoin.name ||
               savedCoin.coin ||
               "Unknown",

            symbol: (
               marketCoin?.symbol ||
               savedCoin.symbol ||
               ""
            ).toUpperCase(),

            image:
               marketCoin?.image ||
               savedCoin.image ||
               "",

            current_price:
               currentPrice,

            price_change_percentage_24h:
               Number(
                  marketCoin?.price_change_percentage_24h ??
                  savedCoin.price_change_percentage_24h ??
                  0
               ) || 0,

            market_cap:
               Number(
                  marketCoin?.market_cap ??
                  savedCoin.market_cap ??
                  0
               ) || 0,

            total_volume:
               Number(
                  marketCoin?.total_volume ??
                  savedCoin.total_volume ??
                  0
               ) || 0,

            market_cap_rank:
               marketCoin?.market_cap_rank ??
               savedCoin.market_cap_rank ??
               null,
         };
      });
   }, [
      watchlist,
      marketCoins,
      livePrices,
   ]);


   /* ======================================================
      FILTER
   ====================================================== */

   const filteredWatchlist =
      useMemo(() => {
         const query =
            search.trim().toLowerCase();

         if (!query) {
            return mergedWatchlist;
         }

         return mergedWatchlist.filter(
            (coin) =>
               coin.coin
                  ?.toLowerCase()
                  .includes(query) ||
               coin.symbol
                  ?.toLowerCase()
                  .includes(query)
         );
      }, [
         mergedWatchlist,
         search,
      ]);


   /* ======================================================
      STATS
   ====================================================== */

   const positiveCount = useMemo(
      () =>
         mergedWatchlist.filter(
            (coin) =>
               Number(
                  coin.price_change_percentage_24h
               ) >= 0
         ).length,
      [mergedWatchlist]
   );


   const negativeCount =
      mergedWatchlist.length -
      positiveCount;


   /* ======================================================
      REMOVE
   ====================================================== */

   const removeFromWatchlist = async (
      event,
      coinId
   ) => {
      event.preventDefault();
      event.stopPropagation();

      if (
         !coinId ||
         removingCoinId
      ) {
         return;
      }

      try {
         setRemovingCoinId(coinId);

         const token =
            getAuthToken();

         if (!token) {
            throw new Error(
               "Authentication required."
            );
         }

         await api.delete(
            `/watchlist/${encodeURIComponent(
               coinId
            )}`,
            {
               headers: {
                  Authorization:
                     `Bearer ${token}`,
               },
            }
         );

         if (mountedRef.current) {
            setWatchlist(
               (current) =>
                  current.filter(
                     (item) =>
                        String(
                           item.coinId
                        ) !==
                        String(coinId)
                  )
            );

            setLivePrices(
               (current) => {
                  const updated = {
                     ...current,
                  };

                  delete updated[
                     coinId
                  ];

                  return updated;
               }
            );

            setError("");
         }
      } catch (requestError) {
         console.error(
            "REMOVE WATCHLIST ERROR:",
            requestError
         );

         if (mountedRef.current) {
            setError(
               requestError.response?.data
                  ?.message ||
               requestError.message ||
               "Unable to remove this coin."
            );
         }
      } finally {
         if (mountedRef.current) {
            setRemovingCoinId(null);
         }
      }
   };


   /* ======================================================
      OPEN COIN
   ====================================================== */

   const openCoin = (coinId) => {
      if (!coinId) {
         return;
      }

      navigate(
         `/markets/${coinId}`
      );
   };


   /* ======================================================
      KEYBOARD
   ====================================================== */

   const handleCardKeyDown = (
      event,
      coinId
   ) => {
      if (
         event.key === "Enter" ||
         event.key === " "
      ) {
         event.preventDefault();

         openCoin(coinId);
      }
   };


   /* ======================================================
      LOGIN REDIRECT
   ====================================================== */

   const goToLogin = () => {
      navigate("/login", {
         replace: true,
      });
   };


   /* ======================================================
      LOADING SCREEN
   ====================================================== */

   if (loading) {
      return (
         <div className="watchlist-page">

            <Sidebar />

            <Navbar />

            <main className="watchlist-content">

               <section className="watchlist-loading">

                  <div className="watchlist-loading-heading">

                     <div className="skeleton skeleton-icon" />

                     <div className="loading-heading-copy">

                        <div className="skeleton skeleton-small" />

                        <div className="skeleton skeleton-title" />

                        <div className="skeleton skeleton-description" />

                     </div>

                  </div>

                  <div className="skeleton-stats">

                     {Array.from({
                        length: 3,
                     }).map((_, index) => (
                        <div
                           className="skeleton skeleton-stat"
                           key={index}
                        />
                     ))}

                  </div>

                  <div className="watchlist-skeleton-list">

                     {Array.from({
                        length: 5,
                     }).map((_, index) => (
                        <div
                           className="watchlist-skeleton-row"
                           key={index}
                        >
                           <div className="skeleton skeleton-coin" />

                           <div className="skeleton-content">

                              <div className="skeleton skeleton-name" />

                              <div className="skeleton skeleton-symbol" />

                           </div>

                           <div className="skeleton skeleton-data" />

                           <div className="skeleton skeleton-data short" />

                           <div className="skeleton skeleton-button" />

                        </div>
                     ))}

                  </div>

               </section>

            </main>

         </div>
      );
   }


   /* ======================================================
      MAIN UI
   ====================================================== */

   return (
      <div className="watchlist-page">

         <Sidebar />

         <Navbar />

         <main className="watchlist-content">

            {/* =================================================
                HEADER
            ================================================= */}

            <header className="watchlist-header">

               <div className="watchlist-heading">

                  <div className="watchlist-title-row">

                     <div className="watchlist-title-icon">
                        <Star size={21} fill="currentColor" />
                     </div>

                     <div>

                        <div className="watchlist-eyebrow">
                           PERSONAL MARKET TRACKING
                        </div>

                        <h1>
                           Watchlist
                        </h1>

                     </div>

                  </div>

                  <p>
                     Keep your favorite
                     cryptocurrencies close
                     and monitor their
                     performance in real time.
                  </p>

               </div>


               <div className="watchlist-header-actions">

                  <button
                     type="button"
                     className="watchlist-refresh-button"
                     onClick={handleRefresh}
                     disabled={
                        refreshing ||
                        requestRef.current
                     }
                  >
                     <RefreshCw
                        size={17}
                        className={
                           refreshing
                              ? "spinning"
                              : ""
                        }
                     />

                     <span>
                        {refreshing
                           ? "Refreshing"
                           : "Refresh"}
                     </span>
                  </button>


                  <button
                     type="button"
                     className="watchlist-market-button"
                     onClick={() =>
                        navigate("/markets")
                     }
                  >
                     <span>
                        Explore Markets
                     </span>

                     <ArrowRight size={17} />
                  </button>

               </div>

            </header>


            {/* =================================================
                LIVE STATUS
            ================================================= */}

            <div className="watchlist-status-row">

               <div className="watchlist-live-status">

                  <span className="live-dot" />

                  <span>
                     Live market data
                  </span>

               </div>

               {lastUpdated && (
                  <span className="watchlist-updated">
                     Updated{" "}
                     {formatUpdatedTime(
                        lastUpdated
                     )}
                  </span>
               )}

            </div>


            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
               <div className="watchlist-error">

                  <div className="error-symbol">
                     !
                  </div>

                  <div className="error-content">

                     <strong>
                        Watchlist unavailable
                     </strong>

                     <p>
                        {error}
                     </p>

                  </div>

                  <div className="error-actions">

                     {error
                        .toLowerCase()
                        .includes("login") && (
                           <button
                              type="button"
                              onClick={goToLogin}
                              className="watchlist-error-button"
                           >
                              Log in
                           </button>
                        )}

                     <button
                        type="button"
                        onClick={handleRefresh}
                        className="watchlist-error-button secondary"
                     >
                        Retry
                     </button>

                  </div>

               </div>
            )}


            {/* =================================================
                SUMMARY
            ================================================= */}

            <section className="watchlist-summary">

               <article className="watchlist-summary-card">

                  <div className="summary-card-icon blue">
                     <WalletCards size={20} />
                  </div>

                  <div className="summary-card-content">

                     <span>
                        Saved assets
                     </span>

                     <strong>
                        {mergedWatchlist.length}
                     </strong>

                  </div>

                  <div className="summary-card-decoration">
                     <Star size={42} />
                  </div>

               </article>


               <article className="watchlist-summary-card">

                  <div className="summary-card-icon green">
                     <TrendingUp size={20} />
                  </div>

                  <div className="summary-card-content">

                     <span>
                        Positive today
                     </span>

                     <strong>
                        {positiveCount}
                     </strong>

                  </div>

                  <div className="summary-card-decoration">
                     <ArrowUpRight size={42} />
                  </div>

               </article>


               <article className="watchlist-summary-card">

                  <div className="summary-card-icon purple">
                     <BarChart3 size={20} />
                  </div>

                  <div className="summary-card-content">

                     <span>
                        Market tracking
                     </span>

                     <strong>
                        Live
                     </strong>

                  </div>

                  <div className="summary-card-decoration">
                     <CircleDollarSign size={42} />
                  </div>

               </article>

            </section>


            {/* =================================================
                CONTENT
            ================================================= */}

            <section className="watchlist-panel">

               {mergedWatchlist.length === 0 ? (

                  /* =============================================
                     EMPTY STATE
                  ============================================= */

                  <div className="watchlist-empty">

                     <div className="empty-orb empty-orb-one" />
                     <div className="empty-orb empty-orb-two" />

                     <div className="empty-icon">
                        <Star
                           size={34}
                           strokeWidth={1.6}
                        />
                     </div>

                     <span className="empty-label">
                        YOUR WATCHLIST
                     </span>

                     <h2>
                        Nothing here yet
                     </h2>

                     <p>
                        Add your favorite
                        cryptocurrencies from the
                        Markets page and they'll
                        appear here automatically.
                     </p>

                     <button
                        type="button"
                        className="empty-explore-button"
                        onClick={() =>
                           navigate("/markets")
                        }
                     >
                        <Search size={17} />

                        <span>
                           Explore Markets
                        </span>

                        <ArrowRight size={17} />

                     </button>

                     <div className="empty-steps">

                        <div className="empty-step">

                           <span>
                              01
                           </span>

                           <p>
                              Find a coin
                           </p>

                        </div>

                        <ChevronRight
                           size={17}
                           className="empty-step-arrow"
                        />

                        <div className="empty-step">

                           <span>
                              02
                           </span>

                           <p>
                              Add to watchlist
                           </p>

                        </div>

                        <ChevronRight
                           size={17}
                           className="empty-step-arrow"
                        />

                        <div className="empty-step">

                           <span>
                              03
                           </span>

                           <p>
                              Track it here
                           </p>

                        </div>

                     </div>

                  </div>

               ) : (

                  /* =============================================
                     WATCHLIST
                  ============================================= */

                  <div className="watchlist-assets">

                     <div className="assets-toolbar">

                        <div className="assets-heading">

                           <div>
                              <h2>
                                 Your Assets
                              </h2>

                              <p>
                                 Saved securely to
                                 your account.
                              </p>
                           </div>

                           <span className="asset-count">
                              {mergedWatchlist.length}{" "}
                              {mergedWatchlist.length === 1
                                 ? "asset"
                                 : "assets"}
                           </span>

                        </div>


                        <div className="watchlist-search">

                           <Search
                              size={17}
                              aria-hidden="true"
                           />

                           <input
                              type="search"
                              value={search}
                              onChange={(event) =>
                                 setSearch(
                                    event.target.value
                                 )
                              }
                              placeholder="Search saved assets..."
                              aria-label="Search saved assets"
                           />

                           {search && (
                              <button
                                 type="button"
                                 className="clear-search"
                                 onClick={() =>
                                    setSearch("")
                                 }
                                 aria-label="Clear search"
                              >
                                 <X size={15} />
                              </button>
                           )}

                        </div>

                     </div>


                     {filteredWatchlist.length ===
                        0 ? (

                        <div className="no-search-results">

                           <Search size={28} />

                           <strong>
                              No matching assets
                           </strong>

                           <p>
                              Try another coin name
                              or symbol.
                           </p>

                           <button
                              type="button"
                              onClick={() =>
                                 setSearch("")
                              }
                           >
                              Clear search
                           </button>

                        </div>

                     ) : (

                        <>

                           {/* Desktop header */}

                           <div className="watchlist-table-header">

                              <span>
                                 Asset
                              </span>

                              <span>
                                 Price
                              </span>

                              <span>
                                 24h Change
                              </span>

                              <span>
                                 Market Cap
                              </span>

                              <span>
                                 Action
                              </span>

                           </div>


                           {/* Assets */}

                           <div className="watchlist-coins">

                              {filteredWatchlist.map(
                                 (coin) => {

                                    const change =
                                       Number(
                                          coin.price_change_percentage_24h
                                       ) || 0;

                                    const isPositive =
                                       change >= 0;

                                    const isRemoving =
                                       removingCoinId ===
                                       coin.coinId;

                                    return (
                                       <article
                                          key={
                                             coin.coinId
                                          }
                                          className={`watchlist-coin-card ${isRemoving
                                                ? "is-removing"
                                                : ""
                                             }`}
                                          onClick={() =>
                                             openCoin(
                                                coin.coinId
                                             )
                                          }
                                          onKeyDown={(
                                             event
                                          ) =>
                                             handleCardKeyDown(
                                                event,
                                                coin.coinId
                                             )
                                          }
                                          role="button"
                                          tabIndex={0}
                                          aria-label={`Open ${coin.coin} details`}
                                       >

                                          {/* =================================
                                              ASSET
                                          ================================= */}

                                          <div className="watchlist-coin-main">

                                             <div className="coin-avatar">

                                                {coin.image ? (
                                                   <img
                                                      src={
                                                         coin.image
                                                      }
                                                      alt=""
                                                      loading="lazy"
                                                      onError={(
                                                         event
                                                      ) => {
                                                         event.currentTarget.style.display =
                                                            "none";
                                                         event.currentTarget.nextElementSibling.style.display =
                                                            "flex";
                                                      }}
                                                   />
                                                ) : null}

                                                <span
                                                   className="coin-avatar-fallback"
                                                   style={{
                                                      display:
                                                         coin.image
                                                            ? "none"
                                                            : "flex",
                                                   }}
                                                >
                                                   {coin.symbol
                                                      ?.slice(
                                                         0,
                                                         1
                                                      )
                                                      ?.toUpperCase() ||
                                                      "?"}
                                                </span>

                                             </div>


                                             <div className="watchlist-coin-name">

                                                <div className="watchlist-name-line">

                                                   <strong>
                                                      {
                                                         coin.coin
                                                      }
                                                   </strong>

                                                   {coin.market_cap_rank && (
                                                      <span className="coin-rank">
                                                         #
                                                         {
                                                            coin.market_cap_rank
                                                         }
                                                      </span>
                                                   )}

                                                </div>

                                                <span className="coin-symbol">
                                                   {coin.symbol ||
                                                      "—"}
                                                </span>

                                             </div>

                                          </div>


                                          {/* =================================
                                              PRICE
                                          ================================= */}

                                          <div className="watchlist-price-cell">

                                             <span className="mobile-cell-label">
                                                Price
                                             </span>

                                             <strong>
                                                {formatUSD(
                                                   coin.current_price
                                                )}
                                             </strong>

                                          </div>


                                          {/* =================================
                                              CHANGE
                                          ================================= */}

                                          <div
                                             className={`watchlist-change ${isPositive
                                                   ? "positive"
                                                   : "negative"
                                                }`}
                                          >

                                             <span className="mobile-cell-label">
                                                24h
                                             </span>

                                             <span className="change-pill">

                                                {isPositive ? (
                                                   <TrendingUp
                                                      size={
                                                         14
                                                      }
                                                   />
                                                ) : (
                                                   <TrendingDown
                                                      size={
                                                         14
                                                      }
                                                   />
                                                )}

                                                {formatPercentage(
                                                   change
                                                )}

                                             </span>

                                          </div>


                                          {/* =================================
                                              MARKET CAP
                                          ================================= */}

                                          <div className="watchlist-market-cap">

                                             <span className="mobile-cell-label">
                                                Market Cap
                                             </span>

                                             <strong>
                                                {coin.market_cap >
                                                   0
                                                   ? `$${formatCompact(
                                                      coin.market_cap
                                                   )}`
                                                   : "—"}
                                             </strong>

                                          </div>


                                          {/* =================================
                                              ACTION
                                          ================================= */}

                                          <div className="watchlist-action">

                                             <button
                                                type="button"
                                                className="watchlist-remove-btn"
                                                onClick={(
                                                   event
                                                ) =>
                                                   removeFromWatchlist(
                                                      event,
                                                      coin.coinId
                                                   )
                                                }
                                                disabled={
                                                   isRemoving
                                                }
                                                aria-label={`Remove ${coin.coin} from watchlist`}
                                                title="Remove from watchlist"
                                             >

                                                {isRemoving ? (
                                                   <span className="remove-spinner" />
                                                ) : (
                                                   <Trash2
                                                      size={
                                                         17
                                                      }
                                                   />
                                                )}

                                             </button>

                                          </div>

                                          <div className="coin-row-arrow">
                                             <ChevronRight
                                                size={
                                                   17
                                                }
                                             />
                                          </div>

                                       </article>
                                    );
                                 }
                              )}

                           </div>

                        </>

                     )}

                  </div>

               )}

            </section>


            {/* =================================================
                FOOTER NOTE
            ================================================= */}

            {mergedWatchlist.length > 0 && (
               <div className="watchlist-footer-note">

                  <Eye size={15} />

                  <span>
                     Prices are updated from live
                     market data. Your saved assets
                     are securely linked to your account.
                  </span>

                  {negativeCount > 0 && (
                     <span className="footer-market-note">
                        {negativeCount}{" "}
                        {negativeCount === 1
                           ? "asset"
                           : "assets"}{" "}
                        down today
                     </span>
                  )}

               </div>
            )}

         </main>

      </div>
   );
};


export default Watchlist;