try:
    code = open('backend/main.py', 'r', encoding='utf-8', errors='replace').read()
    compile(code, 'main.py', 'exec')
    print('SYNTAX OK')
except SyntaxError as e:
    print(f'SYNTAX ERROR line {e.lineno}: {e.msg}')
    lines = code.splitlines()
    for i in range(max(0, e.lineno-2), min(len(lines), e.lineno+2)):
        print(f'  {i+1}: {lines[i][:120]}')
