const express = require("express");

const router = express.Router();


/* =========================================================
   CONTROLLER
========================================================= */

const {
   getWatchlist,
   addToWatchlist,
   removeFromWatchlist,
   checkWatchlist,
} = require("../controllers/watchlistController");


/* =========================================================
   AUTH MIDDLEWARE
========================================================= */

const authMiddleware =
   require("../middleware/authMiddleware");


/* =========================================================
   GET USER WATCHLIST
========================================================= */

router.get(
   "/",
   authMiddleware,
   getWatchlist
);


/* =========================================================
   ADD COIN TO WATCHLIST
========================================================= */

router.post(
   "/",
   authMiddleware,
   addToWatchlist
);


/* =========================================================
   CHECK WHETHER COIN IS WATCHLISTED
========================================================= */

router.get(
   "/check/:coinId",
   authMiddleware,
   checkWatchlist
);


/* =========================================================
   REMOVE COIN FROM WATCHLIST
========================================================= */

router.delete(
   "/:coinId",
   authMiddleware,
   removeFromWatchlist
);


/* =========================================================
   EXPORT ROUTER
========================================================= */

module.exports = router;