import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('critical regressions', () => {
  const repoRoot = join(__dirname, '..', '..');

  it('uses store-scoped checkout payment endpoint in web checkout', () => {
    const content = readFileSync(join(repoRoot, 'apps/web/src/app/store/[subdomain]/checkout/page.tsx'), 'utf8');
    expect(content).toContain('/stores/${_storeId}/payments/create-session');
  });

  it('keeps legal english DOCX files in docs/legal', () => {
    expect(existsSync(join(repoRoot, 'docs/legal/terms-en.docx'))).toBe(true);
    expect(existsSync(join(repoRoot, 'docs/legal/privacy-en.docx'))).toBe(true);
  });

  it('keeps production deployment files in repository', () => {
    expect(existsSync(join(repoRoot, 'nginx.conf'))).toBe(true);
    expect(existsSync(join(repoRoot, 'production/docker-compose.yml'))).toBe(true);
    expect(existsSync(join(repoRoot, 'ssl_one_shot.sh'))).toBe(true);
    expect(existsSync(join(repoRoot, '.env.production.example'))).toBe(true);
  });

  it('documents current plan prices consistently in README', () => {
    const readme = readFileSync(join(repoRoot, 'README.md'), 'utf8');
    expect(readme).toContain('8 ر.ع');
    expect(readme).toContain('35 ر.ع');
    expect(readme).not.toContain('25 ر.ع');
    expect(readme).not.toContain('75 ر.ع');
  });
});
