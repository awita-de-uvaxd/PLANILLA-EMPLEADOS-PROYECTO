import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Save, UserPlus, Users } from 'lucide-react';

export default function IngresoEmpleado() {
  const [formData, setFormData] = useState({
    dpi: '',
    nombre_completo: '',
    salario_base: '',
    fecha_nacimiento: '',
    fecha_contratacion: ''
  });
  const [mensaje, setMensaje] = useState<{texto: string, tipo: 'success' | 'error'} | null>(null);
  
  // Nuevo estado para la lista de empleados
  const [empleados, setEmpleados] = useState<any[]>([]);

  // Función para obtener la lista desde FastAPI
  const fetchEmpleados = async () => {
    try {
      const response = await api.get('/rrhh/empleados');
      setEmpleados(response.data);
    } catch (error) {
      console.error("Error al cargar empleados", error);
    }
  };

  // Cargar los empleados al abrir la pantalla
  useEffect(() => {
    fetchEmpleados();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...formData, salario_base: parseFloat(formData.salario_base) };
      await api.post('/rrhh/empleados', payload);
      setMensaje({ texto: 'Empleado registrado exitosamente.', tipo: 'success' });
      setFormData({ dpi: '', nombre_completo: '', salario_base: '', fecha_nacimiento: '', fecha_contratacion: '' });
      
      // Actualizar la tabla inmediatamente después de guardar
      fetchEmpleados(); 
      
      // Quitar el mensaje después de 3 segundos
      setTimeout(() => setMensaje(null), 3000);
    } catch (error: any) {
      setMensaje({ 
        texto: error.response?.data?.detail || 'Ocurrió un error al registrar el empleado.', 
        tipo: 'error' 
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* SECCIÓN 1: FORMULARIO */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6 border-b pb-4">
          <div className="bg-blue-100 p-2 rounded-lg text-blue-700">
            <UserPlus size={24} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Alta de Nuevo Empleado</h2>
        </div>

        {mensaje && (
          <div className={`p-4 mb-6 rounded-md ${mensaje.tipo === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {mensaje.texto}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
              <input required type="text" className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.nombre_completo} onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">DPI</label>
              <input required type="text" maxLength={13} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" placeholder="13 dígitos sin espacios"
                value={formData.dpi} onChange={(e) => setFormData({...formData, dpi: e.target.value.replace(/\D/g, '')})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
              <input required type="date" className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.fecha_nacimiento} onChange={(e) => setFormData({...formData, fecha_nacimiento: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Contratación</label>
              <input required type="date" className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.fecha_contratacion} onChange={(e) => setFormData({...formData, fecha_contratacion: e.target.value})} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Salario Base (Q)</label>
              <input required type="number" step="0.01" min="0" className="w-full md:w-1/2 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej. 3500.00"
                value={formData.salario_base} onChange={(e) => setFormData({...formData, salario_base: e.target.value})} />
              <p className="text-xs text-gray-500 mt-1">La bonificación incentivo de ley (Q250.00) se calculará automáticamente en la nómina.</p>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md flex items-center gap-2 transition-colors">
              <Save size={18} /> Guardar Expediente
            </button>
          </div>
        </form>
      </div>

      {/* SECCIÓN 2: TABLA DE EMPLEADOS */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6 border-b pb-4">
          <div className="bg-slate-100 p-2 rounded-lg text-slate-700">
            <Users size={24} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Planilla Activa</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-sm uppercase tracking-wider">
                <th className="p-4 border-b font-medium">ID</th>
                <th className="p-4 border-b font-medium">DPI</th>
                <th className="p-4 border-b font-medium">Nombre</th>
                <th className="p-4 border-b font-medium">Fecha Ingreso</th>
                <th className="p-4 border-b font-medium">Salario Base</th>
                <th className="p-4 border-b font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 text-sm">
              {empleados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No hay empleados registrados todavía.
                  </td>
                </tr>
              ) : (
                empleados.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50 border-b last:border-0 transition-colors">
                    <td className="p-4">#{emp.id}</td>
                    <td className="p-4 font-mono text-slate-500">{emp.dpi}</td>
                    <td className="p-4 font-medium">{emp.nombre_completo}</td>
                    <td className="p-4">{emp.fecha_contratacion}</td>
                    <td className="p-4">Q. {emp.salario_base.toFixed(2)}</td>
                    <td className="p-4">
                      {emp.estado ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Activo</span>
                      ) : (
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Inactivo</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}