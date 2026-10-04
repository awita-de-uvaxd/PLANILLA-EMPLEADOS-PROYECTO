import { useState, useEffect } from 'react';
import { FileSpreadsheet, Download, FileText, Activity } from 'lucide-react';
import api from '../../services/api';

export default function Reporteria() {
  const [historialNominas, setHistorialNominas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const fetchNominas = async () => {
      try {
        const response = await api.get('/reporteria/nominas');
        setHistorialNominas(response.data);
      } catch (error) {
        console.error("Error al cargar historial de nóminas", error);
      } finally {
        setCargando(false);
      }
    };
    fetchNominas();
  }, []);

  const descargarExcel = (nominaId: int) => {
    // Abre la ruta del backend en una nueva pestaña para forzar la descarga del archivo
    window.open(`http://127.0.0.1:8000/api/reporteria/nominas/${nominaId}/excel`, '_blank');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Reportes y Descargas</h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600 text-sm uppercase tracking-wider">
              <th className="p-4 border-b font-medium">ID Ejecución</th>
              <th className="p-4 border-b font-medium">Periodo</th>
              <th className="p-4 border-b font-medium">Tipo</th>
              <th className="p-4 border-b font-medium">Total Líquido Planilla</th>
              <th className="p-4 border-b font-medium text-center">Exportar Sábana</th>
            </tr>
          </thead>
          <tbody className="text-gray-700 text-sm">
            {cargando ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  <Activity className="animate-spin inline-block mr-2" /> Cargando historial...
                </td>
              </tr>
            ) : historialNominas.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  Aún no se ha ejecutado ninguna nómina.
                </td>
              </tr>
            ) : (
              historialNominas.map((nomina) => (
                <tr key={nomina.id} className="hover:bg-slate-50 border-b transition-colors">
                  <td className="p-4 font-mono text-slate-500">#{nomina.id}</td>
                  <td className="p-4 font-medium">Mes {nomina.periodo_mes} / {nomina.periodo_anio}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs ${nomina.tipo === 'Fin de Mes' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                      {nomina.tipo}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-gray-800">Q. {nomina.total_liquido.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                  <td className="p-4 flex gap-2 justify-center">
                    <button 
                      onClick={() => descargarExcel(nomina.id)}
                      className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors font-medium border border-emerald-200"
                    >
                      <FileSpreadsheet size={18} /> Excel (Pandas)
                    </button>
                    <td className="p-4 flex gap-2 justify-center">
                    <button 
                      onClick={() => descargarExcel(nomina.id)}
                      className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors font-medium border border-emerald-200"
                    >
                      <FileSpreadsheet size={18} /> Excel
                    </button>
                    {/* ESTE ES EL NUEVO BOTÓN PARA PDF */}
                    <button 
                      onClick={() => window.open(`http://127.0.0.1:8000/api/reporteria/nominas/${nomina.id}/pdf`, '_blank')}
                      className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors font-medium border border-red-200"
                    >
                      <FileText size={18} /> Boletas PDF
                    </button>
                  </td>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}