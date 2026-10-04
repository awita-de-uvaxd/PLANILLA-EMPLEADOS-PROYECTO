import { useState, useEffect } from 'react';
import { Calculator, PlusCircle, MinusCircle, Play } from 'lucide-react';
import api from '../../services/api';

export default function Nominas() {
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [mensaje, setMensaje] = useState<{texto: string, tipo: 'success' | 'error'} | null>(null);

  // Estados para los formularios rápidos
  const [formIngreso, setFormIngreso] = useState({ empleado_id: '', concepto: '', monto: '' });
  const [formDescuento, setFormDescuento] = useState({ empleado_id: '', tipo: 'Eventual', concepto: '', monto: '' });
  const [periodo, setPeriodo] = useState({ mes: new Date().getMonth() + 1, anio: new Date().getFullYear(), tipo_nomina: 'Fin de Mes' });

  useEffect(() => {
    api.get('/rrhh/empleados').then(res => setEmpleados(res.data)).catch(console.error);
  }, []);

  const handleIngreso = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/nominas/ingresos', { ...formIngreso, monto: parseFloat(formIngreso.monto) });
      setMensaje({ texto: 'Ingreso variable registrado.', tipo: 'success' });
      setFormIngreso({ empleado_id: '', concepto: '', monto: '' });
      setTimeout(() => setMensaje(null), 3000);
    } catch (error) {
      setMensaje({ texto: 'Error al registrar ingreso', tipo: 'error' });
    }
  };

  const handleDescuento = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/nominas/descuentos', { ...formDescuento, monto: parseFloat(formDescuento.monto) });
      setMensaje({ texto: 'Descuento registrado.', tipo: 'success' });
      setFormDescuento({ empleado_id: '', tipo: 'Eventual', concepto: '', monto: '' });
      setTimeout(() => setMensaje(null), 3000);
    } catch (error) {
      setMensaje({ texto: 'Error al registrar descuento', tipo: 'error' });
    }
  };

  const ejecutarNomina = async () => {
    if (!confirm(`¿Está seguro de procesar la planilla de ${periodo.tipo_nomina} para el periodo ${periodo.mes}/${periodo.anio}?`)) return;
    
    try {
      const response = await api.post('/nominas/ejecutar', periodo);
      setMensaje({ texto: response.data.mensaje, tipo: 'success' });
    } catch (error: any) {
      setMensaje({ texto: error.response?.data?.detail || 'Error en el cálculo maestro', tipo: 'error' });
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {mensaje && (
        <div className={`p-4 rounded-md ${mensaje.tipo === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {mensaje.texto}
        </div>
      )}

      {/* CABECERA Y EJECUCIÓN */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-wrap justify-between items-end gap-4">
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Mes</label>
            <select className="p-2 border rounded-md" value={periodo.mes} onChange={e => setPeriodo({...periodo, mes: parseInt(e.target.value)})}>
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>Mes {m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Año</label>
            <input type="number" className="p-2 border rounded-md w-24" value={periodo.anio} onChange={e => setPeriodo({...periodo, anio: parseInt(e.target.value)})} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Tipo de Planilla</label>
            <select className="p-2 border rounded-md" value={periodo.tipo_nomina} onChange={e => setPeriodo({...periodo, tipo_nomina: e.target.value})}>
              <option value="Fin de Mes">Fin de Mes</option>
              <option value="Anticipo 15 días">Anticipo 15 días</option>
            </select>
          </div>
        </div>
        <button onClick={ejecutarNomina} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-6 rounded-md flex items-center gap-2 shadow-lg hover:shadow-xl transition-all">
          <Play size={20} /> EJECUTAR CÁLCULO MAESTRO
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PANEL INGRESOS VARIABLES */}
        <form onSubmit={handleIngreso} className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100">
          <div className="flex items-center gap-2 mb-4 text-emerald-600">
            <PlusCircle size={20} />
            <h3 className="text-lg font-bold">Asignar Ingreso Extra</h3>
          </div>
          <div className="space-y-4">
            <select required className="w-full p-2 border rounded-md" value={formIngreso.empleado_id} onChange={e => setFormIngreso({...formIngreso, empleado_id: e.target.value})}>
              <option value="">Seleccione empleado...</option>
              {empleados.map(emp => <option key={emp.id} value={emp.id}>{emp.nombre_completo}</option>)}
            </select>
            <input required type="text" placeholder="Concepto (Ej. Comisiones Octubre)" className="w-full p-2 border rounded-md" value={formIngreso.concepto} onChange={e => setFormIngreso({...formIngreso, concepto: e.target.value})} />
            <input required type="number" step="0.01" placeholder="Monto (Q)" className="w-full p-2 border rounded-md" value={formIngreso.monto} onChange={e => setFormIngreso({...formIngreso, monto: e.target.value})} />
            <button type="submit" className="w-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 py-2 border border-emerald-200 rounded-md font-medium transition-colors">
              Guardar Ingreso
            </button>
          </div>
        </form>

        {/* PANEL DESCUENTOS */}
        <form onSubmit={handleDescuento} className="bg-white p-6 rounded-xl shadow-sm border border-red-100">
          <div className="flex items-center gap-2 mb-4 text-red-500">
            <MinusCircle size={20} />
            <h3 className="text-lg font-bold">Aplicar Descuento</h3>
          </div>
          <div className="space-y-4">
            <select required className="w-full p-2 border rounded-md" value={formDescuento.empleado_id} onChange={e => setFormDescuento({...formDescuento, empleado_id: e.target.value})}>
              <option value="">Seleccione empleado...</option>
              {empleados.map(emp => <option key={emp.id} value={emp.id}>{emp.nombre_completo}</option>)}
            </select>
            <div className="flex gap-2">
              <select className="w-1/3 p-2 border rounded-md" value={formDescuento.tipo} onChange={e => setFormDescuento({...formDescuento, tipo: e.target.value})}>
                <option value="Eventual">1 Sola Vez</option>
                <option value="Cíclico">Todos los meses</option>
              </select>
              <input required type="text" placeholder="Concepto (Ej. Préstamo)" className="w-2/3 p-2 border rounded-md" value={formDescuento.concepto} onChange={e => setFormDescuento({...formDescuento, concepto: e.target.value})} />
            </div>
            <input required type="number" step="0.01" placeholder="Monto (Q)" className="w-full p-2 border rounded-md" value={formDescuento.monto} onChange={e => setFormDescuento({...formDescuento, monto: e.target.value})} />
            <button type="submit" className="w-full bg-red-50 text-red-700 hover:bg-red-100 py-2 border border-red-200 rounded-md font-medium transition-colors">
              Guardar Descuento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}