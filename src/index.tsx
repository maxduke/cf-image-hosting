import { Hono } from "hono";
import { basicAuth } from 'hono/basic-auth'
import { cors } from "hono/cors";
import { Home } from "./Home";

const app = new Hono<{ Bindings: { API_HOST: string, USERNAME: string, PASSWORD: string } }>();

app.use('/', async (c, next) => {
  const auth = basicAuth({
    username: c.env.USERNAME,
    password: c.env.PASSWORD,
  })
  return auth(c, next)
});

app.get("/", (c) => c.html(<Home />));

app.post("/upload", cors(), async (c) => {
  const body = await c.req.parseBody();
  const file = body.file as File;
  const formData = new FormData();
  formData.append("file", file, file.name);
  const response = await fetch(`${c.env.API_HOST}/upload`, {
    method: "POST",
    body: formData,
  });
  const data = await response.json();
  const status = response.status as Parameters<typeof c.json>[1];
  return c.json(data, status);
});

app.get("/file/:name", async (c) => {
  const referrer = c.req.header('Referer') || '';
  const url = referrer.split('/')[2] || '';
  const min_ulr = url.split(':')[0] || '';
  if(referrer && c.env.whiteList.includes(min_ulr) || !referrer) {
    // 访问域名在白名单内，放行 !referer表示直接访问图片(比如浏览器地址栏输入图片地址)
    const response = await fetch(`${c.env.API_HOST}/file/${c.req.param("name")}`);
    return c.newResponse(response.body as ReadableStream, {
      headers: response.headers,
    });
  } else {
    return fetch('https://pic.diydoutu.com/bq/1061.jpg');
  }
});

app.onError((error, c) => {
  return c.json(
    { code: 500, message: error?.message || "Server internal error" },
    500,
  );
});

export default app;
