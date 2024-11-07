import mongoose from 'mongoose';
import { config } from 'dotenv';
import { program } from 'commander';

// Load environment variables
config();

// Define common types for documents
interface BaseMongoDB {
  _id: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define your mongoose schemas and interfaces
interface ISurvey extends BaseMongoDB {
  title: string;
  storeId: mongoose.Types.ObjectId;
  active: boolean;
  lastResponse?: Date;
}

interface ISurveyResponse extends BaseMongoDB {
  surveyId: mongoose.Types.ObjectId;
  responses: Array<{
    questionId: string;
    answer: string;
  }>;
  customerEmail?: string;
}

interface IStore extends BaseMongoDB {
  shopifyDomain: string;
  accessToken: string;
  lastActive?: Date;
}

// Define Mongoose schemas
const StoreSchema = new mongoose.Schema<IStore>({
  shopifyDomain: { type: String, required: true },
  accessToken: { type: String, required: true },
  lastActive: Date,
}, { timestamps: true });

const SurveySchema = new mongoose.Schema<ISurvey>({
  title: { type: String, required: true },
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  active: { type: Boolean, default: false },
  lastResponse: Date,
}, { timestamps: true });

const SurveyResponseSchema = new mongoose.Schema<ISurveyResponse>({
  surveyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Survey', required: true },
  responses: [{
    questionId: String,
    answer: String
  }],
  customerEmail: String,
}, { timestamps: true });

// Register models
const Store = mongoose.model<IStore>('Store', StoreSchema);
const Survey = mongoose.model<ISurvey>('Survey', SurveySchema);
const SurveyResponse = mongoose.model<ISurveyResponse>('SurveyResponse', SurveyResponseSchema);

interface CleanupOptions {
  dryRun: boolean;
  force: boolean;
  days: number;
  collections: string[];
}

class DatabaseCleaner {
  constructor(private options: CleanupOptions) {}

  private log(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
    const prefix = {
      info: '[INFO]',
      success: '[SUCCESS]',
      error: '[ERROR]',
      warning: '[WARNING]'
    };
    
    console.log(`${prefix[type]} ${message}`);
  }

  async connect(): Promise<void> {
    this.log('Connecting to MongoDB...', 'info');
    
    try {
      mongoose.connect('mongodb+srv://kalpesh:vDMw0dDJS0T5diNp@survey-ins-1.9tczk.mongodb.net/survey-app')
      .then(() => console.log('Connected to MongoDB'))
      .catch((err) => console.error('MongoDB connection error:', err));
          this.log('Connected to MongoDB', 'success');
    } catch (error) {
      this.log('Failed to connect to MongoDB', 'error');
      throw error;
    }
  }

  async cleanInactiveStores(): Promise<void> {
    if (!this.options.collections.includes('stores')) return;

    this.log('Cleaning inactive stores...', 'info');
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.options.days);

    const inactiveStores = await Store.find({
      lastActive: { $lt: cutoffDate }
    });

    this.log(`Found ${inactiveStores.length} inactive stores`, 'info');

    if (this.options.dryRun) {
      this.log('Dry run - no stores will be removed', 'warning');
      return;
    }

    if (inactiveStores.length > 0) {
      if (this.options.force || await this.confirmDeletion('stores', inactiveStores.length)) {
        await Store.deleteMany({
          _id: { $in: inactiveStores.map(store => store._id) }
        });
        this.log(`Deleted ${inactiveStores.length} inactive stores`, 'success');
      }
    }

    this.log('Store cleanup completed', 'info');
  }

  async cleanAbandonedSurveys(): Promise<void> {
    if (!this.options.collections.includes('surveys')) return;

    this.log('Cleaning abandoned surveys...', 'info');
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.options.days);

    const abandonedSurveys = await Survey.find({
      $or: [
        { lastResponse: { $lt: cutoffDate } },
        { 
          lastResponse: { $exists: false },
          createdAt: { $lt: cutoffDate }
        }
      ],
      active: false
    });

    this.log(`Found ${abandonedSurveys.length} abandoned surveys`, 'info');

    if (this.options.dryRun) {
      this.log('Dry run - no surveys will be removed', 'warning');
      return;
    }

    if (abandonedSurveys.length > 0) {
      if (this.options.force || await this.confirmDeletion('surveys', abandonedSurveys.length)) {
        await Survey.deleteMany({
          _id: { $in: abandonedSurveys.map(survey => survey._id) }
        });
        this.log(`Deleted ${abandonedSurveys.length} abandoned surveys`, 'success');
      }
    }

    this.log('Survey cleanup completed', 'info');
  }

  async cleanOldResponses(): Promise<void> {
    if (!this.options.collections.includes('responses')) return;

    this.log('Cleaning old survey responses...', 'info');
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.options.days);

    const oldResponses = await SurveyResponse.find({
      createdAt: { $lt: cutoffDate }
    });

    this.log(`Found ${oldResponses.length} old responses`, 'info');

    if (this.options.dryRun) {
      this.log('Dry run - no responses will be removed', 'warning');
      return;
    }

    if (oldResponses.length > 0) {
      if (this.options.force || await this.confirmDeletion('responses', oldResponses.length)) {
        await SurveyResponse.deleteMany({
          _id: { $in: oldResponses.map(response => response._id) }
        });
        this.log(`Deleted ${oldResponses.length} old responses`, 'success');
      }
    }

    this.log('Response cleanup completed', 'info');
  }

  async cleanOrphanedData(): Promise<void> {
    this.log('Cleaning orphaned data...', 'info');

    const existingStoreIds = (await Store.find({}, '_id')).map(store => store._id);
    const orphanedSurveys = await Survey.find({
      storeId: { $nin: existingStoreIds }
    });

    const existingSurveyIds = (await Survey.find({}, '_id')).map(survey => survey._id);
    const orphanedResponses = await SurveyResponse.find({
      surveyId: { $nin: existingSurveyIds }
    });

    this.log(`Found ${orphanedSurveys.length} orphaned surveys`, 'info');
    this.log(`Found ${orphanedResponses.length} orphaned responses`, 'info');

    if (this.options.dryRun) {
      this.log('Dry run - no orphaned data will be removed', 'warning');
      return;
    }

    if (orphanedSurveys.length > 0 && (this.options.force || await this.confirmDeletion('orphaned surveys', orphanedSurveys.length))) {
      await Survey.deleteMany({
        _id: { $in: orphanedSurveys.map(survey => survey._id) }
      });
      this.log(`Deleted ${orphanedSurveys.length} orphaned surveys`, 'success');
    }

    if (orphanedResponses.length > 0 && (this.options.force || await this.confirmDeletion('orphaned responses', orphanedResponses.length))) {
      await SurveyResponse.deleteMany({
        _id: { $in: orphanedResponses.map(response => response._id) }
      });
      this.log(`Deleted ${orphanedResponses.length} orphaned responses`, 'success');
    }

    this.log('Orphaned data cleanup completed', 'info');
  }

  private async confirmDeletion(type: string, count: number): Promise<boolean> {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      readline.question(
        `Are you sure you want to delete ${count} ${type}? (yes/no): `,
        (answer: string) => {
          readline.close();
          resolve(answer.toLowerCase() === 'yes');
        }
      );
    });
  }

  async cleanup(): Promise<void> {
    try {
      await this.connect();

      this.log('Starting database cleanup...', 'info');
      this.log(`Mode: ${this.options.dryRun ? 'Dry Run' : 'Live'}`, 'info');
      this.log(`Age threshold: ${this.options.days} days`, 'info');

      await this.cleanInactiveStores();
      await this.cleanAbandonedSurveys();
      await this.cleanOldResponses();
      await this.cleanOrphanedData();

      this.log('Database cleanup completed successfully!', 'success');
    } catch (error) {
      this.log('Error during cleanup: ' + (error as Error).message, 'error');
      throw error;
    } finally {
      await mongoose.disconnect();
    }
  }
}

// Set up command line interface
program
  .version('1.0.0')
  .description('MongoDB database cleanup utility')
  .option('-d, --dry-run', 'Run without making any changes', false)
  .option('-f, --force', 'Skip confirmation prompts', false)
  .option('--days <number>', 'Number of days of inactivity before cleaning', '90')
  .option('-c, --collections <items>', 'Specific collections to clean (comma-separated)', 'stores,surveys,responses')
  .parse(process.argv);

const options = program.opts();

const cleaner = new DatabaseCleaner({
  dryRun: options.dryRun,
  force: options.force,
  days: parseInt(options.days),
  collections: options.collections.split(',')
});

// Run the cleanup
cleaner.cleanup()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));