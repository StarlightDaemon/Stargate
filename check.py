import psutil
for p in psutil.process_iter(['pid', 'name', 'cmdline', 'cwd']):
    if p.info['name'] == 'python.exe' and p.info['cmdline'] and '8000' in ' '.join(p.info['cmdline']):
        print(f"PID: {p.info['pid']}, CWD: {p.info['cwd']}, CMD: {' '.join(p.info['cmdline'])}")
