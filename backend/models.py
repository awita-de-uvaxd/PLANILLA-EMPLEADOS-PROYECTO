from sqlalchemy import Column, Integer, String, Float, Boolean, Date, ForeignKey, Enum as SQLEnum, create_engine
from sqlalchemy.orm import relationship, declarative_base
from datetime import date
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine
import enum
import os


# Carga las variables del archivo .env
env_path = Path(__file__).resolve().parent / '.env'
load_dotenv(dotenv_path=env_path)

# --- CONEXIÓN A BASE DE DATOS (Esta era la parte que faltaba) ---
# Reemplaza "tu_contraseña" con la clave que usas en MySQL Workbench
URL_BD = os.getenv("DATABASE_URL")
if not URL_BD:
    raise ValueError(f"No se encontró la variable DATABASE_URL. Asegúrate de que el archivo .env exista en esta ruta: {env_path}")

engine = create_engine(URL_BD)

Base = declarative_base()

# --- ENUMS (Listas desplegables para la BD) ---
class TipoDescuento(enum.Enum):
    EVENTUAL = "Eventual"
    CICLICO = "Cíclico"

class TipoNomina(enum.Enum):
    FIN_MES = "Fin de Mes"
    ANTICIPO = "Anticipo 15 días"


# --- MÓDULO AUTENTICACIÓN Y ROLES ---
class Usuario(Base):
    __tablename__ = 'usuarios'
    __table_args__ = {'extend_existing': True} # Evita errores de recarga en memoria
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    
    # Permisos Booleanos
    es_admin = Column(Boolean, default=False)
    acceso_rrhh = Column(Boolean, default=False)
    acceso_nominas = Column(Boolean, default=False)
    acceso_procesos = Column(Boolean, default=False)


# --- MÓDULO RRHH ---
class Empleado(Base):
    __tablename__ = 'empleados'
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    dpi = Column(String(13), unique=True, nullable=False)
    nombre_completo = Column(String(100), nullable=False)
    fecha_nacimiento = Column(Date, nullable=False)
    fecha_contratacion = Column(Date, nullable=False)
    salario_base = Column(Float, nullable=False)
    bonificacion_ley = Column(Float, default=250.00)
    estado = Column(Boolean, default=True)


# --- MÓDULO NÓMINAS Y PROCESOS ---
class Ingreso(Base):
    __tablename__ = 'ingresos'
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    empleado_id = Column(Integer, ForeignKey('empleados.id'))
    concepto = Column(String(100))
    monto = Column(Float)
    
    empleado = relationship("Empleado")

class Descuento(Base):
    __tablename__ = 'descuentos'
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    empleado_id = Column(Integer, ForeignKey('empleados.id'))
    tipo = Column(SQLEnum(TipoDescuento))
    concepto = Column(String(100))
    monto = Column(Float)
    activo = Column(Boolean, default=True)
    
    empleado = relationship("Empleado")

class Incidencia(Base):
    __tablename__ = 'incidencias'
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    empleado_id = Column(Integer, ForeignKey('empleados.id'))
    concepto = Column(String(100))
    fecha_incidencia = Column(Date)
    dias_descontar = Column(Integer, default=0)
    
    empleado = relationship("Empleado")


# --- MÓDULO MAESTRO Y REPORTERÍA ---
class Nomina(Base):
    __tablename__ = 'nominas'
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    periodo_mes = Column(Integer)
    periodo_anio = Column(Integer)
    tipo = Column(SQLEnum(TipoNomina))
    fecha_ejecucion = Column(Date, default=date.today)

class ReporteriaNomina(Base):
    __tablename__ = 'reporteria_nomina'
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    nomina_id = Column(Integer, ForeignKey('nominas.id'))
    empleado_id = Column(Integer, ForeignKey('empleados.id'))
    
    dias_trabajados = Column(Integer)
    salario_ordinario = Column(Float)
    bonificacion_ley = Column(Float)
    total_ingresos_extra = Column(Float)
    base_afecta_igss = Column(Float)
    igss_laboral = Column(Float)
    total_descuentos = Column(Float)
    liquido_a_recibir = Column(Float)
    
    prov_igss_patronal = Column(Float)
    prov_indemnizacion = Column(Float)
    prov_aguinaldo = Column(Float)
    prov_bono14 = Column(Float)
    prov_vacaciones = Column(Float)
    
    empleado = relationship("Empleado")
    nomina = relationship("Nomina")

    # Disparar la creación de tablas en MySQL
Base.metadata.create_all(bind=engine)
print("¡Tablas creadas exitosamente en MySQL!")