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
  useSubscription,
  OrderConfirmationApi,
  useCustomer,
  useTotalAmount
} from '@shopify/ui-extensions-react/checkout';
import { useCallback, useState, useEffect } from 'react';
import axios from 'axios';

const BASEURL = 'https://survey-poc.onrender.com';

// Question type mapping
const QuestionType = {
  TEXT: 'text',
  RATING: 'rating',
  MULTIPLE_CHOICE: 'multiple_choice',
  SINGLE_CHOICE: 'single_choice'
};

const RatingQuestion = ({ value, onChange, maxRating = 5 }) => {
  return (
    <ChoiceList
      name="rating"
      value={value ? [value] : []}
      onChange={(newValue) => onChange(newValue[0])}
    >
      <InlineStack spacing="tight">
        {[...Array(maxRating)].map((_, index) => (
          <Choice key={index + 1} id={(index + 1).toString()}>
            {index + 1}
          </Choice>
        ))}
      </InlineStack>
    </ChoiceList>
  );
};

const QuestionRenderer = ({ question, value, onChange, onAutoAdvance }) => {
  const handleChange = useCallback((newValue) => {
    onChange(newValue);
    if (question.questionType === 'rating') {
      onAutoAdvance?.();
    }
  }, [onChange, onAutoAdvance, question.questionType]);

  switch (question.questionType) {
    case QuestionType.TEXT:
      return (
        <TextField
          label=""
          value={value || ''}
          onChange={handleChange}
          multiline
          placeholder="Please enter your response..."
        />
      );

    case QuestionType.RATING:
      return (
        <RatingQuestion
          value={value}
          onChange={handleChange}
        />
      );

    case QuestionType.MULTIPLE_CHOICE:
    case QuestionType.SINGLE_CHOICE:
      return (
        <ChoiceList
          name={`question-${question._id}`}
          value={Array.isArray(value) ? value : value ? [value] : []}
          onChange={(newValue) => {
            handleChange(question.questionType === QuestionType.MULTIPLE_CHOICE ? newValue : newValue[0]);
          }}
          allowMultiple={question.questionType === QuestionType.MULTIPLE_CHOICE}
        >
          {question.options.map((option) => (
            <Choice key={option} id={option}>{option}</Choice>
          ))}
        </ChoiceList>
      );

    default:
      return <Text>Unsupported question type: {question.questionType}</Text>;
  }
};

const Survey = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [surveyData, setSurveyData] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const  customer = useCustomer();

  const orderCost = useTotalAmount();
  console.log(orderCost,"orderCost");

  console.log(customer,"customerData");
  const fetchSurvey = async () => {
    try {
      const response = await axios.get(`${BASEURL}/api/survey&totalOrderAmount=${orderCost?.amount || 0}`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to load survey. Please try again.');
    }
  };

  const submitSurvey = async (answers) => {
    try {
      const response = await axios.post(
        `${BASEURL}/api/response`,
        {
          surveyId: surveyData._id,
          responses: answers,
          orderId: orderNumber?.number,
          customerId: 'guest' // Replace with actual customer ID if available
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      throw new Error('Failed to submit survey. Please try again.');
    }
  };

  useEffect(() => {
    const loadSurvey = async () => {
      try {
        const data = await fetchSurvey();
        setSurveyData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadSurvey();
  }, []);

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await submitSurvey(answers);
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
  }, [currentIndex, surveyData?.questions?.length]);

  if (isLoading) {
    return (
      <View padding="base">
        <BlockStack spacing="loose" alignment="center">
          <Spinner size="large" />
          <Text>Loading survey...</Text>
        </BlockStack>
      </View>
    );
  }

  if (error) {
    return (
      <View padding="base">
        <Banner status="critical">
          <Text>{error}</Text>
        </Banner>
      </View>
    );
  }

  if (isComplete) {
    return (
      <View padding="base">
        <Banner status="success">
          <BlockStack spacing="tight">
            <Text emphasis="bold">Thank you for your feedback!</Text>
            <Text>Your responses have been recorded.</Text>
          </BlockStack>
        </Banner>
      </View>
    );
  }

  const currentQuestion = surveyData?.questions[currentIndex];
  if (!currentQuestion) {
    return (
      <View padding="base">
        <Banner status="critical">
          <Text>No survey questions available</Text>
        </Banner>
      </View>
    );
  }

  const progress = ((currentIndex + 1) / surveyData.questions.length * 100).toFixed(0);

  return (
    <View padding="base">
      <BlockStack spacing="loose">
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

        <Text emphasis="bold" size="large">
          {currentQuestion.questionText}
        </Text>

        <QuestionRenderer
          question={currentQuestion}
          value={answers[currentQuestion._id]}
          onChange={(value) => setAnswers(prev => ({
            ...prev,
            [currentQuestion._id]: value
          }))}
          onAutoAdvance={handleNext}
        />

        <Button
          onPress={handleNext}
          primary
          loading={isSubmitting}
          disabled={currentQuestion.required && !answers[currentQuestion._id]}
        >
          {currentIndex === surveyData.questions.length - 1 ? 'Submit' : 'Next'}
        </Button>
      </BlockStack>
    </View>
  );
};

export default reactExtension("purchase.thank-you.block.render", () => <Survey />);