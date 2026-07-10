import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  LineChart,
  Line,
  Cell,
  ZAxis,
} from 'recharts';
import { metersToYards } from '../../physics/constants';
import type { SessionShot } from '../../types';

interface DispersionPlotProps {
  shots: SessionShot[];
}

export function DispersionPlot({ shots }: DispersionPlotProps) {
  const data = shots.map((s) => ({
    x: s.results.offlineYards,
    y: s.results.carryYards,
    name: `#${s.index}`,
    fill: s.tracerColor,
  }));

  return (
    <div className="h-44 w-full">
      <ResponsiveContainer>
        <ScatterChart margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
          <CartesianGrid stroke="#232a36" strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="x"
            name="Offline"
            unit=" yd"
            stroke="#8b95a8"
            tick={{ fontSize: 10 }}
            domain={['auto', 'auto']}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Carry"
            unit=" yd"
            stroke="#8b95a8"
            tick={{ fontSize: 10 }}
            width={36}
          />
          <ZAxis range={[60, 60]} />
          <ReferenceLine x={0} stroke="#3dd68c" strokeDasharray="4 4" />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{
              background: '#141820',
              border: '1px solid #232a36',
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Scatter data={data} fill="#00e5ff">
            {data.map((d, i) => (
              <Cell key={i} fill={d.fill} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

interface TrajectoryComparisonProps {
  shots: SessionShot[];
}

export function TrajectoryComparison({ shots }: TrajectoryComparisonProps) {
  const series = shots.filter((s) => s.tracerVisible).slice(-6);

  const byDistance = series.map((shot) => {
    const pts = shot.results.trajectory.filter((_, i) => i % 4 === 0);
    return pts.map((p) => ({
      d: metersToYards(Math.hypot(p.position.x, p.position.z)),
      h: metersToYards(p.position.y),
    }));
  });

  return (
    <div className="h-44 w-full">
      <ResponsiveContainer>
        <LineChart margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
          <CartesianGrid stroke="#232a36" strokeDasharray="3 3" />
          <XAxis
            dataKey="d"
            type="number"
            stroke="#8b95a8"
            tick={{ fontSize: 10 }}
            unit=" yd"
            domain={[0, 'auto']}
          />
          <YAxis
            dataKey="h"
            type="number"
            stroke="#8b95a8"
            tick={{ fontSize: 10 }}
            width={32}
            unit=" yd"
          />
          <Tooltip
            contentStyle={{
              background: '#141820',
              border: '1px solid #232a36',
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          {byDistance.map((pts, idx) => (
            <Line
              key={series[idx].id}
              data={pts}
              type="monotone"
              dataKey="h"
              stroke={series[idx].tracerColor}
              dot={false}
              strokeWidth={1.5}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
