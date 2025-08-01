#!/bin/bash

echo "🧰 Configurando entorno para el proyecto FastAPI Binance con Python 3.12.3"

# Verifica si pyenv está instalado
if ! command -v pyenv &> /dev/null
then
    echo "❌ pyenv no está instalado. Por favor instálalo primero: https://github.com/pyenv/pyenv"
    exit 1
fi

# Instala Python 3.12.3 si no está ya disponible
if ! pyenv versions --bare | grep -q "3.12.3"; then
    echo "📦 Instalando Python 3.12.3..."
    pyenv install 3.12.3
fi

# Establecer Python 3.12.3 como local para el proyecto
pyenv local 3.12.3

# Crear entorno virtual con venv si no existe
if [ ! -d ".venv" ]; then
    echo "🔧 Creando entorno virtual .venv..."
    python -m venv .venv
fi

# Activar entorno virtual
source .venv/bin/activate

# Actualizar pip y wheel
pip install --upgrade pip wheel

# Instalar dependencias del proyecto
echo "📦 Instalando dependencias..."
pip install -r requirements.txt

echo "✅ Entorno configurado correctamente con Python 3.12.3"