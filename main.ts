import { Hono, Context } from 'hono'
import {default as vistas} from './routes.views.ts';
import "https://deno.land/std@0.224.0/dotenv/load.ts";

const app = new Hono()
// app.use(prettyJSON())
app.route('/', vistas)
app.get('/*', (c: Context): Response => c.json({ etatus: 0, data: { info: "La ruta no existe" }}))

Deno.serve({port: 3001}, app.fetch)
