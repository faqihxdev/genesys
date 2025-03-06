const OpenAI = require("openai");
const API_KEY = process.env.OPENAI_API_KEY;

if (!API_KEY) {
  throw new Error("API Key does not exist");
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: API_KEY,
});

/**
 * @description Generates personas based on a given persona configuration.
 * @param {Object} personaConfig - The configuration for persona generation.
 * @returns {Promise<Object[]>} A list of generated personas.
 */
async function generatePersonas(personaConfig) {
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
      model: "gpt-4",
      messages: [{ role: "user", content: promptTemplate }],
      temperature: 0.7,
    });

    const jsonOutput = response.choices[0]?.message?.content;

    try {
      return JSON.parse(jsonOutput);
    } catch (error) {
      console.error("Error parsing JSON:", error);
      return [];
    }
  } catch (error) {
    console.error("Error in generatePersonas:", error);
    return [];
  }
}

// Persona config dummy data
const personaConfig = {
  name: "Tech Enthusiasts",
  description: "A group of individuals who are passionate about technology and innovation.",
  type: "preset",
  size: 2,
  constraints: { ageRange: [20, 40], location: ["USA", "UK"] },
  demographics: {
    // age: { min: 20, max: 40 },
    gender: ["Male", "Female"],
    occupation: "Software Engineer",
    education: "Bachelor’s Degree",
    income: { min: 60000, max: 150000 },
    maritalStatus: "Single",
    ethnicity: "Various",
  },
  psychographics: {
    interests: ["AI", "Startups"],
    values: ["innovation", "growth"],
    personalityTraits: ["analytical", "curious"],
    lifestyleChoices: ["tech-savvy", "early adopter"],
    mediaConsumptionPreferences: ["YouTube", "Tech Blogs"],
  },
  behavior: {
    budget: { min: 1000, max: 5000 },
    brandAffinity: ["Apple", "Tesla"],
    responsiveness: "fast decision-maker",
    spendingHabits: "premium spender",
    decisionMakingSpeed: "research-driven",
    responseToMarketing: "quality-oriented",
  },
};


// Generate personas
generatePersonas(personaConfig).then((personas) => {
  console.log("Generated Personas:", JSON.stringify(personas, null, 2));
});
