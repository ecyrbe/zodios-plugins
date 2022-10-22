globalThis.FormData = require("form-data");
import "cross-fetch/polyfill";
import { AxiosError } from "axios";
import express from "express";
import { AddressInfo } from "net";
import z from "zod";
import { Zodios, makeApi } from "@zodios/core";
import { pluginApi, pluginFetch } from "../index";

globalThis.btoa = (a: string) => Buffer.from(a).toString("base64");
globalThis.atob = (a: string) => Buffer.from(a, "base64").toString();

const userSchema = z.object({
  id: z.number(),
  name: z.string(),
});

const api = makeApi([
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
    method: "get",
    path: "/error",
    response: z.void(),
  },
  {
    method: "post",
    path: "/json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({
          test: z.string(),
        }),
      },
    ],
    response: z.object({
      accept: z.string(),
      content: z.string(),
      body: z.record(z.any()),
    }),
  },
  {
    method: "post",
    path: "/form",
    requestFormat: "form-data",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({
          test: z.string(),
        }),
      },
    ],
    response: z.object({
      accept: z.string(),
      content: z.string(),
    }),
  },
  {
    method: "get",
    path: "/json",
    response: z.object({ accept: z.string() }),
  },
  {
    method: "get",
    path: "/query",
    parameters: [
      {
        name: "a",
        type: "Query",
        schema: z.string(),
      },
      {
        name: "b",
        type: "Query",
        schema: z.array(z.string()),
      },
    ],
    response: z.object({ query: z.record(z.string().or(z.array(z.string()))) }),
  },
  {
    method: "get",
    path: "/auth",
    response: z.object({ login: z.string(), password: z.string() }),
  },
]);

describe("Plugins", () => {
  let app: express.Express;
  let server: ReturnType<typeof app.listen>;
  let port: number;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.get("/error", (req, res) => {
      res.status(500).json({ error: "unexpected error" });
    });
    app.post("/json", (req, res) => {
      res.status(200).json({
        accept: req.headers.accept,
        content: req.headers["content-type"],
        body: req.body,
      });
    });
    app.get("/json", (req, res) => {
      res.status(200).json({
        accept: req.headers.accept,
      });
    });
    app.get("/auth", (req, res) => {
      const token = req.headers.authorization?.split(" ")[1] ?? "";
      const auth = atob(token)?.split(":");
      res.status(200).json({
        login: auth[0],
        password: auth[1],
      });
    });
    app.get("/query", (req, res) => {
      res.status(200).json({
        query: req.query,
      });
    });
    app.post("/form", (req, res) => {
      res.status(200).json({
        accept: req.headers.accept,
        content: req.headers["content-type"],
      });
    });

    server = app.listen(0);
    port = (server.address() as AddressInfo).port;
  });

  afterAll(() => {
    server.close();
  });

  it("should rethrow error", async () => {
    const client = new Zodios(`http://localhost:${port}`, api);
    client.use(pluginFetch());
    let error: AxiosError | undefined = undefined;
    try {
      await client.get("/error");
    } catch (e) {
      error = e as AxiosError;
    }
    expect(error).toBeDefined();
    expect(error?.response?.status).toBe(500);
    expect(error?.response?.data).toEqual({ error: "unexpected error" });
  });

  it("should use json as content type", async () => {
    const client = new Zodios(`http://localhost:${port}`, api);
    client.use(pluginFetch());
    client.use(pluginApi());
    const result = await client.post("/json", { test: "test" });
    expect(result).toEqual({
      content: "application/json",
      accept: "application/json",
      body: { test: "test" },
    });
  });

  it("should use json as accept type", async () => {
    const client = new Zodios(`http://localhost:${port}`, api);
    client.use(pluginFetch());
    client.use(pluginApi());
    const token = await client.get("/json");
    expect(token).toEqual({
      accept: "application/json",
    });
  });

  it("should use query as params", async () => {
    const client = new Zodios(`http://localhost:${port}`, api, {
      validate: true,
    });
    client.use(pluginFetch());
    client.use(pluginApi());
    const result = await client.get("/query", {
      queries: {
        a: "testa",
        b: ["testb", "testc"],
      },
    });
    expect(result).toEqual({
      query: {
        a: "testa",
        b: ["testb", "testc"],
      },
    });
  });

  it("should use form-data as content type", async () => {
    const client = new Zodios(`http://localhost:${port}`, api);
    client.use(pluginApi());
    client.use(pluginFetch());
    const result = await client.post("/form", { test: "test" });
    expect(result).toEqual({
      content: expect.stringContaining("multipart/form-data"),
      accept: "application/json",
    });
  });

  it("should use auth", async () => {
    const client = new Zodios(`http://localhost:${port}`, api, {
      validate: false,
    });
    client.use(pluginFetch());
    client.use(pluginApi());
    const auth = await client.get("/auth", {
      auth: {
        username: "test",
        password: "test",
      },
    });
    expect(auth).toEqual({
      login: "test",
      password: "test",
    });
  });
});
