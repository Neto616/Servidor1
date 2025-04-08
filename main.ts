import { Hono, Context } from 'hono'
import { prettyJSON } from 'hono/pretty-json'
import {default as vistas} from './routes.views.ts';

const app = new Hono()

app.use(prettyJSON());

app.route('/', vistas)
app.get('/*', (c: Context): Response => c.json({ etatus: 0, data: { info: "La ruta no existe" }}))

Deno.serve({port: 3001}, app.fetch)
