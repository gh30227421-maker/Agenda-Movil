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
  const { agencies, employees } = useAgenda(); // Custom hook to fetch reference data
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [codigoActivo, setCodigoActivo] = useState('');
  const [tipoEquipo, setTipoEquipo] = useState('');
  const [marcaModelo, setMarcaModelo] = useState('');
  const [serial, setSerial] = useState('');
  const [estadoOperativo, setEstadoOperativo] = useState('Operativo');
  const [asignadoTipo, setAsignadoTipo] = useState<'ninguno' | 'agencia' | 'empleado'>('ninguno');
  const [agencyCode, setAgencyCode] = useState('');
  const [employeeId, setEmployeeId] = useState('');

  useEffect(() => {
    if (assetToEdit) {
      setCodigoActivo(assetToEdit.codigo_activo);
      setTipoEquipo(assetToEdit.tipo_equipo);
      setMarcaModelo(assetToEdit.marca_modelo || '');
      setSerial(assetToEdit.serial || '');
      setEstadoOperativo(assetToEdit.estado_operativo);
      if (assetToEdit.agency_code) {
        setAsignadoTipo('agencia');
        setAgencyCode(assetToEdit.agency_code);
        setEmployeeId('');
      } else if (assetToEdit.employee_id) {
        setAsignadoTipo('empleado');
        setEmployeeId(assetToEdit.employee_id);
        setAgencyCode('');
      } else {
        setAsignadoTipo('ninguno');
        setAgencyCode('');
        setEmployeeId('');
      }
    } else {
      // Reset
      setCodigoActivo('');
      setTipoEquipo('');
      setMarcaModelo('');
      setSerial('');
      setEstadoOperativo('Operativo');
      setAsignadoTipo('ninguno');
      setAgencyCode('');
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
        marca_modelo: marcaModelo || null,
        serial: serial || null,
        estado_operativo: estadoOperativo,
        agency_code: asignadoTipo === 'agencia' ? agencyCode : null,
        employee_id: asignadoTipo === 'empleado' ? employeeId : null,
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
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden my-8">
        
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-[#00205B]">
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
                Código de Activo / Placa *
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

            {/* Marca / Modelo */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Marca / Modelo
              </label>
              <input
                type="text"
                value={marcaModelo}
                onChange={(e) => setMarcaModelo(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#001A45] focus:border-transparent focus:outline-none"
                placeholder="Ej. Dell Latitude 3420"
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
                  { value: 'En Tránsito', label: 'En Tránsito' },
                  { value: 'Dañado', label: 'Dañado' },
                  { value: 'Desincorporado', label: 'Desincorporado' }
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
                    { value: 'ninguno', label: 'Sin Asignar (En Stock)' },
                    { value: 'agencia', label: 'Asignado a Agencia / Evento' },
                    { value: 'empleado', label: 'Asignado a Empleado' }
                  ]}
                  value={asignadoTipo}
                  onChange={(val) => setAsignadoTipo(val as any)}
                />
              </div>

              {asignadoTipo === 'agencia' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Seleccionar Agencia *
                  </label>
                  <ComboBox
                    options={[
                      { value: '', label: 'Seleccione...' },
                      ...agencies.map(ag => ({ value: ag.code, label: `${ag.code} - ${ag.name}` }))
                    ]}
                    value={agencyCode}
                    onChange={setAgencyCode}
                  />
                </div>
              )}

              {asignadoTipo === 'empleado' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Seleccionar Empleado *
                  </label>
                  <ComboBox
                    options={[
                      { value: '', label: 'Seleccione...' },
                      ...employees.map(emp => ({ value: emp.id, label: `${emp.full_name} (${emp.role})` }))
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
