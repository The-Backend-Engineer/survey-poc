import mongoose from 'mongoose';
import { Store, Survey } from './src/index';
import { faker } from '@faker-js/faker';

// Connect to MongoDB
mongoose.connect('mongodb+srv://kalpesh:vDMw0dDJS0T5diNp@survey-ins-1.9tczk.mongodb.net/survey-app')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Helper functions to generate survey content
const generateMultipleChoiceQuestion = () => ({
  questionText: faker.helpers.arrayElement([
    'How satisfied are you with our product quality?',
    'Which feature do you use most frequently?',
    'How likely are you to recommend us to others?',
    'What is your preferred shopping time?',
    'Which category interests you the most?'
  ]),
  questionType: 'multiple_choice',
  options: Array(faker.number.int({ min: 3, max: 5 }))
    .fill(null)
    .map(() => faker.word.sample()),
  required: faker.datatype.boolean() // Added required field
});

const generateTextQuestion = () => ({
  questionText: faker.helpers.arrayElement([
    'What improvements would you suggest for our service?',
    'Please describe your recent shopping experience.',
    'What additional products would you like to see?',
    'How can we better serve your needs?',
    'What made you choose our store?'
  ]),
  questionType: 'text',
  options: [],
  required: faker.datatype.boolean() // Added required field
});

const generateRatingQuestion = () => ({
  questionText: faker.helpers.arrayElement([
    'Rate our customer service',
    'How would you rate the checkout experience?',
    'Rate the ease of navigation on our website',
    'Rate our delivery service',
    'How would you rate our price competitiveness?'
  ]),
  questionType: 'rating',
  options: [],
  required: faker.datatype.boolean() // Added required field
});

// Survey categories with specific configurations
const surveyTemplates = [
  {
    type: 'Customer Satisfaction',
    questionCount: { min: 3, max: 5 },
    distribution: { multiple_choice: 0.4, rating: 0.4, text: 0.2 }
  },
  {
    type: 'Product Feedback',
    questionCount: { min: 4, max: 6 },
    distribution: { multiple_choice: 0.5, rating: 0.3, text: 0.2 }
  },
  {
    type: 'Website Experience',
    questionCount: { min: 3, max: 4 },
    distribution: { rating: 0.6, text: 0.4 }
  },
  {
    type: 'Post-Purchase',
    questionCount: { min: 2, max: 4 },
    distribution: { multiple_choice: 0.3, rating: 0.4, text: 0.3 }
  }
];

const generateQuestions = (template: any) => {
  const questionCount = faker.number.int({
    min: template.questionCount.min,
    max: template.questionCount.max
  });
  
  const questions = [];
  for (let i = 0; i < questionCount; i++) {
    const rand = Math.random();
    let question;
    
    if (rand < template.distribution.multiple_choice) {
      question = generateMultipleChoiceQuestion();
    } else if (rand < template.distribution.multiple_choice + template.distribution.rating) {
      question = generateRatingQuestion();
    } else {
      question = generateTextQuestion();
    }
    
    questions.push(question);
  }
  
  return questions;
};

async function seedSurveys() {
  try {
    // Clear existing surveys
    await Survey.deleteMany({});
    
    // Create a test store if none exists
    let store = await Store.findOne();
    if (!store) {
      store = await Store.create({
        shopifyDomain: 'test-store.myshopify.com',
        accessToken: 'test_token',
        email: 'store@example.com'
      });
    }
    
    // Generate 100 surveys
    const surveys = [];
    for (let i = 0; i < 100; i++) {
      const template = faker.helpers.arrayElement(surveyTemplates);
      
      const survey = {
        storeId: store._id,
        title: `${template.type}: ${faker.commerce.productName()} Survey`,
        questions: generateQuestions(template),
        active: faker.datatype.boolean({ probability: 0.8 }),
        createdAt: faker.date.past({ years: 1 }),
        targetAudience: {
          newCustomers: faker.datatype.boolean(),
          returningCustomers: faker.datatype.boolean(),
          cartValue: {
            min: faker.number.int({ min: 0, max: 100 }),
            max: faker.number.int({ min: 100, max: 500 })
          },
          productCategories: [faker.commerce.department(), faker.commerce.department()]
        },
        displayRules: {
          displayDelay: faker.number.int({ min: 0, max: 10 }),
          displayLocation: ['homepage', 'checkout'],
          maxDisplaysPerUser: faker.number.int({ min: 1, max: 5 }),
          startDate: faker.date.past({ years: 1 }),
          endDate: faker.date.future({ years: 1 })
        },
        style: {
          primaryColor: faker.color.human(),
          backgroundColor: faker.color.human(),
          fontFamily: faker.word.sample()
        }
      };
      
      surveys.push(survey);
    }
    
    // Insert all surveys
    await Survey.insertMany(surveys);
    console.log('Successfully seeded 100 surveys');
    
    // Log some statistics
    const stats = await Survey.aggregate([
      {
        $unwind: '$questions'
      },
      {
        $group: {
          _id: '$questions.questionType',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('\nQuestion Type Distribution:');
    console.table(stats);
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Seeding error:', error);
    mongoose.disconnect();
  }
}

// Run the seeder
seedSurveys();