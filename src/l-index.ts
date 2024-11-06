import express,{Request} from 'express';
import mongoose from 'mongoose';
import {shopifyApi,LATEST_API_VERSION,Session}  from '@shopify/shopify-api';
import dotenv from 'dotenv';
import '@shopify/shopify-api/adapters/node';
import { Document, ObjectId } from 'mongodb';
import { Types } from 'mongoose';

dotenv.config();

const app = express();
app.use(express.json());

// Define interfaces for your MongoDB models
interface ISurvey {
  _id: string;
  storeId: string;
  active: boolean;
  scriptTagId?: string;
}

interface IStore {
  _id: string;
  shopifyDomain: string;
  accessToken: string;
}

// Define interface for Shopify API response
interface ScriptTagResponse {
  script_tag: {
    id: number;
    event: string;
    src: string;
    display_scope: string;
  };
}

// Define custom error type for Shopify API errors
interface ShopifyAPIError extends Error {
  response?: {
    status?: number;
    headers?: Record<string, string>;
    body?: unknown;
  };
}


// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/survey-app')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Schemas
const StoreSchema = new mongoose.Schema({
  shopifyDomain: { type: String, required: true, unique: true },
  accessToken: { type: String, required: true },
  email: String,
  createdAt: { type: Date, default: Date.now },
});

const SurveySchema = new mongoose.Schema({
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  title: { type: String, required: true },
  questions: [{
    questionText: { type: String, required: true },
    questionType: { type: String, enum: ['multiple_choice', 'text', 'rating'], required: true },
    options: [String],
  }],
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const SurveyResponseSchema = new mongoose.Schema({
  surveyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Survey', required: true },
  responses: [{
    questionId: String,
    answer: mongoose.Schema.Types.Mixed,
  }],
  customerEmail: String,
  createdAt: { type: Date, default: Date.now },
});

// Models
const Store = mongoose.model('Store', StoreSchema);
const Survey = mongoose.model('Survey', SurveySchema);
const SurveyResponse = mongoose.model('SurveyResponse', SurveyResponseSchema);

// Shopify Configuration
const shopify =  shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY || '',
  apiSecretKey: process.env.SHOPIFY_API_SECRET || '',
  scopes: process.env.SCOPES?.split(','),
  hostName: process.env.HOST?.replace(/https:\/\//, '') || '',
  apiVersion: LATEST_API_VERSION, // Using latest stable version
  isEmbeddedApp: true,
});

// Auth Routes
app.get('/auth', async (req, res) => {
  try {
    const shop = req.query.shop as string;
    if (!shop) {
       res.status(400).send('Missing shop parameter');
    }

    // Generate auth URL
    const authRoute = await shopify.auth.begin({
      shop,
      callbackPath: '/auth/callback',
      isOnline: true,
      rawRequest:req,
      rawResponse:res
    });

    // res.redirect(authRoute);
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).send('Authentication error');
  }
});

interface CustomRequest extends Request {
  session: Session; // Extend the Request interface to include session
}

app.get('/auth/callback', async (req, res) => {
  try {
    const callback = await shopify.auth.callback({
      rawRequest: req,
      rawResponse: res,
    });

    // Store the shop data
    const newStore = new Store({
      shopifyDomain: callback.session.shop,
      accessToken: callback.session.accessToken,
    });

 

    (req as CustomRequest).session = callback.session; // Store the session object in the request for use in other routes
    console.log((req as CustomRequest).session, "session");

    const existingStore = await Store.findOne({ shopifyDomain: newStore.shopifyDomain });
    if (!existingStore) {
      await newStore.save();
    } else {
      console.log('Store already exists, not creating a new one.');
    }

    // Redirect to app home page
    res.redirect(`/welcome`);
  } catch (error) {
    console.error('Callback error:', error);
    res.status(500).send('Callback error');
  }
});

app.get('/welcome',async(req,res)=>{
  res.send('Work in progress');
})

// Survey Routes
app.post('/api/surveys', async (req, res) => {
  try {
    const { storeId, title, questions } = req.body;

    // Validate store exists
    const store = await Store.findById(storeId);
    if (!store) {
       res.status(404).json({ error: 'Store not found' });
    }

    const survey = new Survey({
      storeId,
      title,
      questions: questions.map((q: { questionText: string; questionType: string,options:[] }) => ({
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options || []
      }))
    });

    await survey.save();
    res.status(201).json(survey);
  } catch (error) {
    console.error('Survey creation error:', error);
    res.status(500).json({ error: 'Failed to create survey' });
  }
});

app.get('/api/surveys', async (req, res) => {
  try {
    const { storeId } = req.query;
    const surveys = await Survey.find({ storeId }).sort({ createdAt: -1 });
    res.json(surveys);
  } catch (error) {
    console.error('Survey fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch surveys' });
  }
});

// App Block route - Returns the survey UI component
app.get('/api/surveys/:surveyId/block', async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.surveyId);
    if (!survey) {
       res.status(404).json({ error: 'Survey not found' });
       return;
    }

    // Generate unique div ID for this survey
    const surveyContainerId = `survey-${survey._id}`;
    
    // Generate the HTML/JavaScript code
    const blockCode = generateSurveyBlock(survey, surveyContainerId);
    
    res.json({
      containerId: surveyContainerId,
      code: blockCode
    });
  } catch (error) {
    console.error('Block generation error:', error);
    res.status(500).json({ error: 'Failed to generate survey block' });
  }
});

// Publish survey to Shopify as a Script Tag
app.post('/api/surveys/:surveyId/publish', async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.surveyId);
    if (!survey) {
       res.status(404).json({ error: 'Survey not found' });
       return;
    }

    const store = await Store.findById(survey.storeId);
    if (!store) {
       res.status(404).json({ error: 'Store not found' });
       return;
    }

   

    console.log((req as unknown as CustomRequest).session,"ss")
    const client = new shopify.clients.Rest({
      session: {
        id: 'stokeshub.myshopify.com_101493440789',
        shop: 'stokeshub.myshopify.com',
        state: '504596070790979',
        isOnline: true,
        scope: 'write_products,write_themes,read_online_store_navigation,read_online_store_pages,write_script_tags',
        accessToken: 'shpua_24097885a81ee67db57359dd4dd8a729',
        onlineAccessInfo: {
          expires_in: 86399,
          associated_user_scope: 'write_products,write_themes,read_online_store_navigation,read_online_store_pages,write_script_tags',
          associated_user: {
            id: 101493440789,
            first_name: 'Stokeshub',
            last_name: 'Admin',
            email: 'kevinstokes.012@gmail.com',
          }
        }
    } as Session
    });

    // Create a script tag for the survey
    const scriptTag = await client.post({
      path: 'script_tags',
      data: {
        script_tag: {
          event: 'onload',
          src: `${process.env.HOST}/surveys/${survey._id}/script.js`
        }
      }
    });

    res.json({
      message: 'Survey published successfully',
      scriptTag
    });
  } catch (error) {
    console.error('Survey publication error:', error);
    res.status(500).json({ error: 'Failed to publish survey' });
  }
});

// Updated survey publication endpoint
// app.post('/api/surveys/:surveyId/publish', async (req, res) => {
//   try {
//     const survey = await Survey.findById<ISurvey>(req.params.surveyId);
//     if (!survey) {
//        res.status(404).json({ error: 'Survey not found' });
//        return;
//     }

//     const store = await Store.findById<IStore>(survey.storeId);
//     if (!store) {
//        res.status(404).json({ error: 'Store not found' });
//        return;
//     }

//     // Create a proper session object with typing
//     const session = new Session({
//       id: `${store.shopifyDomain}_${Date.now()}`,
//       shop: store.shopifyDomain,
//       state: 'active',
//       isOnline: true,
//       accessToken: store.accessToken,
//       scope: shopify.config.scopes?.join(',') || '',
//     });

//     try {
//       const client = new RestClient({
//         session,
//         apiVersion: LATEST_API_VERSION,
//       });

//       // Create a script tag with proper typing
//       const response = await client.post<ScriptTagResponse>({
//         path: 'script_tags',
//         data: {
//           script_tag: {
//             event: 'onload',
//             src: `${process.env.HOST}/surveys/${survey._id}/script.js`,
//             display_scope: 'online_store',
//           },
//         },
//       });

//       // Ensure response and body exist
//       if (!response?.body?.script_tag) {
//         throw new Error('Invalid response from Shopify API');
//       }

//       // Update survey with proper typing
//       const updatedSurvey = await Survey.findByIdAndUpdate<ISurvey>(
//         survey._id,
//         {
//           $set: {
//             active: true,
//             scriptTagId: response.body.script_tag.id.toString(),
//           },
//         },
//         { new: true }
//       );

//       if (!updatedSurvey) {
//         throw new Error('Failed to update survey');
//       }

//       return res.json({
//         message: 'Survey published successfully',
//         scriptTag: response.body.script_tag,
//       });

//     } catch (apiError) {
//       // Type assertion for the API error
//       const typedError = apiError as ShopifyAPIError;
      
//       // Log the detailed error for debugging
//       console.error('Shopify API Error:', {
//         status: typedError.response?.status,
//         headers: typedError.response?.headers,
//         body: typedError.response?.body,
//       });

//       // Check if it's an authentication error
//       if (typedError.response?.status === 401) {
//         return res.status(401).json({
//           error: 'Authentication failed with Shopify. Please reconnect your store.',
//         });
//       }

//       throw typedError; // Re-throw for general error handling
//     }
//   } catch (error) {
//     const typedError = error as Error;
//     console.error('Survey publication error:', typedError);
    
//     return res.status(500).json({
//       error: 'Failed to publish survey',
//       details: process.env.NODE_ENV === 'development' ? typedError.message : undefined,
//     });
//   }
// });



// Serve the generated survey script
app.get('/surveys/:surveyId/script.js', async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.surveyId);
    if (!survey) {
       res.status(404).send('Survey not found');
       return;
    }

    const script = generateSurveyScript(survey);
    res.setHeader('Content-Type', 'application/javascript');
    res.send(script);
  } catch (error) {
    console.error('Script generation error:', error);
    res.status(500).send('Failed to generate survey script');
  }
});

// MongoDB document interfaces
interface MongoSurveyQuestion {
  _id?: ObjectId;
  questionText: string;
  questionType: 'multiple_choice' | 'text' | 'rating';
  options: string[];
  required?: boolean;
}

interface MongoSurvey extends Document {
  _id: ObjectId;
  storeId: ObjectId;
  title: string;
  description?: string;
  questions: MongoSurveyQuestion[];
  active: boolean;
  createdAt: Date;
  theme?: {
    primaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
  };
}

// Client-side interfaces
interface SurveyOption {
  id: string;
  text: string;
}

interface SurveyQuestion {
  _id: string;
  questionText: string;
  questionType: 'multiple_choice' | 'text' | 'rating';
  options?: SurveyOption[];
  required?: boolean;
}

interface Survey {
  _id: string;
  title: string;
  description?: string;
  questions: SurveyQuestion[];
  theme?: {
    primaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
  };
}

// Conversion function to transform MongoDB document to client-side format
function convertMongoSurveyToClientSurvey(mongoSurvey: MongoSurvey): Survey {
  return {
    _id: mongoSurvey._id.toString(),
    title: mongoSurvey.title,
    description: mongoSurvey.description,
    theme: mongoSurvey.theme,
    questions: mongoSurvey.questions.map(q => ({
      _id: (q._id || new Types.ObjectId()).toString(),
      questionText: q.questionText,
      questionType: q.questionType,
      options: q.options.map((opt, index) => ({
        id: `${index}`,
        text: opt
      })),
      required: q.required
    }))
  };
}

function generateSurveyBlock(mongoSurvey: MongoSurvey | null, containerId: string): string {
  if (!mongoSurvey) {
    return '<div class="error">Survey not found</div>';
  }

  const survey = convertMongoSurveyToClientSurvey(mongoSurvey);
  const { title, description, questions } = survey;
  
  return `
    <div id="${containerId}" class="shopify-survey-container">
      <div class="survey-header">
        <h2 class="survey-title">${title}</h2>
        ${description ? `<p class="survey-description">${description}</p>` : ''}
      </div>
      
      <form id="survey-form-${survey._id}" class="survey-form">
        ${questions.map((question, index) => `
          <div class="survey-question" data-question-type="${question.questionType}">
            <label class="question-label">
              ${question.questionText}
              ${question.required ? '<span class="required">*</span>' : ''}
            </label>
            ${generateQuestionHTML(question, index)}
          </div>
        `).join('')}
        
        <div class="survey-actions">
          <button type="submit" class="survey-submit-btn">
            <span class="btn-text">Submit Survey</span>
            <span class="btn-loading hidden">
              <svg class="spinner" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="4" />
              </svg>
            </span>
          </button>
        </div>
      </form>
    </div>
  `;
}

function generateQuestionHTML(question: SurveyQuestion, index: number): string {
  const questionId = `question_${index}`;
  
  switch (question.questionType) {
    case 'multiple_choice':
      return `
        <div class="options-grid">
          ${question.options?.map((option, optIndex) => `
            <div class="option">
              <input type="radio" 
                     name="${questionId}" 
                     value="${option.text}" 
                     id="q${index}_opt${optIndex}"
                     ${question.required ? 'required' : ''}>
              <label class="option-label" for="q${index}_opt${optIndex}">
                ${option.text}
              </label>
            </div>
          `).join('')}
        </div>
      `;
    
    case 'text':
      return `
        <div class="text-input-wrapper">
          <textarea 
            name="${questionId}"
            class="text-input"
            placeholder="Type your answer here..."
            rows="3"
            ${question.required ? 'required' : ''}
          ></textarea>
          <div class="text-input-border"></div>
        </div>
      `;
    
    case 'rating':
      return `
        <div class="rating-container">
          ${[1, 2, 3, 4, 5].map(num => `
            <div class="rating-option">
              <input type="radio" 
                     name="${questionId}" 
                     value="${num}" 
                     id="q${index}_rating${num}"
                     ${question.required ? 'required' : ''}>
              <label class="rating-label" for="q${index}_rating${num}">
                <span class="rating-number">${num}</span>
                <span class="rating-star">★</span>
              </label>
            </div>
          `).join('')}
        </div>
      `;
    
    default:
      return '<p class="error-message">Unsupported question type</p>';
  }
}

function generateSurveyScript(mongoSurvey: MongoSurvey): string {
  const survey = convertMongoSurveyToClientSurvey(mongoSurvey);
  
  // Rest of the styles remain the same as in previous version
  const styles = `
    // ... (same styles as before)
  `;

  return `
    (function() {
      // Add styles to document
      const styleSheet = document.createElement("style");
      styleSheet.textContent = ${JSON.stringify(styles)};
      document.head.appendChild(styleSheet);

      // Add survey HTML
      const surveyContainer = document.createElement('div');
      surveyContainer.innerHTML = ${JSON.stringify(generateSurveyBlock(mongoSurvey, `survey-${survey._id}`))};
      
      // Find appropriate insertion point
      const insertionPoint = document.querySelector('.shopify-section-main-product') || 
                           document.querySelector('main') || 
                           document.body;
      insertionPoint.appendChild(surveyContainer);

      // Add form submission handler
      const form = document.getElementById(\`survey-form-${survey._id}\`);
      const submitBtn = form.querySelector('.survey-submit-btn');
      const btnText = submitBtn.querySelector('.btn-text');
      const btnLoading = submitBtn.querySelector('.btn-loading');

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Show loading state
        btnText.classList.add('hidden');
        btnLoading.classList.remove('hidden');
        submitBtn.disabled = true;
        
        const formData = new FormData(form);
        const responses = [];
        
        ${survey.questions.map((q, index) => `
          responses.push({
            questionId: '${q._id}',
            answer: formData.get('question_${index}') as string
          });
        `).join('')}

        try {
          const response = await fetch('${process.env.HOST}/api/survey-responses', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              surveyId: '${survey._id}',
              responses,
              customerEmail: window.Shopify?.customerEmail || null,
              timestamp: new Date().toISOString()
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to submit survey');
          }

          // Show success message
          const successMessage = document.createElement('div');
          successMessage.className = 'success-message';
          successMessage.innerHTML = \`
            <div style="text-align: center; padding: 20px;">
              <svg viewBox="0 0 24 24" width="48" height="48" style="margin: 0 auto 10px;">
                <circle cx="12" cy="12" r="11" fill="${survey.theme?.primaryColor || '#008060'}" />
                <path d="M7 13l3 3 7-7" stroke="white" stroke-width="2" fill="none" />
              </svg>
              <h3 style="color: #2c3e50; margin: 0 0 10px;">Thank you for your feedback!</h3>
            </div>
          \`;
          
          form.replaceWith(successMessage);

        } catch (error) {
          console.error('Survey submission error:', error);
          
          // Show error message
          submitBtn.style.background = '#e74c3c';
          btnText.textContent = 'Error - Try Again';
          btnText.classList.remove('hidden');
          btnLoading.classList.add('hidden');
          submitBtn.disabled = false;
          
          setTimeout(() => {
            submitBtn.style.background = '${survey.theme?.primaryColor || '#008060'}';
            btnText.textContent = 'Submit Survey';
          }, 3000);
        }
      });
    })();
  `;
}

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { Store, Survey, SurveyResponse }; 

// // 1.) Implement Auth and auth callback 
// // 2.) Implement Survey creation
// // 3.) Implement survey fetching
// // 4.) Implement survey generation logic
// 5.) Implement survey publish and adding to app-block logic