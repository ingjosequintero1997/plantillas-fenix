import sys
sys.path.insert(0, 'backend')
sys.path.insert(0, '.')
try:
    from backend.main import app
    print('IMPORT OK')
except Exception as e:
    print(f'IMPORT ERROR: {type(e).__name__}: {e}')
