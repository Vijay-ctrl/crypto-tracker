import { useEffect, useRef, useState } from "react";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import {
   Bell,
   Plus,
   Trash2,
   TrendingUp,
   TrendingDown,
   BellRing,
   X,
   Search,
   Loader2,
} from "lucide-react";

import "./Alerts.css";

/* =========================================================
   API CONFIGURATION
========================================================= */

const API_BASE_URL = (
   import.meta.env.VITE_API_URL ||
   "http://localhost:4000/api"
).replace(/\/+$/, "");

const API_ALERTS_URL = `${API_BASE_URL}/alerts`;
const API_MARKET_URL = `${API_BASE_URL}/market`;

/* =========================================================
   TOKEN
========================================================= */

const getToken = () => {
   // Use the current authentication token only.
   // crypto_token is intentionally not used because it can
   // belong to an old/different login session.
   return localStorage.getItem("token") || "";
};

/* =========================================================
   PRICE FORMAT
========================================================= */

const formatPrice = (price) => {
   const value = Number(price);

   if (!Number.isFinite(value)) {
      return "$0.00";
   }

   return value.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
   });
};

/* =========================================================
   ALERTS COMPONENT
========================================================= */

const Alerts = () => {
   const [alerts, setAlerts] = useState([]);

   const [loadingAlerts, setLoadingAlerts] = useState(true);
   const [alertsError, setAlertsError] = useState("");

   const [showForm, setShowForm] = useState(false);

   const [selectedCoin, setSelectedCoin] = useState(null);

   const [condition, setCondition] = useState("above");

   const [targetPrice, setTargetPrice] = useState("");

   const [coinSearch, setCoinSearch] = useState("");

   const [coinResults, setCoinResults] = useState([]);

   const [searchingCoins, setSearchingCoins] = useState(false);

   const [searchError, setSearchError] = useState("");

   const [showCoinResults, setShowCoinResults] = useState(false);

   const [creatingAlert, setCreatingAlert] = useState(false);

   const [updatingAlertId, setUpdatingAlertId] = useState(null);

   const [deletingAlertId, setDeletingAlertId] = useState(null);

   const coinSearchRef = useRef(null);

   /* =======================================================
      ACTIVE ALERT COUNT
   ======================================================= */

   const activeAlerts = alerts.filter(
      (alert) => alert.active
   ).length;

   /* =======================================================
      LOAD SAVED ALERTS FROM MONGODB
   ======================================================= */

   useEffect(() => {
      const loadAlerts = async () => {
         try {
            setLoadingAlerts(true);
            setAlertsError("");

            const token = getToken();

            if (!token) {
               setAlertsError(
                  "Please log in to view your alerts."
               );

               setAlerts([]);
               return;
            }

            const response = await fetch(
               API_ALERTS_URL,
               {
                  method: "GET",
                  headers: {
                     Authorization: `Bearer ${token}`,
                  },
               }
            );

            const data = await response
               .json()
               .catch(() => ({}));

            if (!response.ok) {
               throw new Error(
                  data.message ||
                  "Failed to load alerts."
               );
            }

            const savedAlerts = Array.isArray(
               data.alerts
            )
               ? data.alerts
               : [];

            setAlerts(savedAlerts);
         } catch (error) {
            console.error(
               "Load alerts error:",
               error
            );

            setAlertsError(
               error.message ||
               "Unable to load alerts."
            );
         } finally {
            setLoadingAlerts(false);
         }
      };

      loadAlerts();
   }, []);

   /* =======================================================
      SEARCH COINS
   ======================================================= */

   useEffect(() => {
      const query = coinSearch.trim();

      if (!query) {
         setCoinResults([]);
         setSearchingCoins(false);
         setSearchError("");
         return;
      }

      if (query.length < 2) {
         setCoinResults([]);
         setSearchingCoins(false);
         setSearchError("");
         return;
      }

      const controller =
         new AbortController();

      const timer = setTimeout(
         async () => {
            try {
               setSearchingCoins(true);
               setSearchError("");
               setShowCoinResults(true);

               const token = getToken();

               const headers = {};

               if (token) {
                  headers.Authorization =
                     `Bearer ${token}`;
               }

               const response =
                  await fetch(
                     `${API_MARKET_URL}/search?query=${encodeURIComponent(
                        query
                     )}`,
                     {
                        method: "GET",
                        headers,
                        signal:
                           controller.signal,
                     }
                  );

               const data =
                  await response
                     .json()
                     .catch(() => ({}));

               if (!response.ok) {
                  throw new Error(
                     data.message ||
                     "Failed to search cryptocurrencies."
                  );
               }

               const results =
                  Array.isArray(data)
                     ? data
                     : Array.isArray(
                        data.coins
                     )
                        ? data.coins
                        : Array.isArray(
                           data.results
                        )
                           ? data.results
                           : [];

               setCoinResults(results);
            } catch (error) {
               if (
                  error.name ===
                  "AbortError"
               ) {
                  return;
               }

               console.error(
                  "Coin search error:",
                  error
               );

               setCoinResults([]);

               setSearchError(
                  error.message ||
                  "Unable to search coins."
               );
            } finally {
               if (
                  !controller.signal.aborted
               ) {
                  setSearchingCoins(false);
               }
            }
         },
         350
      );

      return () => {
         clearTimeout(timer);
         controller.abort();
      };
   }, [coinSearch]);

   /* =======================================================
      CLOSE SEARCH RESULTS WHEN CLICKING OUTSIDE
   ======================================================= */

   useEffect(() => {
      const handleOutsideClick = (
         event
      ) => {
         if (
            coinSearchRef.current &&
            !coinSearchRef.current.contains(
               event.target
            )
         ) {
            setShowCoinResults(false);
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

   /* =======================================================
      RESET FORM
   ======================================================= */

   const resetForm = () => {
      setSelectedCoin(null);
      setCondition("above");
      setTargetPrice("");
      setCoinSearch("");
      setCoinResults([]);
      setSearchError("");
      setShowCoinResults(false);
      setCreatingAlert(false);
   };

   /* =======================================================
      OPEN MODAL
   ======================================================= */

   const openCreateAlert = () => {
      resetForm();
      setShowForm(true);
   };

   /* =======================================================
      CLOSE MODAL
   ======================================================= */

   const closeCreateAlert = () => {
      setShowForm(false);
      resetForm();
   };

   /* =======================================================
      SELECT COIN
   ======================================================= */

   const handleCoinSelect = (coin) => {
      const name =
         coin.name ||
         coin.symbol ||
         "Unknown Coin";

      const symbol =
         coin.symbol || "";

      const coinId =
         coin.id ||
         coin.coinId ||
         "";

      setSelectedCoin({
         id: coinId,
         name,
         symbol:
            symbol.toUpperCase(),
         image:
            coin.large ||
            coin.thumb ||
            coin.small ||
            coin.image ||
            "",
         marketCapRank:
            coin.market_cap_rank ||
            coin.marketCapRank ||
            null,
      });

      setCoinSearch(name);
      setShowCoinResults(false);
      setSearchError("");
   };

   /* =======================================================
      CREATE ALERT - SAVE TO MONGODB
   ======================================================= */

   const createAlert = async (event) => {
      event.preventDefault();

      if (!selectedCoin) {
         setSearchError(
            "Please search and select a cryptocurrency."
         );

         setShowCoinResults(true);
         return;
      }

      const price =
         Number(targetPrice);

      if (
         !targetPrice ||
         !Number.isFinite(price) ||
         price <= 0
      ) {
         setSearchError(
            "Please enter a valid target price."
         );

         return;
      }

      try {
         setCreatingAlert(true);
         setSearchError("");

         const token = getToken();

         if (!token) {
            throw new Error(
               "Please log in before creating an alert."
            );
         }

         const response =
            await fetch(
               API_ALERTS_URL,
               {
                  method: "POST",

                  headers: {
                     "Content-Type":
                        "application/json",

                     Authorization:
                        `Bearer ${token}`,
                  },

                  body: JSON.stringify({
                     coinId:
                        selectedCoin.id,

                     coin:
                        selectedCoin.name,

                     symbol:
                        selectedCoin.symbol,

                     image:
                        selectedCoin.image,

                     price,

                     condition,

                     active: true,
                  }),
               }
            );

         const data =
            await response
               .json()
               .catch(() => ({}));

         if (!response.ok) {
            throw new Error(
               data.message ||
               "Failed to create alert."
            );
         }

         if (!data.alert) {
            throw new Error(
               "Alert was created but the server returned no alert data."
            );
         }

         /*
          * Add the MongoDB document returned by
          * the backend to the UI.
          *
          * IMPORTANT:
          * Use MongoDB _id, not Date.now().
          */

         setAlerts(
            (currentAlerts) => [
               data.alert,
               ...currentAlerts,
            ]
         );

         closeCreateAlert();
      } catch (error) {
         console.error(
            "Create alert error:",
            error
         );

         setSearchError(
            error.message ||
            "Failed to create alert."
         );
      } finally {
         setCreatingAlert(false);
      }
   };

   /* =======================================================
      TOGGLE ALERT - UPDATE MONGODB
   ======================================================= */

   const toggleAlert = async (id) => {
      const alert = alerts.find(
         (item) => item._id === id
      );

      if (!alert) {
         return;
      }

      try {
         setUpdatingAlertId(id);

         const token = getToken();

         if (!token) {
            throw new Error(
               "Please log in again."
            );
         }

         const newActive =
            !alert.active;

         const response =
            await fetch(
               `${API_ALERTS_URL}/${id}`,
               {
                  method: "PATCH",

                  headers: {
                     "Content-Type":
                        "application/json",

                     Authorization:
                        `Bearer ${token}`,
                  },

                  body: JSON.stringify({
                     active:
                        newActive,
                  }),
               }
            );

         const data =
            await response
               .json()
               .catch(() => ({}));

         if (!response.ok) {
            throw new Error(
               data.message ||
               "Failed to update alert."
            );
         }

         if (!data.alert) {
            throw new Error(
               "Server returned no updated alert."
            );
         }

         setAlerts(
            (currentAlerts) =>
               currentAlerts.map(
                  (item) =>
                     item._id === id
                        ? data.alert
                        : item
               )
         );
      } catch (error) {
         console.error(
            "Toggle alert error:",
            error
         );

         setAlertsError(
            error.message ||
            "Failed to update alert."
         );
      } finally {
         setUpdatingAlertId(null);
      }
   };

   /* =======================================================
      DELETE ALERT - DELETE FROM MONGODB
   ======================================================= */

   const deleteAlert = async (id) => {
      try {
         setDeletingAlertId(id);

         const token = getToken();

         if (!token) {
            throw new Error(
               "Please log in again."
            );
         }

         const response =
            await fetch(
               `${API_ALERTS_URL}/${id}`,
               {
                  method: "DELETE",

                  headers: {
                     Authorization:
                        `Bearer ${token}`,
                  },
               }
            );

         const data =
            await response
               .json()
               .catch(() => ({}));

         if (!response.ok) {
            throw new Error(
               data.message ||
               "Failed to delete alert."
            );
         }

         /*
          * Remove it from the UI only after
          * MongoDB confirms deletion.
          */

         setAlerts(
            (currentAlerts) =>
               currentAlerts.filter(
                  (item) =>
                     item._id !== id
               )
         );
      } catch (error) {
         console.error(
            "Delete alert error:",
            error
         );

         setAlertsError(
            error.message ||
            "Failed to delete alert."
         );
      } finally {
         setDeletingAlertId(null);
      }
   };

   /* =======================================================
      RENDER
   ======================================================= */

   return (
      <div className="app">
         <Sidebar />

         <div className="main-area">
            <Navbar />

            <main className="alerts-page">

               {/* HEADER */}

               <div className="alerts-header">
                  <div className="page-heading">
                     <div className="alerts-heading-icon">
                        <BellRing size={24} />
                     </div>

                     <div>
                        <h1>
                           Price Alerts
                        </h1>

                        <p>
                           Get notified when cryptocurrency
                           prices reach your target.
                        </p>
                     </div>
                  </div>

                  <button
                     className="create-alert-button"
                     onClick={
                        openCreateAlert
                     }
                  >
                     <Plus size={18} />
                     Create Alert
                  </button>
               </div>

               {/* ERROR */}

               {alertsError && (
                  <div
                     style={{
                        marginBottom:
                           "20px",
                        padding:
                           "12px 16px",
                        borderRadius:
                           "10px",
                        background:
                           "#fff1f2",
                        color:
                           "#be123c",
                        border:
                           "1px solid #fecdd3",
                     }}
                  >
                     {alertsError}
                  </div>
               )}

               {/* STATS */}

               <div className="alerts-stats">

                  <div className="alert-stat-card">
                     <div className="alert-stat-icon blue">
                        <Bell size={20} />
                     </div>

                     <div>
                        <span>
                           Total Alerts
                        </span>

                        <strong>
                           {alerts.length}
                        </strong>
                     </div>
                  </div>

                  <div className="alert-stat-card">
                     <div className="alert-stat-icon green">
                        <BellRing size={20} />
                     </div>

                     <div>
                        <span>
                           Active Alerts
                        </span>

                        <strong>
                           {activeAlerts}
                        </strong>
                     </div>
                  </div>

                  <div className="alert-stat-card">
                     <div className="alert-stat-icon purple">
                        <TrendingUp size={20} />
                     </div>

                     <div>
                        <span>
                           Monitoring
                        </span>

                        <strong>
                           {activeAlerts} Coins
                        </strong>
                     </div>
                  </div>

               </div>

               {/* CREATE ALERT MODAL */}

               {showForm && (
                  <div
                     className="alert-modal-overlay"
                     onMouseDown={(event) => {
                        if (
                           event.target ===
                           event.currentTarget
                        ) {
                           closeCreateAlert();
                        }
                     }}
                  >
                     <div className="alert-modal">

                        <div className="alert-modal-header">

                           <div>
                              <div className="modal-title-row">

                                 <div className="modal-title-icon">
                                    <BellRing
                                       size={20}
                                    />
                                 </div>

                                 <h2>
                                    Create Price Alert
                                 </h2>

                              </div>

                              <p>
                                 Search for any cryptocurrency
                                 and set your target price.
                              </p>
                           </div>

                           <button
                              type="button"
                              className="modal-close-button"
                              onClick={
                                 closeCreateAlert
                              }
                              aria-label="Close"
                           >
                              <X size={20} />
                           </button>

                        </div>

                        <form
                           className="alert-form"
                           onSubmit={
                              createAlert
                           }
                        >

                           {/* COIN SEARCH */}

                           <div className="form-group">

                              <label>
                                 Cryptocurrency
                              </label>

                              <div
                                 className="coin-search-wrapper"
                                 ref={
                                    coinSearchRef
                                 }
                              >

                                 <div className="coin-search-input-wrapper">

                                    <Search
                                       size={18}
                                       className="coin-search-icon"
                                    />

                                    <input
                                       type="text"
                                       className="coin-search-input"
                                       placeholder="Search Bitcoin, Ethereum, Solana..."
                                       value={
                                          coinSearch
                                       }
                                       onChange={(event) => {
                                          setCoinSearch(
                                             event
                                                .target
                                                .value
                                          );

                                          setSelectedCoin(
                                             null
                                          );

                                          setShowCoinResults(
                                             true
                                          );
                                       }}
                                       onFocus={() => {
                                          if (
                                             coinResults.length >
                                             0
                                          ) {
                                             setShowCoinResults(
                                                true
                                             );
                                          }
                                       }}
                                       autoComplete="off"
                                    />

                                    {searchingCoins && (
                                       <Loader2
                                          size={18}
                                          className="coin-search-loader"
                                       />
                                    )}

                                 </div>

                                 {showCoinResults && (
                                    <div className="coin-search-results">

                                       {searchingCoins && (
                                          <div className="coin-search-status">
                                             <Loader2
                                                size={18}
                                                className="spin"
                                             />

                                             Searching
                                             cryptocurrencies...
                                          </div>
                                       )}

                                       {!searchingCoins &&
                                          searchError && (
                                             <div className="coin-search-status error">
                                                {searchError}
                                             </div>
                                          )}

                                       {!searchingCoins &&
                                          !searchError &&
                                          coinSearch.trim()
                                             .length >= 2 &&
                                          coinResults.length ===
                                          0 && (
                                             <div className="coin-search-status">
                                                No cryptocurrencies
                                                found.
                                             </div>
                                          )}

                                       {!searchingCoins &&
                                          coinResults.length >
                                          0 && (
                                             <>
                                                <div className="coin-results-heading">
                                                   Search Results
                                                </div>

                                                {coinResults.map(
                                                   (coin) => (
                                                      <button
                                                         type="button"
                                                         className="coin-search-result"
                                                         key={
                                                            coin.id ||
                                                            coin.coinId ||
                                                            `${coin.symbol}-${coin.name}`
                                                         }
                                                         onClick={() =>
                                                            handleCoinSelect(
                                                               coin
                                                            )
                                                         }
                                                      >
                                                         <div className="coin-result-image">
                                                            {(
                                                               coin.large ||
                                                               coin.thumb ||
                                                               coin.small ||
                                                               coin.image
                                                            ) ? (
                                                               <img
                                                                  src={
                                                                     coin.large ||
                                                                     coin.thumb ||
                                                                     coin.small ||
                                                                     coin.image
                                                                  }
                                                                  alt={
                                                                     coin.name ||
                                                                     "Coin"
                                                                  }
                                                               />
                                                            ) : (
                                                               <div className="coin-result-fallback">
                                                                  {(
                                                                     coin.symbol ||
                                                                     "?"
                                                                  )
                                                                     .charAt(
                                                                        0
                                                                     )
                                                                     .toUpperCase()}
                                                               </div>
                                                            )}
                                                         </div>

                                                         <div className="coin-result-info">
                                                            <strong>
                                                               {coin.name ||
                                                                  "Unknown Coin"}
                                                            </strong>

                                                            <span>
                                                               {(
                                                                  coin.symbol ||
                                                                  ""
                                                               ).toUpperCase()}
                                                            </span>
                                                         </div>

                                                         {(coin.market_cap_rank ||
                                                            coin.marketCapRank) && (
                                                               <span className="coin-result-rank">
                                                                  #
                                                                  {coin.market_cap_rank ||
                                                                     coin.marketCapRank}
                                                               </span>
                                                            )}
                                                      </button>
                                                   )
                                                )}
                                             </>
                                          )}

                                    </div>
                                 )}

                              </div>

                              {selectedCoin && (
                                 <div className="selected-coin">

                                    <div className="selected-coin-image">
                                       {selectedCoin.image ? (
                                          <img
                                             src={
                                                selectedCoin.image
                                             }
                                             alt={
                                                selectedCoin.name
                                             }
                                          />
                                       ) : (
                                          <span>
                                             {selectedCoin.symbol.charAt(
                                                0
                                             )}
                                          </span>
                                       )}
                                    </div>

                                    <div className="selected-coin-info">

                                       <strong>
                                          {selectedCoin.name}
                                       </strong>

                                       <span>
                                          {selectedCoin.symbol}
                                          {selectedCoin.id &&
                                             ` • ${selectedCoin.id}`}
                                       </span>

                                    </div>

                                    <button
                                       type="button"
                                       className="clear-selected-coin"
                                       onClick={() => {
                                          setSelectedCoin(
                                             null
                                          );

                                          setCoinSearch(
                                             ""
                                          );

                                          setCoinResults(
                                             []
                                          );
                                       }}
                                       aria-label="Change cryptocurrency"
                                    >
                                       <X size={16} />
                                    </button>

                                 </div>
                              )}

                           </div>

                           {/* CONDITION */}

                           <div className="form-group">

                              <label>
                                 Alert Condition
                              </label>

                              <select
                                 value={
                                    condition
                                 }
                                 onChange={(event) =>
                                    setCondition(
                                       event.target.value
                                    )
                                 }
                              >
                                 <option value="above">
                                    Price goes above
                                 </option>

                                 <option value="below">
                                    Price goes below
                                 </option>
                              </select>

                           </div>

                           {/* TARGET PRICE */}

                           <div className="form-group">

                              <label>
                                 Target Price (USD)
                              </label>

                              <div className="price-input-wrapper">

                                 <span>
                                    $
                                 </span>

                                 <input
                                    type="number"
                                    placeholder="Enter target price"
                                    value={
                                       targetPrice
                                    }
                                    min="0"
                                    step="any"
                                    onChange={(event) =>
                                       setTargetPrice(
                                          event
                                             .target
                                             .value
                                       )
                                    }
                                 />

                              </div>

                           </div>

                           {/* ACTIONS */}

                           <div className="alert-form-actions">

                              <button
                                 type="button"
                                 className="cancel-alert-button"
                                 onClick={
                                    closeCreateAlert
                                 }
                              >
                                 Cancel
                              </button>

                              <button
                                 type="submit"
                                 className="save-alert-button"
                                 disabled={
                                    creatingAlert
                                 }
                              >
                                 {creatingAlert ? (
                                    <Loader2
                                       size={17}
                                       className="spin"
                                    />
                                 ) : (
                                    <Bell
                                       size={17}
                                    />
                                 )}

                                 {creatingAlert
                                    ? "Creating..."
                                    : "Create Alert"}
                              </button>

                           </div>

                        </form>

                     </div>
                  </div>
               )}

               {/* ACTIVE ALERTS */}

               <section className="alerts-section">

                  <div className="alerts-section-header">

                     <div>
                        <h2>
                           Your Alerts
                        </h2>

                        <p>
                           Manage your cryptocurrency
                           price notifications.
                        </p>
                     </div>

                     {alerts.length > 0 && (
                        <span className="alerts-count">
                           {alerts.length} alert
                           {alerts.length !== 1
                              ? "s"
                              : ""}
                        </span>
                     )}

                  </div>

                  {/* LOADING */}

                  {loadingAlerts ? (
                     <div className="alerts-empty">

                        <div className="alerts-empty-icon">
                           <Loader2
                              size={28}
                              className="spin"
                           />
                        </div>

                        <h3>
                           Loading your alerts...
                        </h3>

                        <p>
                           Fetching your saved alerts
                           from the database.
                        </p>

                     </div>
                  ) : alerts.length === 0 ? (
                     /* EMPTY */

                     <div className="alerts-empty">

                        <div className="alerts-empty-icon">
                           <Bell size={28} />
                        </div>

                        <h3>
                           No price alerts yet
                        </h3>

                        <p>
                           Create an alert and we'll
                           help you monitor your
                           favorite cryptocurrencies.
                        </p>

                        <button
                           className="empty-create-button"
                           onClick={
                              openCreateAlert
                           }
                        >
                           <Plus size={17} />
                           Create Your First Alert
                        </button>

                     </div>
                  ) : (
                     /* ALERT LIST */

                     <div className="alerts-list">

                        {alerts.map(
                           (alert) => (
                              <div
                                 className="alert-card"
                                 key={
                                    alert._id
                                 }
                              >

                                 {/* COIN */}

                                 <div className="alert-coin">

                                    <div
                                       className={
                                          `alert-coin-icon ${alert.condition ===
                                             "above"
                                             ? "above"
                                             : "below"
                                          }`
                                       }
                                    >
                                       {alert.condition ===
                                          "above" ? (
                                          <TrendingUp
                                             size={20}
                                          />
                                       ) : (
                                          <TrendingDown
                                             size={20}
                                          />
                                       )}
                                    </div>

                                    <div>
                                       <h3>
                                          {alert.coin}
                                       </h3>

                                       <span>
                                          {alert.symbol}
                                       </span>
                                    </div>

                                 </div>

                                 {/* CONDITION */}

                                 <div className="alert-condition">

                                    <span className="alert-label">
                                       Condition
                                    </span>

                                    <strong>
                                       {alert.condition ===
                                          "above"
                                          ? "Price Above"
                                          : "Price Below"}
                                    </strong>

                                 </div>

                                 {/* TARGET */}

                                 <div className="alert-target">

                                    <span className="alert-label">
                                       Target Price
                                    </span>

                                    <strong>
                                       {formatPrice(
                                          alert.price
                                       )}
                                    </strong>

                                 </div>

                                 {/* STATUS */}

                                 <div className="alert-status-column">

                                    <span className="alert-label">
                                       Status
                                    </span>

                                    <button
                                       className={
                                          `status-toggle ${alert.active
                                             ? "active"
                                             : ""
                                          }`
                                       }
                                       disabled={
                                          updatingAlertId ===
                                          alert._id
                                       }
                                       onClick={() =>
                                          toggleAlert(
                                             alert._id
                                          )
                                       }
                                    >
                                       {updatingAlertId ===
                                          alert._id ? (
                                          <Loader2
                                             size={14}
                                             className="spin"
                                          />
                                       ) : (
                                          <span className="toggle-dot" />
                                       )}

                                       {alert.active
                                          ? "Active"
                                          : "Paused"}
                                    </button>

                                 </div>

                                 {/* DELETE */}

                                 <div className="alert-actions">

                                    <button
                                       className="delete-alert-button"
                                       disabled={
                                          deletingAlertId ===
                                          alert._id
                                       }
                                       onClick={() =>
                                          deleteAlert(
                                             alert._id
                                          )
                                       }
                                       aria-label="Delete alert"
                                       title="Delete alert"
                                    >
                                       {deletingAlertId ===
                                          alert._id ? (
                                          <Loader2
                                             size={18}
                                             className="spin"
                                          />
                                       ) : (
                                          <Trash2
                                             size={18}
                                          />
                                       )}
                                    </button>

                                 </div>

                              </div>
                           )
                        )}

                     </div>
                  )}

               </section>

            </main>
         </div>
      </div>
   );
};

export default Alerts;