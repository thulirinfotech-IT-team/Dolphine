import React from "react";

export default function About() {
  return (
    <div className="page">
      <div className="about-page">
        {/* Hero Section */}
        <div className="about-hero">
          <h1>About Dolphin Naturals</h1>
          <p className="about-tagline">
            Bringing the purity of nature to your skincare routine
          </p>
        </div>

        {/* Our Story */}
        <section className="about-section">
          <div className="about-content">
            <div className="about-text">
              <h2>Our Story</h2>
              <p>
                Founded with a passion for natural wellness, Dolphin Naturals was born from the belief
                that skincare should be both effective and pure. We combine the healing power of ocean
                minerals with time-tested herbal ingredients to create products that nourish your skin
                naturally.
              </p>
              <p>
                Every product we craft is a testament to our commitment to quality, sustainability, and
                the remarkable benefits of nature's finest ingredients. From the depths of the ocean to
                ancient botanical wisdom, we source only the best for your skin.
              </p>
            </div>
            <div className="about-image">
              <img
                src="https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&h=400&fit=crop"
                alt="Natural ingredients"
              />
            </div>
          </div>
        </section>

        {/* Our Values */}
        <section className="about-section values-section">
          <h2>Our Values</h2>
          <div className="values-grid">
            <div className="value-card">
              <div className="value-icon">🌿</div>
              <h3>100% Natural</h3>
              <p>
                We use only pure, natural ingredients sourced from trusted suppliers.
                No harsh chemicals, no synthetic fragrances, just nature's best.
              </p>
            </div>
            <div className="value-card">
              <div className="value-icon">🌊</div>
              <h3>Ocean Minerals</h3>
              <p>
                Harnessing the power of ocean minerals known for their rejuvenating
                and healing properties to enhance your skin's natural glow.
              </p>
            </div>
            <div className="value-card">
              <div className="value-icon">♻️</div>
              <h3>Sustainable</h3>
              <p>
                Committed to eco-friendly practices, from sourcing to packaging.
                We care for your skin and our planet.
              </p>
            </div>
            <div className="value-card">
              <div className="value-icon">🔬</div>
              <h3>Science-Backed</h3>
              <p>
                Our formulations are developed with research and care, ensuring
                each product delivers real, visible results.
              </p>
            </div>
          </div>
        </section>

        {/* Our Mission */}
        <section className="about-section mission-section">
          <div className="mission-content">
            <h2>Our Mission</h2>
            <p>
              To empower individuals to embrace natural beauty through high-quality,
              sustainably-sourced skincare products. We believe that true beauty comes
              from healthy, nourished skin, and that the best ingredients come from nature.
            </p>
            <p>
              We're dedicated to transparency, quality, and making natural skincare
              accessible to everyone who values purity and effectiveness.
            </p>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="about-section">
          <h2>Why Choose Dolphin Naturals?</h2>
          <div className="features-list">
            <div className="feature-item">
              <span className="feature-check">✓</span>
              <div>
                <h4>Certified Organic Ingredients</h4>
                <p>All our ingredients are certified organic and ethically sourced</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-check">✓</span>
              <div>
                <h4>Cruelty-Free</h4>
                <p>Never tested on animals - we're proud to be 100% cruelty-free</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-check">✓</span>
              <div>
                <h4>Eco-Friendly Packaging</h4>
                <p>Recyclable and biodegradable packaging to minimize environmental impact</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-check">✓</span>
              <div>
                <h4>Handcrafted Quality</h4>
                <p>Each batch is carefully crafted with attention to detail and quality</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
