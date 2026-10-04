import { useState, useEffect } from 'react';
import { CalendarClock, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

export default function Procesos() {
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    empleado_id: '',
    concepto: 'Suspensión IGSS',
    fecha_incidencia: '',
    dias_descontar: ''
  });
  const [mensaje, setMensaje] = useState<{texto: string, tipo: 'success' | 'error'} | null>(null);

  // Cargar lista de empleados al abrir la pantalla
  useEffect(() => {
    const fetchEmpleados = async () => {
      try {
        const response = await api.get('/rrhh/empleados');
        setEmpleados(response.data);
      } catch (error) {
        console.error("Error al cargar empleados", error);
      }
    };
    fetchEmpleados();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.empleado_id) {
      setMensaje({ texto: 'Por favor seleccione un empleado', tipo: 'error' });
      return;
    }

    try {
      const payload = {
        empleado_id: parseInt(formData.empleado_id),
        concepto: formData.concepto,
        fecha_incidencia: formData.fecha_incidencia,
        dias_descontar: parseInt(formData.dias_descontar) || 0
      };
      
      await api.post('/procesos/incidencias', payload);
      setMensaje({ texto: 'Incidencia registrada exitosamente.', tipo: 'success' });
      setFormData({ empleado_id: '', concepto: 'Suspensión IGSS', fecha_incidencia: '', dias_descontar: '' });
      setTimeout(() => setMensaje(null), 3000);
    } catch (error: any) {
      setMensaje({ 
        texto: error.response?.data?.detail || 'Error al registrar la incidencia.', 
        tipo: 'error' 
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-6 border-b pb-4">
        <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
          <CalendarClock size={24} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Registro de Incidencias</h2>
      </div>

      {mensaje && (
        <div className={`p-4 mb-6 rounded-md ${mensaje.tipo === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Empleado</label>
            <select required className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              value={formData.empleado_id} onChange={(e) => setFormData({...formData, empleado_id: e.target.value})}>
              <option value="">Seleccione un empleado...</option>
              {empleados.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.nombre_completo} (DPI: {emp.dpi})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Incidencia</label>
            <select required className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              value={formData.concepto} onChange={(e) => setFormData({...formData, concepto: e.target.value})}>
              <option value="Suspensión IGSS">Suspensión IGSS</option>
              <option value="Falta Injustificada">Falta Injustificada</option>
              <option value="Permiso sin Goce de Sueldo">Permiso sin Goce de Sueldo</option>
              <option value="Llamada de Atención">Llamada de Atención (Sin descuento)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de la Incidencia</label>
            <input required type="date" className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" 
              value={formData.fecha_incidencia} onChange={(e) => setFormData({...formData, fecha_incidencia: e.target.value})}/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Días a descontar en Planilla</label>
            <input required type="number" min="0" className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej. 1" 
              value={formData.dias_descontar} onChange={(e) => setFormData({...formData, dias_descontar: e.target.value})}/>
          </div>
        </div>
        <div className="flex justify-end pt-4">
          <button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-6 rounded-md flex items-center gap-2 transition-colors">
            <AlertTriangle size={18} /> Registrar Incidencia
          </button>
        </div>
      </form>
    </div>
  );
}