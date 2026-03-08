"""
=====================================================
GEOSURVEY PRO — Backend Python / Flask
Archivo: python/server.py

Instalación:
  pip install flask flask-cors python-dotenv

Ejecución:
  python python/server.py
  → http://localhost:5000

★ CAMBIAR: variables en el archivo .env
=====================================================
"""

import os, csv, json
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

# ── Carga de variables de entorno (.env opcional) ──
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

app = Flask(__name__)
CORS(app)

# ── Configuración ──────────────────────────────────
# ★ CAMBIAR en .env o directamente aquí
EMPRESA_NOMBRE = os.getenv('EMPRESA_NOMBRE', 'GeoSurvey Pro')   # ★
CORREO_DESTINO = os.getenv('CORREO_DESTINO', 'info@empresa.com') # ★ su correo real
SMTP_HOST      = os.getenv('SMTP_HOST',      'smtp.gmail.com')
SMTP_PORT      = int(os.getenv('SMTP_PORT',  '587'))
SMTP_USER      = os.getenv('SMTP_USER',      '')  # ★ correo remitente
SMTP_PASS      = os.getenv('SMTP_PASS',      '')  # ★ contraseña o app-password
ADMIN_TOKEN    = os.getenv('ADMIN_TOKEN',    'cambiar-este-token-secreto')  # ★

CSV_PATH       = os.path.join(os.path.dirname(__file__), 'contactos.csv')


# ── Helpers ────────────────────────────────────────
def guardar_csv(datos: dict) -> None:
    """Guarda cada contacto en un CSV local."""
    encabezados = ['fecha', 'nombre', 'empresa', 'email', 'telefono',
                   'servicio', 'ubicacion', 'area', 'mensaje']
    existe = os.path.isfile(CSV_PATH)
    with open(CSV_PATH, 'a', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=encabezados, extrasaction='ignore')
        if not existe:
            w.writeheader()
        w.writerow({'fecha': datetime.now().strftime('%Y-%m-%d %H:%M'), **datos})


def enviar_correos(datos: dict) -> None:
    """
    Envía notificación al equipo + confirmación al cliente.
    Solo funciona si SMTP_USER y SMTP_PASS están configurados.
    """
    if not SMTP_USER or not SMTP_PASS:
        print('[SMTP] Sin credenciales — correo no enviado')
        return

    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart

    try:
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10)
        server.ehlo()
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)

        # 1) Notificación interna
        msg1 = MIMEMultipart()
        msg1['From']    = SMTP_USER
        msg1['To']      = CORREO_DESTINO
        msg1['Subject'] = f'[{EMPRESA_NOMBRE}] Nuevo contacto: {datos.get("nombre","")}'
        cuerpo1 = '\n'.join([f'{k.capitalize()}: {v}' for k, v in datos.items()])
        msg1.attach(MIMEText(cuerpo1, 'plain', 'utf-8'))
        server.sendmail(SMTP_USER, CORREO_DESTINO, msg1.as_string())

        # 2) Confirmación al cliente
        email_cliente = datos.get('email', '')
        if email_cliente:
            msg2 = MIMEMultipart()
            msg2['From']    = SMTP_USER
            msg2['To']      = email_cliente
            msg2['Subject'] = f'Recibimos su solicitud — {EMPRESA_NOMBRE}'
            cuerpo2 = (
                f'Estimado/a {datos.get("nombre","")},\n\n'
                f'Hemos recibido su solicitud y nos pondremos en contacto en menos de 24 horas.\n\n'
                f'Servicio solicitado: {datos.get("servicio","No especificado")}\n\n'
                f'Gracias por confiar en {EMPRESA_NOMBRE}.\n'
            )
            msg2.attach(MIMEText(cuerpo2, 'plain', 'utf-8'))
            server.sendmail(SMTP_USER, email_cliente, msg2.as_string())

        server.quit()
        print('[SMTP] Correos enviados correctamente')

    except Exception as e:
        print(f'[SMTP] Error: {e}')


def validar(datos: dict) -> str | None:
    """Devuelve mensaje de error o None si todo es válido."""
    import re
    if not datos.get('nombre', '').strip():
        return 'El nombre es obligatorio.'
    email = datos.get('email', '').strip()
    if not email or not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
        return 'Correo electrónico inválido.'
    if not datos.get('mensaje', '').strip():
        return 'El mensaje es obligatorio.'
    return None


# ── Rutas / Endpoints ──────────────────────────────

@app.route('/api/health', methods=['GET'])
def health():
    """Verificación de estado del servidor."""
    return jsonify({'ok': True, 'empresa': EMPRESA_NOMBRE, 'hora': datetime.now().isoformat()})


@app.route('/api/contacto', methods=['POST'])
def contacto():
    """Recibe el formulario de contacto desde el frontend."""
    datos = request.get_json(silent=True)
    if not datos:
        return jsonify({'ok': False, 'error': 'Datos inválidos.'}), 400

    error = validar(datos)
    if error:
        return jsonify({'ok': False, 'error': error}), 422

    guardar_csv(datos)
    enviar_correos(datos)

    return jsonify({'ok': True, 'mensaje': 'Solicitud recibida. Le contactaremos pronto.'})


@app.route('/api/admin/contactos', methods=['GET'])
def admin_contactos():
    """
    Lista todos los contactos guardados.
    Requiere header: X-Admin-Token: <ADMIN_TOKEN>
    Ejemplo: curl -H "X-Admin-Token: mi-token" http://localhost:5000/api/admin/contactos
    """
    token = request.headers.get('X-Admin-Token', '')
    if token != ADMIN_TOKEN:
        return jsonify({'error': 'No autorizado.'}), 401

    if not os.path.isfile(CSV_PATH):
        return jsonify({'contactos': [], 'total': 0})

    contactos = []
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            contactos.append(row)

    return jsonify({'contactos': contactos, 'total': len(contactos)})


# ── Inicio ─────────────────────────────────────────
if __name__ == '__main__':
    print(f'\n🌐  {EMPRESA_NOMBRE} — Servidor Backend')
    print(f'📡  http://localhost:5000')
    print(f'📋  GET  /api/health')
    print(f'📬  POST /api/contacto')
    print(f'🔐  GET  /api/admin/contactos  (requiere X-Admin-Token)\n')
    app.run(debug=True, host='0.0.0.0', port=5000)
