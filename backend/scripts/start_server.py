"""Container entry point: migrate the database, then serve API and frontend."""
import os
import subprocess
import sys

subprocess.run([sys.executable, '-m', 'alembic', 'upgrade', 'head'], check=True)
os.execvp(sys.executable, [
    sys.executable, '-m', 'uvicorn', 'app.main:app',
    '--host', '0.0.0.0', '--port', os.getenv('PORT', '8000'), '--workers', '1',
])
