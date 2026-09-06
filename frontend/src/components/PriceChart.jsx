import {
   LineChart,
   Line,
   ResponsiveContainer,
   YAxis,
} from "recharts";

import "./PriceChart.css";

const PriceChart = ({
   data = [],
   change,
}) => {
   if (!Array.isArray(data) || data.length < 2) {
      return (
         <div className="chart-empty">
            —
         </div>
      );
   }

   const chartData = data
      .map((price, index) => ({
         index,
         price: Number(price),
      }))
      .filter((item) =>
         Number.isFinite(item.price)
      );

   if (chartData.length < 2) {
      return (
         <div className="chart-empty">
            —
         </div>
      );
   }

   const isPositive = Number(change) >= 0;

   return (
      <div className="price-chart">
         <ResponsiveContainer
            width="100%"
            height="100%"
         >
            <LineChart
               data={chartData}
               margin={{
                  top: 4,
                  right: 2,
                  bottom: 4,
                  left: 2,
               }}
            >
               <YAxis
                  hide
                  domain={[
                     "dataMin",
                     "dataMax",
                  ]}
               />

               <Line
                  type="monotone"
                  dataKey="price"
                  stroke={
                     isPositive
                        ? "#16a34a"
                        : "#dc2626"
                  }
                  strokeWidth={2}
                  dot={false}
                  activeDot={false}
                  isAnimationActive={false}
               />
            </LineChart>
         </ResponsiveContainer>
      </div>
   );
};

export default PriceChart;