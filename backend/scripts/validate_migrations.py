import sys
from pathlib import Path

from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory
from sqlalchemy.engine import Connection


PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

EXPECTED_HEAD = "c3d4e5f60011"


def migration_script() -> ScriptDirectory:
    config = Config(str(PROJECT_ROOT / "alembic.ini"))
    config.set_main_option("script_location", str(PROJECT_ROOT / "migrations"))
    return ScriptDirectory.from_config(config)


def validate_migration_graph() -> list[str]:
    script = migration_script()
    revisions = list(script.walk_revisions())
    revision_ids = {revision.revision for revision in revisions}

    for revision in revisions:
        parents = revision.down_revision
        if isinstance(parents, str):
            parents = (parents,)
        for parent in parents or ():
            if parent not in revision_ids:
                raise RuntimeError(
                    f"Migration {revision.revision} references missing parent {parent}."
                )

    heads = script.get_heads()
    if heads != [EXPECTED_HEAD]:
        raise RuntimeError(
            f"Expected one Alembic head {EXPECTED_HEAD}, found: {', '.join(heads) or 'none'}."
        )
    return heads


def validate_database_revisions(connection: Connection) -> None:
    current_revisions = MigrationContext.configure(connection).get_current_heads()
    if not current_revisions:
        return

    known_revisions = {
        revision.revision for revision in migration_script().walk_revisions()
    }
    missing_revisions = sorted(set(current_revisions) - known_revisions)
    if missing_revisions:
        missing = ", ".join(missing_revisions)
        raise RuntimeError(
            "The database's alembic_version table references revision(s) "
            f"{missing}, which are absent from the packaged migration history. "
            "Startup was stopped without changing the database. Restore the "
            "original migration file(s) or verify a schema-only backup before "
            "deploying; do not stamp or edit alembic_version to bypass this check."
        )


def main() -> None:
    heads = validate_migration_graph()
    revision_count = len(list(migration_script().walk_revisions()))
    print(f"Alembic graph validated: {revision_count} revisions; head {heads[0]}.")


if __name__ == "__main__":
    main()
