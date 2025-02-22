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
-- Mock Stages (now with split paths)
INSERT INTO stages (
    id,
    "funnelId",
    "parentId",
    "childId",
    name,
    description
  )
VALUES (
    'stg-mock-1',
    'fnl-mock-1',
    NULL,
    NULL,
    -- No direct child, splits into 2A and 2B
    'Awareness',
    'Landing page to introduce the product'
  ),
  (
    'stg-mock-2a',
    'fnl-mock-1',
    'stg-mock-1',
    'stg-mock-3',
    'Features Path',
    'Detailed product features and capabilities'
  ),
  (
    'stg-mock-2b',
    'fnl-mock-1',
    'stg-mock-1',
    'stg-mock-3',
    'Pricing Path',
    'Pricing plans and value proposition'
  ),
  (
    'stg-mock-3',
    'fnl-mock-1',
    NULL,
    -- Multiple parents (2A and 2B)
    NULL,
    'Decision',
    'Checkout and purchase process'
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
-- Create a temporary table to track persona progression through split paths
WITH persona_progression AS (
  SELECT p.series as persona_num,
    CASE
      WHEN p.series <= 8 THEN true -- 8 personas proceed past stage 1
      ELSE false
    END as passed_stage_1,
    CASE
      WHEN p.series <= 5 THEN 'path_a' -- 5 personas go to path A (Features)
      WHEN p.series <= 8 THEN 'path_b' -- 3 personas go to path B (Pricing)
      ELSE NULL
    END as chosen_path,
    CASE
      WHEN p.series <= 4
      AND p.series <= 5 THEN true -- 4 proceed from path A
      WHEN p.series <= 6
      AND p.series <= 8 THEN true -- 2 proceed from path B
      ELSE false
    END as passed_stage_2,
    CASE
      WHEN p.series <= 4 THEN true -- 4 complete the final stage
      ELSE false
    END as passed_stage_3
  FROM generate_series(1, 10) p(series)
) -- Mock Responses (for each persona and each stage item, respecting split paths)
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
SELECT 'res-mock-' || (p.persona_num * 100 + i.series),
  'sim-mock-1',
  'prs-mock-' || p.persona_num,
  CASE
    WHEN i.series <= 2 THEN 'stg-mock-1'
    WHEN i.series <= 4
    AND p.chosen_path = 'path_a' THEN 'stg-mock-2a'
    WHEN i.series <= 6
    AND p.chosen_path = 'path_b' THEN 'stg-mock-2b'
    ELSE 'stg-mock-3'
  END,
  'sti-mock-' || i.series,
  CASE
    WHEN random() > 0.5 THEN 'Positive interaction with the content'
    ELSE 'Neutral interaction with the content'
  END,
  (random() * 2 - 1)::decimal(3, 2),
  CASE
    WHEN (
      i.series <= 2
      AND p.passed_stage_1
    )
    OR (
      i.series <= 4
      AND p.chosen_path = 'path_a'
      AND p.passed_stage_2
    )
    OR (
      i.series <= 6
      AND p.chosen_path = 'path_b'
      AND p.passed_stage_2
    )
    OR (
      i.series > 6
      AND p.passed_stage_3
    ) THEN true
    ELSE false
  END,
  CASE
    WHEN (
      i.series <= 2
      AND p.passed_stage_1
    )
    OR (
      i.series <= 4
      AND p.chosen_path = 'path_a'
      AND p.passed_stage_2
    )
    OR (
      i.series <= 6
      AND p.chosen_path = 'path_b'
      AND p.passed_stage_2
    )
    OR (
      i.series > 6
      AND p.passed_stage_3
    ) THEN 'Content was compelling and relevant'
    ELSE 'Need more information or not convinced'
  END
FROM persona_progression p
  CROSS JOIN generate_series(1, 8) i(series)
WHERE (i.series <= 2)
  OR -- Stage 1: All personas attempt
  (
    i.series <= 4
    AND p.chosen_path = 'path_a'
    AND p.passed_stage_1
  )
  OR -- Stage 2A: Features path
  (
    i.series <= 6
    AND p.chosen_path = 'path_b'
    AND p.passed_stage_1
  )
  OR -- Stage 2B: Pricing path
  (
    i.series <= 8
    AND p.passed_stage_2
  );
-- Stage 3: Only those who passed either path
-- Mock Simulation Stages
INSERT INTO simulation_stages (
    "simulationId",
    "stageId",
    status,
    "completeCount"
  )
VALUES ('sim-mock-1', 'stg-mock-1', 'idle', 8),
  ('sim-mock-1', 'stg-mock-2a', 'idle', 4),
  -- 4 complete features path
  ('sim-mock-1', 'stg-mock-2b', 'idle', 2),
  -- 2 complete pricing path
  ('sim-mock-1', 'stg-mock-3', 'idle', 4);
-- 4 complete final stage