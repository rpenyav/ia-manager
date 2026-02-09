import ReactECharts from 'echarts-for-react';

type ChartProps = {
  option: Record<string, unknown>;
  height?: number;
  className?: string;
};

type SparkPoint = {
  label: string;
  value: number;
};

type SparklineProps = {
  data: SparkPoint[];
  color?: string;
  height?: number;
  width?: number | string;
};

export function Chart({ option, height = 240, className }: ChartProps) {
  return (
    <ReactECharts
      option={option}
      className={className}
      style={{ height, width: '100%' }}
    />
  );
}

export function Sparkline({
  data,
  color = '#1f6f78',
  height = 42,
  width = 140
}: SparklineProps) {
  const labels = data.map((point) => point.label);
  const values = data.map((point) => point.value);
  const option = {
    grid: { left: 4, right: 4, top: 4, bottom: 4 },
    xAxis: { type: 'category', data: labels, show: false },
    yAxis: { type: 'value', show: false },
    series: [
      {
        type: 'line',
        data: values,
        smooth: true,
        symbol: 'none',
        lineStyle: { color, width: 2 },
        areaStyle: { color, opacity: 0.2 }
      }
    ]
  };

  return <ReactECharts option={option} style={{ height, width }} />;
}
