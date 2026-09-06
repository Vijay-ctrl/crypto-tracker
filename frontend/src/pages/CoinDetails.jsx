import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
   ArrowLeft,
   RefreshCw,
   TrendingUp,
   TrendingDown,
   Star,
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import api from "../services/api";


const formatPrice = (price) => {
   if (
      price === null ||
      price === undefined ||
      Number.isNaN(Number(price))
   ) {
      return "—";
   }

   const value = Number(price);

   if (value >= 1) {
      return `$${value.toLocaleString("en-US", {
         maximumFractionDigits: 2,
      })}`;
   }

   return `$${value.toPrecision(4)}`;
};


const formatPercentage = (value) => {
   if (
      value === null ||
      value === undefined ||
      Number.isNaN(Number(value))
   ) {
      return "—";
   }

   return `${Number(value).toFixed(2)}%`;
};


const formatMarketCap = (value) => {
   if (
      value === null ||
      value === undefined ||
      Number.isNaN(Number(value))
   ) {
      return "—";
   }

   const number = Number(value);

   if (number >= 1e12) {
      return `$${(number / 1e12).toFixed(2)}T`;
   }

   if (number >= 1e9) {
      return `$${(number / 1e9).toFixed(2)}B`;
   }

   if (number >= 1e6) {
      return `$${(number / 1e6).toFixed(2)}M`;
   }

   return `$${number.toLocaleString("en-US")}`;
};


const formatVolume = (value) => {
   if (
      value === null ||
      value === undefined ||
      Number.isNaN(Number(value))
   ) {
      return "—";
   }

   const number = Number(value);

   if (number >= 1e12) {
      return `$${(number / 1e12).toFixed(2)}T`;
   }

   if (number >= 1e9) {
      return `$${(number / 1e9).toFixed(2)}B`;
   }

   if (number >= 1e6) {
      return `$${(number / 1e6).toFixed(2)}M`;
   }

   if (number >= 1e3) {
      return `$${(number / 1e3).toFixed(2)}K`;
   }

   return `$${number.toLocaleString("en-US")}`;
};


const getChangeClass = (value) => {
   const number = Number(value);

   if (number > 0) {
      return "positive";
   }

   if (number < 0) {
      return "negative";
   }

   return "";
};


const CoinDetails = () => {
   const { id } = useParams();
   const navigate = useNavigate();

   const [coin, setCoin] = useState(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");
   const [refreshing, setRefreshing] = useState(false);

   const fetchCoin = async (isRefresh = false) => {
      try {
         if (isRefresh) {
            setRefreshing(true);
         } else {
            setLoading(true);
         }

         setError("");

         const response = await api.get(
            `/price/${id}`
         );

         setCoin(response.data);
      } catch (error) {
         console.error(
            "Coin details error:",
            error
         );

         setCoin(null);

         setError(
            "Unable to load coin information."
         );
      } finally {
         setLoading(false);
         setRefreshing(false);
      }
   };


   useEffect(() => {
      fetchCoin();
   }, [id]);


   if (loading) {
      return (
         <div className="app">
            <Sidebar />

            <div className="main-area">
               <Navbar />

               <main className="dashboard-page">
                  <div className="dashboard-loading">
                     Loading coin...
                  </div>
               </main>
            </div>
         </div>
      );
   }


   if (error || !coin) {
      return (
         <div className="app">
            <Sidebar />

            <div className="main-area">
               <Navbar />

               <main className="dashboard-page">

                  <button
                     className="coin-back-button"
                     onClick={() =>
                        navigate("/markets")
                     }
                  >
                     <ArrowLeft size={17} />
                     Back to Markets
                  </button>

                  <div className="coin-error-state">
                     <h2>
                        Coin not found
                     </h2>

                     <p>
                        {error ||
                           "The requested cryptocurrency could not be found."}
                     </p>

                     <button
                        className="primary-button coin-retry-button"
                        onClick={() =>
                           fetchCoin()
                        }
                     >
                        <RefreshCw size={16} />
                        Try Again
                     </button>
                  </div>

               </main>
            </div>
         </div>
      );
   }


   /*
    * Your current /price/:id response uses
    * price_usd, name and symbol.
    *
    * The additional fields below are read only
    * if your backend already provides them.
    */

   const price =
      coin.price_usd ??
      coin.current_price;

   const change1h =
      coin.price_change_percentage_1h_in_currency;

   const change24h =
      coin.price_change_percentage_24h ??
      coin.change_24h;

   const change7d =
      coin.price_change_percentage_7d_in_currency ??
      coin.change_7d;

   const marketCap =
      coin.market_cap;

   const volume =
      coin.total_volume ??
      coin.volume_24h;


   return (
      <div className="app">
         <Sidebar />

         <div className="main-area">
            <Navbar />

            <main className="dashboard-page coin-details-page">

               {/* Back */}
               <button
                  className="coin-back-button"
                  onClick={() =>
                     navigate("/markets")
                  }
               >
                  <ArrowLeft size={17} />
                  Back to Markets
               </button>


               {/* Header */}
               <div className="coin-details-header">

                  <div className="coin-title-section">

                     {coin.image ? (
                        <img
                           src={coin.image}
                           alt={coin.name}
                           className="coin-details-image"
                        />
                     ) : (
                        <div className="coin-details-image-placeholder">
                           {coin.symbol
                              ?.charAt(0)
                              ?.toUpperCase() || "?"}
                        </div>
                     )}

                     <div>
                        <div className="coin-name-row">

                           <h1>
                              {coin.name ||
                                 "Unknown Coin"}
                           </h1>

                           <span className="coin-symbol-badge">
                              {coin.symbol?.toUpperCase() ||
                                 "—"}
                           </span>

                        </div>

                        <p>
                           Cryptocurrency market
                           information
                        </p>
                     </div>

                  </div>


                  <div className="coin-header-actions">

                     <button
                        className="coin-watch-button"
                        title="Add to watchlist"
                     >
                        <Star size={17} />
                        Watchlist
                     </button>

                     <button
                        className="refresh-button"
                        onClick={() =>
                           fetchCoin(true)
                        }
                        disabled={refreshing}
                     >
                        <RefreshCw
                           size={17}
                           className={
                              refreshing
                                 ? "spinning"
                                 : ""
                           }
                        />

                        {refreshing
                           ? "Refreshing..."
                           : "Refresh"}
                     </button>

                  </div>

               </div>


               {/* Main Price Card */}
               <section className="coin-price-card">

                  <div>
                     <span className="coin-card-label">
                        Current Price
                     </span>

                     <h2>
                        {formatPrice(price)}
                     </h2>
                  </div>

                  {change24h !== null &&
                     change24h !== undefined && (
                        <div
                           className={`coin-price-change ${getChangeClass(
                              change24h
                           )}`}
                        >
                           {Number(change24h) > 0 ? (
                              <TrendingUp
                                 size={18}
                              />
                           ) : Number(
                              change24h
                           ) < 0 ? (
                              <TrendingDown
                                 size={18}
                              />
                           ) : null}

                           <span>
                              {formatPercentage(
                                 change24h
                              )}
                           </span>

                           <small>
                              24h
                           </small>
                        </div>
                     )}

               </section>


               {/* Statistics */}
               <section className="coin-statistics">

                  <div className="coin-stat-card">

                     <span>
                        1h Change
                     </span>

                     <strong
                        className={getChangeClass(
                           change1h
                        )}
                     >
                        {formatPercentage(
                           change1h
                        )}
                     </strong>

                  </div>


                  <div className="coin-stat-card">

                     <span>
                        24h Change
                     </span>

                     <strong
                        className={getChangeClass(
                           change24h
                        )}
                     >
                        {formatPercentage(
                           change24h
                        )}
                     </strong>

                  </div>


                  <div className="coin-stat-card">

                     <span>
                        7d Change
                     </span>

                     <strong
                        className={getChangeClass(
                           change7d
                        )}
                     >
                        {formatPercentage(
                           change7d
                        )}
                     </strong>

                  </div>


                  <div className="coin-stat-card">

                     <span>
                        Market Cap
                     </span>

                     <strong>
                        {formatMarketCap(
                           marketCap
                        )}
                     </strong>

                  </div>


                  <div className="coin-stat-card">

                     <span>
                        24h Volume
                     </span>

                     <strong>
                        {formatVolume(
                           volume
                        )}
                     </strong>

                  </div>

               </section>


               {/* Overview */}
               <section className="coin-overview-card">

                  <div className="section-header">

                     <div>
                        <h2>
                           Market Overview
                        </h2>

                        <p>
                           Key information about{" "}
                           {coin.name}
                        </p>
                     </div>

                  </div>


                  <div className="coin-overview-grid">

                     <div>
                        <span>
                           Cryptocurrency
                        </span>

                        <strong>
                           {coin.name || "—"}
                        </strong>
                     </div>


                     <div>
                        <span>
                           Symbol
                        </span>

                        <strong>
                           {coin.symbol
                              ?.toUpperCase() ||
                              "—"}
                        </strong>
                     </div>


                     <div>
                        <span>
                           Current Price
                        </span>

                        <strong>
                           {formatPrice(price)}
                        </strong>
                     </div>


                     <div>
                        <span>
                           Market Cap
                        </span>

                        <strong>
                           {formatMarketCap(
                              marketCap
                           )}
                        </strong>
                     </div>

                  </div>

               </section>

            </main>
         </div>
      </div>
   );
};


export default CoinDetails;