import sys

file_path = "apps/web/src/components/SiteTopBar.tsx"
with open(file_path, "r") as f:
    content = f.read()

old_block = """          {userState.loaded ? (
            userState.hasStore ? (
              <Button asChild className="rounded-full">
                <Link href={isEn ? '/en/dashboard' : '/dashboard'}>
                  {isEn ? 'Dashboard' : 'لوحة التحكم'}
                </Link>
              </Button>
            ) : userState.loggedIn ? (
              <Button asChild className="rounded-full">
                <Link href={isEn ? '/en/onboarding' : '/onboarding'}>
                  {isEn ? 'Open Your Store' : 'افتح متجرك'}
                </Link>
              </Button>
            ) : (
              <Button asChild className="rounded-full">
                <Link href={isEn ? '/en/merchant/login' : '/merchant/login'}>
                  {isEn ? 'Start Now' : 'ابدأ الآن'}
                </Link>
              </Button>
            )
          ) : (
            <div className="w-24 h-9 bg-muted animate-pulse rounded-full" />
          )}"""

new_block = """          {!mounted || !userState.loaded ? (
            <div className="w-24 h-9 bg-muted animate-pulse rounded-full" />
          ) : userState.hasStore ? (
            <Button asChild className="rounded-full">
              <Link href={isEn ? '/en/dashboard' : '/dashboard'}>
                {isEn ? 'Dashboard' : 'لوحة التحكم'}
              </Link>
            </Button>
          ) : userState.loggedIn ? (
            <Button asChild className="rounded-full">
              <Link href={isEn ? '/en/onboarding' : '/onboarding'}>
                {isEn ? 'Open Your Store' : 'افتح متجرك'}
              </Link>
            </Button>
          ) : (
            <Button asChild className="rounded-full">
              <Link href={isEn ? '/en/merchant/login' : '/merchant/login'}>
                {isEn ? 'Start Now' : 'ابدأ الآن'}
              </Link>
            </Button>
          )}"""

content = content.replace(old_block, new_block)

with open(file_path, "w") as f:
    f.write(content)
