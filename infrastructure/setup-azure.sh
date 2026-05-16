#!/usr/bin/env bash
# Vibe Learning — Azure infrastructure provisioning
# Run once: bash infrastructure/setup-azure.sh
# Prerequisites: az CLI installed and logged in (az login)

set -euo pipefail

# ── Configuration ────────────────────────────────────────────────────────────
RG="vibelearning-rg"
LOCATION="canadacentral"
ACR_NAME="vibelearningacr"
CAE_NAME="vibelearning-env"
CA_NAME="vibelearning-api"
SWA_NAME="vibelearning-web"
GITHUB_REPO="Mack-26/learnpool"
DB_ADMIN="vibeadmin"

# Random suffix for globally-unique resource names
SUFFIX=$(python3 -c "import secrets; print(secrets.token_hex(3))")
PG_SERVER="vibelearningdb${SUFFIX}"
STORAGE_ACCOUNT="vibestore${SUFFIX}"
CONTAINER_NAME="documents"

echo "=========================================="
echo " Vibe Learning Azure Setup"
echo "=========================================="
echo "Resource Group : $RG"
echo "Location       : $LOCATION"
echo "ACR            : $ACR_NAME"
echo "PostgreSQL     : $PG_SERVER (Flexible Server)"
echo "Storage        : $STORAGE_ACCOUNT"
echo ""
echo "Press Enter to continue or Ctrl-C to abort..."
read -r

# ── 1. Resource Group ─────────────────────────────────────────────────────────
echo "[1/8] Creating resource group..."
az group create --name "$RG" --location "$LOCATION" --output none

# ── 2. Container Registry ─────────────────────────────────────────────────────
echo "[2/8] Creating Azure Container Registry..."
az acr create \
  --resource-group "$RG" \
  --name "$ACR_NAME" \
  --sku Basic \
  --admin-enabled true \
  --output none

ACR_SERVER=$(az acr show --name "$ACR_NAME" --resource-group "$RG" --query loginServer -o tsv)
ACR_USER=$(az acr credential show --name "$ACR_NAME" --resource-group "$RG" --query username -o tsv)
ACR_PASS=$(az acr credential show --name "$ACR_NAME" --resource-group "$RG" --query "passwords[0].value" -o tsv)
echo "  ACR server: $ACR_SERVER"

# ── 3. PostgreSQL Flexible Server ─────────────────────────────────────────────
echo "[3/8] Creating PostgreSQL Flexible Server (this takes ~5 min)..."
PG_PASS=$(python3 -c "import secrets, string; a=string.ascii_letters+string.digits; print(''.join(secrets.choice(a) for _ in range(24)))")

az postgres flexible-server create \
  --resource-group "$RG" \
  --name "$PG_SERVER" \
  --location "$LOCATION" \
  --admin-user "$DB_ADMIN" \
  --admin-password "$PG_PASS" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 16 \
  --output none

# Allow all Azure services (0.0.0.0 is the special Azure sentinel value)
az postgres flexible-server firewall-rule create \
  --resource-group "$RG" \
  --name "$PG_SERVER" \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0 \
  --output none

# Allow this machine so we can run migrations
MY_IP=$(curl -s https://api.ipify.org 2>/dev/null || echo "")
if [[ -n "$MY_IP" ]]; then
  az postgres flexible-server firewall-rule create \
    --resource-group "$RG" \
    --name "$PG_SERVER" \
    --rule-name AllowSetupMachine \
    --start-ip-address "$MY_IP" \
    --end-ip-address "$MY_IP" \
    --output none
  echo "  Firewall: Azure services + your IP ($MY_IP) allowed"
fi

# Create the app database
az postgres flexible-server db create \
  --resource-group "$RG" \
  --server-name "$PG_SERVER" \
  --database-name vibelearning \
  --output none

# Enable pgvector
az postgres flexible-server parameter set \
  --resource-group "$RG" \
  --server-name "$PG_SERVER" \
  --name azure.extensions \
  --value vector \
  --output none

DB_URL="postgresql://${DB_ADMIN}:${PG_PASS}@${PG_SERVER}.postgres.database.azure.com/vibelearning?sslmode=require"
echo "  PostgreSQL ready: $PG_SERVER.postgres.database.azure.com"

# ── 4. Blob Storage ───────────────────────────────────────────────────────────
echo "[4/8] Creating Storage Account..."
az storage account create \
  --resource-group "$RG" \
  --name "$STORAGE_ACCOUNT" \
  --location "$LOCATION" \
  --sku Standard_LRS \
  --kind StorageV2 \
  --allow-blob-public-access false \
  --output none

az storage container create \
  --account-name "$STORAGE_ACCOUNT" \
  --name "$CONTAINER_NAME" \
  --public-access off \
  --output none

STORAGE_CONN=$(az storage account show-connection-string \
  --resource-group "$RG" \
  --name "$STORAGE_ACCOUNT" \
  --query connectionString -o tsv)
echo "  Storage account: $STORAGE_ACCOUNT"

# ── 5. Initial Docker build + push ────────────────────────────────────────────
echo "[5/8] Building and pushing initial Docker image to ACR..."
az acr build \
  --registry "$ACR_NAME" \
  --image "vibelearning-api:latest" \
  --file Dockerfile \
  . \
  --output none

# ── 6. Container Apps ─────────────────────────────────────────────────────────
echo "[6/8] Creating Container Apps environment and app..."
az containerapp env create \
  --name "$CAE_NAME" \
  --resource-group "$RG" \
  --location "$LOCATION" \
  --output none

JWT_SECRET=$(python3 -c "import secrets, string; a=string.ascii_letters+string.digits; print(''.join(secrets.choice(a) for _ in range(48)))")

echo "  NOTE: You will be prompted for your OPENAI_API_KEY..."
read -rp "  OPENAI_API_KEY: " OPENAI_KEY

az containerapp create \
  --name "$CA_NAME" \
  --resource-group "$RG" \
  --environment "$CAE_NAME" \
  --image "${ACR_SERVER}/vibelearning-api:latest" \
  --registry-server "$ACR_SERVER" \
  --registry-username "$ACR_USER" \
  --registry-password "$ACR_PASS" \
  --target-port 8000 \
  --ingress external \
  --min-replicas 0 \
  --max-replicas 3 \
  --cpu 0.5 \
  --memory 1.0Gi \
  --secrets \
    "db-url=${DB_URL}" \
    "jwt-secret=${JWT_SECRET}" \
    "openai-key=${OPENAI_KEY}" \
    "storage-conn=${STORAGE_CONN}" \
  --env-vars \
    "DATABASE_URL=secretref:db-url" \
    "JWT_SECRET=secretref:jwt-secret" \
    "OPENAI_API_KEY=secretref:openai-key" \
    "AZURE_STORAGE_CONNECTION_STRING=secretref:storage-conn" \
    "AZURE_STORAGE_CONTAINER=documents" \
    "ALLOWED_ORIGINS=http://localhost:5173" \
  --output none

CA_URL=$(az containerapp show \
  --name "$CA_NAME" \
  --resource-group "$RG" \
  --query properties.configuration.ingress.fqdn -o tsv)
echo "  Container App URL: https://${CA_URL}"

# ── 7. Static Web App ─────────────────────────────────────────────────────────
echo "[7/8] Creating Azure Static Web App..."
az staticwebapp create \
  --name "$SWA_NAME" \
  --resource-group "$RG" \
  --location "eastus2" \
  --source "https://github.com/${GITHUB_REPO}" \
  --branch main \
  --app-location frontend \
  --output-location dist \
  --login-with-github \
  --output none

SWA_URL=$(az staticwebapp show \
  --name "$SWA_NAME" \
  --resource-group "$RG" \
  --query defaultHostname -o tsv)
SWA_TOKEN=$(az staticwebapp secrets list \
  --name "$SWA_NAME" \
  --resource-group "$RG" \
  --query properties.apiKey -o tsv)
echo "  Static Web App URL: https://${SWA_URL}"

# Update ALLOWED_ORIGINS now that we know the real SWA URL
az containerapp update \
  --name "$CA_NAME" \
  --resource-group "$RG" \
  --set-env-vars "ALLOWED_ORIGINS=https://${SWA_URL}" \
  --output none

# ── 8. Service Principal for GitHub Actions ───────────────────────────────────
echo "[8/8] Creating service principal for GitHub Actions..."
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
SP_JSON=$(az ad sp create-for-rbac \
  --name "vibelearning-github-actions" \
  --role contributor \
  --scopes "/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RG}" \
  --sdk-auth)

# ── Output summary ────────────────────────────────────────────────────────────
echo ""
echo "=========================================="
echo " SETUP COMPLETE — Save these values!"
echo "=========================================="
echo ""
echo "GitHub Secrets to add at:"
echo "https://github.com/${GITHUB_REPO}/settings/secrets/actions"
echo ""
echo "Secret: AZURE_CREDENTIALS"
echo "$SP_JSON"
echo ""
echo "Secret: ACR_LOGIN_SERVER"
echo "$ACR_SERVER"
echo ""
echo "Secret: ACR_USERNAME"
echo "$ACR_USER"
echo ""
echo "Secret: ACR_PASSWORD"
echo "$ACR_PASS"
echo ""
echo "Secret: AZURE_RESOURCE_GROUP"
echo "$RG"
echo ""
echo "Secret: CONTAINER_APP_NAME"
echo "$CA_NAME"
echo ""
echo "Secret: AZURE_STATIC_WEB_APPS_API_TOKEN"
echo "$SWA_TOKEN"
echo ""
echo "Secret: VITE_API_BASE_URL"
echo "https://${CA_URL}"
echo ""
echo "==========================================="
echo "DB connection string (for running migrations):"
echo "$DB_URL"
echo ""
echo "Next steps:"
echo "  1. Add all secrets above to GitHub"
echo "  2. Install psql if needed: brew install libpq && brew link --force libpq"
echo "  3. Apply DB migrations:"
echo "     for f in db/migrations/*.sql; do psql '${DB_URL}' -f \"\$f\"; done"
echo "  4. Push to main — CI/CD deploys automatically"
echo "==========================================="
