const OpenAI = require('openai');
const { eq } = require('drizzle-orm');
// const { db } = require("@/db");
// const { personas, personaConfigs } = require("@/db/schema");

// Ensure API key is available
if (!process.env.OPENAI_API_KEY) {
  throw new Error('API Key does not exist');
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * @description Generates personas based on a given persona configuration.
 * @param {Object} personaConfig - The configuration for persona generation.
 * @returns {Promise<Object[]>} A list of generated personas.
 */
async function generatePersonas(personaConfig) {
  console.log('Generating personas...');
  try {
    const promptTemplate = `
    You are an AI that generates realistic and diverse personas based on a given persona configuration.

    ### **Input Persona Configuration:**
    {
      "name": "${personaConfig.name}",
      "description": "${personaConfig.description}",
      "type": "${personaConfig.type}",
      "size": ${personaConfig.size},
      "constraints": ${JSON.stringify(personaConfig.constraints)},
      "demographics": ${JSON.stringify(personaConfig.demographics)},
      "psychographics": ${JSON.stringify(personaConfig.psychographics)},
      "behavior": ${JSON.stringify(personaConfig.behavior)}
    }

    ### **Task:**
    - Generate **${personaConfig.size} personas** that follow the provided constraints.
    - Each persona should have distinct traits while aligning with the given demographics, psychographics, and behavior.

    ### **Persona Output Format (JSON)**
    [
      {
        "name": "Full Name",
        "demographics": {
          "age": 30,
          "gender": "Male",
          "location": "New York, USA",
          "income": 80000,
          "education": "Bachelor’s Degree",
          "occupation": "Software Engineer",
          "maritalStatus": "Single",
          "ethnicity": "Caucasian"
        },
        "psychographics": {
          "values": ["innovation", "sustainability"],
          "interests": ["AI", "Startups"],
          "personalityTraits": ["analytical", "curious"],
          "lifestyleChoices": ["eco-friendly"],
          "mediaConsumptionPreferences": ["YouTube", "Tech Blogs"]
        },
        "behavior": {
          "budget": 2000,
          "brandAffinity": ["Apple", "Tesla"],
          "responsiveness": "quick decision-maker",
          "spendingHabits": "premium spender",
          "decisionMakingSpeed": "research-driven",
          "responseToMarketing": "brand loyalist"
        }
      }
    ]
    `;

    const response = await openai.chat.completions.create({
      model: 'o3-mini',
      messages: [{ role: 'user', content: promptTemplate }],
    });

    const jsonOutput = response.choices[0]?.message?.content;

    try {
      return JSON.parse(jsonOutput);
    } catch (error) {
      console.error('Error parsing JSON:', error);
      return [];
    }
  } catch (error) {
    console.error('Error in generatePersonas:', error);
    return [];
  }
}

/**
 * Store the LLM-generated personas into the database
 */
async function storeGeneratedPersonas(generatedPersonas) {
  // Store generated personas in the database
  for (const persona of generatedPersonas) {
    await db.insert(personas).values({
      personaConfigId: personaConfigId,
      name: persona.name,
      description: personaConfig.description,
      demographic: persona.demographics,
      psychographic: persona.psychographics,
      behavior: persona.behavior,
    });
  }
}

/**
 * @description Retrieves a persona configuration from the database and generates personas.
 * @param {string} personaConfigId - The ID of the persona configuration.
 */
async function createPersonasFromConfig(personaConfigId) {
  try {
    // Retrieve persona configuration from the database
    const configData = await db
      .select()
      .from(personaConfigs)
      .where(eq(personaConfigs.id, personaConfigId))
      .limit(1);

    if (!configData.length) {
      console.error('Persona configuration not found');
      return;
    }

    const personaConfig = configData[0];

    // Generate personas using OpenAI
    console.log('Storing generated personas into the database...');
    await storeGeneratedPersonas(generatedPersonas);
    console.log(`Successfully stored ${generatedPersonas.length} personas in the database.`);
  } catch (error) {
    console.error('Error creating personas:', error);
  }
}

// createPersonasFromConfig("personaConfigId");

/**
 * Dummy Data for Testing
 */
const personaConfig = {
  name: 'Tech Enthusiasts',
  description: 'A group of individuals who are passionate about technology and innovation.',
  type: 'preset',
  size: 2,
  constraints: { ageRange: [20, 40], location: ['USA', 'UK'] },
  demographics: {
    // age: { min: 20, max: 40 },
    gender: ['Male', 'Female'],
    occupation: 'Software Engineer',
    education: 'Bachelor’s Degree',
    income: { min: 60000, max: 150000 },
    maritalStatus: 'Single',
    ethnicity: 'Various',
  },
  psychographics: {
    interests: ['AI', 'Startups'],
    values: ['innovation', 'growth'],
    personalityTraits: ['analytical', 'curious'],
    lifestyleChoices: ['tech-savvy', 'early adopter'],
    mediaConsumptionPreferences: ['YouTube', 'Tech Blogs'],
  },
  behavior: {
    budget: { min: 1000, max: 5000 },
    brandAffinity: ['Apple', 'Tesla'],
    responsiveness: 'fast decision-maker',
    spendingHabits: 'premium spender',
    decisionMakingSpeed: 'research-driven',
    responseToMarketing: 'quality-oriented',
  },
};

// Generate personas
generatePersonas(personaConfig).then((personas) => {
  console.log('Generated Personas:', JSON.stringify(personas, null, 2));
});
