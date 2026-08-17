"use client";

import React, { useState, useEffect } from 'react';
import { X, Save, Box } from 'lucide-react';
import { useAssets, Asset } from '@/context/AssetsContext';
import { useAgenda } from '@/context/AgendaContext'; // To get agencies and employees
import ComboBox from '@/components/ui/ComboBox';

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetToEdit?: Asset | null;
}

export default function AssetModal({ isOpen, onClose, assetToEdit }: AssetModalProps) {
  const { addAsset, updateAsset } = useAssets();
  const { agencies, employees, events } = useAgenda(); // Custom hook to fetch reference data
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [codigoActivo, setCodigoActivo] = useState('');
  const [tipoEquipo, setTipoEquipo] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [serial, setSerial] = useState('');
  const [estadoOperativo, setEstadoOperativo] = useState('Operativo');
  const [tipoAsignacion, setTipoAsignacion] = useState<'stock' | 'agencia' | 'evento'>('stock');
  const [agenciaId, setAgenciaId] = useState('');
  const [eventoId, setEventoId] = useState('');
  const [employeeId, setEmployeeId] = useState('');

  useEffect(() => {
    if (assetToEdit) {
      setCodigoActivo(assetToEdit.codigo_activo);
      setTipoEquipo(assetToEdit.tipo_equipo);
      setMarca(assetToEdit.marca || assetToEdit.marca_modelo || '');
      setModelo(assetToEdit.modelo || '');
      setSerial(assetToEdit.serial || '');
      setEstadoOperativo(assetToEdit.estado_operativo);
      setTipoAsignacion((assetToEdit.tipo_asignacion as any) || 'stock');
      setAgenciaId(assetToEdit.agencia_id || '');
      setEventoId(assetToEdit.evento_id || '');
      setEmployeeId(assetToEdit.employee_id || '');
    } else {
      // Reset
      setCodigoActivo('');
      setTipoEquipo('');
      setMarca('');
      setModelo('');
      setSerial('');
      setEstadoOperativo('Operativo');
      setTipoAsignacion('stock');
      setAgenciaId('');
      setEventoId('');
      setEmployeeId('');
    }
  }, [assetToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const assetData = {
        codigo_activo: codigoActivo,
        tipo_equipo: tipoEquipo,
        marca: marca || null,
        modelo: modelo || null,
        serial: serial || null,
        estado_operativo: estadoOperativo,
        tipo_asignacion: tipoAsignacion,
        agencia_id: tipoAsignacion === 'agencia' ? (agenciaId || null) : null,
        evento_id: tipoAsignacion === 'evento' ? (eventoId || null) : null,
        employee_id: (tipoAsignacion === 'agencia' || tipoAsignacion === 'evento') ? (employeeId || null) : null,
      };

      if (assetToEdit) {
        await updateAsset(assetToEdit.id, assetData);
      } else {
        await addAsset(assetData);
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-visible my-8">
        
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-[#00205B] rounded-t-3xl">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Box className="w-5 h-5 text-[#FE5000]" />
            {assetToEdit ? 'Editar Activo' : 'Registrar Nuevo Activo'}
          </h3>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            
            {/* Codigo de Activo */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                N° Inventario BNC *
              </label>
              <input
                type="text"
                required
                value={codigoActivo}
                onChange={(e) => setCodigoActivo(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#001A45] focus:border-transparent focus:outline-none"
                placeholder="Ej. BNC-ACT-001"
              />
            </div>

            {/* Tipo de Equipo (Datalist flexible) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Tipo de Equipo *
              </label>
              <input
                type="text"
                required
                list="tipo-equipo-list"
                value={tipoEquipo}
                onChange={(e) => setTipoEquipo(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#001A45] focus:border-transparent focus:outline-none"
                placeholder="Ej. Laptop, Zebra, etc."
              />
              <datalist id="tipo-equipo-list">
                <option value="Laptop" />
                <option value="Impresora Zebra" />
                <option value="Impresora Multifuncional" />
                <option value="Impresora Olivetti" />
                <option value="Mouse" />
                <option value="Teclado" />
                <option value="Router / Switch" />
                <option value="Cableado" />
              </datalist>
            </div>

            {/* Marca */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Marca *
              </label>
              <input
                type="text"
                required
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#001A45] focus:border-transparent focus:outline-none"
                placeholder="Ej. Dell"
              />
            </div>

            {/* Modelo */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Modelo *
              </label>
              <input
                type="text"
                required
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#001A45] focus:border-transparent focus:outline-none"
                placeholder="Ej. Latitude 3420"
              />
            </div>

            {/* Serial */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Serial
              </label>
              <input
                type="text"
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#001A45] focus:border-transparent focus:outline-none"
                placeholder="Ej. S/N 12345ABC"
              />
            </div>

            {/* Estado Operativo */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Estado Operativo *
              </label>
              <ComboBox
                options={[
                  { value: 'Operativo', label: 'Operativo' },
                  { value: 'En Mantenimiento', label: 'En Mantenimiento' },
                  { value: 'Dañado', label: 'Dañado' }
                ]}
                value={estadoOperativo}
                onChange={setEstadoOperativo}
              />
            </div>
            
          </div>

          <hr className="my-6 border-gray-100" />

          {/* Asignación */}
          <div className="mb-6">
            <h4 className="text-md font-bold text-[#00205B] mb-4">Asignación y Custodia</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Tipo de Asignación
                </label>
                <ComboBox
                  options={[
                    { value: 'stock', label: 'Sin Asignar (En Stock)' },
                    { value: 'agencia', label: 'Asignado a Agencia' },
                    { value: 'evento', label: 'Asignado a Evento' }
                  ]}
                  value={tipoAsignacion}
                  onChange={(val) => {
                    setTipoAsignacion(val as any);
                    setAgenciaId('');
                    setEventoId('');
                    if (val === 'stock') {
                      setEmployeeId('');
                    }
                  }}
                />
              </div>

              {tipoAsignacion === 'agencia' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Seleccionar Agencia *
                  </label>
                  <ComboBox
                    options={[
                      { value: '', label: 'Seleccione...' },
                      ...agencies.map(ag => ({ value: ag.id, label: `${ag.code} - ${ag.name}` }))
                    ]}
                    value={agenciaId}
                    onChange={setAgenciaId}
                  />
                </div>
              )}

              {tipoAsignacion === 'evento' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Seleccionar Evento *
                  </label>
                  <ComboBox
                    options={[
                      { value: '', label: 'Seleccione...' },
                      ...events
                        .filter(ev => !['Culminado', 'Cerrado', 'Cancelado'].includes(ev.status || ''))
                        .map(ev => ({ value: ev.id, label: `${ev.eventName} - ${ev.agencyCode}` }))
                    ]}
                    value={eventoId}
                    onChange={setEventoId}
                  />
                </div>
              )}

              {(tipoAsignacion === 'agencia' || tipoAsignacion === 'evento') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Empleado Responsable (Custodio) *
                  </label>
                  <ComboBox
                    options={[
                      { value: '', label: 'Seleccione...' },
                      ...employees.map(emp => ({ value: emp.id, label: `${emp.fullName} (${emp.cargo})` }))
                    ]}
                    value={employeeId}
                    onChange={setEmployeeId}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl font-medium text-white bg-[#009639] hover:bg-[#007a2e] transition-colors flex items-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save className="w-5 h-5" />
              )}
              {isSubmitting ? 'Guardando...' : 'Guardar Activo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
