#!/usr/bin/env bash
# Applies the Nimbus manifests to the current kubectl context.
# Usage: ./deploy/deploy.sh           (run from the repo root)
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/k8s" && pwd)"

if [[ ! -f "$DIR/11-secrets.yaml" ]]; then
  echo "❌ $DIR/11-secrets.yaml not found."
  echo "   Copy 11-secrets.example.yaml to 11-secrets.yaml and fill in real values first."
  exit 1
fi

echo "☁️  Deploying Nimbus to context: $(kubectl config current-context)"

kubectl apply -f "$DIR/00-namespace.yaml"
kubectl apply -f "$DIR/10-config.yaml" -f "$DIR/11-secrets.yaml"
kubectl apply -f "$DIR/20-postgres.yaml"
kubectl -n nimbus rollout status deployment/nimbus-postgres --timeout=180s

kubectl apply -f "$DIR/30-api.yaml" -f "$DIR/40-orchestrator.yaml" -f "$DIR/50-web.yaml"
kubectl apply -f "$DIR/60-ingress.yaml" -f "$DIR/70-network-policies.yaml"

for deployment in nimbus-api nimbus-orchestrator nimbus-web; do
  kubectl -n nimbus rollout status "deployment/$deployment" --timeout=180s
done

echo
kubectl -n nimbus get pods,svc,ingress
echo
echo "✅ Nimbus deployed."
