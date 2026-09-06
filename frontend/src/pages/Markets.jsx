import {
   useCallback,
   useEffect,
   useMemo,
   useState,
} from "react";

import { useNavigate } from "react-router-dom";

import api from "../services/api";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import "./Markets.css";


const COINS_PER_PAGE = 10;


/* =========================================================
   FORMATTERS
========================================================= */

const formatUSD = (value) => {
   const number = Number(value);

   if (!Number.isFinite(number)) {
      return "$0.00";
   }

   if (number >= 1) {
      return number.toLocaleString(
         "en-US",
         {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 2,
         }
      );
   }

   return `$${number.toLocaleString(
      "en-US",
      {
         minimumFractionDigits: 2,
         maximumFractionDigits: 8,
      }
   )}`;
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

   if (!Number.isFinite(number)) {
      return "0";
   }

   return new Intl.NumberFormat(
      "en-US",
      {
         notation: "compact",
         maximumFractionDigits: 2,
      }
   ).format(number);
};


/* =========================================================
   MARKETS COMPONENT
========================================================= */

const Markets = () => {
   const navigate = useNavigate();


   /* ======================================================
      MARKET DATA
   ====================================================== */

   const [coins, setCoins] = useState([]);

   const [loading, setLoading] =
      useState(true);

   const [refreshing, setRefreshing] =
      useState(false);

   const [error, setError] =
      useState("");


   /* ======================================================
      PAGINATION
   ====================================================== */

   const [page, setPage] =
      useState(1);

   const [hasPrevious, setHasPrevious] =
      useState(false);

   const [hasNext, setHasNext] =
      useState(false);


   /* ======================================================
      SEARCH
   ====================================================== */

   const [search, setSearch] =
      useState("");


   /* ======================================================
      SORTING
   ====================================================== */

   const [sortConfig, setSortConfig] =
      useState({
         key: null,
         direction: null,
      });


   /* ======================================================
      WATCHLIST
   ====================================================== */

   const [watchlist, setWatchlist] =
      useState([]);

   const [watchlistAction, setWatchlistAction] =
      useState(null);

   const [watchlistError, setWatchlistError] =
      useState("");


   /* ======================================================
      LOAD WATCHLIST FROM MONGODB
   ====================================================== */

   const loadWatchlist =
      useCallback(
         async () => {
            try {
               setWatchlistError("");

               const response =
                  await api.get(
                     "/watchlist"
                  );

               const savedWatchlist =
                  Array.isArray(
                     response.data?.watchlist
                  )
                     ? response.data.watchlist
                     : [];

               setWatchlist(
                  savedWatchlist
               );

            } catch (error) {
               console.error(
                  "Failed to load watchlist:",
                  error
               );

               if (
                  error.response?.status ===
                  401
               ) {
                  setWatchlistError(
                     "Please log in to use your watchlist."
                  );
               } else {
                  setWatchlistError(
                     "Unable to load your watchlist."
                  );
               }

               setWatchlist([]);
            }
         },
         []
      );


   /* ======================================================
      INITIAL WATCHLIST LOAD
   ====================================================== */

   useEffect(() => {
      loadWatchlist();
   }, [loadWatchlist]);


   /* ======================================================
      FETCH MARKET DATA
   ====================================================== */

   const fetchMarkets =
      useCallback(
         async (
            requestedPage = 1,
            showRefreshLoader = false
         ) => {
            try {
               if (
                  showRefreshLoader
               ) {
                  setRefreshing(
                     true
                  );
               } else {
                  setLoading(
                     true
                  );
               }

               setError("");

               const response =
                  await api.get(
                     `/market/coins?page=${requestedPage}&limit=${COINS_PER_PAGE}`
                  );

               const data =
                  response.data || {};

               const marketCoins =
                  Array.isArray(
                     data.coins
                  )
                     ? data.coins
                     : [];

               setCoins(
                  marketCoins
               );

               setPage(
                  Number(
                     data.page
                  ) ||
                  requestedPage
               );

               setHasPrevious(
                  Boolean(
                     data.hasPrevious ??
                     requestedPage > 1
                  )
               );

               setHasNext(
                  Boolean(
                     data.hasNext ??
                     data.hasMore ??
                     marketCoins.length ===
                     COINS_PER_PAGE
                  )
               );

            } catch (
            fetchError
            ) {
               console.error(
                  "Failed to fetch markets:",
                  fetchError
               );

               setError(
                  fetchError
                     .response?.data
                     ?.message ||
                  "Unable to load market data. Please try again."
               );

               setCoins([]);

            } finally {
               setLoading(false);
               setRefreshing(false);
            }
         },
         []
      );


   /* ======================================================
      INITIAL MARKET LOAD
   ====================================================== */

   useEffect(() => {
      fetchMarkets(1);
   }, [fetchMarkets]);


   /* ======================================================
      PAGE NAVIGATION
   ====================================================== */

   const goToPreviousPage =
      () => {
         if (
            page <= 1 ||
            !hasPrevious ||
            loading ||
            refreshing
         ) {
            return;
         }

         const nextPage =
            page - 1;

         setSearch("");

         setSortConfig({
            key: null,
            direction: null,
         });

         fetchMarkets(
            nextPage
         );

         window.scrollTo({
            top: 0,
            behavior: "smooth",
         });
      };


   const goToNextPage =
      () => {
         if (
            !hasNext ||
            loading ||
            refreshing
         ) {
            return;
         }

         const nextPage =
            page + 1;

         setSearch("");

         setSortConfig({
            key: null,
            direction: null,
         });

         fetchMarkets(
            nextPage
         );

         window.scrollTo({
            top: 0,
            behavior: "smooth",
         });
      };


   /* ======================================================
      REFRESH
   ====================================================== */

   const handleRefresh =
      () => {
         fetchMarkets(
            page,
            true
         );

         loadWatchlist();
      };


   /* ======================================================
      WATCHLIST CHECK
   ====================================================== */

   const isInWatchlist =
      (coinId) => {
         return watchlist.some(
            (item) =>
               item.coinId === coinId ||
               item.id === coinId
         );
      };


   /* ======================================================
      ADD / REMOVE WATCHLIST
   ====================================================== */

   const toggleWatchlist =
      async (
         event,
         coin
      ) => {
         event.stopPropagation();

         const coinId =
            coin?.id;

         if (!coinId) {
            return;
         }

         const exists =
            isInWatchlist(
               coinId
            );

         try {
            setWatchlistAction(
               coinId
            );

            setWatchlistError("");


            /* ============================================
               REMOVE
            ============================================ */

            if (exists) {
               await api.delete(
                  `/watchlist/${encodeURIComponent(
                     coinId
                  )}`
               );

               setWatchlist(
                  (current) =>
                     current.filter(
                        (item) =>
                           item.coinId !==
                           coinId &&
                           item.id !==
                           coinId
                     )
               );

               return;
            }


            /* ============================================
               ADD
            ============================================ */

            const response =
               await api.post(
                  "/watchlist",
                  {
                     coinId:
                        coin.id,

                     coin:
                        coin.name ||
                        "",

                     symbol:
                        coin.symbol
                           ?.toUpperCase() ||
                        "",

                     image:
                        coin.image ||
                        "",
                  }
               );


            const savedWatchlist =
               response.data?.watchlist;

            if (
               Array.isArray(
                  savedWatchlist
               )
            ) {
               setWatchlist(
                  savedWatchlist
               );
            } else {
               setWatchlist(
                  (current) => [
                     ...current,
                     {
                        coinId:
                           coin.id,

                        coin:
                           coin.name ||
                           "",

                        symbol:
                           coin.symbol
                              ?.toUpperCase() ||
                           "",

                        image:
                           coin.image ||
                           "",
                     },
                  ]
               );
            }

         } catch (error) {
            console.error(
               "Failed to update watchlist:",
               error
            );

            if (
               error.response?.status ===
               401
            ) {
               setWatchlistError(
                  "Please log in to add coins to your watchlist."
               );
            } else {
               setWatchlistError(
                  error.response?.data?.message ||
                  error.response?.data?.error ||
                  "Unable to update watchlist. Please try again."
               );
            }

         } finally {
            setWatchlistAction(
               null
            );
         }
      };


   /* ======================================================
      FILTER + SORT
   ====================================================== */

   const filteredCoins =
      useMemo(() => {
         const query =
            search
               .trim()
               .toLowerCase();

         let result =
            coins.filter(
               (coin) => {
                  if (!query) {
                     return true;
                  }

                  return (
                     coin.name
                        ?.toLowerCase()
                        .includes(
                           query
                        ) ||
                     coin.symbol
                        ?.toLowerCase()
                        .includes(
                           query
                        )
                  );
               }
            );


         if (
            !sortConfig.key
         ) {
            return result;
         }


         result.sort(
            (a, b) => {
               let valueA;
               let valueB;


               switch (
               sortConfig.key
               ) {
                  case "name":
                     valueA =
                        a.name
                           ?.toLowerCase() ||
                        "";

                     valueB =
                        b.name
                           ?.toLowerCase() ||
                        "";

                     break;


                  case "price":
                     valueA =
                        Number(
                           a.current_price
                        ) || 0;

                     valueB =
                        Number(
                           b.current_price
                        ) || 0;

                     break;


                  case "change":
                     valueA =
                        Number(
                           a.price_change_percentage_24h
                        ) || 0;

                     valueB =
                        Number(
                           b.price_change_percentage_24h
                        ) || 0;

                     break;


                  case "market_cap":
                     valueA =
                        Number(
                           a.market_cap
                        ) || 0;

                     valueB =
                        Number(
                           b.market_cap
                        ) || 0;

                     break;


                  default:
                     return 0;
               }


               if (
                  typeof valueA ===
                  "string"
               ) {
                  return (
                     sortConfig.direction ===
                        "asc"
                        ? valueA.localeCompare(
                           valueB
                        )
                        : valueB.localeCompare(
                           valueA
                        )
                  );
               }


               return (
                  sortConfig.direction ===
                     "asc"
                     ? valueA - valueB
                     : valueB - valueA
               );
            }
         );


         return result;

      }, [
         coins,
         search,
         sortConfig,
      ]);


   /* ======================================================
      SORT HANDLER
   ====================================================== */

   const handleSort =
      (key) => {
         setSortConfig(
            (current) => {
               if (
                  current.key !==
                  key
               ) {
                  return {
                     key,
                     direction:
                        "asc",
                  };
               }

               if (
                  current.direction ===
                  "asc"
               ) {
                  return {
                     key,
                     direction:
                        "desc",
                  };
               }

               return {
                  key: null,
                  direction: null,
               };
            }
         );
      };


   const getSortArrow =
      (key) => {
         if (
            sortConfig.key !==
            key
         ) {
            return "↕";
         }

         return sortConfig.direction ===
            "asc"
            ? "↑"
            : "↓";
      };


   /* ======================================================
      SUMMARY
   ====================================================== */

   const summary =
      useMemo(() => {
         const totalMarketCap =
            coins.reduce(
               (sum, coin) =>
                  sum +
                  (
                     Number(
                        coin.market_cap
                     ) || 0
                  ),
               0
            );


         const changes =
            coins
               .map(
                  (coin) =>
                     Number(
                        coin.price_change_percentage_24h
                     )
               )
               .filter(
                  Number.isFinite
               );


         const averageChange =
            changes.length
               ? changes.reduce(
                  (
                     sum,
                     value
                  ) =>
                     sum + value,
                  0
               ) /
               changes.length
               : 0;


         const gainers =
            coins.filter(
               (coin) =>
                  Number(
                     coin.price_change_percentage_24h
                  ) > 0
            ).length;


         const losers =
            coins.filter(
               (coin) =>
                  Number(
                     coin.price_change_percentage_24h
                  ) < 0
            ).length;


         return {
            totalMarketCap,
            averageChange,
            gainers,
            losers,
         };

      }, [coins]);


   /* ======================================================
      LOADING SCREEN
   ====================================================== */

   if (
      loading &&
      coins.length === 0
   ) {
      return (
         <div className="markets-loading-page">

            <Sidebar />

            <Navbar />

            <main className="markets-loading-content">

               <div className="markets-loading-spinner" />

               <h2>
                  Loading market data
               </h2>

               <p>
                  Fetching the latest
                  cryptocurrency prices...
               </p>

            </main>

         </div>
      );
   }


   /* ======================================================
      MAIN UI
   ====================================================== */

   return (
      <div className="markets-page">

         <Sidebar />

         <Navbar />


         <main className="markets-content">

            {/* HEADER */}

            <header className="markets-header">

               <div>

                  <div className="markets-eyebrow">
                     Live Crypto Markets
                  </div>

                  <h1>
                     Markets
                  </h1>

                  <p>
                     Explore the latest
                     cryptocurrency prices,
                     market movements and
                     trading activity.
                  </p>

               </div>


               <button
                  type="button"
                  className="refresh-markets-btn"
                  onClick={
                     handleRefresh
                  }
                  disabled={
                     refreshing
                  }
               >

                  <span
                     className={`refresh-icon ${refreshing
                        ? "spinning"
                        : ""
                        }`}
                  >
                     ↻
                  </span>

                  {refreshing
                     ? "Refreshing..."
                     : "Refresh"}

               </button>

            </header>


            {/* ERROR */}

            {error && (
               <div className="markets-error">

                  <div>

                     <strong>
                        Market data unavailable
                     </strong>

                     <p>
                        {error}
                     </p>

                  </div>


                  <button
                     type="button"
                     onClick={() =>
                        fetchMarkets(
                           page,
                           true
                        )
                     }
                  >
                     Try again
                  </button>

               </div>
            )}


            {/* WATCHLIST ERROR */}

            {watchlistError && (
               <div className="markets-error watchlist-api-error">

                  <div>

                     <strong>
                        Watchlist
                     </strong>

                     <p>
                        {watchlistError}
                     </p>

                  </div>

                  <button
                     type="button"
                     onClick={
                        loadWatchlist
                     }
                  >
                     Retry
                  </button>

               </div>
            )}


            {/* SUMMARY */}

            <section className="market-summary-grid">

               <article className="market-summary-card">

                  <div className="summary-icon">
                     $
                  </div>

                  <div>

                     <span>
                        Visible Market Cap
                     </span>

                     <strong>
                        $
                        {formatCompact(
                           summary.totalMarketCap
                        )}
                     </strong>

                  </div>

               </article>


               <article className="market-summary-card">

                  <div className="summary-icon">
                     %
                  </div>

                  <div>

                     <span>
                        Avg. 24h Change
                     </span>

                     <strong
                        className={
                           summary.averageChange >=
                              0
                              ? "positive"
                              : "negative"
                        }
                     >
                        {formatPercentage(
                           summary.averageChange
                        )}
                     </strong>

                  </div>

               </article>


               <article className="market-summary-card">

                  <div className="summary-icon">
                     ↑
                  </div>

                  <div>

                     <span>
                        Gainers
                     </span>

                     <strong>
                        {summary.gainers}
                     </strong>

                  </div>

               </article>


               <article className="market-summary-card">

                  <div className="summary-icon">
                     ↓
                  </div>

                  <div>

                     <span>
                        Losers
                     </span>

                     <strong>
                        {summary.losers}
                     </strong>

                  </div>

               </article>

            </section>


            {/* MARKET TABLE */}

            <section className="markets-table-card">

               <div className="markets-table-toolbar">

                  <div>

                     <h2>
                        Cryptocurrency Markets
                     </h2>

                     <p>
                        Page{" "}
                        <strong>
                           {page}
                        </strong>{" "}
                        • Showing{" "}
                        <strong>
                           {filteredCoins.length}
                        </strong>{" "}
                        of{" "}
                        <strong>
                           {coins.length}
                        </strong>{" "}
                        coins
                     </p>

                  </div>


                  <div className="markets-search">

                     <span>
                        ⌕
                     </span>

                     <input
                        type="text"
                        value={search}
                        onChange={(
                           event
                        ) =>
                           setSearch(
                              event.target.value
                           )
                        }
                        placeholder="Search coin or symbol..."
                        aria-label="Search coins"
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
                           ×
                        </button>
                     )}

                  </div>

               </div>


               {/* TABLE */}

               {filteredCoins.length > 0 ? (

                  <div className="markets-table-wrapper">

                     <table className="markets-table">

                        <thead>

                           <tr>

                              <th className="watchlist-column">

                                 <span className="sr-only">
                                    Watchlist
                                 </span>

                              </th>


                              <th>
                                 Rank
                              </th>


                              <th
                                 className="sortable-header"
                                 onClick={() =>
                                    handleSort(
                                       "name"
                                    )
                                 }
                              >
                                 Asset

                                 <span>
                                    {getSortArrow(
                                       "name"
                                    )}
                                 </span>

                              </th>


                              <th
                                 className="sortable-header"
                                 onClick={() =>
                                    handleSort(
                                       "price"
                                    )
                                 }
                              >
                                 Price

                                 <span>
                                    {getSortArrow(
                                       "price"
                                    )}
                                 </span>

                              </th>


                              <th
                                 className="sortable-header"
                                 onClick={() =>
                                    handleSort(
                                       "change"
                                    )
                                 }
                              >
                                 24h

                                 <span>
                                    {getSortArrow(
                                       "change"
                                    )}
                                 </span>

                              </th>


                              <th>
                                 High / Low
                              </th>


                              <th
                                 className="sortable-header"
                                 onClick={() =>
                                    handleSort(
                                       "market_cap"
                                    )
                                 }
                              >
                                 Market Cap

                                 <span>
                                    {getSortArrow(
                                       "market_cap"
                                    )}
                                 </span>

                              </th>


                              <th>
                                 Volume
                              </th>

                           </tr>

                        </thead>


                        <tbody>

                           {filteredCoins.map(
                              (
                                 coin,
                                 index
                              ) => {

                                 const change =
                                    Number(
                                       coin.price_change_percentage_24h
                                    ) || 0;


                                 const fallbackRank =
                                    (
                                       page -
                                       1
                                    ) *
                                    COINS_PER_PAGE +
                                    index +
                                    1;


                                 const rank =
                                    coin.market_cap_rank ??
                                    fallbackRank;


                                 const inWatchlist =
                                    isInWatchlist(
                                       coin.id
                                    );


                                 const isUpdating =
                                    watchlistAction ===
                                    coin.id;


                                 return (
                                    <tr
                                       key={
                                          coin.id
                                       }
                                       onClick={() =>
                                          navigate(
                                             `/markets/${coin.id}`
                                          )
                                       }
                                    >

                                       {/* WATCHLIST */}

                                       <td className="watchlist-column">

                                          <button
                                             type="button"
                                             className={`watchlist-star ${inWatchlist
                                                ? "active"
                                                : ""
                                                } ${isUpdating
                                                   ? "loading"
                                                   : ""
                                                }`}
                                             onClick={(
                                                event
                                             ) =>
                                                toggleWatchlist(
                                                   event,
                                                   coin
                                                )
                                             }
                                             disabled={
                                                isUpdating
                                             }
                                             aria-label={
                                                inWatchlist
                                                   ? `Remove ${coin.name} from watchlist`
                                                   : `Add ${coin.name} to watchlist`
                                             }
                                          >
                                             {isUpdating
                                                ? "⋯"
                                                : inWatchlist
                                                   ? "★"
                                                   : "☆"}
                                          </button>

                                       </td>


                                       {/* RANK */}

                                       <td>

                                          <span className="coin-rank">
                                             #
                                             {rank}
                                          </span>

                                       </td>


                                       {/* ASSET */}

                                       <td>

                                          <div className="market-asset">

                                             {coin.image ? (

                                                <img
                                                   src={
                                                      coin.image
                                                   }
                                                   alt=""
                                                   className="coin-image"
                                                   loading="lazy"
                                                />

                                             ) : (

                                                <div className="coin-image coin-image-fallback">
                                                   {coin.symbol
                                                      ?.slice(
                                                         0,
                                                         1
                                                      )
                                                      ?.toUpperCase()}
                                                </div>

                                             )}


                                             <div className="coin-info">

                                                <strong>
                                                   {
                                                      coin.name
                                                   }
                                                </strong>

                                                <span>
                                                   {coin.symbol?.toUpperCase()}
                                                </span>

                                             </div>

                                          </div>

                                       </td>


                                       {/* PRICE */}

                                       <td>

                                          <span className="coin-price">
                                             {formatUSD(
                                                coin.current_price
                                             )}
                                          </span>

                                       </td>


                                       {/* CHANGE */}

                                       <td>

                                          <span
                                             className={`price-change ${change >=
                                                0
                                                ? "positive"
                                                : "negative"
                                                }`}
                                          >
                                             {formatPercentage(
                                                change
                                             )}
                                          </span>

                                       </td>


                                       {/* HIGH LOW */}

                                       <td>

                                          <div className="high-low">

                                             <span>

                                                <small>
                                                   H
                                                </small>

                                                {formatUSD(
                                                   coin.high_24h
                                                )}

                                             </span>


                                             <span>

                                                <small>
                                                   L
                                                </small>

                                                {formatUSD(
                                                   coin.low_24h
                                                )}

                                             </span>

                                          </div>

                                       </td>


                                       {/* MARKET CAP */}

                                       <td>

                                          <span className="market-cap-value">
                                             $
                                             {formatCompact(
                                                coin.market_cap
                                             )}
                                          </span>

                                       </td>


                                       {/* VOLUME */}

                                       <td>

                                          <span className="volume-value">
                                             $
                                             {formatCompact(
                                                coin.total_volume
                                             )}
                                          </span>

                                       </td>

                                    </tr>
                                 );
                              }
                           )}

                        </tbody>

                     </table>

                  </div>

               ) : (

                  <div className="markets-empty">

                     <div className="empty-market-icon">
                        ⌕
                     </div>

                     <h3>
                        No coins found
                     </h3>

                     <p>
                        Try searching with
                        another coin name or
                        symbol.
                     </p>

                  </div>

               )}


               {/* PAGINATION */}

               <div className="markets-pagination">

                  <div className="pagination-info">

                     <span>
                        Showing
                     </span>

                     <strong>
                        {coins.length}
                     </strong>

                     <span>
                        coins
                     </span>

                     <span className="pagination-dot">
                        •
                     </span>

                     <span>
                        10 per page
                     </span>

                  </div>


                  <div className="pagination-controls">

                     <button
                        type="button"
                        className="pagination-btn"
                        onClick={
                           goToPreviousPage
                        }
                        disabled={
                           !hasPrevious ||
                           loading ||
                           refreshing
                        }
                     >

                        <span>
                           ←
                        </span>

                        Previous

                     </button>


                     <div
                        className="pagination-current"
                        aria-live="polite"
                     >

                        <span>
                           Page
                        </span>

                        <strong>
                           {page}
                        </strong>

                     </div>


                     <button
                        type="button"
                        className="pagination-btn pagination-next"
                        onClick={
                           goToNextPage
                        }
                        disabled={
                           !hasNext ||
                           loading ||
                           refreshing
                        }
                     >

                        Next

                        <span>
                           →
                        </span>

                     </button>

                  </div>

               </div>

            </section>


            {/* FOOTER */}

            <div className="markets-footer-note">

               <span />

               <p>
                  Live market data •
                  10 cryptocurrencies
                  displayed per page
               </p>

            </div>

         </main>

      </div>
   );
};


export default Markets;