import React, { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Upload,
  Download,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Eye,
  EyeOff,
  Settings,
  Check,
} from "lucide-react";

const Button = ({
  onClick,
  disabled,
  variant = "default",
  size = "default",
  className = "",
  children,
}) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background";

  const variants = {
    default:
      "bg-primary text-primary-foreground hover:bg-primary/90 bg-blue-600 text-white hover:bg-blue-700",
    destructive:
      "bg-destructive text-destructive-foreground hover:bg-destructive/90 bg-red-600 text-white hover:bg-red-700",
    outline:
      "border border-input hover:bg-accent hover:text-accent-foreground border-gray-300 hover:bg-gray-50",
    secondary:
      "bg-secondary text-secondary-foreground hover:bg-secondary/80 bg-gray-100 text-gray-900 hover:bg-gray-200",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "underline-offset-4 hover:underline text-primary",
  };

  const sizes = {
    default: "h-10 py-2 px-4",
    sm: "h-9 px-3 rounded-md",
    lg: "h-11 px-8 rounded-md",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
};

const Card = ({ className = "", children }) => {
  return (
    <div
      className={`rounded-xl border bg-card text-card-foreground shadow ${className}`}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ className = "", children }) => {
  return (
    <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>
      {children}
    </div>
  );
};

const CardTitle = ({ className = "", children }) => {
  return (
    <h3
      className={`text-xl font-semibold leading-none tracking-tight ${className}`}
    >
      {children}
    </h3>
  );
};

const CardContent = ({ className = "", children }) => {
  return <div className={`p-6 pt-0 ${className}`}>{children}</div>;
};

const CollegeSportsManager = () => {
  const [currentCollege, setCurrentCollege] = useState(null);
  const [newSport, setNewSport] = useState("");
  const [bulkInputText, setBulkInputText] = useState("");
  const [aiResponseText, setAiResponseText] = useState("");
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const collegeNameRef = useRef(null);

  useEffect(() => {
    // This is for demonstration, in a real app you'd fetch from a backend
    setCurrentCollege({
      id: 1,
      name: "Example University",
      sports: [
        {
          id: 1,
          name: "Football",
          headCoach: "Jane Doe",
          staff: [],
        },
      ],
    });
  }, []);

  const addSport = () => {
    if (newSport.trim() !== "") {
      setCurrentCollege((prev) => ({
        ...prev,
        sports: [
          ...prev.sports,
          { id: Date.now(), name: newSport, headCoach: "", staff: [] },
        ],
      }));
      setNewSport("");
    }
  };

  const updateSport = (id, newName) => {
    setCurrentCollege((prev) => ({
      ...prev,
      sports: prev.sports.map((sport) =>
        sport.id === id ? { ...sport, name: newName } : sport,
      ),
    }));
  };

  const deleteSport = (id) => {
    setCurrentCollege((prev) => ({
      ...prev,
      sports: prev.sports.filter((sport) => sport.id !== id),
    }));
  };

  const handleProcessWithAI = async () => {
    if (!bulkInputText.trim()) return;

    setIsProcessingAI(true);
    setAiResponseText("Processing...");

    const API_KEY = "YOUR_API_KEY"; // Replace with your actual API key
    const model = "gemini-2.5-flash-lite";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

    const prompt = `You are a helpful assistant that extracts staff information from a given text. The user will provide a block of text containing staff names, roles, emails, and phone numbers. Your task is to extract this information and format it as a JSON array of objects. Each object should have the properties 'staffTitle', 'staffFirstName', 'staffMiddleName', 'staffLastName', 'staffEmail', 'staffPhoneNumber' the 'staffPhoneNumber' should be formated as "123-456-7890". If a piece of information is not present, use a null value.
Parse the following text and extract staff information into a JSON object with these exact fields in this order:
{
  "staffTitle": "extracted title or null",
  "staffFirstName": "extracted first name or null", 
  "staffMiddleName": "extracted middle name or null",
  "staffLastName": "extracted last name or null",
  "staffEmail": "extracted email or null",
  "staffPhoneNumber": "extracted phone number or null"
}

Now, process the following input and provide the JSON output, only return the json object no other text:

${bulkInputText}
`;

    const requestBody = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      if (response.ok) {
        // The API returns the response in a specific structure.
        const generatedText = data.candidates[0].content.parts[0].text;
        setAiResponseText(generatedText);
      } else {
        setAiResponseText(`Error from AI: ${data.error.message}`);
      }
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      setAiResponseText(
        "Failed to process with AI. Please check your network or API key.",
      );
    } finally {
      setIsProcessingAI(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-6">
          College Sports Manager
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentCollege?.sports?.map((sport) => (
            <Card key={sport.id}>
              <CardHeader>
                <CardTitle>{sport.name}</CardTitle>
              </CardHeader>
              <CardContent>
                {sport.name === "Football" && (
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-semibold">
                        Staff Information
                      </h4>
                      <Button
                        onClick={handleProcessWithAI}
                        disabled={isProcessingAI}
                        className="text-white bg-blue-600 hover:bg-blue-700"
                      >
                        {isProcessingAI ? "Processing..." : "Process with AI"}
                      </Button>
                    </div>
                    {/* Container for the two text areas */}
                    <div className="flex gap-4">
                      <textarea
                        value={bulkInputText}
                        onChange={(e) => setBulkInputText(e.target.value)}
                        placeholder="Paste staff information here (e.g., 'John Smith, Head Coach, john.smith@college.edu, (555) 123-4567')..."
                        className="w-full h-[400px] p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <textarea
                        value={aiResponseText}
                        readOnly
                        placeholder="AI response will appear here..."
                        className="w-full h-[400px] p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Paste any staff information and AI will extract the
                      details automatically. Press Ctrl+D to process quickly.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {currentCollege?.sports?.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No sports added yet.</p>
              <Button
                onClick={addSport}
                className="flex items-center gap-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                Add Your First Sport
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollegeSportsManager;
