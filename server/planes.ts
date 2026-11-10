// Avisa al equipo de Proveo cada vez que un proveedor pide un plan pago desde /planes.
// Sin esto, el pedido quedaba guardado en solicitudesPlan y solo se veía entrando a /admin.
// Destinatarios: las cuentas de la colección admins (las mismas que entran a /admin).
import { PLANES } from '@/domain/planes';
import { mailPedidoDePlan } from '@/domain/notificaciones';
import type { PlanId } from '@/domain/types';
import { auth, db } from './firebaseAdmin';
import { fallas, MailMalConfigurado, type MailSender } from './mail/MailSender';

async function mailsDelEquipo(): Promise<string[]> {
  const admins = await db.collection('admins').get();
  const mails = await Promise.all(admins.docs.map(async (d) => (d.data().email as string | undefined) ?? (await auth.getUser(d.id).catch(() => null))?.email));
  return [...new Set(mails.filter((m): m is string => !!m))];
}

export async function avisarPedidosDePlan(mail: MailSender, urlBase: string) {
  // Al pedir de nuevo, la app reescribe el documento sin "avisado": vuelve a avisar.
  const pendientes = (await db.collection('solicitudesPlan').get()).docs.filter((d) => d.data().avisado !== true);
  if (!pendientes.length) return;
  const equipo = await mailsDelEquipo();
  if (!equipo.length) { console.error('Hay pedidos de plan pero ninguna cuenta en admins para avisar.'); return; }
  for (const d of pendientes) {
    const [u, usuario, contacto] = await Promise.all([
      auth.getUser(d.id).catch(() => null), db.doc(`users/${d.id}`).get(), db.doc(`users/${d.id}/privado/contacto`).get(),
    ]);
    const datos = usuario.data() ?? {};
    const plan = PLANES[d.data().plan as PlanId];
    // Volver al plan gratis no es una venta: no se avisa.
    if (!plan || plan.precioUsd === 0) { await d.ref.update({ avisado: true }); continue; }
    const contenido = mailPedidoDePlan({
      empresa: datos.empresa ?? '(sin empresa)', contacto: datos.contactoNombre ?? '', cuit: datos.cuit ?? '',
      email: contacto.data()?.email ?? u?.email ?? '', plan: plan.nombre, precioUsd: plan.precioUsd,
    }, urlBase);
    let ok = true;
    for (const email of equipo) {
      try {
        await mail.enviar({ para: { nombre: 'Equipo Proveo', email }, ...contenido });
      } catch (e) {
        if (e instanceof MailMalConfigurado) throw e;
        ok = false; fallas.total++;
        console.error(`No se pudo avisar el pedido de plan de ${datos.empresa} a ${email}:`, (e as Error).message);
      }
    }
    if (ok) await d.ref.update({ avisado: true });
    console.log(`Pedido de plan ${plan.nombre} de ${datos.empresa}: ${ok ? 'avisado' : 'queda para la próxima corrida'}.`);
  }
}
