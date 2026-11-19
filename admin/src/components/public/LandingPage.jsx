import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Truck,
  Smartphone,
  Download,
  CheckCircle2,
  Star,
  MapPin,
  Phone,
  Mail,
  Clock,
  ArrowRight,
  Lock,
  Menu,
  X,
  ChevronDown,
  Award,
  Heart,
  Package,
  ExternalLink,
  ShieldAlert,
  Send,
  Check,
  CreditCard,
  QrCode
} from 'lucide-react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: ''
  });
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) return;
    setContactSubmitted(true);
    setTimeout(() => {
      setContactForm({
        name: '',
        email: '',
        phone: '',
        subject: 'General Inquiry',
        message: ''
      });
    }, 1000);
  };

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const faqs = [
    {
      q: 'Are all cosmetics and beauty products 100% authentic?',
      a: 'Yes, absolutely. Salbeau operates on a strict zero-counterfeit policy. We source all products directly from authorized brand manufacturers and licensed domestic distributors. Each item carries verified batch codes and tamper-evident security packaging.'
    },
    {
      q: 'How does doorstep UPI payment work with delivery riders?',
      a: 'When your order arrives, the delivery partner displays an official Salbeau dynamic UPI QR code or verified merchant standee. You simply scan it using Google Pay, PhonePe, Paytm, BHIM, or any banking app to complete payment instantly.'
    },
    {
      q: 'Do you offer Cash on Delivery (COD)?',
      a: 'Yes, Cash on Delivery is available across most serviceable pincodes for retail and trade orders up to the configured limit. You can hand over cash directly to our verified delivery executive.'
    },
    {
      q: 'Can beauty salons and makeup artists access wholesale B2B pricing?',
      a: 'Yes! Certified beauticians, salon owners, and makeup artists can submit their trade verification on our mobile app to unlock wholesale tier pricing, bulk discounts, and dedicated account support.'
    },
    {
      q: 'What is your delivery turnaround time?',
      a: 'Most metropolitan orders are delivered same-day or within 24 to 48 hours directly from our regional fulfillment centers with live GPS tracking.'
    }
  ];

  return (
    <div className="min-h-screen bg-white font-['Manrope',sans-serif] text-gray-900 selection:bg-pink-100 selection:text-[#D81B60]">
      {/* ── HEADER NAVIGATION ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-pink-100/80 transition-all shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Brand Logo */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => scrollToSection('home')}>
              <img
                src="/Logo.png"
                alt="Salbeau Logo"
                className="h-12 sm:h-14 w-auto object-contain select-none"
              />
              <div className="hidden sm:block border-l border-pink-200/80 pl-3">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D81B60] block">
                  Pure Order Based App
                </span>
                <span className="text-xs font-semibold text-gray-400">
                  By MakeUp Store
                </span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-gray-700">
              <button
                type="button"
                onClick={() => scrollToSection('home')}
                className="hover:text-[#D81B60] transition-colors cursor-pointer py-1"
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('about')}
                className="hover:text-[#D81B60] transition-colors cursor-pointer py-1"
              >
                About Us
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('how-it-works')}
                className="hover:text-[#D81B60] transition-colors cursor-pointer py-1"
              >
                How It Works
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('why-choose-us')}
                className="hover:text-[#D81B60] transition-colors cursor-pointer py-1"
              >
                Why Choose Us
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('download')}
                className="hover:text-[#D81B60] transition-colors cursor-pointer py-1 flex items-center gap-1 text-[#D81B60]"
              >
                <span>Download App</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#D81B60] animate-pulse" />
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('contact')}
                className="hover:text-[#D81B60] transition-colors cursor-pointer py-1"
              >
                Contact Us
              </button>
            </nav>

            {/* Header Right Actions: Download App Button */}
            <div className="hidden md:flex items-center gap-3">
              <button
                type="button"
                onClick={() => scrollToSection('download')}
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#D81B60] to-[#E25586] hover:from-[#c2185b] hover:to-[#D81B60] text-white text-xs font-black tracking-wide shadow-md shadow-pink-200 hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
              >
                <Download size={13} strokeWidth={2.5} />
                <span>Get Mobile App</span>
              </button>
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex md:hidden items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl border border-pink-100 text-gray-700 hover:bg-pink-50"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-pink-100 px-5 pt-3 pb-6 space-y-3 animate-fade-in text-sm font-bold text-gray-800 shadow-xl">
            <button
              type="button"
              onClick={() => scrollToSection('home')}
              className="w-full text-left py-2 hover:text-[#D81B60] flex items-center justify-between"
            >
              <span>Home</span>
              <ArrowRight size={14} className="text-gray-300" />
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('about')}
              className="w-full text-left py-2 hover:text-[#D81B60] flex items-center justify-between"
            >
              <span>About Us</span>
              <ArrowRight size={14} className="text-gray-300" />
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('how-it-works')}
              className="w-full text-left py-2 hover:text-[#D81B60] flex items-center justify-between"
            >
              <span>How It Works</span>
              <ArrowRight size={14} className="text-gray-300" />
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('why-choose-us')}
              className="w-full text-left py-2 hover:text-[#D81B60] flex items-center justify-between"
            >
              <span>Why Choose Us</span>
              <ArrowRight size={14} className="text-gray-300" />
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('download')}
              className="w-full text-left py-2 text-[#D81B60] flex items-center justify-between"
            >
              <span>Download App (Android & iOS)</span>
              <ArrowRight size={14} className="text-[#D81B60]" />
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('contact')}
              className="w-full text-left py-2 hover:text-[#D81B60] flex items-center justify-between"
            >
              <span>Contact Us</span>
              <ArrowRight size={14} className="text-gray-300" />
            </button>

            <div className="pt-3 border-t border-pink-100">
              <button
                type="button"
                onClick={() => scrollToSection('download')}
                className="w-full py-3 rounded-xl bg-[#D81B60] text-white text-xs font-black shadow-md flex items-center justify-center gap-2"
              >
                <Download size={14} />
                <span>Download Salbeau App</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO SECTION ─────────────────────────────────────────────────── */}
      <section id="home" className="relative pt-12 pb-20 md:py-24 bg-gradient-to-b from-[#FFF5F8] via-white to-white overflow-hidden">
        {/* Subtle Decorative Background Blobs */}
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 rounded-full bg-pink-100/60 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-96 h-96 rounded-full bg-purple-100/50 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Luxury Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-pink-200/80 shadow-2xs">
                <Sparkles size={14} className="text-[#D81B60]" />
                <span className="text-[11px] font-black uppercase tracking-wider text-[#D81B60]">
                  Pure Order Based Luxury Beauty App
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1E1118] tracking-tight leading-[1.15]">
                Curated Authentic Cosmetics,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D81B60] via-[#E25586] to-[#C2185B]">
                  Direct to Your Doorstep.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base text-gray-600 font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Experience India's premier order-based cosmetics platform. 100% verified authentic makeup, salon-grade skincare, and beauty essentials delivered with instant doorstep UPI and Cash on Delivery.
              </p>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-1 text-xs font-bold text-gray-700">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  <span>100% Genuine Brands</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Truck size={16} className="text-[#D81B60]" />
                  <span>Express Dispatch</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <QrCode size={16} className="text-purple-600" />
                  <span>Doorstep UPI & COD</span>
                </div>
              </div>

              {/* Call-to-action Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
                <button
                  type="button"
                  onClick={() => scrollToSection('download')}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-gradient-to-r from-[#D81B60] to-[#E25586] hover:from-[#c2185b] hover:to-[#D81B60] text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-pink-200 hover:shadow-xl transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                >
                  <Download size={15} />
                  <span>Download Mobile App</span>
                </button>

                <button
                  type="button"
                  onClick={() => scrollToSection('how-it-works')}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-white hover:bg-pink-50/50 border border-pink-200 text-gray-800 text-xs font-bold shadow-2xs hover:border-[#D81B60] transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Explore How It Works</span>
                  <ArrowRight size={14} className="text-[#D81B60]" />
                </button>
              </div>

              {/* Metric Counters */}
              <div className="pt-8 grid grid-cols-3 gap-4 border-t border-pink-100/90 text-center lg:text-left">
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-[#1E1118]">50,000+</div>
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Orders Delivered</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-[#D81B60]">100%</div>
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Authenticity Rate</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-[#1E1118]">4.9 ★</div>
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Customer Rating</div>
                </div>
              </div>
            </div>

            {/* Right Hero Showcase Cards */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md bg-gradient-to-b from-pink-50/80 to-white p-6 sm:p-8 rounded-3xl border border-pink-200/80 shadow-2xl space-y-6">
                {/* Floating Top Badge */}
                <div className="flex items-center justify-between pb-4 border-b border-pink-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#D81B60] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      SB
                    </div>
                    <div>
                      <div className="text-xs font-black text-gray-900">Salbeau Mobile App</div>
                      <div className="text-[10px] text-gray-400 font-medium">Beauty & Salon Marketplace</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                    Live Dispatch
                  </span>
                </div>

                {/* Featured Product Preview */}
                <div className="bg-white p-4 rounded-2xl border border-pink-100 shadow-xs flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-pink-50 flex items-center justify-center overflow-hidden p-1 border border-pink-100">
                    <img
                      src="/Logo.png"
                      alt="Brand Seal"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-[#D81B60] uppercase tracking-wider block">
                      Guaranteed Genuine
                    </span>
                    <h4 className="text-xs font-extrabold text-gray-900 truncate">
                      Luxury Matte Lipstick & Serum Kits
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-black text-gray-900">₹799</span>
                      <span className="text-[10px] text-gray-400 line-through">₹1,299</span>
                      <span className="text-[10px] font-bold text-emerald-600">38% OFF</span>
                    </div>
                  </div>
                </div>

                {/* Feature Pill 1: Verified Sourcing */}
                <div className="bg-white/80 p-3.5 rounded-xl border border-pink-100 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-pink-100 text-[#D81B60] flex items-center justify-center shrink-0 font-bold">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-gray-900">Tamper-Proof Seal</h5>
                    <p className="text-[11px] text-gray-500 font-medium">Original batch code barcode verification on every box</p>
                  </div>
                </div>

                {/* Feature Pill 2: Doorstep UPI */}
                <div className="bg-white/80 p-3.5 rounded-xl border border-purple-100 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 font-bold">
                    <QrCode size={18} />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-purple-950">Scan & Pay at Doorstep</h5>
                    <p className="text-[11px] text-purple-700/80 font-medium">Riders carry dynamic UPI QR codes for instant digital checkout</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ABOUT US SECTION ─────────────────────────────────────────────── */}
      <section id="about" className="py-20 bg-white border-t border-pink-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-16">
            <span className="text-xs font-black uppercase tracking-wider text-[#D81B60] bg-pink-50 border border-pink-100 px-3.5 py-1 rounded-full inline-block">
              About Salbeau
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1E1118] tracking-tight">
              Pure Order Based Cosmetics. No Counterfeits, No Compromises.
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
              Founded with the vision to eliminate grey-market replicas and aging warehouse cosmetics, Salbeau connects conscious beauty lovers and licensed salons directly to authorized manufacturers through our pure order-based pipeline.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pillar 1 */}
            <div className="p-6 rounded-2xl bg-[#FFF8FA] border border-pink-100 hover:border-[#D81B60]/40 transition-all hover:shadow-md space-y-3">
              <div className="w-12 h-12 rounded-xl bg-white text-[#D81B60] border border-pink-200/60 flex items-center justify-center shadow-xs">
                <ShieldCheck size={22} />
              </div>
              <h3 className="text-sm font-black text-gray-900">Direct Brand Sourcing</h3>
              <p className="text-xs text-gray-600 font-medium leading-relaxed">
                We eliminate multi-layered intermediaries. Every product comes directly from certified brand manufacturing hubs with tamper-proof batch seals.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-6 rounded-2xl bg-[#FFF8FA] border border-pink-100 hover:border-[#D81B60]/40 transition-all hover:shadow-md space-y-3">
              <div className="w-12 h-12 rounded-xl bg-white text-purple-700 border border-purple-200/60 flex items-center justify-center shadow-xs">
                <Award size={22} />
              </div>
              <h3 className="text-sm font-black text-gray-900">Fresh Formulation Batch</h3>
              <p className="text-xs text-gray-600 font-medium leading-relaxed">
                Beauty products are climate-sensitive. Our order-based fulfillment ensures active skincare ingredients and pigments never sit idle on dusty shelves.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-6 rounded-2xl bg-[#FFF8FA] border border-pink-100 hover:border-[#D81B60]/40 transition-all hover:shadow-md space-y-3">
              <div className="w-12 h-12 rounded-xl bg-white text-[#D81B60] border border-pink-200/60 flex items-center justify-center shadow-xs">
                <Sparkles size={22} />
              </div>
              <h3 className="text-sm font-black text-gray-900">Transparent B2B & B2C</h3>
              <p className="text-xs text-gray-600 font-medium leading-relaxed">
                Whether purchasing individual cosmetic items or stocking a professional beauty parlor, our tiered wholesale engine delivers fair, upfront pricing.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="p-6 rounded-2xl bg-[#FFF8FA] border border-pink-100 hover:border-[#D81B60]/40 transition-all hover:shadow-md space-y-3">
              <div className="w-12 h-12 rounded-xl bg-white text-emerald-600 border border-emerald-200/60 flex items-center justify-center shadow-xs">
                <Truck size={22} />
              </div>
              <h3 className="text-sm font-black text-gray-900">Dedicated Fleet Care</h3>
              <p className="text-xs text-gray-600 font-medium leading-relaxed">
                Our deliveries are handled by trained, in-house staff equipped with real-time route optimization and doorstep UPI payment hardware.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS SECTION ─────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 bg-gradient-to-b from-[#FFF5F8] to-white border-t border-pink-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-16">
            <span className="text-xs font-black uppercase tracking-wider text-[#D81B60] bg-white border border-pink-100 px-3.5 py-1 rounded-full inline-block shadow-2xs">
              Simple 4-Step Process
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1E1118] tracking-tight">
              How Salbeau Works
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
              From your initial shade selection on the mobile app to unboxing authentic luxury cosmetics at your doorstep.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Step 1 */}
            <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-sm relative group hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 rounded-2xl bg-[#D81B60] text-white flex items-center justify-center font-black text-sm mb-5 shadow-md shadow-pink-200">
                01
              </div>
              <h3 className="text-sm font-black text-gray-900 mb-2">
                Browse & Pick Shades
              </h3>
              <p className="text-xs text-gray-600 font-medium leading-relaxed">
                Explore thousands of lipsticks, foundations, palettes, and serums with high-res swatches and verified customer shade reviews.
              </p>
              <div className="mt-4 pt-3 border-t border-pink-50 text-[11px] font-bold text-[#D81B60] flex items-center gap-1">
                <CheckCircle2 size={13} />
                <span>Smart Shade Finder</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-sm relative group hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black text-sm mb-5 shadow-md shadow-purple-200">
                02
              </div>
              <h3 className="text-sm font-black text-gray-900 mb-2">
                Strict Quality Packing
              </h3>
              <p className="text-xs text-gray-600 font-medium leading-relaxed">
                Every order is hand-verified, sealed with tamper-evident tape, and packed with protective cushioning in climate-managed stores.
              </p>
              <div className="mt-4 pt-3 border-t border-pink-50 text-[11px] font-bold text-purple-700 flex items-center gap-1">
                <CheckCircle2 size={13} />
                <span>Barcode Serial Verification</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-sm relative group hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 rounded-2xl bg-[#D81B60] text-white flex items-center justify-center font-black text-sm mb-5 shadow-md shadow-pink-200">
                03
              </div>
              <h3 className="text-sm font-black text-gray-900 mb-2">
                Express Local Dispatch
              </h3>
              <p className="text-xs text-gray-600 font-medium leading-relaxed">
                Assigned delivery riders pick up your order and head directly to your address with live SMS and push notification tracking.
              </p>
              <div className="mt-4 pt-3 border-t border-pink-50 text-[11px] font-bold text-[#D81B60] flex items-center gap-1">
                <CheckCircle2 size={13} />
                <span>Live Route Tracking</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-sm relative group hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm mb-5 shadow-md shadow-emerald-200">
                04
              </div>
              <h3 className="text-sm font-black text-gray-900 mb-2">
                Doorstep UPI / COD
              </h3>
              <p className="text-xs text-gray-600 font-medium leading-relaxed">
                Inspect your package, scan the rider's dynamic UPI QR code on GPay/PhonePe/Paytm or pay cash on delivery. Instant digital receipt.
              </p>
              <div className="mt-4 pt-3 border-t border-pink-50 text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 size={13} />
                <span>Zero-Contact UPI Scanner</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE US SECTION ────────────────────────────────────────── */}
      <section id="why-choose-us" className="py-20 bg-white border-t border-pink-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-16">
            <span className="text-xs font-black uppercase tracking-wider text-[#D81B60] bg-pink-50 border border-pink-100 px-3.5 py-1 rounded-full inline-block">
              Why Salbeau
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1E1118] tracking-tight">
              Designed for Beauty Connoisseurs & Professional Salons
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
              Here is why tens of thousands of customers and salon professionals trust Salbeau for their beauty supply.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-[#FFF8FA] border border-pink-100 hover:border-[#D81B60] transition-colors shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-pink-100 text-[#D81B60] flex items-center justify-center font-bold">
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-sm font-black text-gray-900">Zero Counterfeit Pledge</h3>
              <p className="text-xs text-gray-600 font-medium leading-relaxed">
                Every single tube, compact, and serum is backed by manufacturer authentication and original batch numbers.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-[#FFF8FA] border border-pink-100 hover:border-[#D81B60] transition-colors shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <QrCode size={20} />
              </div>
              <h3 className="text-sm font-black text-gray-900">Instant Doorstep UPI QR</h3>
              <p className="text-xs text-gray-600 font-medium leading-relaxed">
                Scan and pay in seconds using any UPI application directly on the delivery partner's real-time screen.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-[#FFF8FA] border border-pink-100 hover:border-[#D81B60] transition-colors shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-pink-100 text-[#D81B60] flex items-center justify-center font-bold">
                <Sparkles size={20} />
              </div>
              <h3 className="text-sm font-black text-gray-900">Exclusive Trade Pricing</h3>
              <p className="text-xs text-gray-600 font-medium leading-relaxed">
                Verified B2B beauty parlors and bridal makeup artists receive wholesale margin pricing and priority fulfillment.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-[#FFF8FA] border border-pink-100 hover:border-[#D81B60] transition-colors shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Truck size={20} />
              </div>
              <h3 className="text-sm font-black text-gray-900">Rapid Same-Day Delivery</h3>
              <p className="text-xs text-gray-600 font-medium leading-relaxed">
                Fast dispatch from regional fulfillment hubs so you never have to delay an appointment or client styling session.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl bg-[#FFF8FA] border border-pink-100 hover:border-[#D81B60] transition-colors shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-pink-100 text-[#D81B60] flex items-center justify-center font-bold">
                <Clock size={20} />
              </div>
              <h3 className="text-sm font-black text-gray-900">Real-Time Dispatch Updates</h3>
              <p className="text-xs text-gray-600 font-medium leading-relaxed">
                Track every stage of fulfillment from packaging to dispatch with accurate rider arrival timestamps.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl bg-[#FFF8FA] border border-pink-100 hover:border-[#D81B60] transition-colors shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Heart size={20} />
              </div>
              <h3 className="text-sm font-black text-gray-900">Dedicated Beauty Support</h3>
              <p className="text-xs text-gray-600 font-medium leading-relaxed">
                Our responsive customer support team is available via direct phone and WhatsApp for shade guidance and order queries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PLAY STORE & APP STORE AVAILABILITY SECTION ──────────────────── */}
      <section id="download" className="py-20 bg-gradient-to-br from-[#1E1118] via-[#2D1422] to-[#1E1118] text-white relative overflow-hidden">
        {/* Glow highlights */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 rounded-full bg-[#D81B60]/20 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
                <Smartphone size={14} className="text-pink-300" />
                <span className="text-[11px] font-black uppercase tracking-wider text-pink-200">
                  Mobile App Available Now
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Get the Salbeau App on Google Play & App Store
              </h2>

              <p className="text-sm sm:text-base text-pink-100/80 font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Unlock app-exclusive flash beauty drops, personalized shade finders, real-time rider dispatch tracking, and 1-tap reordering directly on your Android smartphone or Apple iPhone.
              </p>

              {/* App Features List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-semibold text-pink-100/90 text-left">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  <span>Instant OTP Login & Permanent Session</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  <span>Real-Time Rider GPS & Arrival Alerts</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  <span>Seamless Doorstep UPI QR Scanning</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  <span>Verified Trade & Salon B2B Accounts</span>
                </div>
              </div>

              {/* Download Badges Buttons */}
              <div className="pt-6 flex flex-wrap items-center justify-center lg:justify-start gap-4">
                {/* Google Play Store Badge */}
                <a
                  href="#download"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Salbeau Android App is ready for download! Check your device or contact store staff for direct APK package.');
                  }}
                  className="px-6 py-3.5 rounded-2xl bg-white hover:bg-gray-100 text-gray-900 text-xs font-black flex items-center gap-3 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                >
                  <div className="w-6 h-6 flex items-center justify-center text-[#D81B60]">
                    <Download size={20} />
                  </div>
                  <div className="text-left">
                    <span className="text-[9px] font-bold text-gray-500 uppercase block tracking-wider leading-none">
                      Get it on
                    </span>
                    <span className="text-sm font-black text-gray-900 leading-tight">
                      Google Play
                    </span>
                  </div>
                </a>

                {/* Apple App Store Badge */}
                <a
                  href="#download"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Salbeau iOS App is in active deployment. TestFlight invitation available via store administrator.');
                  }}
                  className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-black flex items-center gap-3 backdrop-blur-md transition-all cursor-pointer"
                >
                  <div className="w-6 h-6 flex items-center justify-center text-pink-300">
                    <Smartphone size={20} />
                  </div>
                  <div className="text-left">
                    <span className="text-[9px] font-bold text-pink-200/70 uppercase block tracking-wider leading-none">
                      Download on
                    </span>
                    <span className="text-sm font-black text-white leading-tight">
                      App Store
                    </span>
                  </div>
                </a>
              </div>
            </div>

            {/* Right: Interactive Live QR Code Standee Card */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="bg-white/95 backdrop-blur-md text-gray-900 p-7 rounded-3xl border border-pink-200 shadow-2xl max-w-sm w-full text-center space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[11px] font-black uppercase tracking-wider text-purple-900">
                    Scan to Install App
                  </span>
                </div>

                <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-100 flex items-center justify-center">
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https%3A%2F%2Fclobeau.com%2Fapp"
                    alt="Salbeau App Download QR Code"
                    className="w-44 h-44 object-contain rounded-xl bg-white p-2 shadow-xs"
                  />
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-black text-gray-900">Point Camera & Scan</h4>
                  <p className="text-[11px] text-gray-500 font-medium">
                    Opens direct download link on your Android or iPhone
                  </p>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-center gap-2 text-[11px] font-extrabold text-[#D81B60]">
                  <Sparkles size={13} />
                  <span>Use code FIRST50 for ₹50 off first order</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT US SECTION ───────────────────────────────────────────── */}
      <section id="contact" className="py-20 bg-white border-t border-pink-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-16">
            <span className="text-xs font-black uppercase tracking-wider text-[#D81B60] bg-pink-50 border border-pink-100 px-3.5 py-1 rounded-full inline-block">
              Get in Touch
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1E1118] tracking-tight">
              Contact Salbeau Support & Trade Desk
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
              Have an inquiry about an existing order, brand distribution partnership, or salon verification? Our team is here to assist.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left: Contact Info & Support Channels */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-[#FFF8FA] p-6 rounded-3xl border border-pink-100 space-y-5">
                <h3 className="text-base font-black text-[#1E1118]">Official Head Office</h3>

                <div className="space-y-4 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-pink-100 text-[#D81B60] flex items-center justify-center shrink-0">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 block">Fulfillment Center & Registered Office</span>
                      <span className="text-gray-500 font-medium leading-relaxed">
                        Salbeau Beauty Ltd, Luxury Beauty Boulevard, India
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-pink-100 text-[#D81B60] flex items-center justify-center shrink-0">
                      <Phone size={16} />
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 block">Customer Care & WhatsApp Support</span>
                      <a href="tel:+919876543210" className="text-[#D81B60] font-bold hover:underline">
                        +91 98765 43210
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-pink-100 text-[#D81B60] flex items-center justify-center shrink-0">
                      <Mail size={16} />
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 block">General & Trade Inquiries</span>
                      <a href="mailto:support@clobeau.com" className="text-[#D81B60] font-bold hover:underline">
                        support@clobeau.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-pink-100 text-[#D81B60] flex items-center justify-center shrink-0">
                      <Clock size={16} />
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 block">Operational Support Hours</span>
                      <span className="text-gray-500 font-medium">Monday – Saturday: 9:00 AM – 9:00 PM IST</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Help & Support Assistance */}
              <div className="p-5 rounded-2xl bg-pink-50/70 border border-pink-200/80 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-[#D81B60]">Need Immediate Order Assistance?</h4>
                  <p className="text-[11px] text-gray-600 font-medium">Connect with our dedicated client concierge on WhatsApp</p>
                </div>
                <a
                  href="https://wa.me/919876543210"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-[#D81B60] hover:bg-[#b0144d] text-white text-xs font-black shadow-xs flex items-center gap-1.5"
                >
                  <Send size={12} />
                  <span>Chat Now</span>
                </a>
              </div>
            </div>

            {/* Right: Contact Form */}
            <div className="lg:col-span-7">
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-pink-100 shadow-sm space-y-5">
                <div className="border-b border-pink-100 pb-4">
                  <h3 className="text-base font-black text-gray-900">Send Us a Direct Message</h3>
                  <p className="text-xs text-gray-500 font-medium">Our client relations executive will respond within 2 hours</p>
                </div>

                {contactSubmitted ? (
                  <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2 animate-fade-in">
                    <CheckCircle2 size={32} className="text-emerald-600 mx-auto" />
                    <h4 className="text-sm font-black text-emerald-900">Inquiry Received Successfully!</h4>
                    <p className="text-xs text-emerald-700 font-medium max-w-md mx-auto">
                      Thank you for contacting Salbeau. A customer support representative will review your message and contact you via phone or email shortly.
                    </p>
                    <button
                      type="button"
                      onClick={() => setContactSubmitted(false)}
                      className="mt-3 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer hover:bg-emerald-700"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-800 font-bold mb-1.5">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                          placeholder="e.g. Priya Sharma"
                          className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#D81B60] outline-none font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-800 font-bold mb-1.5">Phone Number *</label>
                        <input
                          type="tel"
                          required
                          value={contactForm.phone}
                          onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                          placeholder="e.g. +91 98765 43210"
                          className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#D81B60] outline-none font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-800 font-bold mb-1.5">Email Address *</label>
                        <input
                          type="email"
                          required
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          placeholder="e.g. priya@gmail.com"
                          className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#D81B60] outline-none font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-800 font-bold mb-1.5">Subject / Department</label>
                        <select
                          value={contactForm.subject}
                          onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                          className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#D81B60] outline-none font-medium cursor-pointer"
                        >
                          <option value="General Inquiry">General Inquiry</option>
                          <option value="Order Tracking & Support">Order Tracking & Support</option>
                          <option value="Salon B2B Trade Program">Salon B2B Trade Program</option>
                          <option value="Brand Distribution / Listing">Brand Distribution / Listing</option>
                          <option value="Delivery Partner Career">Delivery Partner Career</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-800 font-bold mb-1.5">Your Message *</label>
                      <textarea
                        rows={4}
                        required
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        placeholder="Please write your questions or order reference details here..."
                        className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#D81B60] outline-none font-medium resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 bg-gradient-to-r from-[#D81B60] to-[#E25586] hover:from-[#c2185b] hover:to-[#D81B60] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md shadow-pink-200 hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Send size={14} />
                      <span>Submit Inquiry</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* ── FAQ ACCORDION SUB-SECTION ── */}
          <div className="mt-20 max-w-3xl mx-auto space-y-4">
            <h3 className="text-xl font-black text-center text-gray-900 mb-6">
              Frequently Asked Questions
            </h3>

            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="border border-pink-100 rounded-2xl bg-white overflow-hidden shadow-2xs transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-pink-50/40"
                >
                  <span className="text-xs sm:text-sm font-bold text-gray-900">
                    {faq.q}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-gray-400 shrink-0 transition-transform ${openFaq === idx ? 'rotate-180 text-[#D81B60]' : ''}`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-4 pt-1 text-xs text-gray-600 font-medium leading-relaxed border-t border-pink-50 bg-[#FFF8FA]/40">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="bg-[#180E14] text-white pt-16 pb-12 border-t border-pink-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
            {/* Col 1: Brand Info */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src="/Logo.png"
                  alt="Salbeau"
                  className="h-10 w-auto object-contain select-none bg-white/90 p-1 rounded-lg"
                />
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-pink-400 block">
                    Salbeau MakeUp Store
                  </span>
                  <span className="text-[11px] text-gray-400">Pure Order Based Cosmetics</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 font-medium leading-relaxed max-w-sm">
                India's authentic luxury cosmetics distribution platform. Direct brand partnerships, guaranteed batch freshness, and doorstep payment collection.
              </p>
              <div className="flex items-center gap-3 pt-1 text-xs text-pink-200">
                <span className="flex items-center gap-1 font-bold">
                  <ShieldCheck size={14} className="text-emerald-400" /> 100% Genuine
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-bold">
                  <Truck size={14} className="text-pink-400" /> Fast Delivery
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-bold">
                  <QrCode size={14} className="text-purple-400" /> UPI on Delivery
                </span>
              </div>
            </div>

            {/* Col 2: Quick Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-pink-300">Navigation</h4>
              <ul className="space-y-2 text-xs text-gray-400 font-medium">
                <li>
                  <button type="button" onClick={() => scrollToSection('home')} className="hover:text-white transition-colors cursor-pointer">
                    Home
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollToSection('about')} className="hover:text-white transition-colors cursor-pointer">
                    About Us
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollToSection('how-it-works')} className="hover:text-white transition-colors cursor-pointer">
                    How It Works
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollToSection('why-choose-us')} className="hover:text-white transition-colors cursor-pointer">
                    Why Choose Us
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollToSection('download')} className="hover:text-white transition-colors cursor-pointer">
                    Download App
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollToSection('contact')} className="hover:text-white transition-colors cursor-pointer">
                    Contact Us
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Customer Care & Policies */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-pink-300">Customer Care</h4>
              <ul className="space-y-2 text-xs text-gray-400 font-medium">
                <li>
                  <span className="hover:text-white transition-colors cursor-pointer">Authenticity Guarantee</span>
                </li>
                <li>
                  <span className="hover:text-white transition-colors cursor-pointer">Order Tracking & Dispatch</span>
                </li>
                <li>
                  <span className="hover:text-white transition-colors cursor-pointer">Return & Replacement Policy</span>
                </li>
                <li>
                  <span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span>
                </li>
                <li>
                  <span className="hover:text-white transition-colors cursor-pointer">Privacy & Data Security</span>
                </li>
                <li>
                  <span className="hover:text-white transition-colors cursor-pointer">Salon B2B Trade Program</span>
                </li>
              </ul>
            </div>

            {/* Col 4: Verified Logistics & Quality */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-pink-300">Customer Assurance</h4>
              <p className="text-xs text-gray-400 font-medium leading-relaxed">
                Direct authorized sourcing, tamper-evident seals, and instant doorstep UPI payments for seamless salon deliveries.
              </p>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-pink-400 block">Verified Logistics</span>
                <span className="text-xs text-gray-300 font-bold block">100% Genuine Certified</span>
              </div>
            </div>
          </div>

          {/* Bottom Copyright & Disclaimer */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 font-medium">
            <div>
              © {new Date().getFullYear()} Salbeau Beauty Ltd. All rights reserved. Pure Order Based App by MakeUp Store.
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="hover:text-gray-300 cursor-pointer">Security & Compliance</span>
              <span>•</span>
              <span className="hover:text-gray-300 cursor-pointer">GST Invoicing</span>
              <span>•</span>
              <span className="text-gray-400 hover:text-gray-300 cursor-pointer">
                Privacy Policy
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
