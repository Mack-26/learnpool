.PHONY: db-up db-down db-reset db-shell db-seed db-clear-history db-logs

# Start PostgreSQL (with pgvector). Schema in db/migrations/ runs automatically
# on the first start via docker-entrypoint-initdb.d.
db-up:
	docker compose up -d db
	@echo ""
	@echo "  Database starting. Give it ~5 seconds, then:"
	@echo "    make db-shell   — open a psql prompt"
	@echo "    make db-seed    — load development data"
	@echo ""

# Stop the container (data volume is preserved).
db-down:
	docker compose down

# Wipe the data volume and restart with a clean schema.
# Use this when you add a new migration and need a fresh state.
db-reset:
	@echo "Resetting database — all data will be lost..."
	docker compose down -v
	docker compose up -d db
	@echo "Done. Run 'make db-seed' to reload development data."

# Open an interactive psql session inside the running container.
db-shell:
	docker compose exec db psql -U learnpool -d learnpool

# Load development seed data (professors, students, sample course, Q&A).
# Safe to re-run — truncates tables first.
db-seed:
	@echo "Loading seed data..."
	docker compose exec -T db psql -U learnpool -d learnpool < db/seed.sql

# Clear lecture/chat history (questions, answers, citations, feedback).
db-clear-history:
	@echo "Clearing lecture history..."
	docker compose exec -T db psql -U learnpool -d learnpool < db/scripts/clear_lecture_history.sql
	@echo "Done."

# Tail the database container logs.
db-logs:
	docker compose logs -f db
