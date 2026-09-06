import {
   TrendingUp,
   TrendingDown,
   DollarSign,
   BarChart3,
   Bitcoin,
   Coins,
} from "lucide-react";

import "./MarketStats.css";


/* =========================================================
   FORMAT LARGE NUMBERS
========================================================= */

const formatLargeNumber = (value) => {
   const number = Number(value);

   if (!Number.isFinite(number)) {
      return "—";
   }

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

   return `$${number.toLocaleString()}`;
};


/* =========================================================
   FORMAT PERCENTAGE
========================================================= */

const formatPercentage = (value) => {
   const number = Number(value);

   if (!Number.isFinite(number)) {
      return "—";
   }

   return `${number.toFixed(2)}%`;
};


/* =========================================================
   MARKET STATS
========================================================= */

const MarketStats = ({ overview }) => {

   if (!overview) {
      return null;
   }


   /* ======================================================
      SUPPORT BOTH:

      {
         marketCap,
         volume24h,
         ...
      }

      AND:

      {
         data: {
            marketCap,
            volume24h,
            ...
         }
      }
   ====================================================== */

   const data =
      overview?.data &&
         typeof overview.data === "object"
         ? overview.data
         : overview;


   const marketCap =
      Number(data?.marketCap);

   const marketVolume =
      Number(data?.volume24h);

   const marketCapChange =
      Number(data?.marketCapChange24h);

   const btcDominance =
      Number(data?.btcDominance);

   const activeCryptocurrencies =
      Number(data?.activeCryptocurrencies);

   const markets =
      Number(data?.markets);


   return (
      <section className="market-stats-grid">


         {/* =================================================
             TOTAL MARKET CAP
         ================================================= */}

         <div className="stat-card">

            <div className="stat-icon">
               <DollarSign size={22} />
            </div>

            <div className="stat-content">

               <span className="stat-label">
                  Total Market Cap
               </span>

               <h3>
                  {formatLargeNumber(
                     marketCap
                  )}
               </h3>

               <span
                  className={`stat-change ${Number.isFinite(
                     marketCapChange
                  ) &&
                        marketCapChange < 0
                        ? "negative"
                        : "positive"
                     }`}
               >

                  {Number.isFinite(
                     marketCapChange
                  ) &&
                     marketCapChange < 0 ? (
                     <TrendingDown size={15} />
                  ) : (
                     <TrendingUp size={15} />
                  )}

                  {Number.isFinite(
                     marketCapChange
                  )
                     ? formatPercentage(
                        Math.abs(
                           marketCapChange
                        )
                     )
                     : "—"}

                  <span>
                     24h
                  </span>

               </span>

            </div>

         </div>


         {/* =================================================
             24H TRADING VOLUME
         ================================================= */}

         <div className="stat-card">

            <div className="stat-icon">
               <BarChart3 size={22} />
            </div>

            <div className="stat-content">

               <span className="stat-label">
                  24h Trading Volume
               </span>

               <h3>
                  {formatLargeNumber(
                     marketVolume
                  )}
               </h3>

               <span className="stat-subtext">
                  Global market volume
               </span>

            </div>

         </div>


         {/* =================================================
             BTC DOMINANCE
         ================================================= */}

         <div className="stat-card">

            <div className="stat-icon">
               <Bitcoin size={22} />
            </div>

            <div className="stat-content">

               <span className="stat-label">
                  BTC Dominance
               </span>

               <h3>
                  {Number.isFinite(
                     btcDominance
                  )
                     ? formatPercentage(
                        btcDominance
                     )
                     : "—"}
               </h3>

               <span className="stat-subtext">
                  Bitcoin market share
               </span>

            </div>

         </div>


         {/* =================================================
             ACTIVE CRYPTOCURRENCIES
         ================================================= */}

         <div className="stat-card">

            <div className="stat-icon">
               <Coins size={22} />
            </div>

            <div className="stat-content">

               <span className="stat-label">
                  Active Cryptocurrencies
               </span>

               <h3>
                  {Number.isFinite(
                     activeCryptocurrencies
                  )
                     ? activeCryptocurrencies.toLocaleString()
                     : "—"}
               </h3>

               <span className="stat-subtext">

                  Across{" "}

                  {Number.isFinite(
                     markets
                  )
                     ? markets.toLocaleString()
                     : "—"}

                  {" "}markets

               </span>

            </div>

         </div>


      </section>
   );
};


export default MarketStats;