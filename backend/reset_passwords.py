#!/usr/bin/env python
"""Resetear contraseña de usuarios."""

from auth_utils import hash_password
from database import SessionLocal, User

db = SessionLocal()

# Resetear contraseña de admin a "admin"
admin = db.query(User).filter(User.username == 'admin').first()
if admin:
    admin.password_hash = hash_password('admin')
    db.commit()
    print('✓ Contraseña de admin reseteada a: admin')
else:
    print('✗ Usuario admin no encontrado')

# Resetear contraseña de prestador1 a "prestador1"
prestador = db.query(User).filter(User.username == 'prestador1').first()
if prestador:
    prestador.password_hash = hash_password('prestador1')
    db.commit()
    print('✓ Contraseña de prestador1 reseteada a: prestador1')
else:
    print('✗ Usuario prestador1 no encontrado')

print('\nCredenciales listas:')
print('  - admin / admin')
print('  - prestador1 / prestador1')

db.close()
