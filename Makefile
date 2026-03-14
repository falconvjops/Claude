.PHONY: dev ingest test lint clean

dev:
	uvicorn src.api.main:app --reload --port 8000

ingest:
	@if [ -z "$(FILES)" ]; then echo "Usage: make ingest FILES='data/*.xlsx'"; exit 1; fi
	python scripts/ingest_excel.py $(FILES)

test:
	pytest tests/ -v --cov=src --cov-report=term-missing

lint:
	ruff check src/ tests/

clean:
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -name "*.pyc" -delete 2>/dev/null || true
