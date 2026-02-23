# HTTPS local con certificado autofirmado

Para que el navegador no muestre "No seguro" en uso local (solo red interna):

1. **Generar el certificado** (en el servidor o en tu PC, una sola vez):
   ```bash
   chmod +x scripts/generate-ssl-cert.sh
   ./scripts/generate-ssl-cert.sh 10.10.2.115
   ```
   (Sustituye `10.10.2.115` por la IP de tu servidor si es distinta.)

2. **Configurar el frontend** para usar el proxy (misma origen = HTTPS sin contenido mixto).
   En `komodo_frontend/.env`:
   ```
   VITE_API_URL=/api
   ```
   Si el backend en el servidor no corre en 8001, añade:
   ```
   VITE_API_PROXY_TARGET=http://127.0.0.1:8001
   ```

3. **Arrancar el frontend:**
   ```bash
   npm run dev -- --host
   ```

4. **Entrar en el navegador:** `https://10.10.2.115:5173`  
   La primera vez el navegador avisará de que el certificado no es de confianza; en uso local puedes pulsar "Avanzado" → "Acceder igualmente".
