#!/bin/bash
set -e

# AegisOS Universal Deployment Executable
# This script wraps all certified deployment profiles into a single entrypoint.

PROFILE=$1

if [ -z "$PROFILE" ]; then
    echo "Usage: ./deploy.sh [profile]"
    echo "Available Profiles: dev, team, enterprise, airgapped, gpu"
    exit 1
fi

echo "Initiating AegisOS Deployment Profile: $PROFILE"

case "$PROFILE" in
    dev)
        echo "Validating infrastructure..."
        npx ts-node src/platform/cli/aegis-verify-infra.ts
        echo "Starting Developer Workstation profile..."
        docker-compose -f docker-compose.yml up -d
        ;;
    team)
        echo "Starting Small Team profile (Docker Swarm)..."
        docker stack deploy -c docker-compose.prod.yml aegis_team
        ;;
    enterprise)
        echo "Starting Enterprise profile (Kubernetes)..."
        kubectl apply -k k8s/overlays/production
        ;;
    airgapped)
        echo "Starting Air-Gapped profile..."
        # Air-gapped requires loading images from a local tar archive first
        docker load -i /media/usb/aegis-images.tar
        kubectl apply -k k8s/overlays/airgapped
        ;;
    gpu)
        echo "Starting GPU Workstation profile..."
        docker-compose -f docker-compose.yml -f docker-compose.gpu.yml up -d
        ;;
    *)
        echo "❌ Invalid profile: $PROFILE"
        exit 1
        ;;
esac

echo "✅ Deployment initiated. Awaiting health checks..."
# Wait for core API to become healthy
until $(curl --output /dev/null --silent --head --fail http://localhost:8080/health); do
    printf '.'
    sleep 2
done

echo -e "\n✅ AegisOS successfully deployed and operational."
