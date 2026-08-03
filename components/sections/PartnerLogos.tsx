'use client';

import { useState } from 'react';

const partners = [
  { name: 'Work.ink',    url: 'https://work.ink',                         image: '/images/partners/workink.webp' },
  { name: 'Lockr.so',   url: 'https://lockr.so',                          image: '/images/partners/lockr.webp'  },
  { name: 'PayPal',     url: 'https://www.paypal.com',                    image: '/images/partners/paypal.png'   },
  { name: 'Junkie',     url: 'https://junkie-development.de/',            image: '/images/partners/junkie.webp'  },
  { name: 'Prometheus', url: 'https://github.com/levno-710/Prometheus',   icon:  '🔥'                            },
  { name: 'VSPhone',    url: 'https://www.vsphone.com/',                  image: '/images/partners/vsphone.png', fallbackIcon: '🎮' },
];

function PartnerItem({ partner }: { partner: typeof partners[number] }) {
  const [imgError, setImgError] = useState(false);

  const showImage = 'image' in partner && partner.image && !imgError;

  return (
    <a
      href={partner.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex-shrink-0 flex items-center justify-center grayscale hover:grayscale-0 opacity-40 hover:opacity-90 transition-all duration-300"
      title={partner.name}
    >
      {showImage ? (
        <div className="relative h-10 w-32 md:h-12 md:w-40">
          <img
            src={(partner as any).image}
            alt={partner.name}
            className="w-full h-full object-contain"
            onError={() => setImgError(true)}
          />
        </div>
      ) : (
        <div className="flex items-center gap-2 font-bold text-white" style={{ fontSize: '1.1rem' }}>
          {'fallbackIcon' in partner && partner.fallbackIcon
            ? <><span className="text-xl">{partner.fallbackIcon}</span><span>{partner.name}</span></>
            : <><span className="text-xl">{'icon' in partner ? partner.icon : ''}</span><span>{partner.name}</span></>
          }
        </div>
      )}
    </a>
  );
}

export default function PartnerLogos() {
  return (
    <section className="py-10" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="px-6">
        <div className="flex flex-nowrap items-center justify-center gap-8 md:gap-10 overflow-x-auto scrollbar-none">
          {partners.map(p => <PartnerItem key={p.name} partner={p} />)}
        </div>
      </div>
    </section>
  );
}
