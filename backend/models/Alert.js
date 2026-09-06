const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
   {
      userId: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         required: true,
         index: true,
      },

      coinId: {
         type: String,
         required: true,
         trim: true,
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

      image: {
         type: String,
         default: "",
      },

      price: {
         type: Number,
         required: true,
         min: 0,
      },

      condition: {
         type: String,
         enum: ["above", "below"],
         required: true,
         default: "above",
      },

      active: {
         type: Boolean,
         default: true,
      },
   },
   {
      timestamps: true,
   }
);

module.exports = mongoose.model(
   "Alert",
   alertSchema
);