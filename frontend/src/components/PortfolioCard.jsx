import {
   Wallet,
   TrendingUp,
} from "lucide-react";

const PortfolioCard = ({
   value = 0,
   change = 0,
}) => {
   return (
      <div className="portfolio-card">

         <div className="portfolio-header">
            <div>
               <span>
                  Your Portfolio
               </span>

               <h2>
                  $
                  {Number(value).toLocaleString(
                     "en-US",
                     {
                        minimumFractionDigits: 2,
                     }
                  )}
               </h2>
            </div>

            <div className="portfolio-icon">
               <Wallet size={24} />
            </div>
         </div>

         <div className="portfolio-change">
            <TrendingUp size={17} />

            <span>
               {change >= 0 ? "+" : ""}
               {change}%
            </span>

            <small>
               24h change
            </small>
         </div>

      </div>
   );
};

export default PortfolioCard;