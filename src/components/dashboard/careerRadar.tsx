import React from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

interface RadarChartProps {
  data: {
    subject: string;
    score: number;
    fullMark: number;
  }[];
}

export const CareerRadar: React.FC<RadarChartProps> = ({ data }) => {
  return (
    <div className="w-full h-[300px] flex items-center justify-center font-sans">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#E2E8F0" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "#64748B", fontSize: 10, fontWeight: 600 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: "#94A3B8", fontSize: 8 }}
            stroke="transparent"
          />
          <Radar
            name="Skills Assessment"
            dataKey="score"
            stroke="#4F46E5"
            fill="#818CF8"
            fillOpacity={0.2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
