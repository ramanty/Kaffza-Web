import re

path = '/home/ubuntu/Kaffza-Web/apps/api/src/modules/stores/stores.service.ts'
with open(path, 'r') as f:
    content = f.read()

# Remove the check in getMyStores
target_block = """  async getMyStores(user: { sub: string; role: string }) {
    if (!user?.sub) throw new ForbiddenException('غير مصرح');
    if (user.role !== 'merchant' && user.role !== 'admin')
      throw new ForbiddenException('فقط التاجر');"""

replacement_block = """  async getMyStores(user: { sub: string; role: string }) {
    if (!user?.sub) throw new ForbiddenException('غير مصرح');"""

content = content.replace(target_block, replacement_block)

with open(path, 'w') as f:
    f.write(content)
