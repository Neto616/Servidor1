import { Hono } from 'hono'
import vistas from "./ctrl.vista.ts";

const route:Hono = new Hono();

route.get("/", vistas.inicio);
route.get("/reporte_fugas", vistas.fugas)

export default route;