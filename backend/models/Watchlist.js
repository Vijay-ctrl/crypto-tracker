const mongoose = require("mongoose");

const watchlistSchema =
   new mongoose.Schema(
      {
         userId: {
            type:
               mongoose.Schema.Types.ObjectId,
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
      },

      {
         timestamps: true,
      }
   );


watchlistSchema.index(
   {
      userId: 1,
      coinId: 1,
   },
   {
      unique: true,
   }
);


module.exports =
   mongoose.model(
      "Watchlist",
      watchlistSchema
   );