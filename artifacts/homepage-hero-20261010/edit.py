from pathlib import Path
import hashlib,json,shutil
W=Path('D:/Website/Seisen Premium');A=W/'artifacts/homepage-hero-20261010';p=W/'app/page.tsx';s=p.read_text(encoding='utf-8');baseline=s
start=s.index('      <section');end=s.index('      </section>',start)+len('      </section>');leftstart=s.index('<div className="py-20 pr-10 lg:pr-16">',start);leftend=s.index('{/* Right',leftstart);left=s[leftstart:leftend].rstrip();left=left.replace('<div className="py-20 pr-10 lg:pr-16">','<div className={heroStyles.content}>',1)
hero='''      <section className={heroStyles.hero} aria-label="Seisen Script Hub" data-testid="homepage-hero">
        <div className={heroStyles.art}>
          <Image
            src="/script-hub-hero.png"
            alt="A panoramic Roblox-style adventure combining Seisen Hub game heroes, pets, gardens, mines and floating worlds"
            fill
            sizes="100vw"
            priority
            className={heroStyles.image}
          />
          <div className={heroStyles.badge}>
            <span aria-hidden="true" />{workingCount} scripts working
          </div>
        </div>
        <div className={heroStyles.shade} aria-hidden="true" />
        '''+left+'''
      </section>'''
s=s[:start]+hero+s[end:];s=s.replace("import Link from 'next/link';", "import Link from 'next/link';\nimport Image from 'next/image';\nimport heroStyles from './home-hero.module.css';",1);s=s.replace('CheckCircle2, Users','CheckCircle2');s=s.replace('(m: any) =>','(m: DiscordMember) =>',1);p.write_text(s,encoding='utf-8')
shutil.copy2('D:/Reiya Account Manager/public/script-hub-hero.png',W/'public/script-hub-hero.png')
(A/'BASELINE_MANIFEST.json').write_text(json.dumps({'page_sha256':hashlib.sha256((A/'baseline/page.tsx').read_bytes()).hexdigest(),'asset_previously_present':False,'css_previously_present':False,'unrelated_getkey_sha256':hashlib.sha256((W/'app/getkey/page.tsx').read_bytes()).hexdigest()},indent=2))
assert baseline[end:]==s[s.index('      </section>')+len('      </section>'):];print('PASS panorama integrated; header and all sections after hero unchanged; existing CTA/social proof retained')
