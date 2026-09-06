const mongoose = require("mongoose");

const portfolioSchema = new mongoose.Schema(
   {
      userId: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         required: true,
         index: true,
      },

      // CoinGecko unique coin ID
      // Example: bitcoin, ethereum, solana
      coinId: {
         type: String,
         trim: true,
         lowercase: true,
         default: "",
      },

      coin: {
         type: String,
         required: true,
         trim: true,
      },

      symbol: {
         type: String,
         required: true,
         trim: true,
         uppercase: true,
      },

      quantity: {
         type: Number,
         required: true,
         min: 0,
      },

      // Original price paid for one coin
      buyPrice: {
         type: Number,
         required: true,
         min: 0,
      },

      // Original amount invested
      // quantity × buyPrice
      investedValue: {
         type: Number,
         required: true,
         min: 0,
      },
   },
   {
      timestamps: true,
   }
);

module.exports = mongoose.model(
   "Portfolio",
   portfolioSchema
);