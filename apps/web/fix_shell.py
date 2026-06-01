import re

path = '/home/ubuntu/Kaffza-Web/apps/web/src/app/dashboard/shell.tsx'
with open(path, 'r') as f:
    content = f.read()

content = content.replace(", clearAuthCookiesClientSide", "")
content = content.replace("clearAuthCookiesClientSide();", "try { fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1') + '/auth/logout', { method: 'POST', headers: authHeader() }); } catch(e){}")

with open(path, 'w') as f:
    f.write(content)
