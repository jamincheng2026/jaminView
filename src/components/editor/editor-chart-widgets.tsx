"use client";

import dynamic from "next/dynamic";

const LineChart = dynamic(() => import("@visactor/react-vchart").then((mod) => mod.LineChart), {ssr: false});
const BarChart = dynamic(() => import("@visactor/react-vchart").then((mod) => mod.BarChart), {ssr: false});
const PieChart = dynamic(() => import("@visactor/react-vchart").then((mod) => mod.PieChart), {ssr: false});

type ChartDatum = {
  label: string;
  value: number;
};

const fallbackLineData: ChartDatum[] = [
  {label: "Jan", value: 38},
  {label: "Feb", value: 42},
  {label: "Mar", value: 40},
  {label: "Apr", value: 54},
  {label: "May", value: 51},
  {label: "Jun", value: 68},
  {label: "Jul", value: 76},
];

const fallbackBarData: ChartDatum[] = [
  {label: "Rotterdam", value: 82},
  {label: "Singapore", value: 94},
  {label: "Shanghai", value: 61},
];

const fallbackPieData: ChartDatum[] = [
  {label: "Maersk", value: 42},
  {label: "MSC", value: 28},
  {label: "CMA", value: 30},
];

export function MiniLineChart({
  accent = "#215637",
  data = fallbackLineData,
}: {
  accent?: string;
  data?: ChartDatum[];
}) {
  const source = [{id: "line-source", values: data.map((item) => ({month: item.label, value: item.value}))}];

  return (
    <div className="h-[108px] rounded-[4px] bg-[linear-gradient(180deg,#f7e8bf_0%,#f3dab2_100%)] p-2">
      <LineChart
        key={`line-${accent}`}
        data={source}
        xField="month"
        yField="value"
        height={92}
        color={[accent]}
        padding={{top: 10, right: 8, bottom: 12, left: 8}}
        axes={[{orient: "left", visible: false}, {orient: "bottom", visible: false}]}
        crosshair={{xField: {visible: false}, yField: {visible: false}}}
        legends={[]}
        point={{visible: data.length <= 4}}
        line={{style: {lineWidth: 3, lineCap: "round"}}}
        tooltip={{visible: false}}
      />
    </div>
  );
}

export function MiniBarChart({
  accent = "#406840",
  data = fallbackBarData,
}: {
  accent?: string;
  data?: ChartDatum[];
}) {
  const source = [{id: "bar-source", values: data.map((item) => ({port: item.label, value: item.value}))}];

  return (
    <div className="h-[108px] rounded-[4px] bg-[#fafaf5]">
      <BarChart
        key={`bar-${accent}`}
        data={source}
        xField="port"
        yField="value"
        height={108}
        color={[accent]}
        padding={{top: 10, right: 6, bottom: 24, left: 18}}
        axes={[
          {orient: "left", visible: false},
          {
            orient: "bottom",
            label: {visible: true, style: {fontSize: 8, fill: "#727971"}},
            tick: {visible: false},
            domainLine: {visible: false},
          },
        ]}
        bar={{state: {hover: {fillOpacity: 0.9}}, style: {cornerRadiusTopLeft: 4, cornerRadiusTopRight: 4}}}
        crosshair={{xField: {visible: false}, yField: {visible: false}}}
        legends={[]}
        tooltip={{visible: false}}
      />
    </div>
  );
}

export function MiniPieChart({
  accent = "#23422a",
  data = fallbackPieData,
}: {
  accent?: string;
  data?: ChartDatum[];
}) {
  const source = [{id: "pie-source", values: data.map((item) => ({carrier: item.label, value: item.value}))}];
  const legendColors = [accent, "#406840", "#b0cdbc", "#d6a448", "#d38266"];

  return (
    <div className="flex items-center gap-4">
      <div className="h-[90px] w-[90px] shrink-0">
        <PieChart
          key={`pie-${accent}`}
          data={source}
          categoryField="carrier"
          valueField="value"
          height={90}
          color={legendColors}
          padding={0}
          outerRadius={0.82}
          innerRadius={0.58}
          legends={[]}
          label={{visible: false}}
          tooltip={{visible: false}}
        />
      </div>

      <div className="space-y-2 text-[9px] font-bold">
        {data.slice(0, 3).map((item, index) => (
          <div key={`${item.label}-${index}`} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{background: legendColors[index] ?? accent}} />
            {item.label} {item.value}%
          </div>
        ))}
      </div>
    </div>
  );
}
