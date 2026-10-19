#!/usr/bin/env bash
# Deploys Nimbus to an existing AKS cluster created with the app-routing add-on.
# Reads resource names from deploy/azure/.env (git-ignored). Safe to re-run.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
ENV_FILE="$HERE/.env"
# shellcheck disable=SC1090
source "$ENV_FILE"
TAG="${TAG:-v3}"

# Secrets are generated once and kept in the git-ignored .env so re-deploys keep sessions/data.
if [[ -z "${JWT_SECRET:-}" ]]; then
  echo "JWT_SECRET=$(openssl rand -hex 32)" >>"$ENV_FILE"
  echo "POSTGRES_PASSWORD=$(openssl rand -hex 16)" >>"$ENV_FILE"
  source "$ENV_FILE"
fi

echo "🔑 Fetching cluster credentials"
az aks get-credentials -g "$RG" -n "$AKS" --overwrite-existing -o none

echo "🌐 Waiting for the ingress public IP"
IP=""
for _ in $(seq 1 60); do
  IP="$(kubectl -n app-routing-system get svc nginx -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || true)"
  [[ -n "$IP" ]] && break
  sleep 5
done
[[ -n "$IP" ]] || { echo "❌ Ingress IP not assigned (is the app-routing add-on enabled?)"; exit 1; }
HOST="${HOST:-$IP.nip.io}"
ORIGIN="http://$HOST"
echo "   → $ORIGIN"

STORAGE_CONN="$(az storage account show-connection-string -g "$RG" -n "$STORAGE" --query connectionString -o tsv)"

kubectl apply -f "$ROOT/deploy/k8s/00-namespace.yaml"
kubectl -n nimbus create secret generic nimbus-secrets \
  --from-literal=JWT_SECRET="$JWT_SECRET" \
  --from-literal=POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
  --from-literal=DATABASE_URL="postgres://nimbus:$POSTGRES_PASSWORD@nimbus-postgres:5432/nimbus" \
  --from-literal=AZURE_STORAGE_CONNECTION_STRING="$STORAGE_CONN" \
  --from-literal=SMTP_USER="" --from-literal=SMTP_PASS="" \
  --dry-run=client -o yaml | kubectl apply -f -

# Render the generic manifests with Azure-specific values via a throwaway kustomization.
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
cp "$ROOT"/deploy/k8s/{10,20,30,40,50,60,70}-*.yaml "$WORK/"
cat >"$WORK/kustomization.yaml" <<EOF
resources:
  - 10-config.yaml
  - 20-postgres.yaml
  - 30-api.yaml
  - 40-orchestrator.yaml
  - 50-web.yaml
  - 60-ingress.yaml
  - 70-network-policies.yaml
images:
  - { name: ghcr.io/your-org/nimbus-api, newName: $ACR.azurecr.io/nimbus-api, newTag: $TAG }
  - { name: ghcr.io/your-org/nimbus-orchestrator, newName: $ACR.azurecr.io/nimbus-orchestrator, newTag: $TAG }
  - { name: ghcr.io/your-org/nimbus-web, newName: $ACR.azurecr.io/nimbus-web, newTag: $TAG }
patches:
  - target: { kind: ConfigMap, name: nimbus-config }
    patch: |
      - { op: replace, path: /data/FRONTEND_URL, value: "$ORIGIN" }
      - { op: replace, path: /data/CLIENT_ORIGINS, value: "$ORIGIN" }
      - { op: replace, path: /data/RUNTIME_IMAGE, value: "$ACR.azurecr.io/nimbus-runtime:$TAG" }
      - { op: replace, path: /data/REQUIRE_EMAIL_VERIFICATION, value: "false" }
      - { op: replace, path: /data/SECURE_COOKIES, value: "false" }
  - target: { kind: Ingress, name: nimbus }
    patch: |
      - { op: replace, path: /spec/ingressClassName, value: webapprouting.kubernetes.azure.com }
      - { op: replace, path: /spec/rules/0/host, value: "$HOST" }
  - target: { kind: Deployment, name: nimbus-web }
    patch: |
      - { op: replace, path: /spec/replicas, value: 1 }
EOF

echo "🚀 Applying manifests"
kubectl apply -k "$WORK"

# Config changes need a restart to be picked up by already-running pods.
kubectl -n nimbus rollout restart deployment/nimbus-api deployment/nimbus-orchestrator >/dev/null
for d in nimbus-postgres nimbus-api nimbus-orchestrator nimbus-web; do
  kubectl -n nimbus rollout status "deployment/$d" --timeout=300s
done

echo
echo "✅ Nimbus is live at $ORIGIN"
