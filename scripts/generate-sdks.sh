#!/bin/bash
set -e

# AegisOS SDK Generation Pipeline
# Automatically generates SDKs across languages from the centralized OpenAPI contract.

OPENAPI_SPEC="docs/openapi-spec.json"
OUTPUT_DIR="dist/sdks"
GENERATOR_IMAGE="openapitools/openapi-generator-cli:latest"

echo "Initiating AegisOS SDK Generation..."

if [ ! -f "$OPENAPI_SPEC" ]; then
    echo "❌ Error: OpenAPI specification not found at $OPENAPI_SPEC"
    exit 1
fi

mkdir -p $OUTPUT_DIR

# 1. TypeScript Node
echo "Generating TypeScript SDK..."
docker run --rm -v "${PWD}:/local" $GENERATOR_IMAGE generate \
    -i /local/$OPENAPI_SPEC \
    -g typescript-node \
    -o /local/$OUTPUT_DIR/typescript \
    --additional-properties=supportsES6=true

# 2. Python
echo "Generating Python SDK..."
docker run --rm -v "${PWD}:/local" $GENERATOR_IMAGE generate \
    -i /local/$OPENAPI_SPEC \
    -g python \
    -o /local/$OUTPUT_DIR/python \
    --additional-properties=packageName=aegisos_sdk

# 3. Java
echo "Generating Java SDK..."
docker run --rm -v "${PWD}:/local" $GENERATOR_IMAGE generate \
    -i /local/$OPENAPI_SPEC \
    -g java \
    -o /local/$OUTPUT_DIR/java \
    --additional-properties=artifactId=aegisos-sdk,groupId=com.aegisos

# 4. .NET (C#)
echo "Generating .NET SDK..."
docker run --rm -v "${PWD}:/local" $GENERATOR_IMAGE generate \
    -i /local/$OPENAPI_SPEC \
    -g csharp \
    -o /local/$OUTPUT_DIR/dotnet \
    --additional-properties=packageName=AegisOS.SDK

echo "✅ SDK Generation Complete. Artifacts located in $OUTPUT_DIR"
