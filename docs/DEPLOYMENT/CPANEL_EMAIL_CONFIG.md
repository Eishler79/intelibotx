# CPANEL EMAIL CONFIGURATION - Railway Variables

## Variables de entorno para Railway Production:

```bash
# cPanel SMTP Configuration - innova-consulting.net
SMTP_SERVER=mail.innova-consulting.net
SMTP_PORT=587
SMTP_USERNAME=info@innova-consulting.net
SMTP_PASSWORD=Info-innova2022+*
FROM_EMAIL=info@innova-consulting.net
FROM_NAME=InteliBotX
FRONTEND_URL=https://intelibotx.vercel.app

# Encryption Key (si no está configurada)
ENCRYPTION_MASTER_KEY=tu_encryption_key_32_characters
```

## Configuraciones alternativas a probar si falla:

### Opción 1: Puerto SSL 465
```bash
SMTP_SERVER=mail.innova-consulting.net
SMTP_PORT=465
# ... resto igual
```

### Opción 2: Servidor SMTP alternativo
```bash
SMTP_SERVER=smtp.innova-consulting.net
SMTP_PORT=587
# ... resto igual
```

### Opción 3: Puerto estándar 25
```bash
SMTP_SERVER=mail.innova-consulting.net
SMTP_PORT=25
# ... resto igual
```

## Como se verán los emails para usuarios:

- **From:** "InteliBotX <info@innova-consulting.net>"
- **Reply-to:** info@innova-consulting.net
- **Dominio:** innova-consulting.net (profesional)

## Test Commands (después de configuración):

```bash
# Test connection
curl -X POST https://intelibotx-production.up.railway.app/api/auth/test-email-connection

# Test verification email
curl -X POST https://intelibotx-production.up.railway.app/api/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email": "e1g1@hotmail.com"}'
```

## Ventajas:

- ✅ Dominio empresarial profesional
- ✅ Control total del servidor
- ✅ Sin límites de terceros
- ✅ Emails desde innova-consulting.net