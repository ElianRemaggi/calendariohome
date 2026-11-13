import { PrismaClient, Rol } from '@prisma/client';

const prisma = new PrismaClient();

const FUNCIONES = ['PROGRAMADOR', 'ENCARGADO', 'SUB-ENCARGADA'] as const;
const SERVICIOS = ['DTO DESARROLLO'] as const;

const TIPOS_EVENTO = [
  {
    codigo: 'HOME_OFFICE',
    nombre: 'Home Office',
    requiereCupo: true,
    cupoDiario: 3,
    permiteExcesoCupo: true,
    permiteCargaPorRango: false,
    bloqueaFinDeSemana: true,
    bloqueaFeriado: true,
    requiereAprobacion: false,
    mesMinOffsetUser: 0,
    mesMaxOffsetUser: 1,
  },
  {
    codigo: 'VACACIONES',
    nombre: 'Vacaciones',
    requiereCupo: true,
    cupoDiario: 3,
    permiteExcesoCupo: false,
    permiteCargaPorRango: true,
    bloqueaFinDeSemana: false,
    bloqueaFeriado: false,
    requiereAprobacion: false,
    mesMinOffsetUser: 0,
    mesMaxOffsetUser: null,
    minDiasRango: 7,
    maxDiasRango: 35,
  },
] as const;

const SUPER_ADMIN_LEGAJO = 9147;
const ADMIN_SERVICIO_LEGAJOS = [7429, 8884] as const;

async function main() {
  for (const nombre of FUNCIONES) {
    await prisma.funcion.upsert({
      where: { servicioId_nombre: { servicioId: null, nombre } },
      update: { activo: true },
      create: { nombre, activo: true, servicioId: null },
    });
  }

  for (const nombre of SERVICIOS) {
    await prisma.servicio.upsert({
      where: { nombre },
      update: { activo: true },
      create: { nombre, activo: true },
    });
  }

  for (const tipo of TIPOS_EVENTO) {
    await prisma.tipoEvento.upsert({
      where: { codigo: tipo.codigo },
      update: { activo: true },
      create: { ...tipo, activo: true },
    });
  }

  const funcion = await prisma.funcion.findFirstOrThrow({
    where: { nombre: 'PROGRAMADOR', servicioId: null },
  });
  const servicio = await prisma.servicio.findFirstOrThrow({
    where: { nombre: 'DTO DESARROLLO' },
  });

  const superPersona = await prisma.persona.upsert({
    where: { legajo: SUPER_ADMIN_LEGAJO },
    update: { rol: Rol.SUPER_ADMIN, activo: true },
    create: {
      legajo: SUPER_ADMIN_LEGAJO,
      nombre: `Legajo ${SUPER_ADMIN_LEGAJO}`,
      rol: Rol.SUPER_ADMIN,
      funcionId: funcion.id,
      servicioId: servicio.id,
    },
  });
  await prisma.personaAdminServicio.deleteMany({
    where: { personaId: superPersona.id },
  });

  for (const legajo of ADMIN_SERVICIO_LEGAJOS) {
    const existing = await prisma.persona.findUnique({ where: { legajo } });
    const persona =
      existing ??
      (await prisma.persona.create({
        data: {
          legajo,
          nombre: `Legajo ${legajo}`,
          rol: Rol.ADMIN_SERVICIO,
          funcionId: funcion.id,
          servicioId: servicio.id,
        },
      }));
    await prisma.persona.update({
      where: { id: persona.id },
      data: { rol: Rol.ADMIN_SERVICIO, activo: true },
    });
    await prisma.personaAdminServicio.upsert({
      where: {
        personaId_servicioId: {
          personaId: persona.id,
          servicioId: servicio.id,
        },
      },
      create: { personaId: persona.id, servicioId: servicio.id },
      update: {},
    });
  }

  console.log(
    'Shift seed OK: funciones, servicios, tipos de evento, super admin 9147, admins servicio.',
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
