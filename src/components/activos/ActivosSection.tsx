"use client";

import React, { useState, useMemo } from 'react';
import { Box, Plus, Search, Filter, Laptop, PenTool, CheckCircle2, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { useAssets, Asset } from '@/context/AssetsContext';
import ComboBox from '@/components/ui/ComboBox';
import AssetModal from './AssetModal';
import { useAgenda } from '@/context/AgendaContext'; // Para obtener nombres de agencias y empleados si es necesario

export default function ActivosSection() {
  const { assets, isLoading, deleteAsset } = useAssets();
  const { agencies, employees } = useAgenda();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assetToEdit, setAssetToEdit] = useState<Asset | null>(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('all');

  const handleOpenNew = () => {
    setAssetToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (asset: Asset) => {
    setAssetToEdit(asset);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Está seguro de que desea eliminar este activo de forma permanente?')) {
      await deleteAsset(id);
    }
  };

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const matchSearch = 
        asset.codigo_activo.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (asset.marca_modelo && asset.marca_modelo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (asset.serial && asset.serial.toLowerCase().includes(searchTerm.toLowerCase())) ||
        asset.tipo_equipo.toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchEstado = filterEstado === 'all' || asset.estado_operativo === filterEstado;
      
      return matchSearch && matchEstado;
    });
  }, [assets, searchTerm, filterEstado]);

  // KPIs
  const totalAssets = assets.length;
  const totalOperativos = assets.filter(a => a.estado_operativo === 'Operativo').length;
  const totalMantenimiento = assets.filter(a => a.estado_operativo === 'En Mantenimiento' || a.estado_operativo === 'Dañado').length;
  const totalAsignados = assets.filter(a => a.agency_code || a.employee_id).length;

  return (
    <div className="space-y-8 w-full max-w-[95%] xl:max-w-[98%] mx-auto">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#00205B]">Control de Activos Tecnológicos</h2>
          <p className="text-gray-500 text-sm mt-1">
            Gestión e inventario de equipos (Laptops, Impresoras Zebra, Olivetti) asignados a operativos y personal.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center gap-2 bg-[#009639] text-white px-5 py-2.5 rounded-xl font-medium hover:bg-[#007a2e] shadow-sm transition-colors"
        >
          <Plus className="w-5 h-5" />
          Registrar Nuevo Activo
        </button>
      </div>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Box className="w-5 h-5 text-[#00205B]" />
            </div>
          </div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Total Activos Registrados</p>
          <h3 className="text-3xl font-bold text-gray-900 mt-1">{totalAssets}</h3>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-[#009639]" />
            </div>
          </div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Equipos Operativos</p>
          <h3 className="text-3xl font-bold text-[#009639] mt-1">{totalOperativos}</h3>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Mantenimiento / Dañados</p>
          <h3 className="text-3xl font-bold text-red-600 mt-1">{totalMantenimiento}</h3>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
              <Laptop className="w-5 h-5 text-[#FE5000]" />
            </div>
          </div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Equipos Asignados (En Uso)</p>
          <h3 className="text-3xl font-bold text-[#FE5000] mt-1">{totalAsignados}</h3>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex items-center gap-2 text-gray-500 font-medium">
          <Filter className="w-5 h-5" />
          <span className="text-sm">Filtros:</span>
        </div>
        
        <div className="flex-1 w-full flex flex-col md:flex-row gap-4">
          <div className="relative w-full md:w-1/2">
            <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-[#00205B] focus:border-[#00205B] block w-full ps-10 p-2.5 outline-none"
              placeholder="Buscar por código, serial, tipo o modelo..."
            />
          </div>

          <div className="w-full md:w-1/4">
            <ComboBox
              options={[
                { value: 'all', label: 'Todos los Estados' },
                { value: 'Operativo', label: 'Operativos' },
                { value: 'En Mantenimiento', label: 'En Mantenimiento' },
                { value: 'En Tránsito', label: 'En Tránsito' },
                { value: 'Dañado', label: 'Dañados' },
                { value: 'Desincorporado', label: 'Desincorporados' }
              ]}
              value={filterEstado}
              onChange={setFilterEstado}
              icon={<Filter className="w-4 h-4" />}
            />
          </div>
        </div>
      </div>

      {/* Tabla de Activos */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="text-xs text-gray-500 bg-gray-50/80 uppercase border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-bold">Código / Placa</th>
                <th className="px-6 py-4 font-bold">Tipo de Equipo</th>
                <th className="px-6 py-4 font-bold">Marca & Serial</th>
                <th className="px-6 py-4 font-bold">Asignación Actual</th>
                <th className="px-6 py-4 font-bold">Estado</th>
                <th className="px-6 py-4 font-bold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                    <div className="flex justify-center mb-2">
                      <div className="w-6 h-6 border-2 border-[#00205B] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    Cargando inventario...
                  </td>
                </tr>
              ) : filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                    No se encontraron activos que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => {
                  let badgeClass = "bg-gray-100 text-gray-800 border-gray-200";
                  if (asset.estado_operativo === 'Operativo') badgeClass = "bg-green-50 text-green-700 border-green-200";
                  if (asset.estado_operativo === 'En Mantenimiento') badgeClass = "bg-yellow-50 text-yellow-700 border-yellow-200";
                  if (asset.estado_operativo === 'Dañado') badgeClass = "bg-red-50 text-red-700 border-red-200";
                  if (asset.estado_operativo === 'En Tránsito') badgeClass = "bg-blue-50 text-blue-700 border-blue-200";

                  // Determinar texto de asignación
                  let asignacionTexto = "Sin Asignar (Stock)";
                  if (asset.agency_code) {
                    const ag = agencies.find(a => a.code === asset.agency_code);
                    asignacionTexto = `Agencia: ${asset.agency_code} ${ag ? `- ${ag.name}` : ''}`;
                  } else if (asset.employee_id) {
                    const emp = employees.find(e => e.id === asset.employee_id);
                    asignacionTexto = `Personal: ${emp ? emp.fullName : 'ID ' + asset.employee_id}`;
                  }

                  return (
                    <tr key={asset.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-[#00205B]">
                        {asset.codigo_activo}
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {asset.tipo_equipo}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900">{asset.marca_modelo || '-'}</div>
                        <div className="text-xs text-gray-400 mt-0.5">SN: {asset.serial || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-md ${asset.agency_code || asset.employee_id ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-gray-100 text-gray-600'}`}>
                          {asignacionTexto}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full border font-medium ${badgeClass}`}>
                          {asset.estado_operativo}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(asset)}
                            className="p-1.5 text-gray-400 hover:text-[#00205B] hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar Activo"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(asset.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar Activo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AssetModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        assetToEdit={assetToEdit} 
      />
    </div>
  );
}
