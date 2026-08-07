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
    'Agencia Móvil': '#00205C',   // Azul BNC Profundo
    'Red de Agencias': '#FE5000',  // Naranja BNC Institucional
    'Unidad Móvil': '#0284C7',    // Azul Zafiro BNC
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

  // Renderizado Inteligente de Etiquetas de Datos para evitar colisiones y superposiciones
  const renderSmartLabel = (props: any, keyName: string) => {
    const { x, y, width, height, index } = props;
    const row = data[index];
    if (!row) return null;
    
    const value = row[keyName as keyof typeof row] as number;
    const pctKey = `${keyName} Pct` as keyof typeof row;
    const pct = row[pctKey] as number;

    // Si el valor es cero o el segmento es extremadamente estrecho, no renderizar para evitar encimamiento
    if (!width || width < 30 || !value || value === 0 || pct === 0) return null;

    let textContent = '';
    let fontSize = 13;

    if (width >= 115) {
      // Espacio amplio: Valor absoluto + Porcentaje completo
      textContent = `${value.toLocaleString('en-US')} (${pct}%)`;
      fontSize = 12.5;
    } else if (width >= 65) {
      // Espacio mediano: Texto compacto
      textContent = `${value.toLocaleString('en-US')} (${pct}%)`;
      fontSize = 10.5;
    } else if (width >= 35) {
      // Espacio estrecho: Únicamente el porcentaje para no desbordar
      textContent = `${pct}%`;
      fontSize = 11;
    } else {
      return null;
    }

    return (
      <text
        x={x + width / 2}
        y={y + height / 2 + 4}
        fill="#FFFFFF"
        fontSize={fontSize}
        fontWeight="bold"
        textAnchor="middle"
        style={{ pointerEvents: 'none' }}
      >
        {textContent}
      </text>
    );
  };

  return (
    <ChartModalWrapper 
      title="Distribución del Volumen Operativo por Canal de Atención"
      subtitle="Comparativa 100% apilada con etiquetas dinámicas por canal"
    >
      <div className="flex flex-col w-full h-[470px] bg-transparent rounded-2xl overflow-hidden justify-between">
        
        {/* Cabecera Interna */}
        <div className="flex items-center justify-between px-1 mb-2 hide-on-download">
          <span className="text-xs text-gray-500 font-medium">
            Volumen consolidado y participación porcentual por operativa
          </span>
          <span className="bg-[#FE5000] text-white text-xs font-bold px-3 py-1 rounded-full shadow-xs">
            100% Apilado
          </span>
        </div>

        {/* Gráfico de Barras Horizontales Apiladas con Mayor Altura y Espacio */}
        <div className="w-full flex-1 min-h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={data}
              stackOffset="expand"
              margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
              <XAxis 
                type="number" 
                tickFormatter={(val) => `${Math.round(val * 100)}%`} 
                tick={{ fontSize: 13, fill: '#64748B', fontWeight: 600 }}
                axisLine={{ stroke: '#CBD5E1' }}
              />
              <YAxis 
                type="category" 
                dataKey="categoria" 
                tick={{ fontSize: 12, fontWeight: 700, fill: '#00205B' }} 
                width={175}
                axisLine={{ stroke: '#CBD5E1' }}
              />
              <Tooltip 
                formatter={(val: any, name: any, item: any) => {
                  if (!item || !item.payload || val === 0) return [`${val}`, name];
                  const pctKey = `${name} Pct`;
                  const pct = item.payload[pctKey] !== undefined ? item.payload[pctKey] : 0;
                  return [`${Number(val).toLocaleString('en-US')} (${pct}%)`, name];
                }}
                contentStyle={{ 
                  backgroundColor: '#00205C', 
                  borderRadius: '12px', 
                  color: '#FFF', 
                  border: 'none',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
                }}
              />
              <Legend 
                verticalAlign="top" 
                align="center" 
                wrapperStyle={{ paddingBottom: '16px', fontSize: '13px', fontWeight: 700 }} 
              />
              
              <Bar dataKey="Agencia Móvil" stackId="a" fill={canalColors['Agencia Móvil']} barSize={44}>
                <LabelList dataKey="Agencia Móvil" content={(props: any) => renderSmartLabel(props, 'Agencia Móvil')} />
              </Bar>
              <Bar dataKey="Red de Agencias" stackId="a" fill={canalColors['Red de Agencias']} barSize={44}>
                <LabelList dataKey="Red de Agencias" content={(props: any) => renderSmartLabel(props, 'Red de Agencias')} />
              </Bar>
              <Bar dataKey="Unidad Móvil" stackId="a" fill={canalColors['Unidad Móvil']} barSize={44}>
                <LabelList dataKey="Unidad Móvil" content={(props: any) => renderSmartLabel(props, 'Unidad Móvil')} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Nota explicativa inferior */}
        <p className="text-[11px] text-gray-500 italic bg-gray-50/80 p-2.5 rounded-xl border border-gray-100 mt-2">
          <strong>Nota:</strong> "Otras Operaciones" agrupa gestiones como reseteo de claves, activación de productos y actualización de datos.
        </p>
      </div>
    </ChartModalWrapper>
  );
}
