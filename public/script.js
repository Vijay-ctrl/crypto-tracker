
const API_BASE = "http://localhost:5000";
let currentPage = 1;
let perPage = 20;
let currentSort = { key: "market_cap", asc: false };
let cryptoData = [];
let prevPrices = {};
let portfolio = JSON.parse(localStorage.getItem("portfolio")) || {};
let portfolioHistory = JSON.parse(localStorage.getItem("portfolioHistory")) || [];
let alerts = [];

// LOAD CRYPTO DATA
async function loadCryptoData() {
   try {
      const res = await fetch(
         "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=true&price_change_percentage=1h,24h,7d"
      );
      const data = await res.json();

      data.forEach(c => { if (prevPrices[c.id] === undefined) prevPrices[c.id] = c.current_price; });
      cryptoData = data;

      await fetchAlerts();
      refreshPortfolioPrices();
      checkAlerts();

      displayTable();
      updatePortfolioTable();
   } catch (err) {
      console.error("Error fetching data:", err);
      document.getElementById("cryptoBody").innerHTML =
         "<tr><td colspan='10'>⚠️ Error loading data</td></tr>";
   }
}

// ALERTS API
async function fetchAlerts() {
   try {
      const res = await fetch(`${API_BASE}/alerts`);
      alerts = await res.json();
   } catch (err) { console.error("Error fetching alerts:", err); alerts = []; }
}

async function createAlert(coinId, coinName, targetPrice) {
   try {
      const res = await fetch(`${API_BASE}/alerts`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ coinId, coinName, targetPrice })
      });
      const newAlert = await res.json();
      alerts.push(newAlert);
   } catch (err) { console.error("Error creating alert:", err); }
}

async function deleteAlert(alertId) {
   try {
      await fetch(`${API_BASE}/alerts/${alertId}`, { method: "DELETE" });
      alerts = alerts.filter(a => a._id !== alertId);
   } catch (err) { console.error("Error deleting alert:", err); }
}

// SET ALERT
function setAlert(coinId, coinName) {
   const price = prompt(`Set alert price for ${coinName}:`);
   if (!price || isNaN(price)) return;
   createAlert(coinId, coinName, parseFloat(price))
      .then(() => alert(`🚨 Alert set for ${coinName} at $${price}`));
}

// CHECK ALERTS
function checkAlerts() {
   alerts.forEach(alert => {
      const coin = cryptoData.find(c => c.id === alert.coinId);
      if (!coin) return;
      if (coin.current_price >= alert.targetPrice || coin.current_price <= alert.targetPrice) {
         alert(`🚨 ${coin.name} price alert! Current: $${coin.current_price} Target: $${alert.targetPrice}`);
         deleteAlert(alert._id);
      }
   });
}

// PORTFOLIO FUNCTIONS
function addToPortfolio(coinId, coinName, currentPrice) {
   const qty = prompt(`Enter quantity of ${coinName}:`);
   if (!qty || isNaN(qty) || qty <= 0) return;

   if (!portfolio[coinId]) portfolio[coinId] = { name: coinName, quantity: 0, purchasePrice: currentPrice, price: currentPrice };
   portfolio[coinId].quantity += parseFloat(qty);
   portfolio[coinId].purchasePrice = currentPrice;
   portfolio[coinId].price = currentPrice;

   localStorage.setItem("portfolio", JSON.stringify(portfolio));
   updatePortfolioTable();
}

function removeFromPortfolio(coinId) {
   delete portfolio[coinId];
   localStorage.setItem("portfolio", JSON.stringify(portfolio));
   updatePortfolioTable();
}

function refreshPortfolioPrices() {
   for (let coinId in portfolio) {
      const coin = cryptoData.find(c => c.id === coinId);
      if (coin) portfolio[coinId].price = coin.current_price;
   }
}

// PORTFOLIO TABLE & CHART
function updatePortfolioTable() {
   const body = document.getElementById("portfolioBody");
   body.innerHTML = "";
   const search = document.getElementById("portfolioSearch")?.value?.toLowerCase() || "";
   let total = 0;

   for (let coinId in portfolio) {
      const coin = portfolio[coinId];
      if (!coin.name.toLowerCase().includes(search) && !coinId.toLowerCase().includes(search)) continue;

      const value = coin.quantity * coin.price;
      total += value;
      const pl = ((coin.price - coin.purchasePrice) / coin.purchasePrice) * 100;

      body.innerHTML += `
         <tr>
            <td>${coin.name}</td>
            <td>${coin.quantity}</td>
            <td>$${coin.purchasePrice.toLocaleString()}</td>
            <td>$${coin.price.toLocaleString()}</td>
            <td>$${value.toLocaleString()}</td>
            <td style="color:${pl >= 0 ? 'lightgreen' : 'red'}">${pl.toFixed(2)}%</td>
            <td><button onclick="removeFromPortfolio('${coinId}')">Remove</button></td>
         </tr>
      `;
   }

   document.getElementById("portfolioTotal").innerText = `Total Portfolio Value: $${total.toLocaleString()}`;

   portfolioHistory.push({ time: new Date().toLocaleTimeString(), total });
   if (portfolioHistory.length > 50) portfolioHistory.shift();
   localStorage.setItem("portfolioHistory", JSON.stringify(portfolioHistory));
   drawPortfolioChart();
}

let portfolioChart;
function drawPortfolioChart() {
   const ctx = document.getElementById("portfolioChart")?.getContext("2d");
   if (!ctx) return;
   const labels = portfolioHistory.map(p => p.time);
   const data = portfolioHistory.map(p => p.total);
   if (portfolioChart) portfolioChart.destroy();

   portfolioChart = new Chart(ctx, {
      type: "line",
      data: { labels, datasets: [{ label: "Portfolio Value", data, borderColor: "deepskyblue", backgroundColor: "rgba(0,191,255,0.2)", tension: 0.3, fill: true, pointRadius: 0 }] },
      options: { plugins: { legend: { display: true } }, scales: { x: { display: true }, y: { display: true } } }
   });
}

// DISPLAY CRYPTO TABLE
function displayTable() {
   const body = document.getElementById("cryptoBody");
   body.innerHTML = "";
   const sorted = [...cryptoData].sort((a, b) => currentSort.asc ? (a[currentSort.key] ?? 0) - (b[currentSort.key] ?? 0) : (b[currentSort.key] ?? 0) - (a[currentSort.key] ?? 0));
   const start = (currentPage - 1) * perPage;
   const pageData = sorted.slice(start, start + perPage);

   pageData.forEach((coin, i) => {
      const chartId = `chart-${coin.id}`;
      const prev = prevPrices[coin.id];
      let color = ""; if (prev !== undefined) color = coin.current_price > prev ? "lightgreen" : coin.current_price < prev ? "red" : "";
      prevPrices[coin.id] = coin.current_price;

      body.innerHTML += `
         <tr>
            <td>${start + i + 1}</td>
            <td><img src="${coin.image}" width="20"/> ${coin.name} (${coin.symbol.toUpperCase()})</td>
            <td style="color:${color}">$${coin.current_price.toLocaleString()}</td>
            <td style="color:${coin.price_change_percentage_1h_in_currency >= 0 ? 'lightgreen' : 'red'}">${coin.price_change_percentage_1h_in_currency?.toFixed(2)}%</td>
            <td style="color:${coin.price_change_percentage_24h >= 0 ? 'lightgreen' : 'red'}">${coin.price_change_percentage_24h?.toFixed(2)}%</td>
            <td style="color:${coin.price_change_percentage_7d_in_currency >= 0 ? 'lightgreen' : 'red'}">${coin.price_change_percentage_7d_in_currency?.toFixed(2)}%</td>
            <td>$${coin.market_cap.toLocaleString()}</td>
            <td>$${coin.total_volume.toLocaleString()}</td>
            <td>${coin.circulating_supply.toLocaleString()} ${coin.symbol.toUpperCase()}</td>
            <td>
               <canvas id="${chartId}"></canvas><br>
               <button onclick="addToPortfolio('${coin.id}','${coin.name}',${coin.current_price})">Add</button>
               <button onclick="setAlert('${coin.id}','${coin.name}',${coin.current_price})">Alert</button>
            </td>
         </tr>`;
      setTimeout(() => drawChart(chartId, coin.sparkline_in_7d.price), 50);
   });

   document.getElementById("pageInfo").innerText = `Page ${currentPage}`;
}

// DRAW SPARKLINE
function drawChart(canvasId, prices) {
   const ctx = document.getElementById(canvasId).getContext("2d");
   const first = prices[0], last = prices[prices.length - 1];
   const color = last >= first ? "lightgreen" : "red";

   new Chart(ctx, { type: "line", data: { labels: prices.map((_, i) => i), datasets: [{ data: prices, borderColor: color, borderWidth: 2, pointRadius: 0, fill: true, backgroundColor: color === "lightgreen" ? "rgba(144,238,144,0.2)" : "rgba(255,0,0,0.2)", tension: 0.3 }] }, options: { animation: { duration: 800, easing: 'easeOutQuart' }, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } } });
}

// SORTING
document.querySelectorAll("th[data-sort]").forEach(th => {
   th.addEventListener("click", () => {
      const key = th.dataset.sort;
      currentSort.key === key ? currentSort.asc = !currentSort.asc : currentSort = { key, asc: true };
      displayTable();
   });
});

// PAGINATION
document.getElementById("prevPage").addEventListener("click", () => { if (currentPage > 1) { currentPage--; displayTable(); } });
document.getElementById("nextPage").addEventListener("click", () => { if (currentPage * perPage < cryptoData.length) { currentPage++; displayTable(); } });
document.getElementById("perPage").addEventListener("change", e => { perPage = parseInt(e.target.value); currentPage = 1; displayTable(); });

// SEARCH
document.getElementById("searchInput").addEventListener("keyup", () => { currentPage = 1; displayTable(); });
document.getElementById("portfolioSearch")?.addEventListener("keyup", () => { updatePortfolioTable(); });

// LIGHT/DARK MODE
const toggleBtn = document.getElementById("toggleMode");
toggleBtn.addEventListener("click", () => { document.body.classList.toggle("light"); toggleBtn.textContent = document.body.classList.contains("light") ? "☀️" : "🌙"; });

// INITIAL LOAD
window.onload = () => { loadCryptoData(); updatePortfolioTable(); setInterval(loadCryptoData, 30000); };
