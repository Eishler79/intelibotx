# Políticas de terminal para Claude

- Siempre solicitar confirmación antes de ejecutar `rm`, `mv`, `chmod`, `chown`, `curl | sh`, `pip install -U` global.
- Nunca ejecutar comandos fuera de `~/Dev/intelibotx`.
- Usar `rsync -av` para copiar plantillas sin sobreescribir secretos locales.
- Mostrar `git diff` previo a refactors grandes.
