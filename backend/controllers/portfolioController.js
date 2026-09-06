const Portfolio = require("../models/Portfolio");

// GET /api/portfolio
const getPortfolio = async (req, res) => {
   try {
      const assets = await Portfolio.find({
         userId: req.userId,
      }).sort({
         createdAt: -1,
      });

      res.status(200).json({
         assets,
      });
   } catch (error) {
      console.error(
         "Get portfolio error:",
         error
      );

      res.status(500).json({
         message:
            "Failed to fetch portfolio",
         error: error.message,
      });
   }
};


// POST /api/portfolio
const addAsset = async (req, res) => {
   try {
      const {
         coinId,
         coin,
         symbol,
         quantity,
         buyPrice,
      } = req.body;


      // ---------------------------------------------
      // Basic validation
      // ---------------------------------------------

      if (!coin || !symbol) {
         return res.status(400).json({
            message:
               "Coin and symbol are required",
         });
      }


      const parsedQuantity =
         Number(quantity);

      const parsedBuyPrice =
         Number(buyPrice);


      if (
         !Number.isFinite(
            parsedQuantity
         ) ||
         parsedQuantity <= 0
      ) {
         return res.status(400).json({
            message:
               "Quantity must be greater than 0",
         });
      }


      if (
         !Number.isFinite(
            parsedBuyPrice
         ) ||
         parsedBuyPrice <= 0
      ) {
         return res.status(400).json({
            message:
               "Buy price must be greater than 0",
         });
      }


      // ---------------------------------------------
      // Original investment
      // ---------------------------------------------

      const investedValue =
         parsedQuantity *
         parsedBuyPrice;


      // ---------------------------------------------
      // Create portfolio asset
      // ---------------------------------------------

      const asset =
         await Portfolio.create({
            userId: req.userId,

            coinId:
               String(
                  coinId || ""
               )
                  .trim()
                  .toLowerCase(),

            coin:
               coin.trim(),

            symbol:
               symbol
                  .trim()
                  .toUpperCase(),

            quantity:
               parsedQuantity,

            buyPrice:
               parsedBuyPrice,

            investedValue,
         });


      return res.status(201).json({
         message:
            "Asset added successfully",

         asset,
      });
   } catch (error) {
      console.error(
         "Add portfolio asset error:",
         error
      );

      return res.status(500).json({
         message:
            "Failed to add asset",

         error:
            error.message,
      });
   }
};


// DELETE /api/portfolio/:id
const deleteAsset = async (req, res) => {
   try {
      const { id } = req.params;


      const asset =
         await Portfolio.findOneAndDelete({
            _id: id,
            userId: req.userId,
         });


      if (!asset) {
         return res.status(404).json({
            message:
               "Asset not found",
         });
      }


      return res.status(200).json({
         message:
            "Asset removed successfully",

         assetId: id,
      });
   } catch (error) {
      console.error(
         "Delete portfolio asset error:",
         error
      );

      return res.status(500).json({
         message:
            "Failed to remove asset",

         error:
            error.message,
      });
   }
};


module.exports = {
   getPortfolio,
   addAsset,
   deleteAsset,
};