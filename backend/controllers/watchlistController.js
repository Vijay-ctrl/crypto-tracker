const mongoose = require("mongoose");

const Watchlist = require("../models/Watchlist");


/* =========================================================
   HELPER — GET AUTHENTICATED USER ID
========================================================= */

const getUserId = (req) => {
   const userId =
      req.user?.userId ||
      req.userId ||
      null;

   if (!userId) {
      return null;
   }

   const value = String(userId).trim();

   if (!mongoose.Types.ObjectId.isValid(value)) {
      console.error(
         "Invalid authenticated user ID:",
         value
      );

      return null;
   }

   return new mongoose.Types.ObjectId(value);
};


/* =========================================================
   HELPER — NORMALIZE COIN ID
========================================================= */

const getCoinId = (value) => {
   if (
      value === undefined ||
      value === null
   ) {
      return "";
   }

   return String(value).trim();
};


/* =========================================================
   HELPER — GET USER WATCHLIST
========================================================= */

const getUserWatchlist = async (userId) => {
   return await Watchlist
      .find({
         userId,
      })
      .sort({
         createdAt: -1,
      })
      .lean();
};


/* =========================================================
   GET WATCHLIST
========================================================= */

const getWatchlist = async (req, res) => {
   try {

      const userId = getUserId(req);

      console.log(
         "GET WATCHLIST USER ID:",
         userId?.toString()
      );


      if (!userId) {
         return res.status(401).json({
            message:
               "Authentication required",
         });
      }


      const watchlist =
         await getUserWatchlist(
            userId
         );


      console.log(
         "WATCHLIST FOUND:",
         watchlist.length
      );


      return res.status(200).json({
         watchlist,
      });

   } catch (error) {

      console.error(
         "Get watchlist error:",
         error
      );

      return res.status(500).json({
         message:
            "Failed to load watchlist",
      });
   }
};


/* =========================================================
   ADD TO WATCHLIST
========================================================= */

const addToWatchlist = async (req, res) => {
   try {

      const userId = getUserId(req);


      if (!userId) {
         return res.status(401).json({
            message:
               "Authentication required",
         });
      }


      const {
         coinId,
         coin,
         symbol,
         image,
      } = req.body || {};


      const normalizedCoinId =
         getCoinId(coinId);

      const normalizedCoin =
         String(
            coin || ""
         ).trim();

      const normalizedSymbol =
         String(
            symbol || ""
         )
            .trim()
            .toUpperCase();

      const normalizedImage =
         typeof image === "string"
            ? image.trim()
            : "";


      /* ====================================================
         VALIDATION
      ==================================================== */

      if (!normalizedCoinId) {
         return res.status(400).json({
            message:
               "coinId is required",
         });
      }


      if (!normalizedCoin) {
         return res.status(400).json({
            message:
               "coin is required",
         });
      }


      if (!normalizedSymbol) {
         return res.status(400).json({
            message:
               "symbol is required",
         });
      }


      /* ====================================================
         CHECK EXISTING COIN
      ==================================================== */

      const existing =
         await Watchlist.findOne({
            userId,
            coinId:
               normalizedCoinId,
         });


      if (existing) {

         const watchlist =
            await getUserWatchlist(
               userId
            );

         return res.status(200).json({
            message:
               "Coin already in watchlist",

            watchlist,
         });
      }


      /* ====================================================
         CREATE COIN
      ==================================================== */

      const created =
         await Watchlist.create({

            userId,

            coinId:
               normalizedCoinId,

            coin:
               normalizedCoin,

            symbol:
               normalizedSymbol,

            image:
               normalizedImage,
         });


      console.log(
         "WATCHLIST COIN CREATED:",
         created.coinId,
         created.symbol,
         "USER:",
         userId.toString()
      );


      /* ====================================================
         RETURN UPDATED WATCHLIST
      ==================================================== */

      const watchlist =
         await getUserWatchlist(
            userId
         );


      return res.status(201).json({

         message:
            "Coin added to watchlist",

         watchlist,

      });

   } catch (error) {

      console.error(
         "Add watchlist error:",
         error
      );


      /* ====================================================
         DUPLICATE
      ==================================================== */

      if (
         error.code === 11000
      ) {

         try {

            const userId =
               getUserId(req);

            if (!userId) {
               return res.status(401).json({
                  message:
                     "Authentication required",
               });
            }

            const watchlist =
               await getUserWatchlist(
                  userId
               );

            return res.status(200).json({

               message:
                  "Coin already in watchlist",

               watchlist,

            });

         } catch (duplicateError) {

            console.error(
               "Duplicate recovery error:",
               duplicateError
            );

            return res.status(409).json({
               message:
                  "Coin is already in your watchlist",
            });
         }
      }


      /* ====================================================
         MONGOOSE VALIDATION
      ==================================================== */

      if (
         error.name ===
         "ValidationError"
      ) {

         return res.status(400).json({
            message:
               "Invalid watchlist data",
         });
      }


      return res.status(500).json({
         message:
            "Failed to add coin to watchlist",
      });
   }
};


/* =========================================================
   REMOVE FROM WATCHLIST
========================================================= */

const removeFromWatchlist = async (req, res) => {
   try {

      const userId = getUserId(req);


      if (!userId) {
         return res.status(401).json({
            message:
               "Authentication required",
         });
      }


      const coinId =
         getCoinId(
            req.params?.coinId
         );


      if (!coinId) {
         return res.status(400).json({
            message:
               "Coin ID is required",
         });
      }


      const deleted =
         await Watchlist.findOneAndDelete({
            userId,
            coinId,
         });


      if (!deleted) {
         return res.status(404).json({
            message:
               "Coin not found in watchlist",
         });
      }


      return res.status(200).json({

         message:
            "Coin removed from watchlist",

         coinId,

      });

   } catch (error) {

      console.error(
         "Remove watchlist error:",
         error
      );

      return res.status(500).json({
         message:
            "Failed to remove coin from watchlist",
      });
   }
};


/* =========================================================
   CHECK WATCHLIST
========================================================= */

const checkWatchlist = async (req, res) => {
   try {

      const userId = getUserId(req);


      if (!userId) {
         return res.status(401).json({
            message:
               "Authentication required",
         });
      }


      const coinId =
         getCoinId(
            req.params?.coinId
         );


      if (!coinId) {
         return res.status(400).json({
            message:
               "Coin ID is required",
         });
      }


      const item =
         await Watchlist.findOne({
            userId,
            coinId,
         }).lean();


      return res.status(200).json({

         isWatchlisted:
            Boolean(item),

      });

   } catch (error) {

      console.error(
         "Check watchlist error:",
         error
      );

      return res.status(500).json({
         message:
            "Failed to check watchlist",
      });
   }
};


/* =========================================================
   EXPORT
========================================================= */

module.exports = {
   getWatchlist,
   addToWatchlist,
   removeFromWatchlist,
   checkWatchlist,
};