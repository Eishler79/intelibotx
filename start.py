#!/usr/bin/env python3
import sys
import os

# Obtener la ruta absoluta del directorio intelibotx-api
script_dir = os.path.dirname(os.path.abspath(__file__))
api_dir = os.path.join(script_dir, 'intelibotx-api')

# Verificar que el directorio existe
if not os.path.exists(api_dir):
    print(f"Error: Directory {api_dir} does not exist")
    sys.exit(1)

# Agregar el directorio intelibotx-api al path de Python
sys.path.insert(0, api_dir)

# Cambiar al directorio de trabajo
os.chdir(api_dir)

# Importar directamente y ejecutar
try:
    import uvicorn
    from main import app
    
    port = int(os.environ.get("PORT", "8000"))
    print(f"Starting server on port {port}")
    print(f"Working directory: {os.getcwd()}")
    print(f"Python path: {sys.path[:3]}")
    
    uvicorn.run(app, host="0.0.0.0", port=port)
except ImportError as e:
    print(f"Import error: {e}")
    print(f"Current directory: {os.getcwd()}")
    print(f"Files in directory: {os.listdir('.')}")
    sys.exit(1)