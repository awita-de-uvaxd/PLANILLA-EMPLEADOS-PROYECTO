from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
from datetime import date
from typing import List
from fastapi.responses import StreamingResponse
import pandas as pd
import io
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import models # Importa el archivo models.py con tus tablas de base de datos

# 1. Configuración de Base de Datos
SessionLocal = sessionmaker(bind=models.engine)

# 2. Inicialización de la aplicación FastAPI
app = FastAPI(
    title="API Sistema de Nómina",
    description="Backend para cálculo de nómina y gestión de planillas",
    version="1.0.0"
)

# 3. Configuración CORS (Vital para conectar con React/Vite)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], # Puertos por defecto de Vite
    allow_credentials=True,
    allow_methods=["*"], # Permite GET, POST, PUT, DELETE
    allow_headers=["*"],
)

# 4. Dependencia de Base de Datos (Abre y cierra sesión por cada petición)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 5. Esquemas Pydantic (Validan la información que entra desde el Frontend)
class EmpleadoCreate(BaseModel):
    dpi: str
    nombre_completo: str
    salario_base: float
    fecha_nacimiento: date
    fecha_contratacion: date
    # Campos opcionales podrían definirse aquí con Optional[]

class NominaRequest(BaseModel):
    mes: int
    anio: int
    tipo_nomina: str # Debe coincidir con los Enum ("Anticipo 15 días" o "Fin de Mes")

# 6. --- ENDPOINTS (Rutas de la API) ---

@app.get("/")
def estado_servidor():
    return {"status": "Servidor activo", "mensaje": "API de Nómina conectada a MySQL"}

class LoginRequest(BaseModel):
    username: str
    password: str

# --- MÓDULO AUTH: Login y Setup ---

class LoginRequest(BaseModel):
    username: str
    password: str

@app.post("/api/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(
        models.Usuario.username == req.username,
        models.Usuario.password_hash == req.password
    ).first()
    
    if not usuario:
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
        
    return {
        "id": usuario.id,
        "username": usuario.username,
        "es_admin": usuario.es_admin,
        "acceso_rrhh": usuario.acceso_rrhh,
        "acceso_nominas": usuario.acceso_nominas,
        "acceso_procesos": usuario.acceso_procesos
    }

@app.post("/api/auth/setup")
def setup_usuarios(db: Session = Depends(get_db)):
    if db.query(models.Usuario).first():
        return {"mensaje": "Los usuarios ya existen"}
        
    # Creamos un Super Administrador y un usuario normal para pruebas
    usuarios_base = [
        models.Usuario(username="admin", password_hash="1234", es_admin=True, acceso_rrhh=True, acceso_nominas=True, acceso_procesos=True),
        models.Usuario(username="auxiliar", password_hash="1234", es_admin=False, acceso_rrhh=True, acceso_nominas=False, acceso_procesos=False),
    ]
    db.add_all(usuarios_base)
    db.commit()
    return {"mensaje": "Usuarios base creados (admin / auxiliar). Contraseña: 1234"}

# --- MÓDULO ADMIN: Gestión de Permisos ---

class PermisosUpdate(BaseModel):
    es_admin: bool
    acceso_rrhh: bool
    acceso_nominas: bool
    acceso_procesos: bool

@app.get("/api/admin/usuarios")
def listar_usuarios(db: Session = Depends(get_db)):
    return db.query(models.Usuario).all()

@app.put("/api/admin/usuarios/{usuario_id}/permisos")
def actualizar_permisos(usuario_id: int, req: PermisosUpdate, db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    usuario.es_admin = req.es_admin
    usuario.acceso_rrhh = req.acceso_rrhh
    usuario.acceso_nominas = req.acceso_nominas
    usuario.acceso_procesos = req.acceso_procesos
    
    db.commit()
    return {"mensaje": f"Permisos de {usuario.username} actualizados correctamente"}

# MÓDULO AUTH: Crear usuarios iniciales (Solo ejecutar una vez)
@app.post("/api/auth/setup")
def setup_usuarios(db: Session = Depends(get_db)):
    if db.query(models.Usuario).first():
        return {"mensaje": "Los usuarios ya fueron creados previamente"}
        
    usuarios_base = [
        models.Usuario(username="admin", password_hash="1234", rol=models.RolUsuario.ADMIN),
        models.Usuario(username="rrhh", password_hash="1234", rol=models.RolUsuario.RRHH),
        models.Usuario(username="nominas", password_hash="1234", rol=models.RolUsuario.NOMINAS),
        models.Usuario(username="procesos", password_hash="1234", rol=models.RolUsuario.PROCESOS),
    ]
    db.add_all(usuarios_base)
    db.commit()
    return {"mensaje": "Usuarios de prueba creados exitosamente (Contraseña para todos: 1234)"}

# MÓDULO RRHH: Crear Empleado
@app.post("/api/rrhh/empleados")
def crear_empleado(empleado: EmpleadoCreate, db: Session = Depends(get_db)):
    # Validar que el DPI no exista
    db_empleado = db.query(models.Empleado).filter(models.Empleado.dpi == empleado.dpi).first()
    if db_empleado:
        raise HTTPException(status_code=400, detail="Un empleado con este DPI ya está registrado")
    
    nuevo_empleado = models.Empleado(
        dpi=empleado.dpi,
        nombre_completo=empleado.nombre_completo,
        salario_base=empleado.salario_base,
        fecha_nacimiento=empleado.fecha_nacimiento,
        fecha_contratacion=empleado.fecha_contratacion
    )
    db.add(nuevo_empleado)
    db.commit()
    db.refresh(nuevo_empleado)
    return {"mensaje": "Empleado ingresado exitosamente", "id_empleado": nuevo_empleado.id}

# --- MÓDULO NÓMINAS: Ingresos y Descuentos Variables ---

class IngresoCreate(BaseModel):
    empleado_id: int
    concepto: str
    monto: float

class DescuentoCreate(BaseModel):
    empleado_id: int
    tipo: str # "Cíclico" o "Eventual"
    concepto: str
    monto: float

@app.post("/api/nominas/ingresos")
def registrar_ingreso(req: IngresoCreate, db: Session = Depends(get_db)):
    nuevo_ingreso = models.Ingreso(empleado_id=req.empleado_id, concepto=req.concepto, monto=req.monto)
    db.add(nuevo_ingreso)
    db.commit()
    return {"mensaje": "Ingreso extra registrado"}

@app.post("/api/nominas/descuentos")
def registrar_descuento(req: DescuentoCreate, db: Session = Depends(get_db)):
    try:
        tipo_enum = models.TipoDescuento(req.tipo)
    except ValueError:
        raise HTTPException(status_code=400, detail="Tipo de descuento inválido")
        
    nuevo_descuento = models.Descuento(empleado_id=req.empleado_id, tipo=tipo_enum, concepto=req.concepto, monto=req.monto)
    db.add(nuevo_descuento)
    db.commit()
    return {"mensaje": "Descuento registrado"}

# --- MÓDULO NÓMINAS: Ejecución del Cálculo Maestro ---
# Este endpoint conecta con la función matemática que hicimos al inicio

@app.post("/api/nominas/ejecutar")
def ejecutar_calculo(req: NominaRequest, db: Session = Depends(get_db)):
    try:
        tipo_enum = models.TipoNomina(req.tipo_nomina)
        
        # Llamamos a la lógica matemática (Asegúrate de que la función procesar_nomina reciba la db session si la pusiste en otro archivo)
        # Para este ejemplo, la adaptamos para usar la sesión actual de la petición:
        
        nomina_actual = models.Nomina(periodo_mes=req.mes, periodo_anio=req.anio, tipo=tipo_enum)
        db.add(nomina_actual)
        db.flush() 
        
        empleados = db.query(models.Empleado).filter(models.Empleado.estado == True).all()
        
        for emp in empleados:
            # 1. Descuento de días por incidencias
            incidencias = db.query(models.Incidencia).filter(models.Incidencia.empleado_id == emp.id).all()
            dias_descontar = sum([i.dias_descontar for i in incidencias])
            dias_efectivos = 15 if tipo_enum == models.TipoNomina.ANTICIPO else (30 - dias_descontar)
            
            salario_proporcional = (emp.salario_base / 30) * dias_efectivos
            bono_ley_proporcional = (emp.bonificacion_ley / 30) * dias_efectivos
            
            # Variables
            ingresos_var = db.query(models.Ingreso).filter(models.Ingreso.empleado_id == emp.id).all()
            total_ingresos_extra = sum([i.monto for i in ingresos_var])
            
            descuentos_var = db.query(models.Descuento).filter(models.Descuento.empleado_id == emp.id, models.Descuento.activo == True).all()
            total_otros_descuentos = sum([d.monto for d in descuentos_var])
            
            base_igss = salario_proporcional + total_ingresos_extra
            igss_laboral = base_igss * 0.0483
            liquido = (base_igss + bono_ley_proporcional) - igss_laboral - total_otros_descuentos
            
            registro = models.ReporteriaNomina(
                nomina_id=nomina_actual.id, empleado_id=emp.id, dias_trabajados=dias_efectivos,
                salario_ordinario=salario_proporcional, bonificacion_ley=bono_ley_proporcional,
                total_ingresos_extra=total_ingresos_extra, base_afecta_igss=base_igss,
                igss_laboral=igss_laboral, total_descuentos=total_otros_descuentos, liquido_a_recibir=liquido,
                prov_igss_patronal=base_igss * 0.1267, prov_indemnizacion=base_igss * 0.0972,
                prov_aguinaldo=base_igss * 0.0833, prov_bono14=base_igss * 0.0833, prov_vacaciones=base_igss * 0.0416
            )
            db.add(registro)
            
            # Apagar descuentos eventuales
            for d in descuentos_var:
                if d.tipo == models.TipoDescuento.EVENTUAL:
                    d.activo = False
                    
        db.commit()
        return {"mensaje": f"Planilla de {req.tipo_nomina} calculada exitosamente para {len(empleados)} empleados."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    
# Modelo para Incidencias
class IncidenciaCreate(BaseModel):
    empleado_id: int
    concepto: str
    fecha_incidencia: date
    dias_descontar: int

# MÓDULO PROCESOS: Registrar Incidencia
@app.post("/api/procesos/incidencias")
def registrar_incidencia(req: IncidenciaCreate, db: Session = Depends(get_db)):
    nueva_incidencia = models.Incidencia(
        empleado_id=req.empleado_id,
        concepto=req.concepto,
        fecha_incidencia=req.fecha_incidencia,
        dias_descontar=req.dias_descontar
    )
    db.add(nueva_incidencia)
    db.commit()
    return {"mensaje": "Incidencia registrada correctamente"}

# MÓDULO RRHH: Listar Empleados
@app.get("/api/rrhh/empleados")
def listar_empleados(db: Session = Depends(get_db)):
    empleados = db.query(models.Empleado).all()
    return empleados

# MÓDULO NÓMINAS: Ejecutar Cálculo
@app.post("/api/nominas/procesar")
def ejecutar_nomina(req: NominaRequest, db: Session = Depends(get_db)):
    try:
        tipo_enum = models.TipoNomina(req.tipo_nomina)
    except ValueError:
        raise HTTPException(status_code=400, detail="Tipo de nómina inválido")

    # Aquí se integra la lógica matemática que desarrollamos anteriormente
    # para leer ingresos, descuentos, calcular el IGSS (4.83%) y provisionar (9.72%, 8.33%, etc.)
    
    # Simulación de respuesta de éxito (Por ahora)
    return {
        "status": "success",
        "mensaje": f"Nómina de {req.tipo_nomina} para el periodo {req.mes}/{req.anio} calculada exitosamente."
    }

# --- MÓDULO REPORTERÍA: Historial y Exportación ---

@app.get("/api/reporteria/nominas")
def listar_nominas_historial(db: Session = Depends(get_db)):
    # Trae todas las nóminas ordenadas de la más reciente a la más antigua
    nominas = db.query(models.Nomina).order_by(models.Nomina.id.desc()).all()
    
    # Formatear la respuesta para el frontend
    resultado = []
    for n in nominas:
        # Sumar el total líquido de esa nómina
        detalles = db.query(models.ReporteriaNomina).filter(models.ReporteriaNomina.nomina_id == n.id).all()
        total_pagar = sum([d.liquido_a_recibir for d in detalles])
        
        resultado.append({
            "id": n.id,
            "periodo_mes": n.periodo_mes,
            "periodo_anio": n.periodo_anio,
            "tipo": n.tipo.value,
            "fecha_ejecucion": n.fecha_ejecucion,
            "total_liquido": total_pagar
        })
    return resultado

@app.get("/api/reporteria/nominas/{nomina_id}/excel")
def descargar_excel_nomina(nomina_id: int, db: Session = Depends(get_db)):
    nomina = db.query(models.Nomina).filter(models.Nomina.id == nomina_id).first()
    if not nomina:
        raise HTTPException(status_code=404, detail="Nómina no encontrada")
        
    detalles = db.query(models.ReporteriaNomina).filter(models.ReporteriaNomina.nomina_id == nomina_id).all()
    
    # Preparar los datos para Pandas
    data = []
    for d in detalles:
        data.append({
            "DPI": d.empleado.dpi,
            "Nombre Completo": d.empleado.nombre_completo,
            "Días Trabajados": d.dias_trabajados,
            "Salario Ordinario": round(d.salario_ordinario, 2),
            "Bonificación Ley": round(d.bonificacion_ley, 2),
            "Ingresos Extra": round(d.total_ingresos_extra, 2),
            "Base IGSS": round(d.base_afecta_igss, 2),
            "IGSS Laboral": round(d.igss_laboral, 2),
            "Otros Descuentos": round(d.total_descuentos, 2),
            "TOTAL LÍQUIDO": round(d.liquido_a_recibir, 2),
            "Prov. IGSS Patronal": round(d.prov_igss_patronal, 2),
            "Prov. Indemnización": round(d.prov_indemnizacion, 2),
            "Prov. Aguinaldo": round(d.prov_aguinaldo, 2),
            "Prov. Bono 14": round(d.prov_bono14, 2),
            "Prov. Vacaciones": round(d.prov_vacaciones, 2)
        })
        
    df = pd.DataFrame(data)
    
    # Escribir el DataFrame a un archivo Excel en memoria
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name=f"Planilla {nomina.periodo_mes}-{nomina.periodo_anio}")
        
    output.seek(0)
    
    # Configurar los headers para que el navegador lo descargue como archivo
    nombre_archivo = f"SABANA_NOMINA_{nomina.tipo.value}_{nomina.periodo_mes}_{nomina.periodo_anio}.xlsx"
    headers = {
        'Content-Disposition': f'attachment; filename="{nombre_archivo}"'
    }
    return StreamingResponse(output, headers=headers, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

# --- MÓDULO DASHBOARD: Estadísticas en tiempo real ---
@app.get("/api/dashboard/stats")
def obtener_estadisticas(db: Session = Depends(get_db)):
    emp_activos = db.query(models.Empleado).filter(models.Empleado.estado == True).count()
    incidencias_mes = db.query(models.Incidencia).count() # Simplificado para el demo
    
    ultima_nomina = db.query(models.Nomina).order_by(models.Nomina.id.desc()).first()
    total_ultima = 0
    if ultima_nomina:
        detalles = db.query(models.ReporteriaNomina).filter(models.ReporteriaNomina.nomina_id == ultima_nomina.id).all()
        total_ultima = sum([d.liquido_a_recibir for d in detalles])
        
    return {
        "empleados_activos": emp_activos,
        "ultima_nomina_total": total_ultima,
        "incidencias_mes": incidencias_mes,
        "carga_prestacional": "29.15%" # Valor fijo para la demo (IGSS Patronal + Prestaciones)
    }

# --- MÓDULO REPORTERÍA: Generación de Boletas PDF ---
@app.get("/api/reporteria/nominas/{nomina_id}/pdf")
def descargar_boletas_pdf(nomina_id: int, db: Session = Depends(get_db)):
    nomina = db.query(models.Nomina).filter(models.Nomina.id == nomina_id).first()
    detalles = db.query(models.ReporteriaNomina).filter(models.ReporteriaNomina.nomina_id == nomina_id).all()
    
    if not nomina or not detalles:
        raise HTTPException(status_code=404, detail="Nómina no encontrada")

    output = io.BytesIO()
    p = canvas.Canvas(output, pagesize=letter)
    width, height = letter

    for d in detalles:
        # Encabezado
        p.setFont("Helvetica-Bold", 16)
        p.drawString(50, height - 50, "BOLETA DE PAGO DE NÓMINA")
        p.setFont("Helvetica", 10)
        p.drawString(50, height - 70, f"Empresa: NóminaHub S.A.")
        p.drawString(50, height - 85, f"Periodo: Mes {nomina.periodo_mes} / {nomina.periodo_anio} - {nomina.tipo.value}")

        # Datos del Empleado
        p.setFont("Helvetica-Bold", 12)
        p.drawString(50, height - 120, "DATOS DEL EMPLEADO")
        p.setFont("Helvetica", 10)
        p.drawString(50, height - 140, f"Nombre: {d.empleado.nombre_completo}")
        p.drawString(50, height - 155, f"DPI: {d.empleado.dpi}")
        p.drawString(300, height - 155, f"Días Trabajados: {d.dias_trabajados}")

        # Sección Ingresos
        p.setFont("Helvetica-Bold", 12)
        p.drawString(50, height - 190, "INGRESOS (+)")
        p.setFont("Helvetica", 10)
        p.drawString(50, height - 210, f"Salario Ordinario: Q. {d.salario_ordinario:,.2f}")
        p.drawString(50, height - 225, f"Bonificación de Ley: Q. {d.bonificacion_ley:,.2f}")
        p.drawString(50, height - 240, f"Ingresos Extra: Q. {d.total_ingresos_extra:,.2f}")

        # Sección Descuentos
        p.setFont("Helvetica-Bold", 12)
        p.drawString(300, height - 190, "DESCUENTOS (-)")
        p.setFont("Helvetica", 10)
        p.drawString(300, height - 210, f"Cuota Laboral IGSS (4.83%): Q. {d.igss_laboral:,.2f}")
        p.drawString(300, height - 225, f"Otros Descuentos: Q. {d.total_descuentos:,.2f}")

        # Resumen Final
        p.setFont("Helvetica-Bold", 14)
        p.drawString(50, height - 290, f"TOTAL LÍQUIDO A RECIBIR: Q. {d.liquido_a_recibir:,.2f}")

        # Firma
        p.setFont("Helvetica", 10)
        p.drawString(50, height - 370, "________________________________________________")
        p.drawString(50, height - 385, "Firma de Conformidad del Empleado")

        p.showPage() # Salto de página para el siguiente empleado

    p.save()
    output.seek(0)

    nombre_archivo = f"BOLETAS_{nomina.tipo.value}_{nomina.periodo_mes}_{nomina.periodo_anio}.pdf"
    headers = {'Content-Disposition': f'attachment; filename="{nombre_archivo}"'}
    return StreamingResponse(output, headers=headers, media_type='application/pdf')