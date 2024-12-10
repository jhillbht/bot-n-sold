import { useState } from 'react';
import { useToast } from "@/components/ui/use-toast";

export interface SurveyData {
  monthlyRevenue: number;
  monthlyExpenses: number;
  businessType: string;
  email: string;
}

export const useSurveyState = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [surveyData, setSurveyData] = useState<SurveyData>({
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    businessType: "",
    email: "",
  });
  const { toast } = useToast();

  const questions = [
    "What's your monthly revenue?",
    "What's your monthly expenses?",
    "What type of business do you have?",
    "Where should I send an email of your valuation?",
  ];

  const handleResponse = async (text: string) => {
    console.log('Processing text response:', text);
    
    if (currentQuestion === 0 && text.includes('revenue')) {
      const match = text.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
      if (match) {
        const revenue = parseFloat(match[1].replace(/,/g, ''));
        setSurveyData(prev => ({ ...prev, monthlyRevenue: revenue }));
        setCurrentQuestion(1);
        return questions[1];
      }
    } else if (currentQuestion === 1 && text.includes('expenses')) {
      const match = text.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
      if (match) {
        const expenses = parseFloat(match[1].replace(/,/g, ''));
        setSurveyData(prev => ({ ...prev, monthlyExpenses: expenses }));
        setCurrentQuestion(2);
        return questions[2];
      }
    } else if (currentQuestion === 2) {
      setSurveyData(prev => ({ ...prev, businessType: text }));
      setCurrentQuestion(3);
      return questions[3];
    } else if (currentQuestion === 3 && text.includes('@')) {
      const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) {
        const email = emailMatch[0];
        setSurveyData(prev => ({ ...prev, email: email }));
        
        // Send valuation email
        const response = await fetch('https://urdvklczigznduyzmgrf.functions.supabase.co/send-valuation-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...surveyData, email }),
        });

        if (response.ok) {
          toast({
            title: "Valuation Report Sent",
            description: `Check your email at ${email} for your business valuation report.`,
          });
          return `Great! I've sent your valuation report to ${email}. Is there anything else you'd like to know?`;
        } else {
          toast({
            title: "Error",
            description: "Failed to send valuation report. Please try again.",
            variant: "destructive",
          });
        }
      }
    }
    return null;
  };

  return {
    currentQuestion,
    questions,
    handleResponse,
  };
};