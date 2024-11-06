import express, { Request } from 'express';
import mongoose from 'mongoose';
import { shopifyApi, LATEST_API_VERSION, Session } from '@shopify/shopify-api';
import dotenv from 'dotenv';
import '@shopify/shopify-api/adapters/node';
import { Document, ObjectId } from 'mongodb';
import { Types } from 'mongoose';

dotenv.config();

const app = express();
app.use(express.json());

// CORS middleware configuration
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});


// Enhanced interfaces for MongoDB models
interface ISurvey extends Document {
  _id: ObjectId;
  storeId: ObjectId;
  title: string;
  description?: string;
  questions: Array<{
    questionText: string;
    questionType: 'multiple_choice' | 'text' | 'rating';
    options: string[];
    required?: boolean;
  }>;
  active: boolean;
  priority: number;
  status: 'draft' | 'active' | 'paused' | 'completed';
  targetAudience: {
    newCustomers?: boolean;
    returningCustomers?: boolean;
    cartValue?: {
      min?: number;
      max?: number;
    };
    productCategories?: string[];
  };
  displayRules: {
    displayDelay?: number;
    displayLocation?: string[];
    maxDisplaysPerUser?: number;
    startDate?: Date;
    endDate?: Date;
  };
  scriptTagId?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface IStore extends Document {
  _id: ObjectId;
  shopifyDomain: string;
  accessToken: string;
  email: string;
  createdAt: Date;
}

interface ISurveyResponse extends Document {
  surveyId: ObjectId;
  responses: Array<{
    questionId: string;
    answer: any;
    timeSpent?: number;
  }>;
  customerEmail?: string;
  customerType?: 'new' | 'returning';
  totalTimeSpent: number;
  createdAt: Date;
}

interface ISurveyAnalytics extends Document {
  surveyId: ObjectId;
  views: number;
  completions: number;
  averageTimeSpent: number;
  completionRate: number;
  questionAnalytics: Array<{
    questionId: string;
    responses: number;
    skips: number;
    averageTimeSpent: number;
    responseDistribution?: {
      [key: string]: number;
    };
  }>;
  demographicData?: {
    newCustomers: number;
    returningCustomers: number;
    averageCartValue: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// interface Question {
//   _id?: string; // Add this line to include the _id property
//   questionText: string;
//   questionType: "multiple_choice" | "text" | "rating";
//   options: string[];
//   required?: boolean;
// }


// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/survey-app')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Enhanced Schemas
const StoreSchema = new mongoose.Schema({
  shopifyDomain: { type: String, required: true, unique: true },
  accessToken: { type: String, required: true },
  email: String,
  createdAt: { type: Date, default: Date.now },
  settings: {
    defaultSurveyStyle: {
      primaryColor: String,
      backgroundColor: String,
      fontFamily: String
    },
    notificationEmail: String,
    analyticsFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'weekly'
    }
  }
});

const SurveySchema = new mongoose.Schema({
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  title: { type: String, required: true },
  description: String,
  questions: [{
    questionText: { type: String, required: true },
    questionType: { 
      type: String, 
      enum: ['multiple_choice', 'text', 'rating', 'nps', 'checkbox'],
      required: true 
    },
    options: [String],
    required: { type: Boolean, default: false }
  }],
  active: { type: Boolean, default: false },
  priority: { 
    type: Number, 
    default: 0,
    index: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed'],
    default: 'draft',
    index: true
  },
 
  displayRules: {
    displayDelay: Number,
    displayLocation: [String],
    maxDisplaysPerUser: Number,
    startDate: Date,
    endDate: Date,
    displayFrequency: {
      type: String,
      enum: ['once', 'every_visit', 'daily', 'weekly'],
      default: 'once'
    }
  },
  style: {
    primaryColor: String,
    backgroundColor: String,
    fontFamily: String,
    customCSS: String
  },
  scriptTagId: String,
  targetAudience: {
    newCustomers: Boolean,
    returningCustomers: Boolean,
    orderValue: {
      lifetime: {
        min: Number,
        max: Number
      },
      average: {
        min: Number,
        max: Number
      }
    },
    orderCount: {
      min: Number,
      max: Number
    },
    purchaseHistory: {
      categories: [String],
      products: [String],
      lastPurchaseDays: {
        min: Number,
        max: Number
      }
    },
    customerTags: [String],
    visitFrequency: {
      min: Number,
      max: Number,
      periodDays: Number
    }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const SurveyResponseSchema = new mongoose.Schema({
  surveyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Survey', required: true },
  responses: [{
    questionId: String,
    answer: mongoose.Schema.Types.Mixed,
    timeSpent: Number
  }],
  customerEmail: String,
  customerType: {
    type: String,
    enum: ['new', 'returning'],
    required: true
  },
  totalTimeSpent: Number,
  metadata: {
    userAgent: String,
    deviceType: String,
    location: String,
    pageUrl: String
  },
  createdAt: { type: Date, default: Date.now }
});

const SurveyAnalyticsSchema = new mongoose.Schema({
  surveyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Survey', 
    required: true,
    index: true
  },
  views: { type: Number, default: 0 },
  completions: { type: Number, default: 0 },
  averageTimeSpent: { type: Number, default: 0 },
  completionRate: { type: Number, default: 0 },
  questionAnalytics: [{
    questionId: String,
    responses: { type: Number, default: 0 },
    skips: { type: Number, default: 0 },
    averageTimeSpent: { type: Number, default: 0 },
    responseDistribution: {
      type: Map,
      of: Number
    }
  }],
  demographicData: {
    newCustomers: { type: Number, default: 0 },
    returningCustomers: { type: Number, default: 0 },
    averageCartValue: { type: Number, default: 0 }
  },
  dailyStats: [{
    date: Date,
    views: Number,
    completions: Number,
    averageTimeSpent: Number
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Models
const Store = mongoose.model<IStore>('Store', StoreSchema);
const Survey = mongoose.model<ISurvey>('Survey', SurveySchema);
const SurveyResponse = mongoose.model<ISurveyResponse>('SurveyResponse', SurveyResponseSchema);
const SurveyAnalytics = mongoose.model<ISurveyAnalytics>('SurveyAnalytics', SurveyAnalyticsSchema);

// Shopify Configuration
const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY || '',
  apiSecretKey: process.env.SHOPIFY_API_SECRET || '',
  scopes: process.env.SCOPES?.split(','),
  hostName: process.env.HOST?.replace(/https:\/\//, '') || '',
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: true,
});

// Auth Routes
app.get('/auth', async (req, res) => {
  try {
    const shop = req.query.shop as string;
    if (!shop) {
      res.status(400).send('Missing shop parameter');
      return;
    }

    const authRoute = await shopify.auth.begin({
      shop,
      callbackPath: '/auth/callback',
      isOnline: true,
      rawRequest: req,
      rawResponse: res
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).send('Authentication error');
  }
});

interface CustomRequest extends Request {
  session: Session;
}

app.get('/auth/callback', async (req, res) => {
  try {
    const callback = await shopify.auth.callback({
      rawRequest: req,
      rawResponse: res,
    });

    const newStore = new Store({
      shopifyDomain: callback.session.shop,
      accessToken: callback.session.accessToken,
    });

    (req as CustomRequest).session = callback.session;

    const existingStore = await Store.findOne({ shopifyDomain: newStore.shopifyDomain });
    if (!existingStore) {
      await newStore.save();
    }

    res.redirect(`/welcome`);
  } catch (error) {
    console.error('Callback error:', error);
    res.status(500).send('Callback error');
  }
});

// Enhanced API Routes

// Create Survey
app.post('/api/surveys', async (req, res) => {
  try {
    const { 
      storeId, 
      title, 
      description, 
      questions,
      targetAudience,
      displayRules,
      style
    } = req.body;

    const store = await Store.findById(storeId);
    if (!store) {
      res.status(404).json({ error: 'Store not found' });
      return;
    }

    const survey = new Survey({
      storeId,
      title,
      description,
      questions: questions.map((q: {
        questionText: string;
        questionType: string;
        options: string[];
        required: boolean;
      }) => ({
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options || [],
        required: q.required || false
      })),
      targetAudience,
      displayRules,
      style: {
        ...style,
        ...store.settings?.defaultSurveyStyle
      }
    });

    await survey.save();

    // Initialize analytics
    const analytics = new SurveyAnalytics({
      surveyId: survey._id
    });
    await analytics.save();

    res.status(201).json(survey);
  } catch (error) {
    console.error('Survey creation error:', error);
    res.status(500).json({ error: 'Failed to create survey' });
  }
});

// Fetch Active Surveys
app.get('/api/active-surveys', async (req, res) => {
  try {
    const { 
      storeId, 
      customerType, 
      cartValue, 
      productCategory,
      currentUrl 
    } = req.query;

    const query: any = {
      storeId,
      status: 'active',
      'displayRules.startDate': { $lte: new Date() },
      'displayRules.endDate': { $gte: new Date() }
    };

    // Targeting filters
    if (customerType) {
      if (customerType === 'new') {
        query['targetAudience.newCustomers'] = true;
      } else if (customerType === 'returning') {
        query['targetAudience.returningCustomers'] = true;
      }
    }

    if (cartValue) {
      query['targetAudience.cartValue.min'] = { $lte: Number(cartValue) };
      query['targetAudience.cartValue.max'] = { $gte: Number(cartValue) };
    }

    if (productCategory) {
      query['targetAudience.productCategories'] = productCategory;
    }

    if (currentUrl) {
      query['displayRules.displayLocation'] = currentUrl;
    }

    const surveys = await Survey.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .limit(1);

    res.json(surveys);
  } catch (error) {
    console.error('Survey fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch surveys' });
  }
});

// Submit Survey Response
app.post('/api/survey-responses', async (req, res) => {
  try {
    const {
      surveyId,
      responses,
      customerEmail,
      customerType,
      totalTimeSpent,
      metadata
    } = req.body;

    const response = new SurveyResponse({
      surveyId,
      responses,
      customerEmail,
      customerType,
      totalTimeSpent,
      metadata
    });

    await response.save();

    // Update analytics
    await SurveyAnalytics.findOneAndUpdate(
      { surveyId },
      {
        $inc: {
          completions: 1,
          [`demographicData.${customerType}Customers`]: 1
        },
        $set: {
          averageTimeSpent: await calculateAverageTimeSpent(surveyId)
        }
      },
      { new: true }
    );

    res.status(201).json(response);
  } catch (error) {
    console.error('Response submission error:', error);
    res.status(500).json({ error: 'Failed to submit response' });
  }
});

// Get Survey Analytics
app.get('/api/surveys/:surveyId/analytics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const surveyId = req.params.surveyId;

    const dateQuery: any = {};
    if (startDate) {
      dateQuery.createdAt = { $gte: new Date(startDate as string) };
    }
    if (endDate) {
      dateQuery.createdAt = { ...dateQuery.createdAt, $lte: new Date(endDate as string) };
    }

    const analytics = await SurveyAnalytics.findOne({ surveyId });
    const responses = await SurveyResponse.find({
      surveyId,
      ...dateQuery
    });

    const detailedAnalytics = {
      ...analytics?.toObject(),
      responseBreakdown: await calculateResponseBreakdown(responses),
      timeTrends: await calculateTimeTrends(responses),
      userSegments: await calculateUserSegments(responses)
    };

    res.json(detailedAnalytics);
  } catch (error) {
    console.error('Analytics fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Update Survey Status
app.patch('/api/surveys/:surveyId/status', async (req, res) => {
  try {
    const { status } = req.body;
    const survey = await Survey.findByIdAndUpdate(
      req.params.surveyId,
      { 
        status,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!survey) {
       res.status(404).json({ error: 'Survey not found' });
    }

    res.json(survey);
  } catch (error) {
    console.error('Survey status update error:', error);
    res.status(500).json({ error: 'Failed to update survey status' });
  }
});

// Delete Survey
app.delete('/api/surveys/:surveyId', async (req, res) => {
  try {
    const survey = await Survey.findByIdAndDelete(req.params.surveyId);
    if (!survey) {
       res.status(404).json({ error: 'Survey not found' });
    }

    // Clean up related data
    await Promise.all([
      SurveyResponse.deleteMany({ surveyId: req.params.surveyId }),
      SurveyAnalytics.deleteMany({ surveyId: req.params.surveyId })
    ]);

    res.json({ message: 'Survey and related data deleted successfully' });
  } catch (error) {
    console.error('Survey deletion error:', error);
    res.status(500).json({ error: 'Failed to delete survey' });
  }
});

// Get Survey
app.get('/api/survey', async (req, res) => {
  try {
    const { customerId, orderId } = req.query;
    console.log("Im here... in get surveys")

    // if (!customerId || !orderId) {
    //    res.status(400).json({ error: 'Customer ID and Order ID are required' });
    //    return;
    // }

    // Find an active survey that matches targeting criteria
    const survey = await Survey.findOne({
      status: 'active',
      active: true
    }).sort({ priority: -1 });

    if (!survey) {
       res.status(200).json({ error: 'No active survey found' });
       return;
    }
    console.log(survey,"Survey");

    res.json(survey);
  } catch (error) {
    console.error('Survey fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch survey' });
  }
});

// Submit Survey Response
app.post('/api/response', async (req, res) => {
  try {
    const { surveyId, responses, customerId, orderId } = req.body;

    if (!surveyId || !responses || !customerId || !orderId) {
       res.status(400).json({ 
        error: 'Survey ID, responses, customer ID and order ID are required' 
      });
    }

    // Create new survey response
    const surveyResponse = new SurveyResponse({
      surveyId,
      customerId,
      orderId,
      responses: Object.entries(responses).map(([questionId, answer]) => ({
        questionId,
        answer
      })),
      createdAt: new Date(),
      totalTimeSpent: 0 // You may want to calculate this based on client-side tracking
    });

    await surveyResponse.save();

    res.json({ message: 'Survey response recorded successfully' });
  } catch (error) {
    console.error('Survey response submission error:', error);
    res.status(500).json({ error: 'Failed to submit survey response' });
  }
});


// Helper Functions
async function calculateAverageTimeSpent(surveyId: string): Promise<number> {
  const responses = await SurveyResponse.find({ surveyId });
  if (responses.length === 0) return 0;

  const totalTime = responses.reduce((sum, response) => sum + (response.totalTimeSpent || 0), 0);
  return totalTime / responses.length;
}

async function calculateResponseBreakdown(responses: ISurveyResponse[]): Promise<any> {
  const breakdown: { [key: string]: any } = {};
  
  responses.forEach(response => {
    response.responses.forEach(answer => {
      if (!breakdown[answer.questionId]) {
        breakdown[answer.questionId] = {
          responses: {},
          totalResponses: 0
        };
      }

      const answerKey = String(answer.answer);
      breakdown[answer.questionId].responses[answerKey] = 
        (breakdown[answer.questionId].responses[answerKey] || 0) + 1;
      breakdown[answer.questionId].totalResponses++;
    });
  });

  return breakdown;
}

async function calculateTimeTrends(responses: ISurveyResponse[]): Promise<any> {
  const trends = responses.reduce((acc: { [key: string]: any }, response) => {
    const date = response.createdAt.toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = {
        responses: 0,
        averageTimeSpent: 0,
        totalTimeSpent: 0
      };
    }

    acc[date].responses++;
    acc[date].totalTimeSpent += response.totalTimeSpent || 0;
    acc[date].averageTimeSpent = acc[date].totalTimeSpent / acc[date].responses;
    
    return acc;
  }, {});

  return Object.entries(trends)
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

async function calculateUserSegments(responses: ISurveyResponse[]): Promise<any> {
  return {
    customerTypes: {
      new: responses.filter(r => r.customerType === 'new').length,
      returning: responses.filter(r => r.customerType === 'returning').length
    },
    devices: responses.reduce((acc: { [key: string]: number }, response) => {
      const device = response.metadata?.deviceType || 'unknown';
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {}),
    locations: responses.reduce((acc: { [key: string]: number }, response) => {
      const location = response.metadata?.location || 'unknown';
      acc[location] = (acc[location] || 0) + 1;
      return acc;
    }, {})
  };
}

// Advanced Analytics Helper Functions
interface SentimentScore {
  positive: number;
  negative: number;
  neutral: number;
  keywords: string[];
}

interface CorrelationResult {
  questionId1: string;
  questionId2: string;
  correlation: number;
  significance: number;
}

interface PredictiveModel {
  completionProbability: number;
  factors: Array<{
    factor: string;
    impact: number;
  }>;
}

interface UserJourney {
  path: string[];
  frequency: number;
  averageTimeSpent: number;
  completionRate: number;
}

// Helper function to calculate correlation coefficient
function calculateCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  const sum1 = x.reduce((a, b) => a + b);
  const sum2 = y.reduce((a, b) => a + b);
  const sum1Sq = x.reduce((a, b) => a + b * b);
  const sum2Sq = y.reduce((a, b) => a + b * b);
  const pSum = x.map((x, i) => x * y[i]).reduce((a, b) => a + b);
  const num = pSum - (sum1 * sum2 / n);
  const den = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n));
  return num / den;
}

// Helper function for sentiment analysis
function analyzeSentiment(text: string): SentimentScore {
  const positiveWords = new Set(['great', 'excellent', 'good', 'love', 'helpful', 'best', 'amazing']);
  const negativeWords = new Set(['bad', 'poor', 'terrible', 'worst', 'hate', 'difficult', 'confusing']);
  
  const words = text.toLowerCase().split(/\W+/);
  const keywords = words.filter(word => positiveWords.has(word) || negativeWords.has(word));
  
  const score = {
    positive: words.filter(word => positiveWords.has(word)).length / words.length,
    negative: words.filter(word => negativeWords.has(word)).length / words.length,
    neutral: 0,
    keywords
  };
  
  score.neutral = 1 - (score.positive + score.negative);
  return score;
}

// 1. Advanced Sentiment Analysis API
app.get('/api/surveys/:surveyId/sentiment-analysis', async (req, res) => {
  try {
    const surveyId = req.params.surveyId;
    const responses = await SurveyResponse.find({ surveyId });
    
    const textResponses = responses.flatMap(response => 
      response.responses
        .filter(r => typeof r.answer === 'string' && r.answer.split(' ').length > 2)
        .map(r => ({
          questionId: r.questionId,
          text: r.answer as string
        }))
    );

    const sentimentByQuestion = textResponses.reduce((acc: { [key: string]: any }, response) => {
      if (!acc[response.questionId]) {
        acc[response.questionId] = {
          positive: 0,
          negative: 0,
          neutral: 0,
          total: 0,
          keywords: new Map<string, number>(),
          responses: []
        };
      }

      const sentiment = analyzeSentiment(response.text);
      acc[response.questionId].positive += sentiment.positive;
      acc[response.questionId].negative += sentiment.negative;
      acc[response.questionId].neutral += sentiment.neutral;
      acc[response.questionId].total += 1;
      
      sentiment.keywords.forEach(keyword => {
        acc[response.questionId].keywords.set(
          keyword,
          (acc[response.questionId].keywords.get(keyword) || 0) + 1
        );
      });
      
      acc[response.questionId].responses.push({
        text: response.text,
        sentiment
      });

      return acc;
    }, {});

    // Calculate averages and format keywords
    Object.values(sentimentByQuestion).forEach((q: any) => {
      if (q.total > 0) {
        q.positive /= q.total;
        q.negative /= q.total;
        q.neutral /= q.total;
      }
      q.keywords = Array.from(q.keywords.entries() as [string, number][]) 
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
        });

    res.json({
      overallSentiment: Object.values(sentimentByQuestion).reduce((acc: any, q: any) => ({
        positive: acc.positive + q.positive,
        negative: acc.negative + q.negative,
        neutral: acc.neutral + q.neutral,
        total: acc.total + 1
      }), { positive: 0, negative: 0, neutral: 0, total: 0 }),
      sentimentByQuestion
    });
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    res.status(500).json({ error: 'Failed to perform sentiment analysis' });
  }
});

// 2. Question Correlation Analysis API
app.get('/api/surveys/:surveyId/correlation-analysis', async (req, res) => {
  try {
    const surveyId = req.params.surveyId;
    const survey = await Survey.findById(surveyId);
    const responses = await SurveyResponse.find({ surveyId });
    
    if (!survey) {
       res.status(404).json({ error: 'Survey not found' });
    }

    const numericalResponses: { [key: string]: number[] } = {};
    
    // Convert responses to numerical values
    responses.forEach(response => {

      let numericalValue: number;

      response.responses.forEach(r => {
        if (!numericalResponses[r.questionId]) {
          numericalResponses[r.questionId] = [];
        }
        
        if (typeof r.answer === 'number') {
          numericalValue = r.answer;
        } else if (typeof r.answer === 'string') {
          // Convert categorical responses to numbers
          if (survey) { // Check if survey is not null

            const question = survey.questions.find((q: { _id?: string; questionText: string; questionType: "text" | "multiple_choice" | "rating"; options: string[]; required?: boolean }) => q._id?.toString() === r.questionId);
            if (question?.options) {
            numericalValue = question.options.indexOf(r.answer);
          } else {
            return; // Skip non-convertible responses
          }
        } else {
          return; // Skip invalid responses
        }
      }
        
        numericalResponses[r.questionId].push(numericalValue);
      });
    });

    // Calculate correlations between all question pairs
    const correlations: CorrelationResult[] = [];
    const questionIds = Object.keys(numericalResponses);
    
    for (let i = 0; i < questionIds.length; i++) {
      for (let j = i + 1; j < questionIds.length; j++) {
        const id1 = questionIds[i];
        const id2 = questionIds[j];
        
        if (numericalResponses[id1].length === numericalResponses[id2].length) {
          const correlation = calculateCorrelation(
            numericalResponses[id1],
            numericalResponses[id2]
          );
          
          // Calculate statistical significance
          const n = numericalResponses[id1].length;
          const t = correlation * Math.sqrt((n - 2) / (1 - correlation * correlation));
          const significance = 2 * (1 - require('distributions').StudentT(n - 2).cdf(Math.abs(t)));
          
          correlations.push({
            questionId1: id1,
            questionId2: id2,
            correlation,
            significance
          });
        }
      }
    }

    res.json({
      correlations: correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation)),
      sampleSize: responses.length
    });
  } catch (error) {
    console.error('Correlation analysis error:', error);
    res.status(500).json({ error: 'Failed to perform correlation analysis' });
  }
});

// 3. Predictive Completion Analysis API
app.get('/api/surveys/:surveyId/completion-prediction', async (req, res) => {
  try {
    const surveyId = req.params.surveyId;
    const responses = await SurveyResponse.find({ surveyId });
    
    // Split responses into completed and abandoned
    const completed = responses.filter(r => 
      r.responses.length === r.responses.filter(ans => ans.answer !== null).length
    );
    const abandoned = responses.filter(r => 
      r.responses.length !== r.responses.filter(ans => ans.answer !== null).length
    );

    // Analyze factors affecting completion
    const factors = new Map<string, { completed: number; abandoned: number }>();
    
    // Time of day analysis
    responses.forEach(r => {
      const hour = new Date(r.createdAt).getHours();
      const timeSlot = `${hour}-${hour + 1}`;
      if (!factors.has(`time_${timeSlot}`)) {
        factors.set(`time_${timeSlot}`, { completed: 0, abandoned: 0 });
      }
      const isCompleted = completed.includes(r);
      const stat = factors.get(`time_${timeSlot}`)!;
      isCompleted ? stat.completed++ : stat.abandoned++;
    });

    // Device type analysis
    responses.forEach(r => {
      const device = r.metadata?.deviceType || 'unknown';
      if (!factors.has(`device_${device}`)) {
        factors.set(`device_${device}`, { completed: 0, abandoned: 0 });
      }
      const isCompleted = completed.includes(r);
      const stat = factors.get(`device_${device}`)!;
      isCompleted ? stat.completed++ : stat.abandoned++;
    });

    // Calculate completion probability and factor impacts
    const totalResponses = responses.length;
    const completionRate = completed.length / totalResponses;
    
    const factorImpacts = Array.from(factors.entries()).map(([factor, stats]) => ({
      factor,
      impact: (stats.completed / (stats.completed + stats.abandoned)) - completionRate
    }));

    const model: PredictiveModel = {
      completionProbability: completionRate,
      factors: factorImpacts.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    };

    res.json({
      model,
      statistics: {
        totalResponses,
        completedResponses: completed.length,
        abandonedResponses: abandoned.length,
        averageTimeToComplete: completed.reduce((sum, r) => sum + (r.totalTimeSpent || 0), 0) / completed.length
      }
    });
  } catch (error) {
    console.error('Completion prediction error:', error);
    res.status(500).json({ error: 'Failed to generate completion predictions' });
  }
});

// 4. User Journey Analysis API
app.get('/api/surveys/:surveyId/user-journey', async (req, res) => {
  try {
    const surveyId = req.params.surveyId;
    const responses = await SurveyResponse.find({ surveyId });
    
    // Track question paths
    const journeyPaths = new Map<string, {
      count: number;
      timeSpent: number;
      completions: number;
    }>();

    responses.forEach(response => {
      const path = response.responses
        .map(r => r.questionId)
        .join('->');
      
      if (!journeyPaths.has(path)) {
        journeyPaths.set(path, {
          count: 0,
          timeSpent: 0,
          completions: 0
        });
      }
      
      const pathStats = journeyPaths.get(path)!;
      pathStats.count++;
      pathStats.timeSpent += response.totalTimeSpent || 0;
      
      // Check if journey was completed
      if (response.responses.every(r => r.answer !== null)) {
        pathStats.completions++;
      }
    });

    // Format journey data
    const journeys: UserJourney[] = Array.from(journeyPaths.entries())
      .map(([path, stats]) => ({
        path: path.split('->'),
        frequency: stats.count / responses.length,
        averageTimeSpent: stats.timeSpent / stats.count,
        completionRate: stats.completions / stats.count
      }))
      .sort((a, b) => b.frequency - a.frequency);

    // Calculate transition probabilities
    const transitions = new Map<string, Map<string, number>>();
    responses.forEach(response => {
      for (let i = 0; i < response.responses.length - 1; i++) {
        const currentQ = response.responses[i].questionId;
        const nextQ = response.responses[i + 1].questionId;
        
        if (!transitions.has(currentQ)) {
          transitions.set(currentQ, new Map());
        }
        
        const currentTransitions = transitions.get(currentQ)!;
        currentTransitions.set(
          nextQ,
          (currentTransitions.get(nextQ) || 0) + 1
        );
      }
    });

    // Convert transition counts to probabilities
    const transitionProbabilities = Array.from(transitions.entries()).reduce((acc, [fromQ, toQs]) => {
      const total = Array.from(toQs.values()).reduce((sum, count) => sum + count, 0);
      acc[fromQ] = Array.from(toQs.entries()).reduce((qAcc, [toQ, count]) => {
        qAcc[toQ] = count / total;
        return qAcc;
      }, {} as { [key: string]: number });
      return acc;
    }, {} as { [key: string]: { [key: string]: number } });

    res.json({
      journeys: journeys.slice(0, 10), // Top 10 most common paths
      transitionProbabilities,
      metrics: {
        averageQuestionsAnswered: responses.reduce((sum, r) => 
          sum + r.responses.filter(ans => ans.answer !== null).length, 0
        ) / responses.length,
        mostCommonStartingPoint: Array.from(transitions.entries())
          .sort((a, b) => 
            Array.from(b[1].values()).reduce((sum, count) => sum + count, 0) -
            Array.from(a[1].values()).reduce((sum, count) => sum + count, 0)
          )[0]?.[0]
      }
    });
  } catch (error) {
    console.error('User journey analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze user journeys' });
  }
});

// Error Handling Middleware
app.use((err: Error, req: Request, res: any, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { app, Store, Survey, SurveyResponse, SurveyAnalytics };
