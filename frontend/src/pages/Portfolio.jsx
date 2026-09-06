import React, {
   useEffect,
   useMemo,
   useRef,
   useState,
} from "react";

import "./Portfolio.css";


/* =========================================================
   API CONFIGURATION
========================================================= */

const API_BASE_URL = (
   import.meta.env.VITE_API_URL ||
   "http://localhost:4000"
)
   .replace(/\/+$/, "")
   .replace(/\/api$/, "");

const API_PORTFOLIO_URL =
   `${API_BASE_URL}/api/portfolio`;

const API_MARKET_URL =
   `${API_BASE_URL}/api/market`;


/* =========================================================
   RESPONSE HELPER
========================================================= */

const parseResponse = async (response) => {
   const contentType =
      response.headers.get("content-type") || "";

   let data = null;

   if (
      contentType.includes(
         "application/json"
      )
   ) {
      data = await response.json();
   }

   if (!response.ok) {
      throw new Error(
         data?.message ||
         data?.error ||
         `Request failed (${response.status})`
      );
   }

   if (!data) {
      throw new Error(
         "Server returned an invalid response."
      );
   }

   return data;
};


/* =========================================================
   FORMATTERS
========================================================= */

const formatCurrency = (value) => {
   const number =
      Number(value) || 0;

   return new Intl.NumberFormat(
      "en-US",
      {
         style: "currency",
         currency: "USD",
         minimumFractionDigits:
            number >= 1 ? 2 : 4,
         maximumFractionDigits:
            number >= 1 ? 2 : 6,
      }
   ).format(number);
};


const formatPercent = (value) => {
   const number =
      Number(value) || 0;

   return `${number >= 0 ? "+" : ""
      }${number.toFixed(2)}%`;
};


const formatQuantity = (value) => {
   const number =
      Number(value) || 0;

   return number.toLocaleString(
      "en-US",
      {
         maximumFractionDigits: 8,
      }
   );
};


/* =========================================================
   PORTFOLIO COMPONENT
========================================================= */

const Portfolio = () => {

   /* ======================================================
      PORTFOLIO STATE
   ====================================================== */

   const [assets, setAssets] =
      useState([]);

   const [prices, setPrices] =
      useState({});

   const [loading, setLoading] =
      useState(true);

   const [pricesLoading, setPricesLoading] =
      useState(false);

   const [error, setError] =
      useState("");


   /* ======================================================
      MODAL STATE
   ====================================================== */

   const [showAddModal, setShowAddModal] =
      useState(false);

   const [submitting, setSubmitting] =
      useState(false);

   const [deletingId, setDeletingId] =
      useState(null);


   /* ======================================================
      COIN SEARCH STATE
   ====================================================== */

   const [coinSearch, setCoinSearch] =
      useState("");

   const [coinResults, setCoinResults] =
      useState([]);

   const [searchingCoins, setSearchingCoins] =
      useState(false);

   const [selectedCoin, setSelectedCoin] =
      useState(null);

   const coinSearchRef =
      useRef(null);


   /* ======================================================
      FORM STATE
   ====================================================== */

   const [formData, setFormData] =
      useState({
         coin: "",
         symbol: "",
         coinId: "",
         quantity: "",
         buyPrice: "",
      });


   /* ======================================================
      AUTH
   ====================================================== */

   const getToken = () => {
      /*
         Keep this key consistent with your Login/auth
         implementation.

         If your login stores "token" use:
         localStorage.getItem("token")

         If your login stores "crypto_token" use:
         localStorage.getItem("crypto_token")
      */

      return (
         localStorage.getItem(
            "token"
         ) ||
         localStorage.getItem(
            "crypto_token"
         )
      );
   };


   /* ======================================================
      RESET ADD-ASSET FORM
   ====================================================== */

   const resetAddAssetForm = () => {
      setFormData({
         coin: "",
         symbol: "",
         coinId: "",
         quantity: "",
         buyPrice: "",
      });

      setCoinSearch("");

      setCoinResults([]);

      setSelectedCoin(null);

      setSearchingCoins(false);
   };


   /* ======================================================
      CLOSE ADD-ASSET MODAL
   ====================================================== */

   const closeAddModal = () => {
      if (submitting) {
         return;
      }

      setShowAddModal(false);

      resetAddAssetForm();
   };


   /* ======================================================
      OPEN ADD-ASSET MODAL
   ====================================================== */

   const openAddModal = () => {
      setError("");

      resetAddAssetForm();

      setShowAddModal(true);
   };


   /* ======================================================
      FETCH PORTFOLIO
   ====================================================== */

   const fetchPortfolio = async () => {
      const token = getToken();

      if (!token) {
         setError(
            "Please log in to view your portfolio."
         );

         setLoading(false);

         return;
      }

      try {
         setLoading(true);

         setError("");

         const response =
            await fetch(
               API_PORTFOLIO_URL,
               {
                  method: "GET",

                  headers: {
                     Authorization:
                        `Bearer ${token}`,
                  },
               }
            );

         const data =
            await parseResponse(
               response
            );

         setAssets(
            Array.isArray(data.assets)
               ? data.assets
               : []
         );
      } catch (err) {
         console.error(
            "Portfolio fetch error:",
            err
         );

         setError(
            err.message ||
            "Failed to load portfolio."
         );
      } finally {
         setLoading(false);
      }
   };


   /* ======================================================
      FETCH LIVE PORTFOLIO PRICES
   ====================================================== */

   const fetchPortfolioPrices = async (
      portfolioAssets = assets
   ) => {

      if (!portfolioAssets.length) {
         setPrices({});

         return;
      }

      try {
         setPricesLoading(true);

         /*
            Send both symbols and CoinGecko IDs.

            New assets:
            BTC + bitcoin

            Existing old assets:
            BTC without coinId

            Backend can fall back to the legacy
            symbol mapping for old records.
         */

         const symbols =
            portfolioAssets.map(
               (asset) =>
                  String(
                     asset.symbol || ""
                  ).toUpperCase()
            );

         const coinIds =
            portfolioAssets.map(
               (asset) =>
                  String(
                     asset.coinId || ""
                  ).toLowerCase()
            );

         const response =
            await fetch(
               `${API_MARKET_URL}/portfolio-prices?symbols=${encodeURIComponent(
                  symbols.join(",")
               )}&coinIds=${encodeURIComponent(
                  coinIds.join(",")
               )}`
            );

         const data =
            await parseResponse(
               response
            );

         setPrices(
            data.prices || {}
         );
      } catch (err) {
         console.error(
            "Portfolio price fetch error:",
            err
         );

         setError(
            err.message ||
            "Failed to fetch current market prices."
         );
      } finally {
         setPricesLoading(false);
      }
   };


   /* ======================================================
      SEARCH COINS
   ====================================================== */

   const searchCoins = async (
      query
   ) => {

      const searchTerm =
         query.trim();

      /*
         Don't search for one-character
         queries.
      */

      if (
         searchTerm.length < 2
      ) {
         setCoinResults([]);

         setSearchingCoins(false);

         return;
      }

      try {
         setSearchingCoins(true);

         const response =
            await fetch(
               `${API_MARKET_URL}/search?query=${encodeURIComponent(
                  searchTerm
               )}`
            );

         const data =
            await parseResponse(
               response
            );

         const results =
            Array.isArray(
               data.coins
            )
               ? data.coins
               : [];

         setCoinResults(
            results
         );
      } catch (err) {
         console.error(
            "Coin search error:",
            err
         );

         setCoinResults([]);

         /*
            Don't replace the main portfolio
            error with a search error.
         */
      } finally {
         setSearchingCoins(false);
      }
   };


   /* ======================================================
      COIN SEARCH DEBOUNCE
   ====================================================== */

   useEffect(() => {

      if (!showAddModal) {
         return undefined;
      }

      const timeout =
         setTimeout(() => {
            searchCoins(
               coinSearch
            );
         }, 350);

      return () =>
         clearTimeout(timeout);

   }, [
      coinSearch,
      showAddModal,
   ]);


   /* ======================================================
      CLOSE SEARCH DROPDOWN WHEN CLICKING OUTSIDE
   ====================================================== */

   useEffect(() => {

      const handleOutsideClick =
         (event) => {

            if (
               coinSearchRef.current &&
               !coinSearchRef.current.contains(
                  event.target
               )
            ) {
               setCoinResults([]);
            }
         };

      document.addEventListener(
         "mousedown",
         handleOutsideClick
      );

      return () => {
         document.removeEventListener(
            "mousedown",
            handleOutsideClick
         );
      };

   }, []);


   /* ======================================================
      INITIAL LOAD
   ====================================================== */

   useEffect(() => {
      fetchPortfolio();
   }, []);


   /* ======================================================
      FETCH PRICES AFTER ASSETS LOAD
   ====================================================== */

   useEffect(() => {

      if (!loading) {
         fetchPortfolioPrices(
            assets
         );
      }

   }, [
      assets,
      loading,
   ]);


   /* ======================================================
      AUTO REFRESH LIVE PRICES

      Every 60 seconds
   ====================================================== */

   useEffect(() => {

      if (!assets.length) {
         return undefined;
      }

      const interval =
         setInterval(() => {
            fetchPortfolioPrices(
               assets
            );
         }, 60000);

      return () =>
         clearInterval(
            interval
         );

   }, [assets]);


   /* ======================================================
      HANDLE COIN SELECTION
   ====================================================== */

   const handleCoinSelect = (
      coin
   ) => {

      if (!coin) {
         return;
      }

      const symbol =
         String(
            coin.symbol || ""
         ).toUpperCase();

      setSelectedCoin(
         coin
      );

      setFormData(
         (previous) => ({
            ...previous,

            coin:
               coin.name || "",

            symbol,

            coinId:
               coin.id || "",
         })
      );

      /*
         Show selected coin name
         in the search field.
      */

      setCoinSearch(
         coin.name || ""
      );

      /*
         Close search results.
      */

      setCoinResults([]);
   };


   /* ======================================================
      HANDLE FORM INPUT
   ====================================================== */

   const handleInputChange = (
      event
   ) => {

      const {
         name,
         value,
      } = event.target;

      setFormData(
         (previous) => ({
            ...previous,
            [name]: value,
         })
      );
   };


   /* ======================================================
      ADD ASSET
   ====================================================== */

   const handleAddAsset = async (
      event
   ) => {

      event.preventDefault();

      const token =
         getToken();

      if (!token) {
         setError(
            "Please log in first."
         );

         return;
      }


      /*
         A coin must be selected
         from the search results.
      */

      if (
         !formData.coinId ||
         !formData.coin ||
         !formData.symbol
      ) {
         setError(
            "Please search and select a cryptocurrency."
         );

         return;
      }


      const quantity =
         Number(
            formData.quantity
         );

      const buyPrice =
         Number(
            formData.buyPrice
         );


      if (
         !Number.isFinite(
            quantity
         ) ||
         quantity <= 0
      ) {
         setError(
            "Please enter a valid quantity."
         );

         return;
      }


      if (
         !Number.isFinite(
            buyPrice
         ) ||
         buyPrice <= 0
      ) {
         setError(
            "Please enter a valid buy price."
         );

         return;
      }


      try {
         setSubmitting(true);

         setError("");


         const response =
            await fetch(
               API_PORTFOLIO_URL,
               {
                  method: "POST",

                  headers: {
                     "Content-Type":
                        "application/json",

                     Authorization:
                        `Bearer ${token}`,
                  },

                  body:
                     JSON.stringify({
                        coinId:
                           formData.coinId,

                        coin:
                           formData.coin,

                        symbol:
                           formData.symbol,

                        quantity,

                        buyPrice,
                     }),
               }
            );


         const data =
            await parseResponse(
               response
            );


         if (data.asset) {

            /*
               Add the newly-created
               asset immediately.
            */

            setAssets(
               (previous) => [
                  data.asset,
                  ...previous,
               ]
            );

         } else {

            /*
               Fallback in case backend
               doesn't return the asset.
            */

            await fetchPortfolio();
         }


         /*
            Reset form and close modal.
         */

         resetAddAssetForm();

         setShowAddModal(false);

      } catch (err) {

         console.error(
            "Add portfolio asset error:",
            err
         );

         setError(
            err.message ||
            "Failed to add asset."
         );

      } finally {
         setSubmitting(false);
      }
   };


   /* ======================================================
      DELETE ASSET
   ====================================================== */

   const handleDeleteAsset = async (
      assetId
   ) => {

      const token =
         getToken();

      if (!token) {
         setError(
            "Please log in first."
         );

         return;
      }


      const confirmed =
         window.confirm(
            "Are you sure you want to remove this asset?"
         );


      if (!confirmed) {
         return;
      }


      try {
         setDeletingId(
            assetId
         );

         setError("");


         const response =
            await fetch(
               `${API_PORTFOLIO_URL}/${assetId}`,
               {
                  method: "DELETE",

                  headers: {
                     Authorization:
                        `Bearer ${token}`,
                  },
               }
            );


         await parseResponse(
            response
         );


         setAssets(
            (previous) =>
               previous.filter(
                  (asset) =>
                     asset._id !==
                     assetId
               )
         );

      } catch (err) {

         console.error(
            "Delete portfolio asset error:",
            err
         );

         setError(
            err.message ||
            "Failed to remove asset."
         );

      } finally {
         setDeletingId(null);
      }
   };


   /* ======================================================
      CALCULATED PORTFOLIO DATA
   ====================================================== */

   const calculatedAssets =
      useMemo(() => {

         return assets.map(
            (asset) => {

               const symbol =
                  String(
                     asset.symbol ||
                     ""
                  ).toUpperCase();


               const currentPrice =
                  Number(
                     prices[symbol]
                        ?.price
                  ) || 0;


               const quantity =
                  Number(
                     asset.quantity
                  ) || 0;


               const buyPrice =
                  Number(
                     asset.buyPrice
                  ) || 0;


               const investedValue =
                  Number(
                     asset.investedValue
                  ) ||
                  quantity *
                  buyPrice;


               const currentValue =
                  quantity *
                  currentPrice;


               const profitLoss =
                  currentValue -
                  investedValue;


               const profitLossPercent =
                  investedValue > 0
                     ? (
                        profitLoss /
                        investedValue
                     ) * 100
                     : 0;


               const change24h =
                  Number(
                     prices[symbol]
                        ?.change24h
                  ) || 0;


               return {
                  ...asset,

                  currentPrice,

                  investedValue,

                  currentValue,

                  profitLoss,

                  profitLossPercent,

                  change24h,
               };
            }
         );

      }, [
         assets,
         prices,
      ]);


   /* ======================================================
      PORTFOLIO SUMMARY
   ====================================================== */

   const portfolioSummary =
      useMemo(() => {

         const investedValue =
            calculatedAssets.reduce(
               (
                  total,
                  asset
               ) =>
                  total +
                  asset.investedValue,
               0
            );


         const currentValue =
            calculatedAssets.reduce(
               (
                  total,
                  asset
               ) =>
                  total +
                  asset.currentValue,
               0
            );


         const profitLoss =
            currentValue -
            investedValue;


         const profitLossPercent =
            investedValue > 0
               ? (
                  profitLoss /
                  investedValue
               ) * 100
               : 0;


         /*
            Estimate 24h portfolio
            dollar change.

            Current value ×
            24h percentage.
         */

         const change24h =
            calculatedAssets.reduce(
               (
                  total,
                  asset
               ) => {

                  const assetCurrentValue =
                     asset.currentValue;

                  return (
                     total +
                     assetCurrentValue *
                     (
                        asset.change24h /
                        100
                     )
                  );
               },
               0
            );


         /*
            Find best performer.
         */

         let bestPerformer =
            null;


         calculatedAssets.forEach(
            (asset) => {

               if (
                  !bestPerformer ||
                  asset.profitLossPercent >
                  bestPerformer.profitLossPercent
               ) {
                  bestPerformer =
                     asset;
               }
            }
         );


         return {
            investedValue,

            currentValue,

            profitLoss,

            profitLossPercent,

            change24h,

            bestPerformer,
         };

      }, [
         calculatedAssets,
      ]);


   /* ======================================================
      ESTIMATED INVESTMENT
   ====================================================== */

   const estimatedInvestment =
      (
         Number(
            formData.quantity
         ) || 0
      ) *
      (
         Number(
            formData.buyPrice
         ) || 0
      );


   /* ======================================================
      RENDER
   ====================================================== */

   return (
      <div className="portfolio-page">

         <div className="portfolio-container">


            {/* =================================================
                PAGE HEADER
            ================================================= */}

            <div className="portfolio-header">

               <div>

                  <p className="section-eyebrow">
                     PORTFOLIO
                  </p>

                  <h1>
                     Your Crypto Portfolio
                  </h1>

                  <p className="portfolio-subtitle">
                     Track your investments
                     and monitor real-time
                     market performance.
                  </p>

               </div>


               <button
                  type="button"
                  className="holdings-add-btn"
                  onClick={
                     openAddModal
                  }
               >
                  <span>+</span>
                  Add Asset
               </button>

            </div>


            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
               <div className="portfolio-error">

                  <span>
                     {error}
                  </span>

                  <button
                     type="button"
                     onClick={() =>
                        setError("")
                     }
                     aria-label="Dismiss error"
                  >
                     ×
                  </button>

               </div>
            )}


            {/* =================================================
                SUMMARY CARDS
            ================================================= */}

            <div className="portfolio-summary-grid">


               {/* Current Portfolio Value */}

               <div className="portfolio-summary-card">

                  <span className="summary-label">
                     Current Portfolio Value
                  </span>

                  <strong className="summary-value">
                     {formatCurrency(
                        portfolioSummary.currentValue
                     )}
                  </strong>

                  <span
                     className={`summary-change ${portfolioSummary.profitLoss >= 0
                           ? "positive"
                           : "negative"
                        }`}
                  >
                     {formatCurrency(
                        portfolioSummary.profitLoss
                     )}{" "}

                     (
                     {formatPercent(
                        portfolioSummary.profitLossPercent
                     )}
                     )
                  </span>

               </div>


               {/* Total Invested */}

               <div className="portfolio-summary-card">

                  <span className="summary-label">
                     Total Invested
                  </span>

                  <strong className="summary-value">
                     {formatCurrency(
                        portfolioSummary.investedValue
                     )}
                  </strong>

                  <span className="summary-muted">
                     Original cost basis
                  </span>

               </div>


               {/* 24h Change */}

               <div className="portfolio-summary-card">

                  <span className="summary-label">
                     24h Change
                  </span>

                  <strong
                     className={`summary-value ${portfolioSummary.change24h >= 0
                           ? "positive"
                           : "negative"
                        }`}
                  >
                     {formatCurrency(
                        portfolioSummary.change24h
                     )}
                  </strong>

                  <span className="summary-muted">
                     Estimated from current holdings
                  </span>

               </div>


               {/* Best Performer */}

               <div className="portfolio-summary-card">

                  <span className="summary-label">
                     Best Performer
                  </span>

                  <strong className="summary-value">

                     {portfolioSummary.bestPerformer
                        ? portfolioSummary
                           .bestPerformer
                           .symbol
                        : "—"}

                  </strong>

                  <span
                     className={`summary-change ${!portfolioSummary.bestPerformer ||
                           portfolioSummary.bestPerformer
                              .profitLossPercent >= 0
                           ? "positive"
                           : "negative"
                        }`}
                  >

                     {portfolioSummary.bestPerformer
                        ? formatPercent(
                           portfolioSummary
                              .bestPerformer
                              .profitLossPercent
                        )
                        : "—"}

                  </span>

               </div>

            </div>


            {/* =================================================
                HOLDINGS
            ================================================= */}

            <section className="portfolio-holdings">

               <div className="holdings-header">

                  <div>

                     <p className="section-eyebrow">
                        YOUR ASSETS
                     </p>

                     <h2>
                        Holdings
                     </h2>

                  </div>


                  {pricesLoading &&
                     assets.length > 0 && (
                        <span className="price-refreshing">
                           Updating prices...
                        </span>
                     )}

               </div>


               {/* Loading */}

               {loading ? (

                  <div className="portfolio-loading">

                     <div className="loading-spinner"></div>

                     <p>
                        Loading your portfolio...
                     </p>

                  </div>

               ) : assets.length === 0 ? (

                  /* Empty portfolio */

                  <div className="portfolio-empty">

                     <div className="empty-icon">
                        ◇
                     </div>

                     <h3>
                        No assets yet
                     </h3>

                     <p>
                        Your portfolio is
                        empty. Add an asset
                        using the button above.
                     </p>

                  </div>

               ) : (

                  /* Holdings */

                  <div className="holdings-list">


                     {/* TABLE HEADER */}

                     <div className="holding-row holding-row-header">

                        <div className="holding-coin">
                           Asset
                        </div>

                        <div className="holding-item">
                           Quantity
                        </div>

                        <div className="holding-item">
                           Buy Price
                        </div>

                        <div className="holding-item">
                           Current Price
                        </div>

                        <div className="holding-item">
                           Invested
                        </div>

                        <div className="holding-item">
                           Current Value
                        </div>

                        <div className="holding-item">
                           P&amp;L
                        </div>

                        <div className="holding-actions-heading">
                           Action
                        </div>

                     </div>


                     {/* HOLDING ROWS */}

                     {calculatedAssets.map(
                        (asset) => {

                           const positive =
                              asset.profitLoss >= 0;


                           return (
                              <div
                                 className="holding-row"
                                 key={
                                    asset._id
                                 }
                              >


                                 {/* Asset */}

                                 <div className="holding-coin">

                                    <div className="coin-avatar">

                                       {asset.symbol
                                          ?.charAt(0)
                                          ?.toUpperCase()}

                                    </div>

                                    <div>

                                       <strong>
                                          {asset.coin}
                                       </strong>

                                       <span>
                                          {asset.symbol}
                                       </span>

                                    </div>

                                 </div>


                                 {/* Quantity */}

                                 <div
                                    className="holding-item"
                                    data-label="Quantity"
                                 >

                                    <strong>
                                       {formatQuantity(
                                          asset.quantity
                                       )}
                                    </strong>

                                 </div>


                                 {/* Buy Price */}

                                 <div
                                    className="holding-item"
                                    data-label="Buy Price"
                                 >

                                    {formatCurrency(
                                       asset.buyPrice
                                    )}

                                 </div>


                                 {/* Current Price */}

                                 <div
                                    className="holding-item"
                                    data-label="Current Price"
                                 >

                                    {asset.currentPrice >
                                       0
                                       ? formatCurrency(
                                          asset.currentPrice
                                       )
                                       : "Loading..."}

                                 </div>


                                 {/* Invested */}

                                 <div
                                    className="holding-item"
                                    data-label="Invested"
                                 >

                                    {formatCurrency(
                                       asset.investedValue
                                    )}

                                 </div>


                                 {/* Current Value */}

                                 <div
                                    className="holding-item holding-value"
                                    data-label="Current Value"
                                 >

                                    {asset.currentPrice >
                                       0
                                       ? formatCurrency(
                                          asset.currentValue
                                       )
                                       : "—"}

                                 </div>


                                 {/* P&L */}

                                 <div
                                    className={`holding-item holding-pnl ${positive
                                          ? "positive"
                                          : "negative"
                                       }`}
                                    data-label="P&L"
                                 >

                                    <strong>

                                       {asset.currentPrice >
                                          0
                                          ? formatCurrency(
                                             asset.profitLoss
                                          )
                                          : "—"}

                                    </strong>

                                    <span>

                                       {asset.currentPrice >
                                          0
                                          ? formatPercent(
                                             asset.profitLossPercent
                                          )
                                          : "—"}

                                    </span>

                                 </div>


                                 {/* Action */}

                                 <div className="holding-actions">

                                    <button
                                       type="button"
                                       className="remove-asset-btn"
                                       onClick={() =>
                                          handleDeleteAsset(
                                             asset._id
                                          )
                                       }
                                       disabled={
                                          deletingId ===
                                          asset._id
                                       }
                                       aria-label={`Remove ${asset.coin}`}
                                    >

                                       {deletingId ===
                                          asset._id
                                          ? "..."
                                          : "Remove"}

                                    </button>

                                 </div>

                              </div>
                           );
                        }
                     )}

                  </div>

               )}

            </section>

         </div>


         {/* =====================================================
             ADD ASSET MODAL
         ===================================================== */}

         {showAddModal && (

            <div
               className="portfolio-modal-overlay"
               onMouseDown={(
                  event
               ) => {

                  if (
                     event.target ===
                     event.currentTarget
                  ) {
                     closeAddModal();
                  }

               }}
            >

               <div
                  className="portfolio-modal"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="add-asset-title"
               >


                  {/* MODAL HEADER */}

                  <div className="modal-header">

                     <div>

                        <p className="section-eyebrow">
                           PORTFOLIO
                        </p>

                        <h2 id="add-asset-title">
                           Add Asset
                        </h2>

                     </div>


                     <button
                        type="button"
                        className="modal-close-btn"
                        onClick={
                           closeAddModal
                        }
                        aria-label="Close modal"
                        disabled={
                           submitting
                        }
                     >
                        ×
                     </button>

                  </div>


                  {/* FORM */}

                  <form
                     onSubmit={
                        handleAddAsset
                     }
                     className="asset-form"
                  >


                     {/* =================================================
                         CRYPTOCURRENCY SEARCH
                     ================================================= */}

                     <div
                        className="form-group"
                        ref={
                           coinSearchRef
                        }
                     >

                        <label htmlFor="coin-search">
                           Cryptocurrency
                        </label>


                        <div className="coin-search-wrapper">


                           {/* Search Input */}

                           <div className="coin-search-input-wrapper">

                              <span
                                 className="coin-search-icon"
                                 aria-hidden="true"
                              >
                                 🔍
                              </span>


                              <input
                                 id="coin-search"
                                 type="text"
                                 className="coin-search-input"
                                 placeholder="Search Bitcoin, Ethereum, Solana..."
                                 value={
                                    coinSearch
                                 }
                                 onChange={(
                                    event
                                 ) => {

                                    const value =
                                       event.target.value;

                                    setCoinSearch(
                                       value
                                    );

                                    /*
                                       If user starts
                                       changing the
                                       selected coin,
                                       clear the old
                                       selection.
                                    */

                                    if (
                                       selectedCoin &&
                                       value !==
                                       selectedCoin.name
                                    ) {

                                       setSelectedCoin(
                                          null
                                       );

                                       setFormData(
                                          (
                                             previous
                                          ) => ({
                                             ...previous,

                                             coin:
                                                "",

                                             symbol:
                                                "",

                                             coinId:
                                                "",
                                          })
                                       );
                                    }

                                 }}
                                 autoComplete="off"
                                 autoFocus
                                 disabled={
                                    submitting
                                 }
                              />

                           </div>


                           {/* Search Results */}

                           {coinSearch.trim()
                              .length >= 2 && (

                                 <div className="coin-search-results">


                                    {searchingCoins ? (

                                       <div className="coin-search-status">

                                          <span>
                                             Searching cryptocurrencies...
                                          </span>

                                       </div>

                                    ) : coinResults.length ===
                                       0 ? (

                                       <div className="coin-search-status">
                                          No cryptocurrencies found
                                       </div>

                                    ) : (

                                       coinResults.map(
                                          (coin) => (

                                             <button
                                                type="button"
                                                className="coin-search-result"
                                                key={
                                                   coin.id
                                                }
                                                onClick={() =>
                                                   handleCoinSelect(
                                                      coin
                                                   )
                                                }
                                             >

                                                {/* Coin Image */}

                                                {coin.image ? (

                                                   <img
                                                      src={
                                                         coin.image
                                                      }
                                                      alt=""
                                                      className="coin-search-image"
                                                   />

                                                ) : (

                                                   <div className="coin-search-image-fallback">

                                                      {coin.symbol
                                                         ?.charAt(
                                                            0
                                                         )
                                                         ?.toUpperCase()}

                                                   </div>

                                                )}


                                                {/* Coin Information */}

                                                <span className="coin-search-info">

                                                   <strong>
                                                      {coin.name}
                                                   </strong>

                                                   <small>
                                                      {coin.symbol?.toUpperCase()}
                                                   </small>

                                                </span>


                                                {/* Market Rank */}

                                                {coin.marketCapRank && (

                                                   <span className="coin-search-rank">

                                                      #
                                                      {
                                                         coin.marketCapRank
                                                      }

                                                   </span>

                                                )}

                                             </button>

                                          )
                                       )

                                    )}

                                 </div>

                              )}

                        </div>


                        {/* Selected Coin */}

                        {selectedCoin && (

                           <div className="selected-coin">

                              <span>
                                 Selected:
                              </span>

                              <strong>
                                 {selectedCoin.name}
                              </strong>

                              <span>
                                 (
                                 {selectedCoin.symbol?.toUpperCase()}
                                 )
                              </span>

                           </div>

                        )}

                     </div>


                     {/* =================================================
                         QUANTITY + BUY PRICE
                     ================================================= */}

                     <div className="form-grid">


                        {/* Quantity */}

                        <div className="form-group">

                           <label htmlFor="quantity">
                              Quantity
                           </label>

                           <input
                              id="quantity"
                              name="quantity"
                              type="number"
                              step="any"
                              min="0"
                              placeholder="0.00"
                              value={
                                 formData.quantity
                              }
                              onChange={
                                 handleInputChange
                              }
                              required
                              disabled={
                                 submitting
                              }
                           />

                        </div>


                        {/* Buy Price */}

                        <div className="form-group">

                           <label htmlFor="buyPrice">
                              Buy Price (USD)
                           </label>

                           <input
                              id="buyPrice"
                              name="buyPrice"
                              type="number"
                              step="any"
                              min="0"
                              placeholder="0.00"
                              value={
                                 formData.buyPrice
                              }
                              onChange={
                                 handleInputChange
                              }
                              required
                              disabled={
                                 submitting
                              }
                           />

                        </div>

                     </div>


                     {/* =================================================
                         ESTIMATED INVESTMENT
                     ================================================= */}

                     <div className="estimated-value">

                        <span>
                           Estimated Investment
                        </span>

                        <strong>
                           {formatCurrency(
                              estimatedInvestment
                           )}
                        </strong>

                     </div>


                     {/* =================================================
                         FORM ACTIONS
                     ================================================= */}

                     <div className="asset-form-actions">

                        <button
                           type="button"
                           className="cancel-btn"
                           onClick={
                              closeAddModal
                           }
                           disabled={
                              submitting
                           }
                        >
                           Cancel
                        </button>


                        <button
                           type="submit"
                           className="submit-asset-btn"
                           disabled={
                              submitting ||
                              !formData.coinId
                           }
                           title={
                              !formData.coinId
                                 ? "Search and select a cryptocurrency first"
                                 : ""
                           }
                        >

                           {submitting
                              ? "Adding..."
                              : "Add Asset"}

                        </button>

                     </div>

                  </form>

               </div>

            </div>

         )}

      </div>
   );
};


export default Portfolio;