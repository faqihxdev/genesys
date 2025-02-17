const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * @description Get color recommendation based on personality traits
 * @param {string[]} traits - List of personality traits
 * @returns {Object} Color recommendation with meaning
 */
function getColorRecommendation(traits) {
  const rainbowColors = {
    red: { meaning: "energy, passion, excitement" },
    orange: { meaning: "sociability, adventure, confidence" },
    yellow: { meaning: "optimism, cheerfulness, creativity" },
    green: { meaning: "balance, growth, harmony" },
    blue: { meaning: "calmness, trust, stability" },
    indigo: { meaning: "intuition, deep thinking, wisdom" },
    violet: { meaning: "creativity, spirituality, imagination" }
  };

  // This is a simple mock logic - in reality, you'd have more sophisticated matching
  const trait = traits[0].toLowerCase();
  let color = 'blue'; // default color

  if (trait.match(/energetic|passionate|bold/)) color = 'red';
  if (trait.match(/social|adventurous|friendly/)) color = 'orange';
  if (trait.match(/cheerful|optimistic|bright/)) color = 'yellow';
  if (trait.match(/balanced|peaceful|growing/)) color = 'green';
  if (trait.match(/calm|trustworthy|reliable/)) color = 'blue';
  if (trait.match(/thoughtful|wise|deep/)) color = 'indigo';
  if (trait.match(/creative|spiritual|artistic/)) color = 'violet';

  return {
    color,
    meaning: rainbowColors[color].meaning
  };
}

/**
 * @description Demonstrates personality-based color recommendation using OpenAI
 * @param {Object} personalityData - Personality data in JSON format
 */
async function demonstratePersonalityColors(personalityData) {
  try {
    const functions = [
      {
        name: 'get_color_recommendation',
        description: 'Get a rainbow color recommendation based on personality traits',
        parameters: {
          type: 'object',
          properties: {
            traits: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of personality traits to base the color recommendation on'
            }
          },
          required: ['traits']
        }
      }
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an insightful assistant that helps people discover their personality-matching rainbow color. You analyze their traits and select the most suitable color."
        },
        {
          role: "user",
          content: `Here is my personality data: ${JSON.stringify(personalityData)}. What rainbow color matches my personality?`
        }
      ],
      functions,
      function_call: 'auto'
    });

    const responseMessage = completion.choices[0].message;

    // Handle function calling if the model wants to use it
    if (responseMessage.function_call) {
      const functionName = responseMessage.function_call.name;
      const functionArgs = JSON.parse(responseMessage.function_call.arguments);

      if (functionName === 'get_color_recommendation') {
        const colorData = getColorRecommendation(functionArgs.traits);
        console.log('Color recommendation:', colorData);
      }
    }

    console.log('Response:', responseMessage.content);
  } catch (error) {
    console.error('Error in demonstratePersonalityColors:', error);
  }
}

// Example usage with sample personality data
const samplePersonalityData = {
  name: "Sarah",
  traits: ["creative", "energetic", "thoughtful"],
  interests: ["art", "music", "nature"],
  mood: "inspired"
};

// Execute the function
demonstratePersonalityColors(samplePersonalityData);
