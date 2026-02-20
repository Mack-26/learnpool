"""Extract text from uploaded files (PDF, TXT, DOCX)."""

from pathlib import Path

ALLOWED_EXTENSIONS = {".pdf", ".txt", ".docx"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


def extract_text_from_file(file_path: Path, filename: str) -> str:
    """Extract text from a file. Raises ValueError for unsupported types or extraction errors."""
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"Unsupported file type: {ext}. Use .pdf, .txt, or .docx")

    if ext == ".txt":
        return _extract_txt(file_path)
    if ext == ".pdf":
        return _extract_pdf(file_path)
    if ext == ".docx":
        return _extract_docx(file_path)
    raise ValueError(f"Unsupported file type: {ext}")


def _extract_txt(path: Path) -> str:
    content = path.read_text(encoding="utf-8", errors="replace")
    return content.strip()


def _extract_pdf(path: Path) -> str:
    from pypdf import PdfReader

    reader = PdfReader(str(path))
    parts = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            parts.append(text)
    return "\n\n".join(parts).strip()


def _extract_docx(path: Path) -> str:
    from docx import Document

    doc = Document(str(path))
    parts = []
    for para in doc.paragraphs:
        if para.text.strip():
            parts.append(para.text)
    return "\n\n".join(parts).strip()
