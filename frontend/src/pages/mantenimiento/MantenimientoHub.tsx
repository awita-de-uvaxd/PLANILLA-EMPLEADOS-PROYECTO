import { useState, useEffect } from 'react';
import { Settings, Layers, MapPin, BookOpen, Sliders, Plus, CheckCircle2, AlertCircle, Lock, Unlock } from 'lucide-react';
import api from '../../services/api';

export default function MantenimientoHub() {
  const [vistaActiva, setVistaActiva] = useState<'cecos' | 'centros' | 'rubros' | 'parametros'>('cecos');
  
  const [cecos, setCecos] = useState<any[]>([]);
  const [centrosTrabajo, setCentrosTrabajo] = useState<any[]>([]);
  const [rubros, setRubros] = useState<any[]>([]);
  
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  // Formularios
  const [formCeco, setFormCeco] = useState({ codigo: '', nombre: '', unidad: '', linea_negocio: '' });
  const [formCentro, setFormCentro] = useState({ nombre_ubicacion: '', direccion: '', departamento: '', municipio: '' });
  const [formRubro, setFormRubro] = useState({ 
    desc_ing_des: '', 
    clave_conta: '50', 
    cat_conta: 'Haber', 
    cuenta_mayor: '', 
    tipo_gasto: 'Fijo' 
  });

  useEffect(() => {
    cargarDatos();
  }, [vistaActiva]);

  const cargarDatos = async () => {
    try {
      setError(null);
      if (vistaActiva === 'cecos') {
        const res = await api.get('/mantenimiento/cecos');
        setCecos(res.data);
      } else if (vistaActiva === 'centros') {
        const res = await api.get('/mantenimiento/centros-trabajo');
        setCentrosTrabajo(res.data);
      } else if (vistaActiva === 'rubros') {
        const res = await api.get('/contabilidad/rubros');
        setRubros(res.data);
      }
    } catch (err: any) {
      setError("Error al cargar los datos del catálogo.");
    }
  };

  const handleCrearCeco = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/mantenimiento/cecos', formCeco);
      setExito("Centro de Costo registrado con éxito.");
      setFormCeco({ codigo: '', nombre: '', unidad: '', linea_negocio: '' });
      cargarDatos();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al guardar CeCo.");
    }
  };

  const handleToggleCeco = async (id: number) => {
    try {
      await api.put(`/mantenimiento/cecos/${id}/toggle`);
      setExito("Estado del CeCo actualizado.");
      cargarDatos();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al actualizar CeCo.");
    }
  };

  const handleCrearCentro = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/mantenimiento/centros-trabajo', formCentro);
      setExito("Centro de trabajo registrado con éxito.");
      setFormCentro({ nombre_ubicacion: '', direccion: '', departamento: '', municipio: '' });
      cargarDatos();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al guardar centro de trabajo.");
    }
  };

  const handleBloquearCentro = async (id: number) => {
    if (!window.confirm("¿Estás seguro de bloquear permanentemente este Centro de Trabajo? Una vez bloqueado no se podrá volver a habilitar.")) return;
    try {
      await api.put(`/mantenimiento/centros-trabajo/${id}/bloquear`);
      setExito("Centro de trabajo bloqueado permanentemente.");
      cargarDatos();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al bloquear centro de trabajo.");
    }
  };

  const handleCrearRubro = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/contabilidad/rubros', formRubro);
      setExito("Rubro contable registrado correctamente.");
      setFormRubro({ desc_ing_des: '', clave_conta: '50', cat_conta: 'Haber', cuenta_mayor: '', tipo_gasto: 'Fijo' });
      cargarDatos();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al guardar rubro.");
    }
  };

  const handleToggleRubro = async (id: number) => {
    try {
      await api.put(`/contabilidad/rubros/${id}/toggle`);
      setExito("Estado del rubro contable actualizado.");
      cargarDatos();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al actualizar rubro.");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="bg-slate-800 p-2 rounded-lg text-white">
          <Settings size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Módulo de Mantenimiento y Catálogos</h2>
          <p className="text-sm text-gray-500">Gestión de CeCos, Centros de Trabajo y Cuentas Contables con controles de bloqueo.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {exito && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-lg flex items-center gap-2">
          <CheckCircle2 size={20} /> {exito}
        </div>
      )}

      {/* NAVEGACIÓN DE VISTAS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button 
          onClick={() => setVistaActiva('cecos')}
          className={`p-4 rounded-xl border text-left flex items-center gap-3 transition-all ${vistaActiva === 'cecos' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
        >
          <Layers size={22} />
          <div>
            <p className="font-semibold text-sm">Centros de Costo</p>
            <p className={`text-xs ${vistaActiva === 'cecos' ? 'text-blue-100' : 'text-gray-400'}`}>Bloqueo / Habilitación</p>
          </div>
        </button>

        <button 
          onClick={() => setVistaActiva('centros')}
          className={`p-4 rounded-xl border text-left flex items-center gap-3 transition-all ${vistaActiva === 'centros' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
        >
          <MapPin size={22} />
          <div>
            <p className="font-semibold text-sm">Centros de Trabajo</p>
            <p className={`text-xs ${vistaActiva === 'centros' ? 'text-blue-100' : 'text-gray-400'}`}>Bloqueo Definitivo</p>
          </div>
        </button>

        <button 
          onClick={() => setVistaActiva('rubros')}
          className={`p-4 rounded-xl border text-left flex items-center gap-3 transition-all ${vistaActiva === 'rubros' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
        >
          <BookOpen size={22} />
          <div>
            <p className="font-semibold text-sm">Rubros Contables</p>
            <p className={`text-xs ${vistaActiva === 'rubros' ? 'text-blue-100' : 'text-gray-400'}`}>Fijos y Variables</p>
          </div>
        </button>

        <button 
          onClick={() => setVistaActiva('parametros')}
          className={`p-4 rounded-xl border text-left flex items-center gap-3 transition-all ${vistaActiva === 'parametros' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
        >
          <Sliders size={22} />
          <div>
            <p className="font-semibold text-sm">Parámetros</p>
            <p className={`text-xs ${vistaActiva === 'parametros' ? 'text-blue-100' : 'text-gray-400'}`}>Configuraciones Ley</p>
          </div>
        </button>
      </div>

      {/* VISTA 1: CECOS CON BLOQUEO / HABILITACIÓN */}
      {vistaActiva === 'cecos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border shadow-sm lg:col-span-1">
            <h3 className="font-semibold text-gray-800 mb-4 text-sm flex items-center gap-2">
              <Plus size={18} className="text-blue-600" /> Registrar Nuevo CeCo
            </h3>
            <form onSubmit={handleCrearCeco} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Código (10 dígitos)</label>
                <input 
                  type="text" maxLength={10} required placeholder="Ej. 1010203000"
                  value={formCeco.codigo} onChange={e => setFormCeco({...formCeco, codigo: e.target.value})}
                  className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
                <input 
                  type="text" required placeholder="Ej. Depto Financiero"
                  value={formCeco.nombre} onChange={e => setFormCeco({...formCeco, nombre: e.target.value})}
                  className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Unidad</label>
                <input 
                  type="text" required placeholder="Ej. Administración"
                  value={formCeco.unidad} onChange={e => setFormCeco({...formCeco, unidad: e.target.value})}
                  className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Línea de Negocio</label>
                <input 
                  type="text" required placeholder="Ej. Corporativo"
                  value={formCeco.linea_negocio} onChange={e => setFormCeco({...formCeco, linea_negocio: e.target.value})}
                  className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium">
                Guardar CeCo
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl border shadow-sm lg:col-span-2 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
              <h3 className="font-semibold text-gray-800 text-sm">Catálogo de Centros de Costo</h3>
              <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded font-medium">Total: {cecos.length}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-xs uppercase border-b">
                    <th className="p-3">Código</th>
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-gray-700">
                  {cecos.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-blue-600">{c.codigo}</td>
                      <td className="p-3">{c.nombre}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${c.activo !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {c.activo !== false ? 'Activo' : 'Bloqueado'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button 
                          onClick={() => handleToggleCeco(c.id)}
                          className={`px-3 py-1 rounded text-xs font-medium text-white ${c.activo !== false ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                        >
                          {c.activo !== false ? 'Bloquear' : 'Habilitar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VISTA 2: CENTROS DE TRABAJO (BLOQUEO PERMANENTE) */}
      {vistaActiva === 'centros' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border shadow-sm lg:col-span-1">
            <h3 className="font-semibold text-gray-800 mb-4 text-sm flex items-center gap-2">
              <Plus size={18} className="text-blue-600" /> Registrar Centro de Trabajo
            </h3>
            <form onSubmit={handleCrearCentro} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nombre Ubicación / Tienda</label>
                <input 
                  type="text" required placeholder="Ej. Tienda Galerías"
                  value={formCentro.nombre_ubicacion} onChange={e => setFormCentro({...formCentro, nombre_ubicacion: e.target.value})}
                  className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Dirección</label>
                <input 
                  type="text" required placeholder="Ej. 12 Calle 4-50"
                  value={formCentro.direccion} onChange={e => setFormCentro({...formCentro, direccion: e.target.value})}
                  className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Departamento</label>
                <input 
                  type="text" required placeholder="Ej. Guatemala"
                  value={formCentro.departamento} onChange={e => setFormCentro({...formCentro, departamento: e.target.value})}
                  className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Municipio</label>
                <input 
                  type="text" required placeholder="Ej. Guatemala"
                  value={formCentro.municipio} onChange={e => setFormCentro({...formCentro, municipio: e.target.value})}
                  className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium">
                Guardar Ubicación
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl border shadow-sm lg:col-span-2 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
              <h3 className="font-semibold text-gray-800 text-sm">Centros de Trabajo (Bloqueo Definitivo)</h3>
              <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded font-medium">Total: {centrosTrabajo.length}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-xs uppercase border-b">
                    <th className="p-3">Ubicación / Tienda</th>
                    <th className="p-3">Dirección</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-gray-700">
                  {centrosTrabajo.map((ct) => (
                    <tr key={ct.id} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold">{ct.nombre_ubicacion}</td>
                      <td className="p-3 text-xs text-gray-600">{ct.direccion} ({ct.departamento})</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${ct.activo !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {ct.activo !== false ? 'Activo' : 'Bloqueado Definitivo'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {ct.activo !== false ? (
                          <button 
                            onClick={() => handleBloquearCentro(ct.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium"
                          >
                            Bloquear Definitivo
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No reversible</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VISTA 3: RUBROS CONTABLES (CON CLAVE, CAT, CUENTA MAYOR Y TIPO GASTO) */}
      {vistaActiva === 'rubros' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border shadow-sm lg:col-span-1">
            <h3 className="font-semibold text-gray-800 mb-4 text-sm flex items-center gap-2">
              <Plus size={18} className="text-blue-600" /> Registrar Rubro Contable
            </h3>
            <form onSubmit={handleCrearRubro} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Descripción (Desc. Ing / Des)</label>
                <input 
                  type="text" required placeholder="Ej. Sueldo ordinario"
                  value={formRubro.desc_ing_des} onChange={e => setFormRubro({...formRubro, desc_ing_des: e.target.value})}
                  className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Clave Contable</label>
                  <input 
                    type="text" required placeholder="Ej. 40"
                    value={formRubro.clave_conta} onChange={e => setFormRubro({...formRubro, clave_conta: e.target.value})}
                    className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Cat. Conta (Debe/Haber)</label>
                  <select 
                    value={formRubro.cat_conta} onChange={e => setFormRubro({...formRubro, cat_conta: e.target.value})}
                    className="w-full border rounded-lg p-2.5 text-sm outline-none bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Debe">Debe</option>
                    <option value="Haber">Haber</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Cuenta Mayor (10 dígitos)</label>
                <input 
                  type="text" maxLength={10} required placeholder="Ej. 6111020000"
                  value={formRubro.cuenta_mayor} onChange={e => setFormRubro({...formRubro, cuenta_mayor: e.target.value})}
                  className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de Gasto</label>
                <select 
                  value={formRubro.tipo_gasto} onChange={e => setFormRubro({...formRubro, tipo_gasto: e.target.value})}
                  className="w-full border rounded-lg p-2.5 text-sm outline-none bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Fijo">Fijo</option>
                  |
                </select>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium">
                Guardar Rubro
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl border shadow-sm lg:col-span-2 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
              <h3 className="font-semibold text-gray-800 text-sm">Catálogo de Cuentas y Rubros Contables</h3>
              <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded font-medium">Total: {rubros.length}</span>
            </div>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-slate-50 z-10">
                  <tr className="text-slate-600 text-xs uppercase border-b">
                    <th className="p-3">Descripción</th>
                    <th className="p-3">Clave / Cat.</th>
                    <th className="p-3">Cuenta Mayor</th>
                    <th className="p-3">Gasto</th>
                    <th className="p-3 text-center">Estado</th>
                    <th className="p-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-gray-700">
                  {rubros.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-gray-900">{r.desc_ing_des}</td>
                      <td className="p-3 text-xs">
                        <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{r.clave_conta}</span> - <span className="font-semibold">{r.cat_conta}</span>
                      </td>
                      <td className="p-3 font-mono text-xs text-blue-600 font-bold">{r.cuenta_mayor}</td>
                      <td className="p-3 text-xs">
                        <span className={`px-2 py-0.5 rounded font-medium ${r.tipo_gasto === 'Fijo' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                          {r.tipo_gasto}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${r.activo !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {r.activo !== false ? 'Activo' : 'Bloqueado'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button 
                          onClick={() => handleToggleRubro(r.id)}
                          className={`px-3 py-1 rounded text-xs font-medium text-white ${r.activo !== false ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                        >
                          {r.activo !== false ? 'Bloquear' : 'Habilitar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VISTA 4: PARÁMETROS */}
      {vistaActiva === 'parametros' && (
        <div className="bg-white p-6 rounded-xl border shadow-sm max-w-2xl">
          <h3 className="font-semibold text-gray-800 mb-2 text-base">Parámetros Legales y de Nómina (Guatemala)</h3>
          <p className="text-xs text-gray-500 mb-6">Valores base para cálculos automáticos de planillas y prestaciones.</p>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border">
              <div><p className="font-medium">Cuota Laboral IGSS</p></div>
              <span className="font-bold text-blue-600">4.83%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border">
              <div><p className="font-medium">Cuota Patronal IGSS</p></div>
              <span className="font-bold text-blue-600">12.67%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border">
              <div><p className="font-medium">Bonificación Incentivo de Ley</p></div>
              <span className="font-bold text-blue-600">Q. 250.00</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}