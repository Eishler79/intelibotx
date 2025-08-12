# scripts/spec_guard.py
import os, re, subprocess, sys, pathlib

SPEC_TAG = re.compile(r'^\s*(#|//)\s*SPEC_REF:\s*(\S+)$')
CODE_EXT = (".py", ".ts", ".tsx", ".js", ".jsx")

# .MD estratégicos permitidos (ajústalo a tus archivos)
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

def changed_files():
    out = subprocess.check_output(
        ["git","diff","--cached","--name-only"], text=True
    ).splitlines()
    return [f for f in out if f.endswith(CODE_EXT)]

def check_file(f):
    diff = subprocess.check_output(
        ["git","diff","--cached","-U0", f], text=True, errors="ignore"
    )
    has_tag = False
    issues = []
    for line in diff.splitlines():
        if not line.startswith("+"): 
            continue
        m = SPEC_TAG.search(line[1:])
        if m:
            has_tag = True
            ref = m.group(2).strip()
            md_file = ref.split("#")[0]
            if md_file not in MD_WHITELIST and not pathlib.Path(md_file).exists():
                issues.append(f"{f}: MD no encontrado/permitido → {md_file}")
    if not has_tag:
        issues.append(f"{f}: Falta comentario SPEC_REF en líneas añadidas")
    return issues

def main():
    files = changed_files()
    if not files: 
        sys.exit(0)
    problems = []
    for f in files:
        problems += check_file(f)
    if problems:
        print("❌ Spec Guard: commit bloqueado.")
        for p in problems:
            print(" -", p)
        print("\nAñade un comentario en el código modificado, p.ej.:")
        print("// SPEC_REF: ENDPOINTS_ANALYSIS.md#persistencia-trading-ops")
        sys.exit(1)

if __name__ == "__main__":
    main()