#!/usr/bin/env bash
# Deletes EVERYTHING Nimbus created in Azure (cluster, registry, storage, IPs, disks).
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1090
source "$HERE/.env"

read -r -p "Permanently delete resource group '$RG' and all its resources? [y/N] " answer
[[ "$answer" == "y" || "$answer" == "Y" ]] || { echo "Cancelled."; exit 0; }

# The AKS-managed node resource group (MC_*) is removed automatically with the cluster.
az group delete -n "$RG" --yes --no-wait
kubectl config delete-context "$AKS" >/dev/null 2>&1 || true
echo "🗑️  Deletion started — it finishes in the background in ~5–10 minutes."
