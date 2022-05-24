import { AxiosError } from "axios";
import express from "express";
import { AddressInfo } from "net";
import z from "zod";
import { Zodios, asApi } from "@zodios/core";
import { pluginToken, pluginHeader, pluginApi } from "./index";

const userSchema = z.object({
  id: z.number(),
  name: z.string(),
});

const api = asApi([
  {
    method: "get",
    path: "/token",
    response: z.object({ token: z.string() }),
  },
  {
    method: "get",
    path: "/expired-token",
    response: z.object({ token: z.string() }),
  },
  {
    method: "post",
    path: "/json",
    response: z.object({ accept: z.string(), content: z.string() }),
  },
  {
    method: "get",
    path: "/json",
    response: z.object({ accept: z.string() }),
  },
] as const);

describe("Plugins", () => {
  let app: express.Express;
  let server: ReturnType<typeof app.listen>;
  let port: number;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.get("/token", (req, res) => {
      res.status(200).json({ token: req.headers.authorization });
    });
    app.get("/expired-token", (req, res) => {
      res.status(401).json({ error: "token expired" });
    });
    app.post("/json", (req, res) => {
      res.status(200).json({
        accept: req.headers.accept,
        content: req.headers["content-type"],
      });
    });
    app.get("/json", (req, res) => {
      res.status(200).json({
        accept: req.headers.accept,
      });
    });

    server = app.listen(0);
    port = (server.address() as AddressInfo).port;
  });

  afterAll(() => {
    server.close();
  });

  it("should get back injected token", async () => {
    const client = new Zodios(`http://localhost:${port}`, api);
    client.use(pluginToken({ getToken: async () => "token" }));
    const token = await client.get("/token");
    expect(token).toEqual({
      token: "Bearer token",
    });
  });

  it("should try to renew token", async () => {
    const client = new Zodios(`http://localhost:${port}`, api);
    client.use(
      pluginToken({
        getToken: async () => "token",
        renewToken: async () => {},
      })
    );
    let error: AxiosError | undefined = undefined;
    try {
      await client.get("/expired-token");
    } catch (e) {
      error = e as AxiosError;
    }
    expect(error).toBeDefined();
    expect(error?.response?.status).toBe(401);
    expect(error?.response?.data).toEqual({ error: "token expired" });
  });

  it("should get back injected auth", async () => {
    const client = new Zodios(`http://localhost:${port}`, api);
    client.use(pluginHeader("Authorization", async () => "Basic auth"));
    const token = await client.get("/token");
    expect(token).toEqual({
      token: "Basic auth",
    });
  });

  it("should use json as content type", async () => {
    const client = new Zodios(`http://localhost:${port}`, api);
    client.use(pluginApi());
    const token = await client.post("/json");
    expect(token).toEqual({
      content: "application/json",
      accept: "application/json",
    });
  });

  it("should use json as accept type", async () => {
    const client = new Zodios(`http://localhost:${port}`, api);
    client.use(pluginApi());
    const token = await client.get("/json");
    expect(token).toEqual({
      accept: "application/json",
    });
  });
});
