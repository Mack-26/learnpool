"""Azure Blob Storage wrapper. Falls back to local disk when no connection string is configured."""

import io
from datetime import datetime, timedelta, timezone
from pathlib import Path

from config import settings


def _use_azure() -> bool:
    return bool(settings.azure_storage_connection_string)


def upload_file(blob_name: str, data: bytes) -> None:
    if _use_azure():
        from azure.storage.blob import BlobServiceClient
        client = BlobServiceClient.from_connection_string(settings.azure_storage_connection_string)
        blob_client = client.get_blob_client(
            container=settings.azure_storage_container, blob=blob_name
        )
        blob_client.upload_blob(io.BytesIO(data), overwrite=True)
    else:
        local_dir = Path(__file__).resolve().parent.parent / "uploads"
        local_dir.mkdir(exist_ok=True)
        (local_dir / blob_name).write_bytes(data)


def get_download_url(blob_name: str, expiry_hours: int = 24) -> str:
    if _use_azure():
        from azure.storage.blob import BlobServiceClient, BlobSasPermissions, generate_blob_sas
        client = BlobServiceClient.from_connection_string(settings.azure_storage_connection_string)
        sas_token = generate_blob_sas(
            account_name=client.account_name,
            container_name=settings.azure_storage_container,
            blob_name=blob_name,
            account_key=client.credential.account_key,
            permission=BlobSasPermissions(read=True),
            expiry=datetime.now(timezone.utc) + timedelta(hours=expiry_hours),
        )
        return (
            f"https://{client.account_name}.blob.core.windows.net"
            f"/{settings.azure_storage_container}/{blob_name}?{sas_token}"
        )
    # Local fallback
    return f"/uploads/{blob_name}"
