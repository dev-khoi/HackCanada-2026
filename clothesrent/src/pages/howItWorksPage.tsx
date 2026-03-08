import { useEffect, useRef } from "react";
import gsap from "gsap";

const STEPS = [
    {
        num: "01",
        title: "Browse & Discover",
        desc: "Skip the endless thrift-store digging. Our curated marketplace surfaces pieces that actually match your style, size, and vibe — so sustainable shopping finally feels personal.",
        icon: "◇",
    },
    {
        num: "02",
        title: "AI Wardrobe Match",
        desc: "Tell us the look you're going for and our AI stylist builds a complete outfit from real listings. Sustainable fashion, styled to you — not a random rack.",
        icon: "✦",
    },
    {
        num: "03",
        title: "Rent or Buy",
        desc: "Why pay full price for something you'll wear once? Rent the look, save the money, skip the waste. Or buy it outright if you're obsessed.",
        icon: "↗",
    },
    {
        num: "04",
        title: "Wear & Return",
        desc: "Rock it. Return it. Someone else gets to love it next. Great style doesn't have to end up in a landfill.",
        icon: "↻",
    },
];

const IMPACT_STATS = [
    { value: "92M", label: "tons of textile waste per year globally" },
    { value: "73%", label: "of clothing ends up in landfills" },
    { value: "1", label: "rental = ~3kg of CO₂ saved vs. buying new" },
];

export default function HowItWorksPage() {
    const stepsRef = useRef<HTMLDivElement>(null);
    const statsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (stepsRef.current) {
            const cards = stepsRef.current.querySelectorAll(".hiw-step");
            gsap.fromTo(
                cards,
                { y: 50, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.7,
                    stagger: 0.15,
                    ease: "power3.out",
                }
            );
        }

        if (statsRef.current) {
            const items = statsRef.current.querySelectorAll(".hiw-stat");
            gsap.fromTo(
                items,
                { y: 30, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.6,
                    stagger: 0.12,
                    delay: 0.5,
                    ease: "power2.out",
                }
            );
        }
    }, []);

    return (
        <main className="hiw-page">
            {/* Hero */}
            <section className="hiw-hero">
                <div className="section-eyebrow">How It Works</div>
                <h1 className="font-display hiw-title">
                    Sustainable, <em>with style</em>
                </h1>
                <p className="hiw-subtitle">
                    Thrift stores are everywhere — but finding pieces that match your
                    taste shouldn't take hours. Pfiffle makes secondhand personal,
                    stylish, and effortless, so you can save money and the planet
                    without sacrificing your look.
                </p>
            </section>

            {/* Steps */}
            <section className="hiw-steps" ref={stepsRef}>
                {STEPS.map((step) => (
                    <div key={step.num} className="hiw-step">
                        <div className="hiw-step-icon">{step.icon}</div>
                        <div className="hiw-step-num">{step.num}</div>
                        <h3 className="font-display hiw-step-title">{step.title}</h3>
                        <p className="hiw-step-desc">{step.desc}</p>
                    </div>
                ))}
            </section>

            {/* Connector line */}
            <div className="hiw-divider" />

            {/* Sustainability */}
            <section className="hiw-sustain">
                <div className="section-eyebrow">Why It Matters</div>
                <h2 className="font-display hiw-sustain-title">
                    Look good. <em>Do good.</em>
                </h2>
                <p className="hiw-sustain-copy">
                    Fast fashion is cheap, but the planet pays the real price. Thrift
                    is the answer — but scrolling through racks of random stuff hoping
                    to find your style? That's why people give up. We built Pfiffle
                    so that dressing sustainably is as easy (and stylish) as buying new.
                    AI-powered matching, real listings from real people, zero waste.
                </p>

                <div className="hiw-stats" ref={statsRef}>
                    {IMPACT_STATS.map((stat, i) => (
                        <div key={i} className="hiw-stat">
                            <div className="hiw-stat-value">{stat.value}</div>
                            <div className="hiw-stat-label">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="hiw-cta">
                <h2 className="font-display hiw-cta-title">Ready to start?</h2>
                <p className="hiw-cta-sub">
                    Discover what's near you or let AI style your next look.
                </p>
                <div className="hiw-cta-actions">
                    <a href="/shop" className="btn-primary">Browse Shop</a>
                    <a href="/outfit" className="btn-outline">AI Wardrobe</a>
                </div>
            </section>
        </main>
    );
}
