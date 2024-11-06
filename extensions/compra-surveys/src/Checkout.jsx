import {
  reactExtension,
  View,
  BlockStack,
  Text,
  Button,
  InlineStack,
  Choice,
  ChoiceList,
  Banner,
  Spinner,
  TextField,
  Select,
  Divider,
  useApi,
  useSubscription
} from '@shopify/ui-extensions-react/checkout';
import { useCallback, useState, useEffect } from 'react';
import axios from 'axios'

const BASEURL = 'https://f50e-2405-201-41-e824-b0d3-1478-15ae-99c2.ngrok-free.app';

const QuestionType = {
  SINGLE_CHOICE: 'single_choice',
  MULTIPLE_CHOICE: 'multiple_choice',
  TEXT: 'text',
  SELECT: 'select',
  IMAGE_RADIO: 'image_radio',
};

const Footer = () => (
  <View padding="base" background="surface" border="base" cornerRadius="medium">
    <BlockStack spacing="tight" alignment="center">
      <Text emphasis="bold">Thank you for choosing Compra!</Text>
      <Text appearance="subdued">Your feedback helps us make Compra better every day.</Text>
      <Divider />
      <Text appearance="subdued" size="small">
        © {new Date().getFullYear()} Compra. All rights reserved.
      </Text>
    </BlockStack>
  </View>
);

const InitialLoadingView = () => (
  <View padding="base">
    <BlockStack spacing="loose" alignment="center">
      <Spinner size="large" accessibilityLabel="Loading survey" />
      <Text emphasis="bold">Loading Survey</Text>
      <Text appearance="subdued">Please wait while we prepare your feedback form...</Text>
    </BlockStack>
  </View>
);

const ThankYouView = ({ customerId, orderId }) => {
  useEffect(() => {
    console.log('Survey completed for:', { customerId, orderId });
  }, [customerId, orderId]);

  return (
    <View padding="base">
      <BlockStack spacing="loose">
        <Banner status="success">
          <BlockStack spacing="tight">
            <Text emphasis="bold">Thank you for completing the survey!</Text>
            <Text>Your feedback helps us improve our services.</Text>
          </BlockStack>
        </Banner>
        <Text appearance="subdued">You can now close this window.</Text>
      </BlockStack>
    </View>
  );
};

const ErrorView = ({ error, onRetry }) => (
  <View padding="base">
    <Banner status="critical">
      <BlockStack spacing="tight">
        <Text emphasis="bold">Something went wrong</Text>
        <Text>{error || 'Unable to load survey. Please try again.'}</Text>
        {onRetry && (
          <Button onPress={onRetry}>Try Again</Button>
        )}
      </BlockStack>
    </Banner>
  </View>
);

const QuestionRenderer = ({ question, value, onChange, onAutoAdvance }) => {
  const handleSingleChoiceChange = useCallback((newValue) => {
    if (newValue.length > 0) {
      onChange(newValue[0]);
      onAutoAdvance?.();
    }
  }, [onChange, onAutoAdvance]);

  const handleMultipleChoiceChange = useCallback((newValue) => {
    onChange(newValue);
  }, [onChange]);

  const handleSelectChange = useCallback((newValue) => {
    if (newValue) {
      onChange(newValue);
      onAutoAdvance?.();
    }
  }, [onChange, onAutoAdvance]);

  const handleTextChange = useCallback((newValue) => {
    onChange(newValue);
  }, [onChange]);

  const handleImageRadioChange = useCallback((newValue) => {
    if (newValue.length > 0) {
      onChange(newValue[0]);
      onAutoAdvance?.();
    }
  }, [onChange, onAutoAdvance]);

  switch (question.type) {
    case QuestionType.SINGLE_CHOICE:
      return (
        <ChoiceList
          name={`question-${question.id}`}
          value={value ? [value] : []}
          onChange={handleSingleChoiceChange}
        >
          {question.options.map((option) => (
            <Choice key={option} id={option}>{option}</Choice>
          ))}
        </ChoiceList>
      );

    case QuestionType.MULTIPLE_CHOICE:
      return (
        <ChoiceList
          name={`question-${question.id}`}
          value={value || []}
          onChange={handleMultipleChoiceChange}
          allowMultiple
        >
          {question.options.map((option) => (
            <Choice key={option} id={option}>{option}</Choice>
          ))}
        </ChoiceList>
      );

    case QuestionType.SELECT:
      return (
        <Select
          label=""
          value={value || ''}
          onChange={handleSelectChange}
          options={question.options.map(opt => ({ value: opt, label: opt }))}
        />
      );

    case QuestionType.TEXT:
      return (
        <TextField
          value={value || ''}
          onChange={handleTextChange}
          multiline
          maxLength={question.maxLength}
          placeholder={question.placeholder}
        />
      );

    case QuestionType.IMAGE_RADIO:
      return (
        <ChoiceList
          name={`question-${question.id}`}
          value={value ? [value] : []}
          onChange={handleImageRadioChange}
        >
          {question.options.map((option) => (
            <Choice key={option.label} id={option.label}>
              <InlineStack spacing="tight" alignment="center">
                <img 
                  src={option.imageUrl} 
                  alt={option.label} 
                  width="80" 
                  height="80" 
                  style={{ borderRadius: '8px' }} 
                />
                <Text>{option.label}</Text>
              </InlineStack>
            </Choice>
          ))}
        </ChoiceList>
      );

    default:
      return <ErrorView error={`Unsupported question type: ${question.type}`} />;
  }
};

const ProgressBar = ({ current, total }) => {
  const progress = ((current + 1) / total * 100).toFixed(0);
  
  return (
    <Banner status="info">
      <BlockStack spacing="tight">
        <Text>Progress: {progress}%</Text>
        <View
          border="base"
          cornerRadius="full"
          padding="none"
          blockAlignment="stretch"
        >
          <View
            padding="extraTight"
            cornerRadius="full"
            background="interactive"
            inlineSize={`${progress}%`}
          />
        </View>
      </BlockStack>
    </Banner>
  );
};

const Survey = () => {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState(null);
  const [surveyData, setSurveyData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  

  const {orderConfirmation} = useApi();

  const orderNumber = useSubscription(orderConfirmation);


  const [customerId, setCustomerId] = useState(null);
  const [orderId, setOrderId] = useState(orderNumber.number);

  console.log(orderNumber.number,orderConfirmation,"Im here")



  const fetchSurvey = async (customerId, orderId) => {
    try {
      console.log('Fetching survey:', `${BASEURL}/api/survey`);
      
      const response = await axios.get(
        `${BASEURL}/api/survey`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          withCredentials: true
        }
      );

      console.log('Survey data received:', response);
      return response.data;

    } catch (error) {
      console.error('Error fetching survey:', error);
      if (error.response) {
        // Server responded with error
        throw new Error(`Server error: ${error.response.status}`);
      } else if (error.request) {
        // Request made but no response
        throw new Error('No response from server. Please check your connection.');
      } else {
        // Error setting up request
        throw new Error('Failed to load survey. Please try again later.');
      }
    }
  };

  const submitSurvey = async (surveyId, answers) => {
    try {
      console.log('Submitting survey:', { surveyId, answers });
      
      const response = await axios.post(
        `${BASEURL}/api/response`,
        {
          surveyId,
          responses: answers,
          customerId,
          orderId,
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Survey submission successful:', response.data);
      return response.data;

    } catch (error) {
      console.error('Error submitting survey:', error);
      if (error.response) {
        throw new Error(`Submission failed: ${error.response.data.message || 'Server error'}`);
      } else if (error.request) {
        throw new Error('No response from server. Please check your connection.');
      } else {
        throw new Error('Failed to submit survey. Please try again.');
      }
    }
  };

  useEffect(() => {
    const loadSurvey = async () => {
      try {
        // In real implementation, get these from Shopify checkout context
        const tempCustomerId = 'test-customer-123';
        const tempOrderId = 'test-order-456';
        
        setCustomerId(tempCustomerId);
        setOrderId(tempOrderId);
        
        const data = await fetchSurvey(tempCustomerId, tempOrderId);
        setSurveyData(data);
        setIsInitialLoading(false);
      } catch (err) {
        setError(err.message);
        setIsInitialLoading(false);
      }
    };

    loadSurvey();
  }, []);

  const handleSubmit = async () => {
    if (!surveyData?.id || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await submitSurvey(surveyData.id, answers);
      setIsComplete(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = useCallback(() => {
    if (currentIndex < (surveyData?.questions?.length || 0) - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      handleSubmit();
    }
  }, [currentIndex, surveyData?.questions?.length, handleSubmit]);

  const handleRetry = useCallback(async () => {
    setError(null);
    setIsInitialLoading(true);
    try {
      const data = await fetchSurvey(customerId, orderId);
      setSurveyData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsInitialLoading(false);
    }
  }, [customerId, orderId]);

  if (isInitialLoading) {
    return <InitialLoadingView />;
  }

  if (error) {
    return <ErrorView error={error} onRetry={handleRetry} />;
  }

  if (isComplete) {
    return <ThankYouView customerId={customerId} orderId={orderId} />;
  }

  if (!surveyData || !surveyData.questions || surveyData.questions.length === 0) {
    return <ErrorView error="No survey questions available" onRetry={handleRetry} />;
  }

  return (
    <View padding="base">
      <BlockStack spacing="loose">
        <ProgressBar 
          current={currentIndex} 
          total={surveyData.questions.length} 
        />
        
        <Text emphasis="bold" size="large">
          {surveyData.questions[currentIndex].question}
        </Text>
        
        <QuestionRenderer
          question={surveyData.questions[currentIndex]}
          value={answers[surveyData.questions[currentIndex].id]}
          onChange={(value) => 
            setAnswers(prev => ({
              ...prev,
              [surveyData.questions[currentIndex].id]: value
            }))
          }
          onAutoAdvance={handleNext}
        />

        <Button
          onPress={handleNext}
          primary
          loading={isSubmitting}
        >
          {currentIndex === surveyData.questions.length - 1 ? 'Submit' : 'Next'}
        </Button>
      </BlockStack>
      
      <Footer />
    </View>
  );
};

export default reactExtension("purchase.thank-you.block.render",() => <Survey/>);