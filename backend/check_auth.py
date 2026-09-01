#!/usr/bin/env python
"""Verificar credenciales de usuarios en la BD."""

from auth_utils import verify_credentials
from database import SessionLocal, User

db = SessionLocal()
admin = db.query(User).filter(User.username == 'admin').first()

if admin:
    print('Usuario admin encontrado')
    print(f'  - Username: {admin.username}')
    print(f'  - Password hash: {admin.password_hash[:50]}...')
    
    # Intentar verificar con contraseña 'admin'
    if verify_credentials('admin', 'admin'):
        print('  OK: Contraseña admin es VALIDA')
    else:
        print('  ERROR: Contraseña admin NO es valida')
else:
    print('Usuario admin no encontrado')

# Listar todos los usuarios
print('\nTodos los usuarios en BD:')
users = db.query(User).all()
for u in users:
    print(f'  - {u.username} ({u.role})')

db.close()
