"use client";

import { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, CheckCircle2, Circle, MoreVertical, Search, UserPlus, Calendar as CalendarIcon, User, Users, Briefcase, ChevronDown, Edit2, Trash2 } from 'lucide-react';
import { useAgenda } from '@/context/AgendaContext';
import { Employee } from '@/lib/mock-data';
import { useToast } from '@/context/ToastContext';

export default function PersonalSection() {
  const { events, assignments, toggleAssignmentStatus, addAssignment, employees, addEmployee, updateEmployee, deleteEmployee } = useAgenda();
  const { showToast } = useToast();
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'asignaciones' | 'directorio'>('asignaciones');

  // Event selector state
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || '');
  const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [newEmpFicha, setNewEmpFicha] = useState('');
  const [newEmpDni, setNewEmpDni] = useState('');
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpCargo, setNewEmpCargo] = useState('');
  
  // Custom Dropdowns State for Assignment Modal
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  // Modals state
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isEditEmployeeModalOpen, setIsEditEmployeeModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyEmployee, setHistoryEmployee] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  
  const [employeeActionsDropdownId, setEmployeeActionsDropdownId] = useState<string | null>(null);
  const actionsDropdownRef = useRef<HTMLDivElement>(null);
  
  
  // Assignment Modal State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [role, setRole] = useState('Promotor');
  const [status, setStatus] = useState<'Confirmado' | 'Pendiente'>('Confirmado');

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsEventDropdownOpen(false);
      }
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
      if (actionsDropdownRef.current && !actionsDropdownRef.current.contains(event.target as Node)) {
        setEmployeeActionsDropdownId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  const activeEvent = events.find(e => e.id === selectedEventId);
  
  // Derived state: employees assigned to the currently selected event
  const assignedEmployees = useMemo(() => {
    if (!selectedEventId) return [];
    return assignments
      .filter(asg => asg.eventId === selectedEventId)
      .map(asg => {
        const emp = employees.find(e => e.id === asg.employeeId);
        return {
          assignmentId: asg.id,
          employeeCode: emp?.employeeCode || '',
          dni: emp?.dni || '',
          fullName: emp?.fullName || 'Desconocido',
          role: asg.role,
          confirmed: asg.status === 'Confirmado',
          cargo: emp?.cargo || ''
        };
      });
  }, [assignments, selectedEventId, employees]);

  // Derived state: filtered employees for the search modal
  const searchResults = useMemo(() => {
    if (searchQuery.length < 2) return [];
    const query = searchQuery.toLowerCase();
    return employees.filter(emp => 
      emp.fullName.toLowerCase().includes(query) || 
      emp.dni.toLowerCase().includes(query) ||
      emp.employeeCode.toLowerCase().includes(query)
    ).slice(0, 5); // max 5 results
  }, [searchQuery, employees]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddAssignment = async () => {
    if (!selectedEmployee || !selectedEventId) return;
    setIsSubmitting(true);
    try {
      await addAssignment({
        eventId: selectedEventId,
        employeeId: selectedEmployee.id,
        role: role,
        status: status
      });
      showToast(`Empleado ${selectedEmployee.fullName} vinculado correctamente al evento.`, 'success');
      
      setSearchQuery('');
      setSelectedEmployee(null);
      setRole('Promotor');
      setStatus('Confirmado');
      setIsAssignmentModalOpen(false);
    } catch (e) {
      // Error handled by context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpFicha || !newEmpDni || !newEmpName || !newEmpCargo) return;
    
    setIsSubmitting(true);
    try {
      await addEmployee({
        employeeCode: newEmpFicha,
        dni: newEmpDni,
        fullName: newEmpName,
        cargo: newEmpCargo
      });
      showToast(`Empleado ${newEmpName} registrado en el catálogo maestro.`, 'success');
      
      setNewEmpFicha('');
      setNewEmpDni('');
      setNewEmpName('');
      setNewEmpCargo('');
      setIsEmployeeModalOpen(false);
    } catch (e) {
      // Error handled by context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;
    setIsSubmitting(true);
    try {
      await updateEmployee(editingEmployee.id, {
        employeeCode: newEmpFicha,
        dni: newEmpDni,
        fullName: newEmpName,
        cargo: newEmpCargo
      });
      showToast('Empleado actualizado con éxito.', 'success');
      setIsEditEmployeeModalOpen(false);
      setEditingEmployee(null);
    } catch (error) {
      showToast('No se pudo actualizar el empleado.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este empleado? Esta acción no se puede deshacer.')) {
      try {
        await deleteEmployee(id);
        showToast('Empleado eliminado del catálogo.', 'success');
      } catch (error) {
        showToast('Error al eliminar empleado.', 'error');
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER & TABS */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-[#00205B]">Gestión de Personal</h2>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('asignaciones')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'asignaciones' 
                ? 'bg-white text-[#00205B] shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            Asignaciones a Jornadas
          </button>
          <button 
            onClick={() => setActiveTab('directorio')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'directorio' 
                ? 'bg-white text-[#00205B] shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4" />
            Directorio Empleados
          </button>
        </div>
      </div>

      {/* --- TAB: ASIGNACIONES --- */}
      {activeTab === 'asignaciones' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          <div className="relative" ref={dropdownRef}>
            <div 
              onClick={() => setIsEventDropdownOpen(!isEventDropdownOpen)}
              className="flex items-center justify-between gap-3 bg-white border border-gray-200 px-4 py-3 rounded-xl shadow-sm w-full md:w-80 cursor-pointer hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <CalendarIcon className="w-5 h-5 text-[#FE5000] shrink-0" />
                <span className="text-sm font-bold text-[#00205B] truncate">
                  {activeEvent ? `${activeEvent.eventName} - ${activeEvent.agencyCode}` : 'Seleccione un evento...'}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-500 shrink-0 transition-transform ${isEventDropdownOpen ? 'rotate-180' : ''}`} />
            </div>
            
            {isEventDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                {events.map(ev => (
                  <div 
                    key={ev.id}
                    onClick={() => {
                      setSelectedEventId(ev.id);
                      setIsEventDropdownOpen(false);
                    }}
                    className={`px-4 py-3 cursor-pointer text-sm font-medium transition-colors border-b border-gray-50 last:border-0 ${
                      selectedEventId === ev.id ? 'bg-blue-50 text-[#00205B]' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {ev.eventName} - <span className="text-gray-400">{ev.agencyCode}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-700">Equipo Asignado al Evento Activo</h3>
                <span className="bg-[#00205B] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {assignedEmployees.length}
                </span>
              </div>
              
              <button
                onClick={() => setIsAssignmentModalOpen(true)}
                disabled={!selectedEventId}
                className="flex items-center gap-2 bg-[#FE5000] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#e04700] transition-colors shadow-sm focus:ring-4 focus:ring-[#FE5000]/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserPlus className="w-4 h-4" />
                Vincular Empleado
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4">Ficha</th>
                    <th className="px-6 py-4">Cédula</th>
                    <th className="px-6 py-4">Nombre Completo</th>
                    <th className="px-6 py-4">Rol en la Jornada</th>
                    <th className="px-6 py-4 text-center">Asistencia</th>
                    <th className="px-6 py-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {assignedEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="font-medium text-gray-700">No hay personal asignado</p>
                        <p className="text-sm mt-1">Haz clic en "Vincular Empleado" para agregar personal a este operativo.</p>
                      </td>
                    </tr>
                  ) : (
                    assignedEmployees.map((emp) => (
                      <tr key={emp.assignmentId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900">{emp.employeeCode}</td>
                        <td className="px-6 py-4">{emp.dni}</td>
                        <td className="px-6 py-4 font-bold text-[#00205B]">{emp.fullName}</td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold border border-gray-200">
                            {emp.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={async () => {
                              try {
                                await toggleAssignmentStatus(emp.assignmentId);
                                showToast(`Asistencia de ${emp.fullName} ${!emp.confirmed ? 'confirmada' : 'marcada como pendiente'}.`, 'info');
                              } catch (e) {
                                // Error handled by context
                              }
                            }}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                              emp.confirmed
                                ? 'bg-[#009639]/10 text-[#009639] hover:bg-[#009639]/20'
                                : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                            }`}
                          >
                            {emp.confirmed ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                            {emp.confirmed ? 'Confirmado' : 'Pendiente'}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: DIRECTORIO --- */}
      {activeTab === 'directorio' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-700">Catálogo General del Banco</h3>
                <span className="bg-[#00205B] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {employees.length}
                </span>
              </div>
              
              <button
                onClick={() => setIsEmployeeModalOpen(true)}
                className="flex items-center gap-2 bg-[#00205B] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#001845] transition-colors shadow-sm focus:ring-4 focus:ring-[#00205B]/30"
              >
                <Plus className="w-4 h-4" />
                Registrar Empleado
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4">Ficha</th>
                    <th className="px-6 py-4">Cédula</th>
                    <th className="px-6 py-4">Nombre Completo</th>
                    <th className="px-6 py-4">Cargo</th>
                    <th className="px-6 py-4 text-center">Participación</th>
                    <th className="px-6 py-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {employees.map((emp) => {
                    const empHistory = assignments.filter(a => a.employeeId === emp.id);
                    return (
                    <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">{emp.employeeCode}</td>
                      <td className="px-6 py-4">{emp.dni}</td>
                      <td className="px-6 py-4 font-bold text-[#00205B] flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                          {emp.fullName.charAt(0)}
                        </div>
                        {emp.fullName}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
                          <Briefcase className="w-3.5 h-3.5" />
                          {emp.cargo}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => {
                            setHistoryEmployee(emp);
                            setIsHistoryModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-[#00205B] hover:bg-blue-100 rounded-full text-xs font-bold transition-colors shadow-sm"
                        >
                          <CalendarIcon className="w-3 h-3" />
                          {empHistory.length} Operativos
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center relative">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEmployeeActionsDropdownId(employeeActionsDropdownId === emp.id ? null : emp.id);
                          }}
                          className="p-1.5 text-gray-400 hover:text-[#00205B] hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        
                        {employeeActionsDropdownId === emp.id && (
                          <div ref={actionsDropdownRef} className="absolute right-10 top-4 mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20 animate-in fade-in slide-in-from-top-2">
                            <button 
                              onClick={() => {
                                setEditingEmployee(emp);
                                setNewEmpFicha(emp.employeeCode);
                                setNewEmpDni(emp.dni);
                                setNewEmpName(emp.fullName);
                                setNewEmpCargo(emp.cargo || '');
                                setIsEditEmployeeModalOpen(true);
                                setEmployeeActionsDropdownId(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#00205B] flex items-center gap-2"
                            >
                              <Edit2 className="w-4 h-4" />
                              Editar
                            </button>
                            <button 
                              onClick={() => {
                                handleDeleteEmployee(emp.id);
                                setEmployeeActionsDropdownId(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Eliminar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: VINCULAR EMPLEADO A EVENTO --- */}
      {isAssignmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-[#00205B] to-[#001030] flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[#FE5000]" /> 
                  Vincular Personal
                </h3>
                <p className="text-blue-200 text-sm mt-1 truncate max-w-sm">Jornada: {activeEvent?.eventName}</p>
              </div>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-visible">
              
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-800">Buscar en Catálogo Maestro</label>
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-gray-400" />
                  <input 
                    type="text" 
                    value={selectedEmployee ? selectedEmployee.fullName : searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSelectedEmployee(null); 
                    }}
                    placeholder="Escribe Ficha, Nombre o Cédula..." 
                    className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm font-medium rounded-xl focus:ring-2 focus:ring-[#FE5000] focus:border-[#FE5000] pl-11 p-3.5 outline-none transition-all" 
                  />
                  
                  {searchQuery.length >= 2 && !selectedEmployee && searchResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                      {searchResults.map(emp => (
                        <div 
                          key={emp.id} 
                          onClick={() => {
                            setSelectedEmployee(emp);
                            setSearchQuery('');
                          }}
                          className="px-5 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0 flex items-center gap-3 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold shrink-0">
                            {emp.fullName.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-[#00205B] text-sm">{emp.fullName}</span>
                            <span className="text-xs text-gray-500 font-medium">Ficha: {emp.employeeCode} • CI: {emp.dni}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {searchQuery.length >= 2 && !selectedEmployee && searchResults.length === 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg px-5 py-4 text-sm text-center text-gray-500 font-medium">
                      No se encontró al empleado. Revise el Directorio Empleados.
                    </div>
                  )}
                </div>
              </div>

              {selectedEmployee && (
                <div className="space-y-5 animate-in fade-in slide-in-from-top-2">
                  
                  <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-xl p-4 flex items-center gap-4 shadow-sm">
                    <div className="w-12 h-12 bg-[#00205B] text-white rounded-full flex items-center justify-center font-bold text-xl shadow-inner">
                      {selectedEmployee.fullName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{selectedEmployee.fullName}</p>
                      <p className="text-xs font-semibold text-gray-500 mt-0.5">
                        C.I: {selectedEmployee.dni} • Ficha: {selectedEmployee.employeeCode}
                      </p>
                      <span className="inline-block mt-1.5 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold uppercase tracking-wider">
                        {selectedEmployee.cargo}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div ref={roleDropdownRef} className="relative">
                      <label className="block text-sm font-bold mb-2 text-gray-800">Rol a Desempeñar</label>
                      <div 
                        onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                        className="flex items-center justify-between w-full bg-white border border-gray-300 text-gray-900 text-sm font-medium rounded-xl p-3 cursor-pointer hover:border-gray-400 transition-colors shadow-sm"
                      >
                        <span>{role}</span>
                        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
                      </div>
                      
                      {isRoleDropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-lg z-20 overflow-hidden animate-in fade-in slide-in-from-top-2">
                          {['Coordinador', 'Promotor', 'Chofer', 'Técnico', 'Auditor'].map(r => (
                            <div 
                              key={r}
                              onClick={() => {
                                setRole(r);
                                setIsRoleDropdownOpen(false);
                              }}
                              className={`px-4 py-3 cursor-pointer text-sm font-medium transition-colors border-b border-gray-50 last:border-0 hover:bg-blue-50 hover:text-[#00205B] ${
                                role === r ? 'bg-blue-50 text-[#00205B]' : 'text-gray-700'
                              }`}
                            >
                              {r}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div ref={statusDropdownRef} className="relative">
                      <label className="block text-sm font-bold mb-2 text-gray-800">Estado Confirmación</label>
                      <div 
                        onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                        className="flex items-center justify-between w-full bg-white border border-gray-300 text-gray-900 text-sm font-medium rounded-xl p-3 cursor-pointer hover:border-gray-400 transition-colors shadow-sm"
                      >
                        <span>{status}</span>
                        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                      </div>
                      
                      {isStatusDropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-lg z-20 overflow-hidden animate-in fade-in slide-in-from-top-2">
                          {(['Confirmado', 'Pendiente'] as const).map(s => (
                            <div 
                              key={s}
                              onClick={() => {
                                setStatus(s);
                                setIsStatusDropdownOpen(false);
                              }}
                              className={`px-4 py-3 cursor-pointer text-sm font-medium transition-colors border-b border-gray-50 last:border-0 hover:bg-blue-50 hover:text-[#00205B] ${
                                status === s ? 'bg-blue-50 text-[#00205B]' : 'text-gray-700'
                              }`}
                            >
                              {s}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 mt-auto">
              <button 
                onClick={() => {
                  setIsAssignmentModalOpen(false);
                  setSelectedEmployee(null);
                  setSearchQuery('');
                }} 
                className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleAddAssignment}
                disabled={!selectedEmployee || isSubmitting}
                className="px-6 py-2.5 bg-[#FE5000] text-white font-bold rounded-xl hover:bg-[#e04700] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Vinculando...' : 'Confirmar Vinculación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: REGISTRAR NUEVO EMPLEADO (DIRECTORIO) --- */}
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleRegisterEmployee} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-[#00205B] to-[#001030]">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-300" />
                Registrar Empleado
              </h3>
              <p className="text-blue-200 text-sm mt-1">Añadir al catálogo maestro de personal.</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1.5 text-gray-800">Número de Ficha</label>
                <input 
                  required
                  type="text" 
                  value={newEmpFicha}
                  onChange={e => setNewEmpFicha(e.target.value.toUpperCase())}
                  placeholder="Ej: EMP-0999"
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-[#00205B] focus:border-[#00205B] outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1.5 text-gray-800">Cédula de Identidad</label>
                <input 
                  required
                  type="text" 
                  value={newEmpDni}
                  onChange={e => setNewEmpDni(e.target.value)}
                  placeholder="Ej: V-20.123.456"
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-[#00205B] focus:border-[#00205B] outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1.5 text-gray-800">Nombre Completo</label>
                <input 
                  required
                  type="text" 
                  value={newEmpName}
                  onChange={e => setNewEmpName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-[#00205B] focus:border-[#00205B] outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1.5 text-gray-800">Cargo</label>
                <input 
                  required
                  type="text" 
                  value={newEmpCargo}
                  onChange={e => setNewEmpCargo(e.target.value)}
                  placeholder="Ej: Promotor, Coordinador, etc."
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-[#00205B] focus:border-[#00205B] outline-none bg-white"
                />
              </div>
            </div>
            
            <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button 
                type="button"
                onClick={() => setIsEmployeeModalOpen(false)} 
                className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-[#00205B] text-white font-bold rounded-xl hover:bg-[#001845] transition-colors shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Registro'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- MODAL: EDITAR EMPLEADO --- */}
      {isEditEmployeeModalOpen && editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleEditEmployee} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-[#00205B] to-[#001030]">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-[#FE5000]" />
                Editar Empleado
              </h3>
              <p className="text-blue-200 text-sm mt-1">Actualizar los datos en el catálogo maestro.</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1.5 text-gray-800">Número de Ficha</label>
                <input 
                  required
                  type="text" 
                  value={newEmpFicha}
                  onChange={e => setNewEmpFicha(e.target.value.toUpperCase())}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-[#00205B] focus:border-[#00205B] outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1.5 text-gray-800">Cédula de Identidad</label>
                <input 
                  required
                  type="text" 
                  value={newEmpDni}
                  onChange={e => setNewEmpDni(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-[#00205B] focus:border-[#00205B] outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1.5 text-gray-800">Nombre Completo</label>
                <input 
                  required
                  type="text" 
                  value={newEmpName}
                  onChange={e => setNewEmpName(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-[#00205B] focus:border-[#00205B] outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1.5 text-gray-800">Cargo</label>
                <input 
                  required
                  type="text" 
                  value={newEmpCargo}
                  onChange={e => setNewEmpCargo(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-[#00205B] focus:border-[#00205B] outline-none bg-white"
                />
              </div>
            </div>
            
            <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button 
                type="button"
                onClick={() => setIsEditEmployeeModalOpen(false)} 
                className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-[#FE5000] text-white font-bold rounded-xl hover:bg-[#e04700] transition-colors shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- MODAL: HISTORIAL DE PARTICIPACIÓN --- */}
      {isHistoryModalOpen && historyEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-[#00205B] to-[#001030] flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-[#FE5000]" />
                  Historial de Participación
                </h3>
                <p className="text-blue-200 text-sm mt-1">{historyEmployee.fullName} • CI: {historyEmployee.dni}</p>
              </div>
              <button 
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-2 bg-white/10 text-white hover:bg-white/20 rounded-full transition-colors"
              >
                <MoreVertical className="w-5 h-5" /> {/* Use X icon ideally, using MoreVertical as placeholder if X is missing, wait I will import X */}
              </button>
            </div>
            
            <div className="p-0 overflow-y-auto max-h-[60vh]">
              {(() => {
                const empHistory = assignments
                  .filter(a => a.employeeId === historyEmployee.id)
                  .map(a => {
                    const ev = events.find(e => e.id === a.eventId);
                    return { ...a, event: ev };
                  })
                  .filter(a => a.event)
                  .sort((a, b) => new Date(b.event!.startDate).getTime() - new Date(a.event!.startDate).getTime());

                if (empHistory.length === 0) {
                  return (
                    <div className="p-10 flex flex-col items-center justify-center text-gray-400">
                      <CalendarIcon className="w-12 h-12 text-gray-200 mb-3" />
                      <p className="font-bold text-gray-600">Sin historial operativo</p>
                      <p className="text-sm">Este empleado no ha participado en ninguna jornada.</p>
                    </div>
                  );
                }

                return (
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200 sticky top-0">
                      <tr>
                        <th className="px-6 py-3">Fecha</th>
                        <th className="px-6 py-3">Jornada</th>
                        <th className="px-6 py-3">Agencia</th>
                        <th className="px-6 py-3">Rol Desempeñado</th>
                        <th className="px-6 py-3">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {empHistory.map(hist => (
                        <tr key={hist.id} className="hover:bg-gray-50">
                          <td className="px-6 py-3 whitespace-nowrap text-gray-900 font-medium">
                            {new Date(hist.event!.startDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-3 font-bold text-[#00205B]">
                            {hist.event!.eventName}
                          </td>
                          <td className="px-6 py-3 text-xs text-gray-500">
                            {hist.event!.agencyCode}
                          </td>
                          <td className="px-6 py-3">
                            <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-bold border border-gray-200">
                              {hist.role}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              hist.status === 'Confirmado' 
                                ? 'bg-green-50 text-green-700 border border-green-200' 
                                : 'bg-orange-50 text-orange-700 border border-orange-200'
                            }`}>
                              {hist.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button 
                onClick={() => setIsHistoryModalOpen(false)} 
                className="px-6 py-2 bg-[#00205B] text-white font-bold rounded-xl hover:bg-[#001845] transition-colors shadow-sm"
              >
                Cerrar Historial
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
