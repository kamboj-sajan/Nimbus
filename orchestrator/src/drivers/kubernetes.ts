import * as k8s from "@kubernetes/client-node";
import fs from "fs";
import path from "path";
import YAML from "yaml";
import { config } from "../config";
import { mintSnapshotToken, type Session } from "../lib/auth";
import type { RuntimeDriver, RuntimeStatus } from "./types";

const { namespace } = config.kubernetes;

/** Usernames are [a-z0-9_]; Kubernetes names allow [a-z0-9-]. */
const resourceName = (username: string) => `nimbus-ws-${username.replace(/_/g, "-")}`;

function render(template: string, values: Record<string, string>): any {
  const source = fs.readFileSync(path.join(__dirname, "../templates", template), "utf8");
  const filled = source.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in values)) throw new Error(`Missing template value ${key} in ${template}`);
    return values[key];
  });
  return YAML.parse(filled);
}

function isStatus(err: any, code: number): boolean {
  const body = typeof err?.body === "string" ? safeJson(err.body) : err?.body;
  return err?.code === code || err?.statusCode === code || body?.code === code;
}

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Production driver: one Deployment + Service (+ Secret holding the hydration token) per
 * user. The runtime container pulls the user's files from the API on start.
 */
export class KubernetesDriver implements RuntimeDriver {
  readonly name = "kubernetes";
  private apps: k8s.AppsV1Api;
  private core: k8s.CoreV1Api;

  constructor() {
    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();
    this.apps = kc.makeApiClient(k8s.AppsV1Api);
    this.core = kc.makeApiClient(k8s.CoreV1Api);
  }

  private async createOrIgnore(create: () => Promise<unknown>) {
    try {
      await create();
    } catch (err) {
      if (!isStatus(err, 409)) throw err;
    }
  }

  async spawn(session: Session): Promise<RuntimeStatus> {
    const current = await this.status(session.username);
    if (current !== "stopped") return current;

    const name = resourceName(session.username);
    const values = {
      NAME: name,
      USERNAME: session.username,
      NAMESPACE: namespace,
      IMAGE: config.kubernetes.runtimeImage,
      RUNTIME_PORT: String(config.runtimePort),
      API_URL: config.runtimeApiUrl,
      CLIENT_ORIGINS: config.clientOrigins.join(","),
      CPU_LIMIT: config.kubernetes.cpuLimit,
      MEMORY_LIMIT: config.kubernetes.memoryLimit,
    };

    // Fresh hydration token each spawn; replace any stale secret from an earlier session.
    await this.core.deleteNamespacedSecret({ name, namespace }).catch(() => {});
    await this.core.createNamespacedSecret({
      namespace,
      body: {
        metadata: { name, labels: { app: name, "nimbus/role": "workspace" } },
        stringData: { NIMBUS_HYDRATE_TOKEN: mintSnapshotToken(session, "24h") },
      },
    });

    const service = render("service.yaml", values);
    service.spec.ports.push(
      ...config.kubernetes.previewPorts.map((port) => ({
        name: `preview-${port}`,
        port,
        targetPort: port,
      }))
    );

    await this.createOrIgnore(() =>
      this.apps.createNamespacedDeployment({ namespace, body: render("deployment.yaml", values) })
    );
    await this.createOrIgnore(() => this.core.createNamespacedService({ namespace, body: service }));

    console.log(`🚀 Created workspace ${name} in namespace ${namespace}`);
    return "starting";
  }

  async stop(username: string): Promise<void> {
    const name = resourceName(username);
    await Promise.all([
      this.apps.deleteNamespacedDeployment({ name, namespace }).catch((err) => {
        if (!isStatus(err, 404)) throw err;
      }),
      this.core.deleteNamespacedService({ name, namespace }).catch((err) => {
        if (!isStatus(err, 404)) throw err;
      }),
      this.core.deleteNamespacedSecret({ name, namespace }).catch(() => {}),
    ]);
    console.log(`🗑️  Deleted workspace ${name}`);
  }

  async status(username: string): Promise<RuntimeStatus> {
    try {
      const deployment = await this.apps.readNamespacedDeployment({
        name: resourceName(username),
        namespace,
      });
      return (deployment.status?.readyReplicas ?? 0) > 0 ? "running" : "starting";
    } catch (err) {
      if (isStatus(err, 404)) return "stopped";
      throw err;
    }
  }

  target(username: string, port: number): string | null {
    if (port !== config.runtimePort && !config.kubernetes.previewPorts.includes(port)) return null;
    return `http://${resourceName(username)}.${namespace}.svc.cluster.local:${port}`;
  }
}
