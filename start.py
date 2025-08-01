#!/usr/bin/env python3
import sys
import os
import subprocess

# Cambiar al directorio intelibotx-api y ejecutar uvicorn
api_dir = os.path.join(os.path.dirname(__file__), 'intelibotx-api')
os.chdir(api_dir)

port = os.environ.get("PORT", "8000")
cmd = [sys.executable, "-m", "uvicorn", "main:app", "--host=0.0.0.0", f"--port={port}"]

subprocess.run(cmd)