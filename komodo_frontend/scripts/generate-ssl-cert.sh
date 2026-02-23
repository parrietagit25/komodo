#!/bin/bash
# Genera un certificado autofirmado para HTTPS local (IP + localhost).
# Uso: ./scripts/generate-ssl-cert.sh [IP]
# Ejemplo: ./scripts/generate-ssl-cert.sh 10.10.2.115

set -e
IP="${1:-10.10.2.115}"
DIR="$(cd "$(dirname "$0")/.." && pwd)/certs"
mkdir -p "$DIR"
cd "$DIR"

openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes \
  -subj "/CN=$IP" \
  -addext "subjectAltName=IP:127.0.0.1,IP:$IP"

echo "Certificado generado en: $DIR"
echo "Valido para: 127.0.0.1 y $IP"
