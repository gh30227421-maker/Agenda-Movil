"use client";

import React from 'react';
import ChartModalWrapper from './ChartModalWrapper';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList 
} from 'recharts';

interface VolumenChartProps {
  events: any[];
}

export default function VolumenChart({ events }: VolumenChartProps) {
  const canalColors: Record<string, string> = {
    'Agencia Móvil': '#00205B',  // Azul BNC
    'Red de Agencias': '#FE5000', // Naranja BNC
    'Unidad Móvil': '#3B82F6',   // Azul Claro
  };

  // Calcular métricas dinámicas para todas las operaciones
  let aperturas = { 'Agencia Móvil': 0, 'Red de Agencias': 0, 'Unidad Móvil': 0 };
  let entregasTdd = { 'Agencia Móvil': 0, 'Red de Agencias': 0, 'Unidad Móvil': 0 };
  let otrasOps = { 'Agencia Móvil': 0, 'Red de Agencias': 0, 'Unidad Móvil': 0 };

  events.forEach(ev => {
    const c = ev.cifras;
    const type = ev.type as 'Agencia Móvil' | 'Red de Agencias' | 'Unidad Móvil';
    if (c && type && aperturas[type] !== undefined) {
      aperturas[type] += c.cuentasAbiertas || 0;
      entregasTdd[type] += c.tdd || 0;
      otrasOps[type] += c.reclamos || 0;
    }
  });

  const totalAperturas = (aperturas['Agencia Móvil'] + aperturas['Red de Agencias'] + aperturas['Unidad Móvil']) || 1;
  const totalTdd = (entregasTdd['Agencia Móvil'] + entregasTdd['Red de Agencias'] + entregasTdd['Unidad Móvil']) || 1;
  const totalOtras = (otrasOps['Agencia Móvil'] + otrasOps['Red de Agencias'] + otrasOps['Unidad Móvil']) || 1;

  const data = [
    {
      categoria: 'APERTURA DE CUENTAS',
      'Agencia Móvil': aperturas['Agencia Móvil'],
      'Agencia Móvil Pct': Math.round((aperturas['Agencia Móvil'] / totalAperturas) * 100),
      'Red de Agencias': aperturas['Red de Agencias'],
      'Red de Agencias Pct': Math.round((aperturas['Red de Agencias'] / totalAperturas) * 100),
      'Unidad Móvil': aperturas['Unidad Móvil'],
      'Unidad Móvil Pct': Math.round((aperturas['Unidad Móvil'] / totalAperturas) * 100),
    },
    {
      categoria: 'ENTREGA TDD',
      'Agencia Móvil': entregasTdd['Agencia Móvil'],
      'Agencia Móvil Pct': entregasTdd['Agencia Móvil'] > 0 ? Math.round((entregasTdd['Agencia Móvil'] / totalTdd) * 100) : 0,
      'Red de Agencias': entregasTdd['Red de Agencias'],
      'Red de Agencias Pct': entregasTdd['Red de Agencias'] > 0 ? Math.round((entregasTdd['Red de Agencias'] / totalTdd) * 100) : 0,
      'Unidad Móvil': entregasTdd['Unidad Móvil'],
      'Unidad Móvil Pct': entregasTdd['Unidad Móvil'] > 0 ? Math.round((entregasTdd['Unidad Móvil'] / totalTdd) * 100) : 0,
    },
    {
      categoria: 'OTRAS OPERACIONES',
      'Agencia Móvil': otrasOps['Agencia Móvil'],
      'Agencia Móvil Pct': otrasOps['Agencia Móvil'] > 0 ? Math.round((otrasOps['Agencia Móvil'] / totalOtras) * 100) : 0,
      'Red de Agencias': otrasOps['Red de Agencias'],
      'Red de Agencias Pct': otrasOps['Red de Agencias'] > 0 ? Math.round((otrasOps['Red de Agencias'] / totalOtras) * 100) : 0,
      'Unidad Móvil': otrasOps['Unidad Móvil'],
      'Unidad Móvil Pct': otrasOps['Unidad Móvil'] > 0 ? Math.round((otrasOps['Unidad Móvil'] / totalOtras) * 100) : 0,
    },
  ];

  const renderLabel = (props: any, keyName: string) => {
    const { x, y, width, height, index } = props;
    const row = data[index];
    if (!row) return null;
    
    const value = row[keyName as keyof typeof row] as number;
    const pctKey = `${keyName} Pct` as keyof typeof row;
    const pct = row[pctKey] as number;

    if (!width || width < 25 || !value || value === 0) return null;
    
    if (pct === 0) return null;

    return (
      <text
        x={x + width / 2}
        y={y + height / 2 + 4}
        fill="#FFFFFF"
        fontSize={15}
        fontWeight="bold"
        textAnchor="middle"
      >
        {`${value.toLocaleString('en-US')} (${pct}%)`}
      </text>
    );
  };

  return (
    <ChartModalWrapper 
      title="Distribución del Volumen Operativo por Canal de Atención"
      subtitle="Comparativa 100% apilada con etiquetas de valores absolutos y porcentaje"
    >
      <div className="flex flex-col h-full space-y-6">
        <div className="flex items-center justify-end w-full">
          <div className="flex items-center gap-2">
            <span className="bg-[#FE5000] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
              Estadísticas
            </span>
          </div>
        </div>

        {/* Gráfico de Barras Horizontales Apiladas con Etiquetas Internas seguras */}
        <div className="w-full flex-1 min-h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={data}
              stackOffset="expand"
              margin={{ top: 10, right: 120, left: 40, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
              <XAxis type="number" tickFormatter={(val) => `${Math.round(val * 100)}%`} tick={{ fontSize: 15, fill: '#6B7280' }} />
              <YAxis 
                type="category" 
                dataKey="categoria" 
                tick={{ fontSize: 15, fontWeight: 'bold', fill: '#1F2937' }} 
                width={160} 
              />
              <Tooltip 
                formatter={(val: any, name: any, item: any) => {
                  if (!item || !item.payload || val === 0) return [`${val}`, name];
                  const pctKey = `${name} Pct`;
                  const pct = item.payload[pctKey] !== undefined ? item.payload[pctKey] : 0;
                  return [`${val} (${pct}%)`, name];
                }}
                contentStyle={{ backgroundColor: '#00205B', borderRadius: '10px', color: '#FFF', border: 'none' }}
              />
              <Legend verticalAlign="top" align="center" wrapperStyle={{ paddingBottom: '20px', fontSize: '16px', fontWeight: 'bold' }} />
              
              <Bar dataKey="Agencia Móvil" stackId="a" fill={canalColors['Agencia Móvil']} barSize={36}>
                <LabelList dataKey="Agencia Móvil" content={(props: any) => renderLabel(props, 'Agencia Móvil')} />
              </Bar>
              <Bar dataKey="Red de Agencias" stackId="a" fill={canalColors['Red de Agencias']} barSize={36}>
                <LabelList dataKey="Red de Agencias" content={(props: any) => renderLabel(props, 'Red de Agencias')} />
              </Bar>
              <Bar dataKey="Unidad Móvil" stackId="a" fill={canalColors['Unidad Móvil']} barSize={36}>
                <LabelList dataKey="Unidad Móvil" content={(props: any) => renderLabel(props, 'Unidad Móvil')} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <p className="text-[11px] text-gray-500 italic bg-gray-50 p-3 rounded-xl border border-gray-100 mt-4">
          <strong>Nota:</strong> En "Otras Operaciones y Servicios" se incluyen gestiones como: restablecimiento de claves, reseteo de cuentas, activación de cuentas y actualización de datos.
        </p>
      </div>
    </ChartModalWrapper>
  );
}
