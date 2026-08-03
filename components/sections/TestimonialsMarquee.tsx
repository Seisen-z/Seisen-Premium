'use client';

import { useEffect, useState } from 'react';
import { Star, Quote, Gamepad2 } from 'lucide-react';
import { TestimonialData } from '@/lib/testimonials';

function DiscordCount() {
  const [count, setCount] = useState<string>("3,000+");

  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch('https://discord.com/api/v9/invites/F4sAf6z8Ph?with_counts=true');
        const data = await res.json();
        if (data.approximate_member_count) {
          setCount(data.approximate_member_count.toLocaleString());
        }
      } catch (e) {
        console.error('Failed to fetch discord count', e);
      }
    }
    fetchCount();
  }, []);

  return <span>{count}</span>;
}

const MarqueeColumn = ({ reviews, reverse = false, speed = 40 }: { reviews: TestimonialData[], reverse?: boolean, speed?: number }) => {
    return (
        <div className="flex overflow-hidden relative w-full group">
             <div 
                className={`flex gap-6 animate-testimonial-marquee ${reverse ? 'flex-row-reverse' : ''}`}
                style={{ 
                    animationDuration: `${speed}s`,
                    animationDirection: reverse ? 'reverse' : 'normal'
                }}
             >
                {[...reviews, ...reviews].map((review, i) => (
                    <div 
                        key={i} 
                        className="flex-shrink-0 w-[350px] p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[#c9a97a]/30 transition-all duration-300 hover:bg-white/10 group-hover:[animation-play-state:paused]"
                    >
                        <div className="flex gap-1 mb-4">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                            ))}
                        </div>
                        
                        <p className="text-gray-300 mb-6 min-h-[48px] line-clamp-3 text-sm leading-relaxed">
                            "{review.content}"
                        </p>

                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 ring-2 ring-white/5">
                                        <img 
                                            src={review.avatar} 
                                            alt={review.author}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#c9a97a] rounded-full border-2 border-[#0a0a0a]" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white">{review.author}</p>
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                       <Gamepad2 className="w-3 h-3" /> {review.role}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
             </div>
        </div>
    );
}

export default function TestimonialsMarquee({ initialTestimonials }: { initialTestimonials: TestimonialData[] }) {
  const firstRow = initialTestimonials.slice(0, Math.ceil(initialTestimonials.length / 2));
  const secondRow = initialTestimonials.slice(Math.ceil(initialTestimonials.length / 2));

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-6 mb-16 text-center relative z-10">
        
        <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
          Loved by gamers <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c9a97a] to-[#9a7d58]">worldwide</span>
        </h2>
        
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Join <span className="text-white font-semibold"><DiscordCount /> users</span> who trust Seisen to accelerate their daily workflow
        </p>
      </div>

      <div className="flex flex-col gap-6 relative mask-linear-fade">
         <MarqueeColumn reviews={firstRow} speed={60} />
         <MarqueeColumn reviews={secondRow} reverse speed={70} />
      </div>
      
      <style jsx global>{`
        @keyframes testimonial-marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
        }
        .animate-testimonial-marquee {
            animation: testimonial-marquee linear infinite;
        }
        .mask-linear-fade {
            mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
            -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
        }
      `}</style>
    </section>
  );
}
