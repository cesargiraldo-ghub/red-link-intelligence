# RED Link Intelligence

Web app y webhook para detectar links de portales inmobiliarios que llegan por WhatsApp/GoHighLevel.

## Prueba local

```bash
cd ~/Downloads/red-link-intelligence
python3 -m http.server 4173
```

Abre:

```text
http://127.0.0.1:4173
```

## Webhook en Vercel

Despues de desplegar en Vercel, GoHighLevel debe llamar:

```text
https://TU-PROYECTO.vercel.app/api/webhook
```

O por empresa:

```text
https://TU-PROYECTO.vercel.app/api/webhook/empresa-token
```

Metodo: `POST`

Body recomendado:

```json
{
  "message": "{{message.body}}",
  "contact_name": "{{contact.name}}",
  "contact_phone": "{{contact.phone}}",
  "contact_email": "{{contact.email}}",
  "ghl_contact_id": "{{contact.id}}"
}
```

La respuesta incluye `respuesta_whatsapp`, que es el texto que puedes enviar al cliente por WhatsApp desde GoHighLevel.
