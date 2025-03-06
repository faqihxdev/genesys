const OpenAI = require('openai');
// const { db } = require('@/db');
// const { responses, summary, summaryStages, simulations, simulationStages } = require('@/db/schema');

// Ensure API key is available
if (!process.env.OPENAI_API_KEY) {
    throw new Error("API Key does not exist");
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Fetch necessary data from the database
 */
// async function fetchSimulationData(simulationId) {
//   const simulation = await db.query.simulations.findFirst({
//     where: (s) => s.id.eq(simulationId),
//   });

//   if (!simulation) throw new Error('Simulation not found');

//   const personasList = await db.query.personas.findMany({
//     where: (p) => p.personaConfigId.eq(simulation.personaConfigId),
//   });

//   const stageList = await db.query.stages.findMany({
//     where: (s) => s.funnelId.eq(simulation.funnelId),
//   });

//   const stageItemsList = await db.query.stageItems.findMany({
//     where: (si) => si.stageId.in(stageList.map((s) => s.id)),
//   });

//   return { simulation, personasList, stageList, stageItemsList };
// }

/**
 * Dummy Data for Testing
 */
async function fetchSimulationData(simulationId) {
    // Simulated simulation object
    const simulation = {
      id: simulationId,
      funnelId: "funnel-123",
      personaConfigId: "personaconfig-456",
      status: "completed",
      completeCount: 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  
    // Simulated personas associated with this simulation
    const personasList = [
      {
        id: "prs-001",
        personaConfigId: "personaconfig-456",
        name: "John Doe",
        demographics: {
          age: 30,
          gender: "male",
          location: "USA",
          income: 80000,
          education: "Bachelor’s Degree",
          occupation: "Software Engineer",
          maritalStatus: "Single",
          ethnicity: "Caucasian"
        },
        psychographics: {
          values: ["innovation", "efficiency"],
          interests: ["AI", "gadgets"],
          personalityTraits: ["analytical", "curious"],
          lifestyleChoices: ["eco-friendly"],
          mediaConsumptionPreferences: ["YouTube", "Tech Blogs"]
        },
        behavior: {
          budget: 1000,
          brandAffinity: ["Apple", "Tesla"],
          responsiveness: "quick decision-maker",
          spendingHabits: "premium spender",
          decisionMakingSpeed: "research-driven",
          responseToMarketing: "brand loyalist"
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "prs-002",
        personaConfigId: "persona-config-456",
        name: "Jane Smith",
        demographics: {
          age: 28,
          gender: "female",
          location: "UK",
          income: 50000,
          education: "Master’s Degree",
          occupation: "Environmental Consultant",
          maritalStatus: "Married",
          ethnicity: "Asian"
        },
        psychographics: {
          values: ["sustainability", "minimalism"],
          interests: ["green tech", "organic food"],
          personalityTraits: ["conscious", "thoughtful"],
          lifestyleChoices: ["sustainable living"],
          mediaConsumptionPreferences: ["Podcasts", "Eco Blogs"]
        },
        behavior: {
          budget: 500,
          brandAffinity: ["Patagonia", "Tesla"],
          responsiveness: "moderate decision-maker",
          spendingHabits: "conservative spender",
          decisionMakingSpeed: "slow, research-driven",
          responseToMarketing: "value-driven"
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];    
  
    // Simulated stages of the funnel
    const stageList = [
      {
        id: "stg-001",
        funnelId: "funnel-123",
        name: "Awareness",
        description: "Introduction to the product",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "stg-002",
        funnelId: "funnel-123",
        name: "Consideration",
        description: "Customer reviews and comparisons",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "stg-003",
        funnelId: "funnel-123",
        name: "Decision",
        description: "Final purchase decision-making",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  
    // Simulated stage items
    const stageItemsList = [
      {
        id: "sti-001",
        stageId: "stg-001",
        name: "Intro Video",
        description: "Short product introduction video",
        type: "video",
        content: "https://example.com/video.mp4",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "sti-002",
        stageId: "stg-002",
        name: "Customer Testimonials",
        description: "Real feedback from satisfied customers",
        type: "text",
        content: "This product changed my life!",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "sti-003",
        stageId: "stg-003",
        name: "Discount Offer",
        description: "Limited-time discount for first-time buyers",
        type: "image",
        content: "https://example.com/discount.jpg",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  
    return { simulation, personasList, stageList, stageItemsList };
}

/**
 * Generate insights using OpenAI LLM
 */
async function generateInsights(simulationData) {
    const prompt = `
    # Marketing Funnel Simulation Analysis
    
    ## Context:
    This simulation models how different personas interact with a **marketing funnel** by progressing through its stages.
    The goal is to analyze user engagement, sentiment, and conversion rates to identify **key trends** and **areas for improvement**.
    
    ## Simulation Details:
    - **Simulation ID**: ${simulationData.simulation.id}
    - **Funnel ID**: ${simulationData.simulation.funnelId}
    - **Persona Config ID**: ${simulationData.simulation.personaConfigId}
    - **Personas Involved**: ${simulationData.personasList.map((p) => 
      `ID: ${p.id}, Name: ${p.name}, 
      Demographics: Age: ${p.demographics.age}, Gender: ${p.demographics.gender}, Location: ${p.demographics.location}, 
      Income: ${p.demographics.income}, Education: ${p.demographics.education}, Occupation: ${p.demographics.occupation}, 
      Marital Status: ${p.demographics.maritalStatus}, Ethnicity: ${p.demographics.ethnicity}, 
      Psychographics: Values: ${p.psychographics.values.join(', ')}, Interests: ${p.psychographics.interests.join(', ')}, 
      Personality Traits: ${p.psychographics.personalityTraits.join(', ')}, Lifestyle Choices: ${p.psychographics.lifestyleChoices.join(', ')}, 
      Media Consumption Preferences: ${p.psychographics.mediaConsumptionPreferences.join(', ')}, 
      Behavior: Budget: ${p.behavior.budget}, Brand Affinity: ${p.behavior.brandAffinity.join(', ')}, 
      Responsiveness: ${p.behavior.responsiveness}, Spending Habits: ${p.behavior.spendingHabits}, 
      Decision Making Speed: ${p.behavior.decisionMakingSpeed}, Response to Marketing: ${p.behavior.responseToMarketing}`    ).join(', ')}
    - **Marketing Stages**: ${simulationData.stageList.map((s) => 
      `ID: ${s.id}, Name: ${s.name}, Description: ${s.description}, Funnel ID: ${s.funnelId}`
      ).join(', ')}    
    - **Stage Items (Content Used)**: ${simulationData.stageItemsList.map((si) => 
      `- Stage Item ID: ${si.stageItemId}, Content: ${si.content}, Description: ${si.description}, Type: ${si.type}`
      ).join('\n')}
    
    ## Expected Output:
    Generate a structured JSON response based on the following schema:
    
    **1. Simulation Overview (simulation):**
    - ID, Funnel ID, Persona Config ID
    - Overall status
    - Total count of personas who completed all stages
    
    **2. Stage-Level Insights (simulationStages):**
    - Simluation ID, Stage ID
    - Status of the stage
    - Total count of personas who completed all stages
    
    **3. Summary Per Stage (summaryStages):**
    - ID, Simulation ID, Stage ID
    - Conversion rate at each stage
    - Aggregate sentiment score
    - Insights on persona engagement
    - Recommendations to improve performance
    
    **4. Overall Summary (summary):**
    - ID, Simulation ID
    - Funnel-wide conversion rate
    - Overall sentiment
    - Key insights on marketing effectiveness
    - Final recommendations
    
    **5. Persona Responses (responses):**
    - ID, Simulation ID, Persona ID, Stage ID, Stage Item ID
    - Individual persona interactions at each stage for each stage item
    - Response content
    - Sentiment score (-1 to 1)
    - Whether the persona proceeded to the next stage
    - The reason for proceeding or dropping out
    
    ## Output Format:
    {
        "simulation": { 
            "id": "${simulationData.simulation.id}", 
            "funnelId": "${simulationData.simulation.funnelId}", 
            "personaConfigId": "${simulationData.simulation.personaConfigId}", 
            "status": "completed", 
            "completeCount": 100
        },
        "simulationStages": [
        { 
            "simulationId": "${simulationData.simulation.id}", 
            "stageId": "...", 
            "status": "completed", 
            "completeCount": 80 
        }
        ],
        "summaryStages": [
        { 
            "id": "...", 
            "simulationId": "${simulationData.simulation.id}", 
            "stageId": "...", 
            "conversionRate": 0.7, 
            "sentiment": 0.80, 
            "summary": "...", 
            "recommendation": "..." 
        }
        ],
        "summary": { 
            "id": "...", 
            "simulationId": "${simulationData.simulation.id}", 
            "conversionRate": 0.65, 
            "sentiment": 0.80, 
            "summary": "...", 
            "recommendation": "..." 
        },
        "responses": [
        { 
            "id": "...", 
            "simulationId": "${simulationData.simulation.id}", 
            "personaId": "...", 
            "stageId": "...", 
            "stageItemId": "...", 
            "response": "...", 
            "sentiment": 0.9, 
            "proceed": true, 
            "proceedReason": "..." 
        }
        ]
    }
    `;
    
    const response = await openai.chat.completions.create({
      model: 'o3-mini',  // Replace with the correct model name
      messages: [
          { role: 'system', content: 'You are an AI that generates structured marketing insights based on a simulated funnel.' },
          { role: 'user', content: prompt }
      ],
    });
    
    const output = response.choices[0].message.content;

    try {
      const output = response.choices[0].message.content;
      console.log("Generated Response:", output);
  
      const jsonResponse = JSON.parse(output);
      console.log("Parsed JSON Response:", jsonResponse);
  } catch (error) {
      console.error("Error processing response:", error);
  }
  
  }

/**
 * Store the LLM-generated insights into the database
 */
async function storeGeneratedData(generatedData) {
  // Insert into simulations table
  await db.insert(simulations).values(generatedData.simulation);

  // Insert into simulationStages table
  await db.insert(simulationStages).values(generatedData.simulationStages);

  // Insert into summaryStages table
  await db.insert(summaryStages).values(generatedData.summaryStages);

  // Insert into summary table
  await db.insert(summary).values(generatedData.summary);

  // Insert into responses table
  await db.insert(responses).values(generatedData.responses);
}

/**
 * Main function to execute the pipeline
 */
async function processSimulation(simulationId) {
  try {
    console.log(`Fetching data for simulation: ${simulationId}`);
    const simulationData = await fetchSimulationData(simulationId);

    console.log('Generating insights using LLM...');
    const generatedData = await generateInsights(simulationData);
    // console.log('Generated insights:', generatedData);

    // console.log('Storing generated insights into the database...');
    // await storeGeneratedData(generatedData);

    console.log('Process completed successfully!');
  } catch (error) {
    console.error('Error processing simulation:', error);
  }
}

processSimulation('sim-123');