const mongoose = require("mongoose");
const Alert = require("../models/Alert");

/* =========================================================
   GET ALL ALERTS
   GET /api/alerts
========================================================= */

const getAlerts = async (req, res) => {
   try {
      const userId = req.userId || req.user?.userId;

      if (
         !userId ||
         !mongoose.Types.ObjectId.isValid(userId)
      ) {
         return res.status(401).json({
            message:
               "Invalid authenticated user.",
         });
      }

      const alerts = await Alert.find({
         userId,
      })
         .sort({
            createdAt: -1,
         })
         .lean();

      return res.status(200).json({
         alerts,
      });
   } catch (error) {
      console.error(
         "Get alerts error:",
         error
      );

      return res.status(500).json({
         message:
            "Failed to load alerts.",
      });
   }
};

/* =========================================================
   CREATE ALERT
   POST /api/alerts
========================================================= */

const createAlert = async (req, res) => {
   try {
      const userId = req.userId || req.user?.userId;

      if (
         !userId ||
         !mongoose.Types.ObjectId.isValid(userId)
      ) {
         return res.status(401).json({
            message:
               "Invalid authenticated user.",
         });
      }

      const {
         coinId,
         coin,
         symbol,
         image,
         price,
         condition,
         active,
      } = req.body;

      /* -----------------------------------------------
         VALIDATION
      ------------------------------------------------ */

      if (
         !coinId ||
         !coin ||
         !symbol
      ) {
         return res.status(400).json({
            message:
               "Coin ID, coin name and symbol are required.",
         });
      }

      const numericPrice =
         Number(price);

      if (
         !Number.isFinite(
            numericPrice
         ) ||
         numericPrice <= 0
      ) {
         return res.status(400).json({
            message:
               "Target price must be a valid number greater than zero.",
         });
      }

      if (
         condition !== "above" &&
         condition !== "below"
      ) {
         return res.status(400).json({
            message:
               "Condition must be either above or below.",
         });
      }

      /* -----------------------------------------------
         CREATE MONGODB DOCUMENT
      ------------------------------------------------ */

      const alert =
         await Alert.create({
            userId,

            coinId:
               String(coinId).trim(),

            coin:
               String(coin).trim(),

            symbol:
               String(symbol)
                  .trim()
                  .toUpperCase(),

            image:
               typeof image === "string"
                  ? image
                  : "",

            price:
               numericPrice,

            condition,

            active:
               active !== false,
         });

      console.log(
         "Alert saved to MongoDB:",
         alert._id.toString()
      );

      return res.status(201).json({
         message:
            "Alert created successfully.",

         alert,
      });
   } catch (error) {
      console.error(
         "Create alert error:",
         error
      );

      return res.status(500).json({
         message:
            "Failed to create alert.",
         error:
            process.env.NODE_ENV ===
               "development"
               ? error.message
               : undefined,
      });
   }
};

/* =========================================================
   UPDATE ALERT
   PATCH /api/alerts/:id
========================================================= */

const updateAlert = async (req, res) => {
   try {
      const userId = req.userId || req.user?.userId;

      const { id } = req.params;

      if (
         !userId ||
         !mongoose.Types.ObjectId.isValid(userId)
      ) {
         return res.status(401).json({
            message:
               "Invalid authenticated user.",
         });
      }

      if (
         !mongoose.Types.ObjectId.isValid(id)
      ) {
         return res.status(400).json({
            message:
               "Invalid alert ID.",
         });
      }

      const updateData = {};

      /* -----------------------------------------------
         ACTIVE
      ------------------------------------------------ */

      if (
         typeof req.body.active ===
         "boolean"
      ) {
         updateData.active =
            req.body.active;
      }

      /* -----------------------------------------------
         PRICE
      ------------------------------------------------ */

      if (
         req.body.price !==
         undefined
      ) {
         const numericPrice =
            Number(req.body.price);

         if (
            !Number.isFinite(
               numericPrice
            ) ||
            numericPrice <= 0
         ) {
            return res.status(400).json({
               message:
                  "Target price must be a valid number greater than zero.",
            });
         }

         updateData.price =
            numericPrice;
      }

      /* -----------------------------------------------
         CONDITION
      ------------------------------------------------ */

      if (
         req.body.condition !==
         undefined
      ) {
         if (
            req.body.condition !==
            "above" &&
            req.body.condition !==
            "below"
         ) {
            return res.status(400).json({
               message:
                  "Condition must be either above or below.",
            });
         }

         updateData.condition =
            req.body.condition;
      }

      if (
         Object.keys(updateData)
            .length === 0
      ) {
         return res.status(400).json({
            message:
               "No valid fields were provided for update.",
         });
      }

      /* -----------------------------------------------
         UPDATE ONLY CURRENT USER'S ALERT
      ------------------------------------------------ */

      const alert =
         await Alert.findOneAndUpdate(
            {
               _id: id,
               userId,
            },
            {
               $set: updateData,
            },
            {
               new: true,
               runValidators: true,
            }
         );

      if (!alert) {
         return res.status(404).json({
            message:
               "Alert not found.",
         });
      }

      return res.status(200).json({
         message:
            "Alert updated successfully.",

         alert,
      });
   } catch (error) {
      console.error(
         "Update alert error:",
         error
      );

      return res.status(500).json({
         message:
            "Failed to update alert.",
      });
   }
};

/* =========================================================
   DELETE ALERT
   DELETE /api/alerts/:id
========================================================= */

const deleteAlert = async (req, res) => {
   try {
      const userId = req.userId || req.user?.userId;

      const { id } = req.params;

      if (
         !userId ||
         !mongoose.Types.ObjectId.isValid(userId)
      ) {
         return res.status(401).json({
            message:
               "Invalid authenticated user.",
         });
      }

      if (
         !mongoose.Types.ObjectId.isValid(id)
      ) {
         return res.status(400).json({
            message:
               "Invalid alert ID.",
         });
      }

      const alert =
         await Alert.findOneAndDelete({
            _id: id,
            userId,
         });

      if (!alert) {
         return res.status(404).json({
            message:
               "Alert not found.",
         });
      }

      return res.status(200).json({
         message:
            "Alert deleted successfully.",

         alert,
      });
   } catch (error) {
      console.error(
         "Delete alert error:",
         error
      );

      return res.status(500).json({
         message:
            "Failed to delete alert.",
      });
   }
};

module.exports = {
   getAlerts,
   createAlert,
   updateAlert,
   deleteAlert,
};