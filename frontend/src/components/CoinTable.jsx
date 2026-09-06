import React from "react";
import PriceChart from "./PriceChart";


// ========================================
// Format Price
// ========================================

const formatPrice = (price) => {
   if (
      price === null ||
      price === undefined ||
      Number.isNaN(Number(price))
   ) {
      return "—";
   }

   if (price >= 1) {
      return `$${Number(price).toLocaleString(
         "en-US",
         {
            maximumFractionDigits: 2,
         }
      )}`;
   }

   return `$${Number(price).toPrecision(4)}`;
};


// ========================================
// Format Market Cap
// ========================================

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


// ========================================
// Format Percentage
// ========================================

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


// ========================================
// Change Class
// ========================================

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


// ========================================
// Coin Table
// ========================================

const CoinTable = ({ coins = [] }) => {

   if (!coins.length) {
      return (
         <div className="coin-table-container">
            <p>No cryptocurrency data available.</p>
         </div>
      );
   }


   return (
      <div className="coin-table-container">

         <table className="coin-table">

            <thead>

               <tr>
                  <th>#</th>
                  <th>Coin</th>
                  <th>Price</th>
                  <th>1h</th>
                  <th>24h</th>
                  <th>7d</th>
                  <th>7D Chart</th>
                  <th>Market Cap</th>
               </tr>

            </thead>


            <tbody>

               {coins.map((coin, index) => {

                  const change1h =
                     coin.price_change_percentage_1h_in_currency;

                  const change24h =
                     coin.price_change_percentage_24h;

                  const change7d =
                     coin.price_change_percentage_7d_in_currency;


                  // ==================================
                  // Sparkline data
                  // ==================================

                  const chartData =
                     coin.sparkline_in_7d?.price || [];


                  return (

                     <tr key={coin.id}>

                        {/* Rank */}

                        <td className="coin-rank">
                           {coin.market_cap_rank ||
                              index + 1}
                        </td>


                        {/* Coin */}

                        <td>

                           <div className="coin-info">

                              <img
                                 src={coin.image}
                                 alt={coin.name}
                                 className="coin-image"
                              />

                              <div>

                                 <div className="coin-name">
                                    {coin.name}
                                 </div>

                                 <div className="coin-symbol">
                                    {coin.symbol?.toUpperCase()}
                                 </div>

                              </div>

                           </div>

                        </td>


                        {/* Price */}

                        <td className="coin-price">

                           {formatPrice(
                              coin.current_price
                           )}

                        </td>


                        {/* 1 Hour */}

                        <td
                           className={getChangeClass(
                              change1h
                           )}
                        >

                           {formatPercentage(
                              change1h
                           )}

                        </td>


                        {/* 24 Hour */}

                        <td
                           className={getChangeClass(
                              change24h
                           )}
                        >

                           {formatPercentage(
                              change24h
                           )}

                        </td>


                        {/* 7 Day */}

                        <td
                           className={getChangeClass(
                              change7d
                           )}
                        >

                           {formatPercentage(
                              change7d
                           )}

                        </td>


                        {/* 7 Day Chart */}

                        <td className="coin-chart-cell">

                           {chartData.length > 0 ? (

                              <PriceChart
                                 data={chartData}
                                 change={change7d}
                              />

                           ) : (

                              <span>
                                 —
                              </span>

                           )}

                        </td>


                        {/* Market Cap */}

                        <td className="market-cap">

                           {formatMarketCap(
                              coin.market_cap
                           )}

                        </td>

                     </tr>

                  );

               })}

            </tbody>

         </table>

      </div>
   );
};


export default CoinTable;