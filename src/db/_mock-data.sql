-- Mock Project
INSERT INTO projects (id, name, description)
VALUES (
    'prj-mock-1',
    'Mock Marketing Campaign',
    'A test marketing campaign project'
  );
-- Mock Funnel
INSERT INTO funnels (id, "projectId", name, description)
VALUES (
    'fnl-mock-1',
    'prj-mock-1',
    'Product Launch Funnel',
    'A test funnel for product launch campaign with path optimization'
  );
-- Mock Stages (without parentId and childId fields)
INSERT INTO stages (
    id,
    "funnelId",
    name,
    description
  )
VALUES (
    'stg-mock-1',
    'fnl-mock-1',
    'Awareness',
    'Landing page to introduce the product'
  ),
  (
    'stg-mock-2a',
    'fnl-mock-1',
    'Features Path',
    'Detailed product features and capabilities'
  ),
  (
    'stg-mock-2b',
    'fnl-mock-1',
    'Pricing Path',
    'Pricing plans and value proposition'
  ),
  (
    'stg-mock-3',
    'fnl-mock-1',
    'Decision',
    'Checkout and purchase process'
  );
-- Mock Stage Links to define relationships between stages
-- stg-mock-1 splits into stg-mock-2a and stg-mock-2b,
-- and both stg-mock-2a and stg-mock-2b lead into stg-mock-3.
INSERT INTO stage_links (id, "funnelId", "fromStageId", "toStageId")
VALUES (
    'sln-mock-1',
    'fnl-mock-1',
    'stg-mock-1',
    'stg-mock-2a'
  ),
  (
    'sln-mock-2',
    'fnl-mock-1',
    'stg-mock-1',
    'stg-mock-2b'
  ),
  (
    'sln-mock-3',
    'fnl-mock-1',
    'stg-mock-2a',
    'stg-mock-3'
  ),
  (
    'sln-mock-4',
    'fnl-mock-1',
    'stg-mock-2b',
    'stg-mock-3'
  );
-- Mock Stage Items (distributed across split paths)
INSERT INTO stage_items (id, "stageId", name, description, type, content)
VALUES (
    'sti-mock-1',
    'stg-mock-1',
    'Hero Text',
    'Main landing page copy',
    'text',
    'Discover the future of productivity with our revolutionary AI-powered tool'
  ),
  (
    'sti-mock-2',
    'stg-mock-1',
    'Product Video',
    'Product demo video',
    'video',
    'https://example.com/mock-product-video'
  ),
  (
    'sti-mock-3',
    'stg-mock-2a',
    'Feature List',
    'Product features',
    'text',
    'Key Features: 1. AI-powered automation 2. Seamless integration 3. Real-time analytics'
  ),
  (
    'sti-mock-4',
    'stg-mock-2a',
    'Technical Demo',
    'Interactive product demo',
    'text',
    'See how our AI technology works in real-time'
  ),
  (
    'sti-mock-5',
    'stg-mock-2b',
    'Pricing Table',
    'Product pricing options',
    'text',
    'Basic: $10/mo, Pro: $25/mo, Enterprise: Custom'
  ),
  (
    'sti-mock-6',
    'stg-mock-2b',
    'ROI Calculator',
    'Value estimation tool',
    'text',
    'Calculate your potential savings and benefits'
  ),
  (
    'sti-mock-7',
    'stg-mock-3',
    'Purchase Form',
    'Checkout form',
    'text',
    'Simple and secure checkout process'
  ),
  (
    'sti-mock-8',
    'stg-mock-3',
    'Testimonials',
    'Customer reviews',
    'text',
    'See what our happy customers are saying'
  );
-- Mock Persona Config
INSERT INTO persona_configs (
    id,
    "projectId",
    name,
    description,
    type,
    size,
    constraints,
    demographics,
    psychographics,
    behavior
  )
VALUES (
    'pcg-mock-1',
    'prj-mock-1',
    'Tech-Savvy Professionals',
    'Professional users interested in productivity tools',
    'custom',
    10,
    'Tech professionals aged 25-45',
    '{"age_range": [25, 45], "occupation": "Technology"}'::jsonb,
    '{"interests": ["technology", "productivity", "innovation"]}'::jsonb,
    '{"budget_range": [100, 1000], "decision_speed": "medium"}'::jsonb
  );
-- Mock Personas (10 personas)
INSERT INTO personas (
    id,
    "personaConfigId",
    name,
    demographic,
    psychographic,
    behavior
  )
SELECT 'prs-mock-' || generate_series,
  'pcg-mock-1',
  'Persona ' || generate_series,
  format(
    '{"age": %s, "occupation": "Tech Professional"}',
    (25 + (generate_series % 20))
  )::jsonb,
  '{"interests": ["technology", "productivity"], "personality": "analytical"}'::jsonb,
  format(
    '{"budget": %s, "decision_speed": "medium"}',
    (200 + (generate_series * 100))
  )::jsonb
FROM generate_series(1, 10);
-- Mock Simulation
INSERT INTO simulations (
    id,
    "funnelId",
    "personaConfigId",
    status,
    "completeCount"
  )
VALUES (
    'sim-mock-1',
    'fnl-mock-1',
    'pcg-mock-1',
    'complete',
    10
  );
-- Mock Simulation Stages
INSERT INTO simulation_stages (
    "simulationId",
    "stageId",
    status,
    "completeCount"
  )
VALUES ('sim-mock-1', 'stg-mock-1', 'idle', 10),
  ('sim-mock-1', 'stg-mock-2a', 'idle', 4),
  ('sim-mock-1', 'stg-mock-2b', 'idle', 3),
  ('sim-mock-1', 'stg-mock-3', 'idle', 5);
-- Mock Responses with realistic content and coherent progression
INSERT INTO responses (
    id,
    "simulationId",
    "personaId",
    "stageId",
    "stageItemId",
    response,
    sentiment,
    proceed,
    "proceedReason"
  )
VALUES -- Persona 1 (Complete Journey through Features Path)
  (
    'res-mock-101',
    'sim-mock-1',
    'prs-mock-1',
    'stg-mock-1',
    'sti-mock-1',
    'The value proposition resonates strongly with my needs for AI automation',
    0.85,
    true,
    'Clear understanding of product benefits and potential ROI'
  ),
  (
    'res-mock-102',
    'sim-mock-1',
    'prs-mock-1',
    'stg-mock-1',
    'sti-mock-2',
    'Product demo effectively showcases the key functionalities I need',
    0.75,
    true,
    'Visual demonstration confirmed product capabilities'
  ),
  (
    'res-mock-103',
    'sim-mock-1',
    'prs-mock-1',
    'stg-mock-2a',
    'sti-mock-3',
    'Comprehensive feature set aligns with our technical requirements',
    0.90,
    true,
    'Features match our technical needs perfectly'
  ),
  (
    'res-mock-104',
    'sim-mock-1',
    'prs-mock-1',
    'stg-mock-2a',
    'sti-mock-4',
    'Interactive demo provided deep technical insights',
    0.85,
    true,
    'Technical capabilities exceed expectations'
  ),
  (
    'res-mock-105',
    'sim-mock-1',
    'prs-mock-1',
    'stg-mock-3',
    'sti-mock-7',
    'Straightforward purchase process with clear terms',
    0.80,
    true,
    'Confident in proceeding with purchase'
  ),
  (
    'res-mock-106',
    'sim-mock-1',
    'prs-mock-1',
    'stg-mock-3',
    'sti-mock-8',
    'Customer testimonials validate our use case',
    0.75,
    true,
    'Strong social proof from similar companies'
  ),
  -- Persona 2 (Complete Journey through Features Path)
  (
    'res-mock-201',
    'sim-mock-1',
    'prs-mock-2',
    'stg-mock-1',
    'sti-mock-1',
    'AI capabilities seem promising for our workflow',
    0.70,
    true,
    'Value proposition matches our needs'
  ),
  (
    'res-mock-202',
    'sim-mock-1',
    'prs-mock-2',
    'stg-mock-1',
    'sti-mock-2',
    'Demo shows relevant use cases for our team',
    0.65,
    true,
    'Product functionality appears suitable'
  ),
  (
    'res-mock-203',
    'sim-mock-1',
    'prs-mock-2',
    'stg-mock-2a',
    'sti-mock-3',
    'Feature set covers our primary requirements',
    0.75,
    true,
    'Core features align with needs'
  ),
  (
    'res-mock-204',
    'sim-mock-1',
    'prs-mock-2',
    'stg-mock-2a',
    'sti-mock-4',
    'Technical demo validates integration capabilities',
    0.70,
    true,
    'Integration requirements met'
  ),
  (
    'res-mock-205',
    'sim-mock-1',
    'prs-mock-2',
    'stg-mock-3',
    'sti-mock-7',
    'Purchase process is clear but need internal approval',
    0.60,
    true,
    'Ready to proceed pending approval'
  ),
  (
    'res-mock-206',
    'sim-mock-1',
    'prs-mock-2',
    'stg-mock-3',
    'sti-mock-8',
    'Testimonials provide relevant success stories',
    0.65,
    true,
    'Confidence from peer reviews'
  ),
  -- Persona 3 (Drops off at Decision stage - Features Path)
  (
    'res-mock-301',
    'sim-mock-1',
    'prs-mock-3',
    'stg-mock-1',
    'sti-mock-1',
    'Interesting AI capabilities but need more details',
    0.60,
    true,
    'Worth exploring further'
  ),
  (
    'res-mock-302',
    'sim-mock-1',
    'prs-mock-3',
    'stg-mock-1',
    'sti-mock-2',
    'Demo shows potential but raises integration questions',
    0.55,
    true,
    'Need to evaluate technical fit'
  ),
  (
    'res-mock-303',
    'sim-mock-1',
    'prs-mock-3',
    'stg-mock-2a',
    'sti-mock-3',
    'Features seem comprehensive but complex',
    0.50,
    true,
    'Need to assess implementation effort'
  ),
  (
    'res-mock-304',
    'sim-mock-1',
    'prs-mock-3',
    'stg-mock-2a',
    'sti-mock-4',
    'Technical requirements might be challenging',
    0.45,
    true,
    'Technical evaluation needed'
  ),
  (
    'res-mock-305',
    'sim-mock-1',
    'prs-mock-3',
    'stg-mock-3',
    'sti-mock-7',
    'Purchase process requires too much commitment',
    -0.20,
    false,
    'Implementation complexity concerns'
  ),
  (
    'res-mock-306',
    'sim-mock-1',
    'prs-mock-3',
    'stg-mock-3',
    'sti-mock-8',
    'Case studies dont match our scale',
    -0.30,
    false,
    'Risk seems too high for our size'
  ),
  -- Persona 4 (Complete Journey through Pricing Path)
  (
    'res-mock-401',
    'sim-mock-1',
    'prs-mock-4',
    'stg-mock-1',
    'sti-mock-1',
    'Value proposition focuses on key benefits',
    0.75,
    true,
    'Clear potential for ROI'
  ),
  (
    'res-mock-402',
    'sim-mock-1',
    'prs-mock-4',
    'stg-mock-1',
    'sti-mock-2',
    'Product demonstration shows good value',
    0.70,
    true,
    'Functionality justifies investment'
  ),
  (
    'res-mock-403',
    'sim-mock-1',
    'prs-mock-4',
    'stg-mock-2b',
    'sti-mock-5',
    'Pricing structure aligns with our budget',
    0.80,
    true,
    'Pricing fits within budget constraints'
  ),
  (
    'res-mock-404',
    'sim-mock-1',
    'prs-mock-4',
    'stg-mock-2b',
    'sti-mock-6',
    'ROI calculator shows compelling returns',
    0.85,
    true,
    'Clear financial benefits'
  ),
  (
    'res-mock-405',
    'sim-mock-1',
    'prs-mock-4',
    'stg-mock-3',
    'sti-mock-7',
    'Purchase terms are acceptable',
    0.75,
    true,
    'Ready to proceed with investment'
  ),
  (
    'res-mock-406',
    'sim-mock-1',
    'prs-mock-4',
    'stg-mock-3',
    'sti-mock-8',
    'Success stories demonstrate good ROI',
    0.70,
    true,
    'Validated by peer experiences'
  ),
  -- Persona 5 (Drops off at Decision stage - Pricing Path)
  (
    'res-mock-501',
    'sim-mock-1',
    'prs-mock-5',
    'stg-mock-1',
    'sti-mock-1',
    'Product benefits seem valuable',
    0.65,
    true,
    'Interested in cost-benefit analysis'
  ),
  (
    'res-mock-502',
    'sim-mock-1',
    'prs-mock-5',
    'stg-mock-1',
    'sti-mock-2',
    'Demo suggests good potential',
    0.60,
    true,
    'Worth exploring pricing options'
  ),
  (
    'res-mock-503',
    'sim-mock-1',
    'prs-mock-5',
    'stg-mock-2b',
    'sti-mock-5',
    'Pricing tiers need clarification',
    0.40,
    true,
    'Need to evaluate cost structure'
  ),
  (
    'res-mock-504',
    'sim-mock-1',
    'prs-mock-5',
    'stg-mock-2b',
    'sti-mock-6',
    'ROI calculations seem optimistic',
    0.30,
    true,
    'Uncertain about projected returns'
  ),
  (
    'res-mock-505',
    'sim-mock-1',
    'prs-mock-5',
    'stg-mock-3',
    'sti-mock-7',
    'Total cost of ownership concerns',
    -0.40,
    false,
    'Budget constraints and hidden costs'
  ),
  (
    'res-mock-506',
    'sim-mock-1',
    'prs-mock-5',
    'stg-mock-3',
    'sti-mock-8',
    'Need more similar case studies',
    -0.35,
    false,
    'Insufficient proof for our industry'
  ),
  -- Persona 6 (Drops off at Features Path)
  (
    'res-mock-601',
    'sim-mock-1',
    'prs-mock-6',
    'stg-mock-1',
    'sti-mock-1',
    'Initial value proposition is interesting',
    0.55,
    true,
    'Worth investigating features'
  ),
  (
    'res-mock-602',
    'sim-mock-1',
    'prs-mock-6',
    'stg-mock-1',
    'sti-mock-2',
    'Demo raises technical questions',
    0.45,
    true,
    'Need to verify technical fit'
  ),
  (
    'res-mock-603',
    'sim-mock-1',
    'prs-mock-6',
    'stg-mock-2a',
    'sti-mock-3',
    'Features seem too complex for our needs',
    -0.30,
    false,
    'Complexity exceeds our requirements'
  ),
  (
    'res-mock-604',
    'sim-mock-1',
    'prs-mock-6',
    'stg-mock-2a',
    'sti-mock-4',
    'Technical implementation looks challenging',
    -0.40,
    false,
    'Integration effort too high'
  ),
  -- Persona 7 (Drops off at Pricing Path)
  (
    'res-mock-701',
    'sim-mock-1',
    'prs-mock-7',
    'stg-mock-1',
    'sti-mock-1',
    'Value proposition is compelling',
    0.50,
    true,
    'Interested in cost details'
  ),
  (
    'res-mock-702',
    'sim-mock-1',
    'prs-mock-7',
    'stg-mock-1',
    'sti-mock-2',
    'Demo shows relevant capabilities',
    0.45,
    true,
    'Need to evaluate pricing'
  ),
  (
    'res-mock-703',
    'sim-mock-1',
    'prs-mock-7',
    'stg-mock-2b',
    'sti-mock-5',
    'Pricing exceeds our budget',
    -0.50,
    false,
    'Cost beyond available budget'
  ),
  (
    'res-mock-704',
    'sim-mock-1',
    'prs-mock-7',
    'stg-mock-2b',
    'sti-mock-6',
    'ROI timeline too long',
    -0.45,
    false,
    'Investment recovery period too extended'
  ),
  -- Persona 8 (Drops off at Awareness)
  (
    'res-mock-801',
    'sim-mock-1',
    'prs-mock-8',
    'stg-mock-1',
    'sti-mock-1',
    'Value proposition not relevant',
    -0.40,
    false,
    'Product not aligned with current needs'
  ),
  (
    'res-mock-802',
    'sim-mock-1',
    'prs-mock-8',
    'stg-mock-1',
    'sti-mock-2',
    'Demo doesnt address our use case',
    -0.45,
    false,
    'Use cases dont match our requirements'
  ),
  -- Persona 9 (Drops off at Awareness)
  (
    'res-mock-901',
    'sim-mock-1',
    'prs-mock-9',
    'stg-mock-1',
    'sti-mock-1',
    'Not the solution were looking for',
    -0.60,
    false,
    'Different solution direction needed'
  ),
  (
    'res-mock-902',
    'sim-mock-1',
    'prs-mock-9',
    'stg-mock-1',
    'sti-mock-2',
    'Product capabilities dont match needs',
    -0.55,
    false,
    'Feature set misaligned with requirements'
  ),
  -- Persona 10 (Drops off at Awareness)
  (
    'res-mock-1001',
    'sim-mock-1',
    'prs-mock-10',
    'stg-mock-1',
    'sti-mock-1',
    'Not ready for this type of solution',
    -0.70,
    false,
    'Organization not mature enough for implementation'
  ),
  (
    'res-mock-1002',
    'sim-mock-1',
    'prs-mock-10',
    'stg-mock-1',
    'sti-mock-2',
    'Too advanced for current needs',
    -0.65,
    false,
    'Solution complexity exceeds current capabilities'
  );