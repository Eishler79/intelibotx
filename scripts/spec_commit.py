# scripts/spec_commit.py
import argparse, subprocess, sys, pathlib

MD_WHITELIST = {
    "ENDPOINTS_ANALYSIS.md",
    "DOCUMENTACION_ESTRATEGIAS_BOTS.md",
    "SMART_SCALPER_STRATEGY.md",
    "SMART_SCALPER_ANALYTICS_DETAILED.md",
    "DESIGN_SYSTEM_INTELIBOTX.md",
    "CONTEXTO_PLAN_3_FRENTES.md",
    "DEPLOYMENT_GUIDE.md",
    "README.md",
}

def run(cmd):
    return subprocess.run(cmd, text=True, check=True)

def main():
    p = argparse.ArgumentParser(description="Commit con Spec-Ref obligatorio")
    p.add_argument("-m","--message", required=True, help="Mensaje del commit")
    p.add_argument("-s","--spec", required=True, help="Spec-Ref ej: ARCHIVO.md#seccion")
    p.add_argument("--push", action="store_true", help="Hacer git push despues del commit")
    args = p.parse_args()

    spec = args.spec.strip()
    if "#" not in spec:
        print("❌ Spec-Ref debe incluir ancla de sección: ARCHIVO.md#seccion")
        sys.exit(1)

    md_file = spec.split("#")[0]
    if md_file not in MD_WHITELIST and not pathlib.Path(md_file).exists():
        print(f"❌ MD no encontrado/permitido: {md_file}")
        sys.exit(1)

    # Add files
    run(["git","add","-A"])

    # Correr guardián
    try:
        run(["python3","scripts/spec_guard.py"])
    except subprocess.CalledProcessError:
        print("❌ Spec Guard falló. Corrige los SPEC_REF en el código.")
        sys.exit(1)

    full_msg = f"{args.message}\n\nSpec-Ref: {spec}"
    run(["git","commit","-m", full_msg])

    if args.push:
        run(["git","push"])
    print("✅ Commit listo.", "Se hizo push." if args.push else "Sin push.")

if __name__ == "__main__":
    main()