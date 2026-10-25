import pytest
from sqlalchemy import create_engine

from scripts.validate_migrations import (
    EXPECTED_HEAD,
    validate_database_revisions,
    validate_migration_graph,
)


def test_migration_graph_has_expected_single_head():
    assert validate_migration_graph() == [EXPECTED_HEAD]


def test_database_revision_preflight_rejects_unknown_revision():
    engine = create_engine("sqlite://")
    try:
        with engine.begin() as connection:
            connection.exec_driver_sql(
                "CREATE TABLE alembic_version (version_num VARCHAR(32) NOT NULL)"
            )
            connection.exec_driver_sql(
                "INSERT INTO alembic_version (version_num) VALUES ('unknown_rev_9999')"
            )
            with pytest.raises(RuntimeError, match="unknown_rev_9999"):
                validate_database_revisions(connection)
    finally:
        engine.dispose()


def test_database_revision_preflight_accepts_known_revision():
    engine = create_engine("sqlite://")
    try:
        with engine.begin() as connection:
            connection.exec_driver_sql(
                "CREATE TABLE alembic_version (version_num VARCHAR(32) NOT NULL)"
            )
            connection.exec_driver_sql(
                "INSERT INTO alembic_version (version_num) VALUES (?)",
                (EXPECTED_HEAD,),
            )
            validate_database_revisions(connection)
    finally:
        engine.dispose()
