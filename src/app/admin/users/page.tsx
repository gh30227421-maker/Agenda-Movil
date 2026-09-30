"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';
import { Users, Shield, Mail, Lock, UserPlus, X, RefreshCw, Activity, Clock, Laptop } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ComboBox from '@/components/ui/ComboBox';

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  role: string;
}

export default function AdminUsersPage() {
  const { user, isAdmin, isLoading: isAuthLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para el log de actividad
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [selectedUserLogs, setSelectedUserLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [selectedUserEmail, setSelectedUserEmail] = useState('');

  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      if (!res.ok) throw new Error('Error al obtener usuarios');
      
      const data = await res.json();
      setUsers(data.users || []);
    } catch (e: any) {
      console.error(e);
      showToast('No se pudieron cargar los usuarios', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (!isAuthLoading) {
      if (!isAdmin) {
        router.push('/dashboard');
        return;
      }
      fetchUsers();
    }
  }, [isAdmin, isAuthLoading, router, fetchUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword) return;

    try {
      setIsSubmitting(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ email: newEmail, password: newPassword, role: newRole })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Error al crear usuario');
      }

      showToast(`Usuario ${newEmail} creado correctamente`, 'success');
      setIsModalOpen(false);
      setNewEmail('');
      setNewPassword('');
      setNewRole('user');
      fetchUsers();
    } catch (e: any) {
      console.error(e);
      showToast(e.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewLogs = async (userId: string, email: string) => {
    setSelectedUserEmail(email);
    setIsLogsModalOpen(true);
    setIsLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from('user_activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setSelectedUserLogs(data || []);
    } catch (e: any) {
      console.error('Supabase error:', e);
      showToast(e.message || 'Error al cargar historial de actividad', 'error');
    } finally {
      setIsLoadingLogs(false);
    }
  };

  if (isAuthLoading || !isAdmin) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#00205B] flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#FE5000]" />
            Administración de Usuarios
          </h2>
          <p className="text-gray-500 mt-1">
            Gestiona los accesos y credenciales de la plataforma
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#00205B] text-white px-4 py-2.5 rounded-xl font-medium hover:bg-[#00153b] shadow-sm transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Registrar Usuario
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2 text-[#00205B] font-bold">
            <Users className="w-5 h-5" />
            <h3>Directorio de Usuarios</h3>
          </div>
          <button onClick={fetchUsers} className="p-2 text-gray-500 hover:text-[#00205B] transition-colors" title="Actualizar">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-bold">Correo Electrónico</th>
                <th className="px-6 py-4 font-bold">Rol</th>
                <th className="px-6 py-4 font-bold">Fecha de Registro</th>
                <th className="px-6 py-4 font-bold">Fecha de Registro</th>
                <th className="px-6 py-4 font-bold">Último Acceso</th>
                <th className="px-6 py-4 font-bold text-center">Actividad</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    {u.email}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      u.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : 'bg-blue-100 text-[#00205B] border border-blue-200'
                    }`}>
                      {u.role === 'admin' ? 'Administrador' : 'Usuario'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(u.created_at).toLocaleDateString('es-VE')}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString('es-VE') : 'Nunca'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleViewLogs(u.id, u.email)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-[#00205B] text-gray-700 hover:text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                      title="Ver historial de actividad"
                    >
                      <Activity className="w-3.5 h-3.5" />
                      Historial
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No se encontraron usuarios
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear Usuario */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-[#00205B]">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#FE5000]" />
                Registrar Nuevo Usuario
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-blue-200 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Correo Electrónico Institucional</label>
                <div className="relative">
                  <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                    <Mail className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-[#00205B] focus:border-[#00205B] block w-full ps-10 p-3"
                    placeholder="ejemplo@bnc.com.ve"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Contraseña Temporal</label>
                <div className="relative">
                  <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                    <Lock className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-[#00205B] focus:border-[#00205B] block w-full ps-10 p-3"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nivel de Acceso</label>
                <ComboBox
                  options={[
                    { value: 'user', label: 'Usuario Estándar (Lectura/Escritura de Agenda)' },
                    { value: 'admin', label: 'Administrador (Puede crear usuarios)' }
                  ]}
                  value={newRole}
                  onChange={setNewRole}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2.5 text-sm font-bold text-white bg-[#00205B] hover:bg-[#00153b] rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  Crear Cuenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Historial de Actividad */}
      {isLogsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-[#00205B] shrink-0">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#FE5000]" />
                  Historial de Actividad
                </h3>
                <p className="text-blue-200 text-sm mt-1">{selectedUserEmail}</p>
              </div>
              <button
                onClick={() => setIsLogsModalOpen(false)}
                className="text-blue-200 hover:text-white transition-colors p-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto bg-slate-50 flex-1">
              {isLoadingLogs ? (
                <div className="flex justify-center items-center py-12">
                  <RefreshCw className="w-8 h-8 text-[#00205B] animate-spin" />
                </div>
              ) : selectedUserLogs.length === 0 ? (
                <div className="text-center py-12 text-gray-500 flex flex-col items-center">
                  <Clock className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="font-semibold text-lg">Sin registros de actividad</p>
                  <p className="text-sm">El usuario no ha generado ningún registro reciente.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedUserLogs.map((log) => (
                    <div key={log.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                        <Activity className="w-5 h-5 text-[#00205B]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <p className="font-bold text-gray-900">{log.action}</p>
                          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString('es-VE')}
                          </span>
                        </div>
                        {log.details && (
                          <p className="text-sm text-gray-600 mt-1">{log.details}</p>
                        )}
                        {log.device_info && (
                          <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
                            <Laptop className="w-3.5 h-3.5" />
                            <span className="truncate">{log.device_info}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-white flex justify-end shrink-0">
              <button
                onClick={() => setIsLogsModalOpen(false)}
                className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-5 py-2.5 rounded-xl font-semibold transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
