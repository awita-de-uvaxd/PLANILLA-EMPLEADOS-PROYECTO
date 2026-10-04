import { useState, useEffect } from 'react';
import { ShieldCheck, Save, Key } from 'lucide-react';
import api from '../../services/api';

export default function Administracion() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [mensaje, setMensaje] = useState<{texto: string, tipo: 'success'|'error'} | null>(null);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      const res = await api.get('/admin/usuarios');
      setUsuarios(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const togglePermiso = (index: number, campo: string) => {
    const nuevosUsuarios = [...usuarios];
    nuevosUsuarios[index][campo] = !nuevosUsuarios[index][campo];
    setUsuarios(nuevosUsuarios);
  };

  const guardarPermisos = async (usuario: any) => {
    try {
      await api.put(`/admin/usuarios/${usuario.id}/permisos`, {
        es_admin: usuario.es_admin,
        acceso_rrhh: usuario.acceso_rrhh,
        acceso_nominas: usuario.acceso_nominas,
        acceso_procesos: usuario.acceso_procesos
      });
      setMensaje({ texto: `Permisos de ${usuario.username} actualizados.`, tipo: 'success' });
      setTimeout(() => setMensaje(null), 3000);
    } catch (error) {
      setMensaje({ texto: 'Error al actualizar permisos', tipo: 'error' });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6 border-b pb-4">
        <div className="bg-slate-800 p-2 rounded-lg text-white">
          <ShieldCheck size={24} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Accesos (RBAC)</h2>
      </div>

      {mensaje && (
        <div className={`p-4 rounded-md ${mensaje.tipo === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700'}`}>
          {mensaje.texto}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600 text-sm uppercase tracking-wider">
              <th className="p-4 border-b font-medium">Usuario</th>
              <th className="p-4 border-b font-medium text-center">Admin Total</th>
              <th className="p-4 border-b font-medium text-center">Módulo RRHH</th>
              <th className="p-4 border-b font-medium text-center">Módulo Nóminas</th>
              <th className="p-4 border-b font-medium text-center">Módulo Procesos</th>
              <th className="p-4 border-b font-medium text-center">Acción</th>
            </tr>
          </thead>
          <tbody className="text-gray-700 text-sm">
            {usuarios.map((user, idx) => (
              <tr key={user.id} className="hover:bg-slate-50 border-b">
                <td className="p-4 font-medium flex items-center gap-2">
                  <Key size={16} className="text-gray-400"/> {user.username}
                </td>
                <td className="p-4 text-center">
                  <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" 
                    checked={user.es_admin} onChange={() => togglePermiso(idx, 'es_admin')} />
                </td>
                <td className="p-4 text-center">
                  <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" disabled={user.es_admin}
                    checked={user.es_admin || user.acceso_rrhh} onChange={() => togglePermiso(idx, 'acceso_rrhh')} />
                </td>
                <td className="p-4 text-center">
                  <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" disabled={user.es_admin}
                    checked={user.es_admin || user.acceso_nominas} onChange={() => togglePermiso(idx, 'acceso_nominas')} />
                </td>
                <td className="p-4 text-center">
                  <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" disabled={user.es_admin}
                    checked={user.es_admin || user.acceso_procesos} onChange={() => togglePermiso(idx, 'acceso_procesos')} />
                </td>
                <td className="p-4 text-center">
                  <button onClick={() => guardarPermisos(user)} className="bg-slate-800 hover:bg-slate-900 text-white p-2 rounded flex items-center gap-2 mx-auto text-xs">
                    <Save size={14} /> Guardar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}