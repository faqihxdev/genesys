-- =====================================================
-- SEED DATA FOR APPLE PHONE MARKETING FUNNELS
-- Target: Singapore General Public
-- YOU CAN RUN THIS DIRECTLY ON SUPABASE SQL EDITOR
-- =====================================================

-- To change project ID, find and replace 'prj-v5nm-jdir' throughout this file

-- =====================================================
-- FUNNEL 1: TECH-FOCUSED MARKETING FUNNEL
-- =====================================================

-- Insert Feature-Focused Marketing Funnel
INSERT INTO funnels (id, project_id, name, description, created_at, updated_at) VALUES
('fnl-terrible-apple-sg', 'prj-v5nm-jdir', 'iPhone Tech-Forward Campaign', 'A technology-focused marketing funnel that emphasizes iPhone specifications, features, and technical capabilities. Appeals to tech-savvy customers who value performance and innovation.', NOW(), NOW());

-- Insert Stages for Tech-Focused Funnel
INSERT INTO stages (id, funnel_id, name, description, created_at, updated_at) VALUES
-- Start Stage
('stg-terrible-start', 'fnl-terrible-apple-sg', 'Innovation Showcase', 'Compelling landing page highlighting cutting-edge technology and innovation. Appeals to tech enthusiasts with performance metrics and advanced features.', NOW(), NOW()),

-- Middle Stages (Branching)
('stg-terrible-middle-1', 'fnl-terrible-apple-sg', 'Performance Deep Dive', 'Detailed technical analysis showing superior performance, benchmarks, and capabilities. Perfect for users who want to understand the technology behind the device.', NOW(), NOW()),
('stg-terrible-middle-2', 'fnl-terrible-apple-sg', 'Value & Investment', 'Smart pricing strategy showing long-term value, trade-in options, and cost-per-day ownership. Appeals to rational decision-makers who analyze purchases.', NOW(), NOW()),

-- End Stage
('stg-terrible-end', 'fnl-terrible-apple-sg', 'Smart Purchase', 'Streamlined checkout with tech-savvy features like quick setup, data transfer assistance, and technical support options.', NOW(), NOW());

-- Insert Stage Links for Terrible Funnel
INSERT INTO stage_links (id, funnel_id, from_stage_id, to_stage_id, created_at, updated_at) VALUES
('sln-terrible-start-to-mid1', 'fnl-terrible-apple-sg', 'stg-terrible-start', 'stg-terrible-middle-1', NOW(), NOW()),
('sln-terrible-start-to-mid2', 'fnl-terrible-apple-sg', 'stg-terrible-start', 'stg-terrible-middle-2', NOW(), NOW()),
('sln-terrible-mid1-to-end', 'fnl-terrible-apple-sg', 'stg-terrible-middle-1', 'stg-terrible-end', NOW(), NOW()),
('sln-terrible-mid2-to-end', 'fnl-terrible-apple-sg', 'stg-terrible-middle-2', 'stg-terrible-end', NOW(), NOW());

-- Insert Stage Items for Tech-Focused Funnel
INSERT INTO stage_items (id, stage_id, name, description, stage_item_type, content, created_at, updated_at) VALUES
-- Start Stage Items
('sti-terrible-start-1', 'stg-terrible-start', 'Innovation Hero', 'Compelling technology showcase', 'text', 'Revolutionary A17 Pro chip delivers 20% faster performance. Experience the future of mobile technology with iPhone 15 - engineered for Singapore''s digital lifestyle.', NOW(), NOW()),
('sti-terrible-start-2', 'stg-terrible-start', 'Performance Metrics', 'Impressive technical achievements', 'text', 'Breakthrough performance: 2x faster AI processing, 50% better energy efficiency, and pro-grade camera system. See why tech reviewers call it "the most advanced iPhone ever."', NOW(), NOW()),
('sti-terrible-start-3', 'stg-terrible-start', 'Smart Selection', 'Intelligent model comparison', 'text', 'Find your perfect match: iPhone 15 (everyday excellence), Plus (bigger display), Pro (advanced cameras), Pro Max (ultimate performance). Each optimized for different usage patterns.', NOW(), NOW()),

-- Middle Stage 1 Items
('sti-terrible-mid1-1', 'stg-terrible-middle-1', 'Performance Benchmarks', 'Impressive technical comparisons', 'text', 'Benchmark results: 40% faster than competitors, industry-leading 48MP camera with computational photography, and 22-hour video playback. Perfect for Singapore''s demanding mobile users.', NOW(), NOW()),
('sti-terrible-mid1-2', 'stg-terrible-middle-1', 'Advanced Capabilities', 'Cutting-edge features explanation', 'text', 'Pro features: 4K ProRes video recording, advanced night photography, Action mode for smooth videos, and Dynamic Island for seamless multitasking. Built for creators and professionals.', NOW(), NOW()),

-- Middle Stage 2 Items
('sti-terrible-mid2-1', 'stg-terrible-middle-2', 'Smart Investment', 'Value-focused pricing strategy', 'text', 'Smart investment: S$1,299 for 4+ years of cutting-edge performance = S$0.89/day. Trade-in your old device for up to S$800 credit. 0% interest financing available.', NOW(), NOW()),
('sti-terrible-mid2-2', 'stg-terrible-middle-2', 'Immediate Availability', 'Quick access and setup', 'text', 'Ready when you are: Same-day pickup at Apple Orchard Road, free 2-hour delivery in Singapore, or quick online setup with data transfer assistance. Your upgrade awaits.', NOW(), NOW()),

-- End Stage Items
('sti-terrible-end-1', 'stg-terrible-end', 'Smart Checkout', 'Streamlined purchase process', 'text', 'Optimized checkout: iPhone 15 (128GB) S$1,299, free delivery, instant trade-in credit applied. Total after trade-in: from S$499. Secure payment in 30 seconds.', NOW(), NOW()),
('sti-terrible-end-2', 'stg-terrible-end', 'Tech Support Included', 'Comprehensive support package', 'text', 'Complete support: Free setup assistance, data transfer service, 90-day technical support, and access to Today at Apple sessions. Your success is guaranteed.', NOW(), NOW()),
('sti-terrible-end-3', 'stg-terrible-end', 'Confidence Guarantee', 'Risk-free purchase assurance', 'text', 'Risk-free upgrade: 14-day return policy, 1-year warranty, AppleCare+ available, and lifetime technical support. Join millions of satisfied iPhone users in Singapore.', NOW(), NOW());

-- =====================================================
-- FUNNEL 2: EXCELLENT MARKETING FUNNEL
-- =====================================================

-- Insert Excellent Marketing Funnel
INSERT INTO funnels (id, project_id, name, description, created_at, updated_at) VALUES
('fnl-excellent-apple-sg', 'prj-v5nm-jdir', 'iPhone Singapore Lifestyle Campaign', 'A well-crafted marketing funnel that understands Singapore customers, addresses their specific needs, and guides them through a smooth, value-focused journey with personalized messaging and clear benefits.', NOW(), NOW());

-- Insert Stages for Excellent Funnel
INSERT INTO stages (id, funnel_id, name, description, created_at, updated_at) VALUES
-- Start Stage
('stg-excellent-start', 'fnl-excellent-apple-sg', 'Singapore-Focused Welcome', 'Warm, localized landing page that speaks to Singapore lifestyle and values, with clear value proposition and social proof.', NOW(), NOW()),

-- Middle Stages (Branching)
('stg-excellent-middle-1', 'fnl-excellent-apple-sg', 'Professional Focus Path', 'Tailored messaging for working professionals highlighting productivity, camera quality for work, and seamless integration with business needs.', NOW(), NOW()),
('stg-excellent-middle-2', 'fnl-excellent-apple-sg', 'Lifestyle & Family Path', 'Focused on family moments, photography, entertainment, and how iPhone enhances daily life in Singapore context.', NOW(), NOW()),

-- End Stage
('stg-excellent-end', 'fnl-excellent-apple-sg', 'Smooth Purchase Experience', 'Streamlined checkout with multiple payment options, clear pricing, excellent support, and confidence-building guarantees.', NOW(), NOW());

-- Insert Stage Links for Excellent Funnel
INSERT INTO stage_links (id, funnel_id, from_stage_id, to_stage_id, created_at, updated_at) VALUES
('sln-excellent-start-to-mid1', 'fnl-excellent-apple-sg', 'stg-excellent-start', 'stg-excellent-middle-1', NOW(), NOW()),
('sln-excellent-start-to-mid2', 'fnl-excellent-apple-sg', 'stg-excellent-start', 'stg-excellent-middle-2', NOW(), NOW()),
('sln-excellent-mid1-to-end', 'fnl-excellent-apple-sg', 'stg-excellent-middle-1', 'stg-excellent-end', NOW(), NOW()),
('sln-excellent-mid2-to-end', 'fnl-excellent-apple-sg', 'stg-excellent-middle-2', 'stg-excellent-end', NOW(), NOW());

-- Insert Stage Items for Excellent Funnel
INSERT INTO stage_items (id, stage_id, name, description, stage_item_type, content, created_at, updated_at) VALUES
-- Start Stage Items
('sti-excellent-start-1', 'stg-excellent-start', 'Localized Hero Message', 'Warm welcome that speaks to Singapore lifestyle', 'text', 'Capture Singapore''s vibrant moments with iPhone 15. From Marina Bay sunrises to hawker center gatherings, make every memory extraordinary. Designed for how Singaporeans live, work, and connect.', NOW(), NOW()),
('sti-excellent-start-2', 'stg-excellent-start', 'Social Proof Singapore', 'Local testimonials and trust signals', 'text', '"Finally upgraded from my old phone - the camera quality is incredible for my food photography!" - Sarah, Tanjong Pagar. Join 500,000+ Singaporeans who''ve made the switch.', NOW(), NOW()),
('sti-excellent-start-3', 'stg-excellent-start', 'Clear Value Proposition', 'Simple, benefit-focused messaging', 'text', 'Why iPhone 15 is perfect for Singapore: ✓ All-day battery for long commutes ✓ Pro cameras for stunning photos ✓ 5G speed for seamless connectivity ✓ Works perfectly in our climate', NOW(), NOW()),

-- Middle Stage 1 Items (Professional Focus)
('sti-excellent-mid1-1', 'stg-excellent-middle-1', 'Professional Benefits', 'Work-focused value proposition', 'text', 'Boost your productivity in Singapore''s fast-paced work environment. Crystal-clear video calls, lightning-fast file sharing, and professional-grade photos for presentations. Perfect for CBD professionals and entrepreneurs.', NOW(), NOW()),
('sti-excellent-mid1-2', 'stg-excellent-middle-1', 'Business Use Cases', 'Specific professional scenarios', 'text', 'Real scenarios: Document scanning for contracts, 4K video recording for client presentations, secure Face ID for sensitive apps, and seamless integration with your MacBook for that important Zoom call.', NOW(), NOW()),

-- Middle Stage 2 Items (Lifestyle & Family)
('sti-excellent-mid2-1', 'stg-excellent-middle-2', 'Family Moments', 'Emotional connection to family life', 'text', 'Preserve precious family moments in stunning detail. From your child''s first steps at East Coast Park to family dinners in Chinatown - every photo tells your Singapore story beautifully.', NOW(), NOW()),
('sti-excellent-mid2-2', 'stg-excellent-middle-2', 'Entertainment Value', 'Lifestyle and entertainment benefits', 'text', 'Your entertainment hub: Stream Netflix during MRT rides, play games with friends, listen to Spotify with incredible audio quality, and share moments instantly with family overseas.', NOW(), NOW()),

-- End Stage Items
('sti-excellent-end-1', 'stg-excellent-end', 'Transparent Pricing', 'Clear, honest pricing structure', 'text', 'iPhone 15 (128GB): S$1,299. Free delivery island-wide. No hidden fees. Includes: 1-year Apple warranty, free setup service, and 30-day money-back guarantee. GST included in all prices.', NOW(), NOW()),
('sti-excellent-end-2', 'stg-excellent-end', 'Payment Flexibility', 'Multiple convenient payment options', 'text', 'Pay your way: Credit/debit cards, PayLah!, GrabPay, or 0% interest installments (6-24 months). Trade in your old phone for up to S$800 credit. Student discounts available with valid ID.', NOW(), NOW()),
('sti-excellent-end-3', 'stg-excellent-end', 'Support & Guarantees', 'Confidence-building assurances', 'text', 'Your peace of mind: Free island-wide delivery, expert setup assistance, 14-day return policy, and access to Apple Orchard Road for support. Questions? Chat with our Singapore-based team 24/7.', NOW(), NOW());

-- =====================================================
-- VERIFICATION QUERIES (OPTIONAL - COMMENT OUT WHEN RUNNING)
-- =====================================================

-- Uncomment these to verify the data was inserted correctly:
-- SELECT f.name, COUNT(s.id) as stage_count FROM funnels f LEFT JOIN stages s ON f.id = s.funnel_id WHERE f.project_id = 'prj-v5nm-jdir' GROUP BY f.id, f.name;
-- SELECT s.name, COUNT(si.id) as item_count FROM stages s LEFT JOIN stage_items si ON s.id = si.stage_id JOIN funnels f ON s.funnel_id = f.id WHERE f.project_id = 'prj-v5nm-jdir' GROUP BY s.id, s.name ORDER BY s.funnel_id, s.name;
-- SELECT COUNT(*) as total_stage_links FROM stage_links sl JOIN funnels f ON sl.funnel_id = f.id WHERE f.project_id = 'prj-v5nm-jdir';
