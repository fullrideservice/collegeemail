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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Dialog component
const Dialog = ({ isOpen, onClose, children }) => {
  const dialogRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/10 bg-opacity-50 flex items-center justify-center z-50">
      <div
        ref={dialogRef}
        className="bg-white rounded-lg shadow-lg max-w-md w-full m-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
          {children}
        </div>
      </div>
    </div>
  );
};

const CollegeSportsManager = () => {
  const [colleges, setColleges] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(null);
  const [editingStaff, setEditingStaff] = useState({});
  const [autoSaveStatus, setAutoSaveStatus] = useState("saved");
  const [openDialogs, setOpenDialogs] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [bulkInputText, setBulkInputText] = useState("");
  const [aiResponseText, setAiResponseText] = useState("");
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showBulkInput, setShowBulkInput] = useState(null);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [validationWarnings, setValidationWarnings] = useState({});
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const fileInputRef = useRef(null);

  const currentCollege = colleges[currentIndex];

  // Auto-save functionality
  useEffect(() => {
    if (colleges.length > 0) {
      setAutoSaveStatus("saving");
      const timer = setTimeout(() => {
        setAutoSaveStatus("saved");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [colleges]);

  // Validation functions
  const validateEmail = (email) => {
    if (!email) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) ? null : "Invalid email format";
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return "";
    const cleaned = phone.replace(/\D/g, "");
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
    return phone;
  };

  const validatePhoneNumber = (phone) => {
    if (!phone) return null;
    const cleaned = phone.replace(/\D/g, "");
    return cleaned.length === 10 ? null : "Phone number must be 10 digits";
  };

  // Generate derived staff name
  const generateStaffName = (first, middle, last) => {
    const parts = [first, middle, last].filter((part) => part && part.trim());
    return parts.join(" ");
  };

  // Enhanced validation function for navigation
  const validateCurrentCollege = () => {
    if (!currentCollege || !currentCollege.sports) return null;

    const warnings = {
      noCoaches: [],
      noEmails: [],
      customVisibility: [],
      hiddenCoaches: [],
      inactiveCoaches: [],
    };

    currentCollege.sports.forEach((sport) => {
      const sportName = sport.sport || "Unnamed Sport";

      // Check if sport has no coaches at all
      if (!sport.staff || sport.staff.length === 0) {
        warnings.noCoaches.push(sportName);
        return;
      }

      // Check for coaches with no emails
      const coachesWithEmails = sport.staff.filter(
        (staff) => staff.staffEmail && staff.staffEmail.trim(),
      );
      if (coachesWithEmails.length === 0) {
        warnings.noEmails.push(sportName);
      }

      // Check visibility and active status
      let hasCustomVisibility = false;
      let hasHiddenCoaches = false;
      let hasInactiveCoaches = false;

      sport.staff.forEach((staff) => {
        // Check if staff is inactive
        if (staff.staffActive === false) {
          hasInactiveCoaches = true;
        }

        // Define visibility fields - updated to use new field names
        const visibilityFields = [
          staff.canShowStaffUser,
          staff.canShowTitle,
          staff.canShowName,
          staff.canShowEmail,
          staff.canShowPhoneNumber,
          staff.staffActive,
        ];

        // Check for completely hidden (all false)
        const allFalse = visibilityFields.every((field) => field === false);

        // Check for fully visible (all true)
        const allTrue = visibilityFields.every((field) => field === true);

        if (allFalse) {
          hasHiddenCoaches = true;
        } else if (!allTrue) {
          // Anything that's not all true and not all false is custom
          // This includes null values and mixed combinations
          hasCustomVisibility = true;
        }
      });

      if (hasCustomVisibility) {
        warnings.customVisibility.push(sportName);
      }
      if (hasHiddenCoaches) {
        warnings.hiddenCoaches.push(sportName);
      }
      if (hasInactiveCoaches) {
        warnings.inactiveCoaches.push(sportName);
      }
    });

    // Return warnings only if any exist
    const hasWarnings = Object.values(warnings).some((arr) => arr.length > 0);
    return hasWarnings ? warnings : null;
  };

  // Navigation with validation
  const goToPrevious = () => {
    if (currentIndex > 0) {
      const warnings = validateCurrentCollege();
      if (warnings) {
        setValidationWarnings(warnings);
        setPendingNavigation("previous");
        setShowValidationDialog(true);
        return;
      }
      performNavigation("previous");
    }
  };

  const goToNext = () => {
    if (currentIndex < colleges.length - 1) {
      const warnings = validateCurrentCollege();
      if (warnings) {
        setValidationWarnings(warnings);
        setPendingNavigation("next");
        setShowValidationDialog(true);
        return;
      }
      performNavigation("next");
    }
  };

  const performNavigation = (direction) => {
    if (direction === "previous" && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (direction === "next" && currentIndex < colleges.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }

    // Reset states after navigation
    setIsEditing(null);
    setEditingStaff({});
    setOpenDialogs({});
    setShowBulkInput(null);
    setBulkInputText("");
    setAiResponseText("");
  };

  const handleValidationProceed = () => {
    setShowValidationDialog(false);
    if (pendingNavigation) {
      performNavigation(pendingNavigation);
      setPendingNavigation(null);
    }
    setValidationWarnings({});
  };

  const handleValidationCancel = () => {
    setShowValidationDialog(false);
    setPendingNavigation(null);
    setValidationWarnings({});
  };

  // Enhanced AI processing with improved prompt and JSON parsing
  const processWithAI = async (sportIndex, staffIndex) => {
    if (!bulkInputText) return;

    setIsProcessingAI(true);
    setAiResponseText("Processing...");

    const API_KEY = "AIzaSyASsPYfI03YRzvVGNibVarkPFPGgXP0rSQ";
    const model = "gemini-2.0-flash-exp";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

    const prompt = `You are a helpful assistant that extracts staff information from a given text. The user will provide a block of text containing staff names, roles, emails, and phone numbers. Your task is to extract this information and format it as a JSON array of objects. Each object should have the properties 'staffTitle', 'staffFirstName', 'staffMiddleName', 'staffLastName', 'staffEmail', 'staffPhoneNumber'. The 'staffPhoneNumber' should be formatted as "(123) 456-7890". If a piece of information is not present, use null.

Parse the following text and extract staff information into a JSON array with these exact fields:
[
{
  "staffTitle": "extracted title or null",
  "staffFirstName": "extracted first name or null", 
  "staffMiddleName": "extracted middle name or null",
  "staffLastName": "extracted last name or null",
  "staffEmail": "extracted email or null",
  "staffPhoneNumber": "extracted phone number formatted as (123) 456-7890 or null"
}
]

Text to parse: ${bulkInputText}

Return only the JSON array, no other text.`;

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
        const generatedText = data.candidates[0].content.parts[0].text;
        setAiResponseText(generatedText);

        // Try to parse the JSON and populate the form
        try {
          const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const parsedData = JSON.parse(jsonMatch[0]);

            // If it's an array, take the first item, otherwise use the object directly
            const staffData = Array.isArray(parsedData)
              ? parsedData[0]
              : parsedData;

            if (staffData) {
              // Update editing staff with AI-parsed data
              const updatedStaff = {
                ...editingStaff,
                staffTitle: staffData.staffTitle || "",
                staffFirstName: staffData.staffFirstName || "",
                staffMiddleName: staffData.staffMiddleName || "",
                staffLastName: staffData.staffLastName || "",
                staffEmail: staffData.staffEmail || "",
                staffPhoneNumber: staffData.staffPhoneNumber || "",
              };

              // Generate staff name
              updatedStaff.staffName = generateStaffName(
                updatedStaff.staffFirstName,
                updatedStaff.staffMiddleName,
                updatedStaff.staffLastName,
              );

              setEditingStaff(updatedStaff);

              // If there are multiple staff members in the array, you could handle them here
              if (Array.isArray(parsedData) && parsedData.length > 1) {
                setAiResponseText(
                  (prev) =>
                    prev +
                    "\n\nNote: Multiple staff members detected. Only the first one was populated. You can process others separately.",
                );
              }
            }
          }
        } catch (parseError) {
          console.error("Error parsing AI response:", parseError);
          setAiResponseText(
            (prev) =>
              prev +
              "\n\nNote: Could not automatically populate form fields, but you can copy the data manually.",
          );
        }
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

  // Import JSON
  const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target.result);
          const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData];
          setColleges(dataArray);
          setCurrentIndex(0);
        } catch (error) {
          alert("Invalid JSON file");
        }
      };
      reader.readAsText(file);
    }
  };

  // Export JSON
  const handleExport = () => {
    const dataStr = JSON.stringify(colleges, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "college_data.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === "ArrowLeft" && !isEditing) {
        goToPrevious();
      } else if (event.key === "ArrowRight" && !isEditing) {
        goToNext();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentIndex, colleges.length, isEditing]);

  // Add new staff member
  const addStaff = (sportIndex) => {
    const newStaff = {
      staffId: crypto.randomUUID(),
      staffTitle: "",
      staffName: "",
      staffFirstName: "",
      staffMiddleName: "",
      staffLastName: "",
      staffEmail: "",
      staffPhoneNumber: "",
      canShowStaffUser: true,
      canShowTitle: true,
      canShowName: true,
      canShowEmail: true,
      canShowPhoneNumber: true,
      staffLinkOrDirectoryLink: null,
      staffActive: true,
    };

    const updatedColleges = [...colleges];
    updatedColleges[currentIndex].sports[sportIndex].staff.push(newStaff);
    setColleges(updatedColleges);

    // Automatically enter edit mode and show bulk input
    const staffIndex =
      updatedColleges[currentIndex].sports[sportIndex].staff.length - 1;
    setIsEditing(`${sportIndex}-${staffIndex}`);
    setEditingStaff({ ...newStaff });
    setShowBulkInput(`${sportIndex}-${staffIndex}`);
  };

  // Set staff visibility preset
  const setStaffVisibility = (sportIndex, staffIndex, preset) => {
    const updatedColleges = [...colleges];
    const staff =
      updatedColleges[currentIndex].sports[sportIndex].staff[staffIndex];

    if (preset === "visible") {
      staff.canShowStaffUser = true;
      staff.canShowTitle = true;
      staff.canShowName = true;
      staff.canShowEmail = true;
      staff.canShowPhoneNumber = true;
      staff.staffActive = true;
    } else if (preset === "hidden") {
      staff.canShowStaffUser = false;
      staff.canShowTitle = false;
      staff.canShowName = false;
      staff.canShowEmail = false;
      staff.canShowPhoneNumber = false;
      staff.staffActive = null;
    }

    setColleges(updatedColleges);
  };

  // Update staff visibility field
  const updateStaffVisibility = (sportIndex, staffIndex, field, value) => {
    const updatedColleges = [...colleges];
    updatedColleges[currentIndex].sports[sportIndex].staff[staffIndex][field] =
      value;
    setColleges(updatedColleges);
  };

  // Toggle dialog
  const toggleDialog = (key) => {
    setOpenDialogs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Get staff visibility status
  const getStaffVisibilityStatus = (staff) => {
    const visibleFields = [
      staff.canShowStaffUser,
      staff.canShowTitle,
      staff.canShowName,
      staff.canShowEmail,
      staff.canShowPhoneNumber,
      staff.staffActive,
    ];

    const allVisible = visibleFields.every((field) => field === true);
    const allHidden = visibleFields
      .slice(0, 5)
      .every((field) => field === false);

    if (allVisible) return "visible";
    if (allHidden) return "hidden";
    return "custom";
  };

  // Edit staff member
  const startEditStaff = (sportIndex, staffIndex) => {
    setIsEditing(`${sportIndex}-${staffIndex}`);
    setEditingStaff({ ...currentCollege.sports[sportIndex].staff[staffIndex] });
    setValidationErrors({});
    // Automatically show bulk input dialog when editing
    setShowBulkInput(`${sportIndex}-${staffIndex}`);
    setBulkInputText("");
    setAiResponseText("");
  };

  // Save staff changes
  const saveStaffChanges = (sportIndex, staffIndex) => {
    const errors = {};

    // Validate email
    const emailError = validateEmail(editingStaff.staffEmail);
    if (emailError) errors.email = emailError;

    // Validate phone
    const phoneError = validatePhoneNumber(editingStaff.staffPhoneNumber);
    if (phoneError) errors.phone = phoneError;

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    const updatedColleges = [...colleges];
    const updatedStaff = {
      ...editingStaff,
      staffName: generateStaffName(
        editingStaff.staffFirstName,
        editingStaff.staffMiddleName,
        editingStaff.staffLastName,
      ),
      staffPhoneNumber: formatPhoneNumber(editingStaff.staffPhoneNumber),
    };

    updatedColleges[currentIndex].sports[sportIndex].staff[staffIndex] =
      updatedStaff;
    setColleges(updatedColleges);
    setIsEditing(null);
    setEditingStaff({});
    setValidationErrors({});
    setShowBulkInput(null);
    setBulkInputText("");
    setAiResponseText("");
  };

  // Cancel staff edit
  const cancelStaffEdit = () => {
    setIsEditing(null);
    setEditingStaff({});
    setValidationErrors({});
    setShowBulkInput(null);
    setBulkInputText("");
    setAiResponseText("");
  };

  // Delete staff member
  const deleteStaff = (sportIndex, staffIndex) => {
    if (confirm("Are you sure you want to delete this staff member?")) {
      const updatedColleges = [...colleges];
      updatedColleges[currentIndex].sports[sportIndex].staff.splice(
        staffIndex,
        1,
      );
      setColleges(updatedColleges);
    }
  };

  // Update editing staff field
  const updateEditingField = (field, value) => {
    let processedValue = value;

    // Auto-format phone number as user types
    if (field === "staffPhoneNumber") {
      processedValue = formatPhoneNumber(value);
    }

    setEditingStaff((prev) => {
      const updated = { ...prev, [field]: processedValue };

      // Update derived staffName when name fields change
      if (
        ["staffFirstName", "staffMiddleName", "staffLastName"].includes(field)
      ) {
        updated.staffName = generateStaffName(
          updated.staffFirstName,
          updated.staffMiddleName,
          updated.staffLastName,
        );
      }

      return updated;
    });

    // Clear validation errors when user starts typing
    if (validationErrors.email && field === "staffEmail") {
      setValidationErrors((prev) => ({ ...prev, email: null }));
    }
    if (validationErrors.phone && field === "staffPhoneNumber") {
      setValidationErrors((prev) => ({ ...prev, phone: null }));
    }
  };

  // Get sport-specific styling
  const getSportColor = (sport) => {
    const colors = {};
    return colors[sport] || "bg-gray-50 border-gray-200";
  };

  // Add new college
  const addNewCollege = () => {
    const newCollege = {
      collegeId: crypto.randomUUID(),
      officialName: "New College",
      officialNameLowercase: "new college",
      createdAt: Date.now(),
      divisionNCAA: 1,
      orgIdNCAA: null,
      academicYearNCAA: new Date().getFullYear() + 1,
      activeNCAA: true,
      collegeWebsiteUrl: "",
      athleticWebsiteUrl: "",
      stateProvinceNCAA: "",
      sportDirectoryLink: "",
      nicheCollegeLink: "",
      governmentSchoolLink: "",
      ipedsId: "",
      updatedAt: Date.now(),
      sports: [],
    };

    const updatedColleges = [...colleges, newCollege];
    setColleges(updatedColleges);
    setCurrentIndex(updatedColleges.length - 1);
  };

  // Add new sport to current college
  const addSport = () => {
    const newSport = {
      sport: "New Sport",
      division: "1",
      conference: "",
      governingBody: "NCAA",
      sportCoachDirectoryLink: "",
      staff: [],
    };

    const updatedColleges = [...colleges];
    updatedColleges[currentIndex].sports.push(newSport);
    setColleges(updatedColleges);
  };

  // Delete sport
  const deleteSport = (sportIndex) => {
    if (
      confirm("Are you sure you want to delete this sport and all its staff?")
    ) {
      const updatedColleges = [...colleges];
      updatedColleges[currentIndex].sports.splice(sportIndex, 1);
      setColleges(updatedColleges);
    }
  };

  // Update sport info
  const updateSport = (sportIndex, field, value) => {
    const updatedColleges = [...colleges];
    updatedColleges[currentIndex].sports[sportIndex][field] = value;
    setColleges(updatedColleges);
  };

  // Update college basic info
  const updateCollegeInfo = (field, value) => {
    const updatedColleges = [...colleges];
    updatedColleges[currentIndex][field] = value;
    if (field === "officialName") {
      updatedColleges[currentIndex]["officialNameLowercase"] =
        value.toLowerCase();
    }
    setColleges(updatedColleges);
  };

  if (colleges.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              College Sports Management System
            </h1>
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-xl font-semibold mb-4">Get Started</h2>
              <p className="text-gray-600 mb-6">
                Import your college sports JSON file or create a new college
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Import JSON File
                </Button>
                <Button
                  onClick={addNewCollege}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create New College
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="sm"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button onClick={handleExport} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={addNewCollege} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New College
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
            </div>

            <div className="flex items-center gap-4">
              <span
                className={`text-sm px-2 py-1 rounded ${
                  autoSaveStatus === "saved"
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {autoSaveStatus === "saved" ? "Saved" : "Saving..."}
              </span>
              <span className="text-sm text-gray-600">
                {currentCollege?.sports?.length || 0} Sports
              </span>
              <span className="text-sm text-gray-600">
                College {currentIndex + 1} of {colleges.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation and College Info */}
      <div className="max-w-[1500px] mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              variant="outline"
              size="lg"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <div className="text-center flex-1 mx-8">
              <Input
                value={currentCollege?.officialName || ""}
                onChange={(e) =>
                  updateCollegeInfo("officialName", e.target.value)
                }
                className="text-2xl font-bold text-center border-none shadow-none text-gray-900 bg-transparent"
                placeholder="College Name"
              />
            </div>

            <Button
              onClick={goToNext}
              disabled={currentIndex === colleges.length - 1}
              variant="outline"
              size="lg"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <Label className="mb-2">State</Label>
              <Input
                value={currentCollege?.stateProvinceNCAA || ""}
                onChange={(e) =>
                  updateCollegeInfo("stateProvinceNCAA", e.target.value)
                }
                placeholder="State"
              />
            </div>
            <div>
              <Label className="mb-2">NCAA Division</Label>
              <Input
                value={currentCollege?.divisionNCAA || ""}
                onChange={(e) =>
                  updateCollegeInfo("divisionNCAA", e.target.value)
                }
                placeholder="Division"
              />
            </div>
            <div>
              <Label className="mb-2">College Website</Label>
              <Input
                value={currentCollege?.collegeWebsiteUrl || ""}
                onChange={(e) =>
                  updateCollegeInfo("collegeWebsiteUrl", e.target.value)
                }
                placeholder="college.edu"
              />
            </div>
            <div>
              <Label className="mb-2">Athletic Website</Label>
              <Input
                value={currentCollege?.athleticWebsiteUrl || ""}
                onChange={(e) =>
                  updateCollegeInfo("athleticWebsiteUrl", e.target.value)
                }
                placeholder="athletics.college.edu"
              />
            </div>
          </div>
        </div>

        {/* Sports Management */}
        <div className="mb-6">
          <Button onClick={addSport} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Sport
          </Button>
        </div>

        {/* Validation Warning Dialog */}
        <Dialog isOpen={showValidationDialog} onClose={handleValidationCancel}>
          <div className="space-y-4">
            <div className="pr-8">
              <h4 className="font-semibold text-lg text-red-800 flex items-center gap-2">
                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                </div>
                Data Quality Warnings
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                Issues found with{" "}
                {currentCollege?.officialName || "current college"}. Review or
                proceed anyway.
              </p>
            </div>

            <div className="border border-red-200 rounded-lg p-4 bg-red-50 space-y-3 max-h-80 overflow-y-auto">
              {validationWarnings.noCoaches?.length > 0 && (
                <div>
                  <h5 className="font-medium text-red-900 mb-1">
                    Sports with no coaches:
                  </h5>
                  <p className="text-sm text-red-700 ml-3">
                    {validationWarnings.noCoaches.join(", ")}
                  </p>
                </div>
              )}

              {validationWarnings.noEmails?.length > 0 && (
                <div>
                  <h5 className="font-medium text-red-900 mb-1">
                    Sports with coaches missing emails:
                  </h5>
                  <p className="text-sm text-red-700 ml-3">
                    {validationWarnings.noEmails.join(", ")}
                  </p>
                </div>
              )}

              {validationWarnings.customVisibility?.length > 0 && (
                <div>
                  <h5 className="font-medium text-red-900 mb-1">
                    Sports with coaches using custom visibility:
                  </h5>
                  <p className="text-sm text-red-700 ml-3">
                    {validationWarnings.customVisibility.join(", ")}
                  </p>
                </div>
              )}

              {validationWarnings.hiddenCoaches?.length > 0 && (
                <div>
                  <h5 className="font-medium text-red-900 mb-1">
                    Sports with completely hidden coaches:
                  </h5>
                  <p className="text-sm text-red-700 ml-3">
                    {validationWarnings.hiddenCoaches.join(", ")}
                  </p>
                </div>
              )}

              {validationWarnings.inactiveCoaches?.length > 0 && (
                <div>
                  <h5 className="font-medium text-red-900 mb-1">
                    Sports with inactive coaches:
                  </h5>
                  <p className="text-sm text-red-700 ml-3">
                    {validationWarnings.inactiveCoaches.join(", ")}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                onClick={handleValidationCancel}
                variant="outline"
                size="sm"
              >
                Stay Here
              </Button>
              <Button
                onClick={handleValidationProceed}
                variant="destructive"
                size="sm"
              >
                Proceed Anyway
              </Button>
            </div>
          </div>
        </Dialog>

        <div className="space-y-32">
          {currentCollege?.sports?.map((sport, sportIndex) => (
            <Card
              key={sportIndex}
              className={`${getSportColor(sport.sport)} border-2`}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Input
                      value={sport.sport}
                      onChange={(e) =>
                        updateSport(sportIndex, "sport", e.target.value)
                      }
                      className="text-xl font-bold bg-transparent border-none shadow-none"
                      placeholder="Sport Name"
                    />
                    <Input
                      value={sport.division}
                      onChange={(e) =>
                        updateSport(sportIndex, "division", e.target.value)
                      }
                      placeholder="Division"
                      className="bg-white"
                    />
                    <Input
                      value={sport.conference}
                      onChange={(e) =>
                        updateSport(sportIndex, "conference", e.target.value)
                      }
                      placeholder="Conference"
                      className="bg-white"
                    />
                    <Input
                      value={sport.sportCoachDirectoryLink || ""}
                      onChange={(e) =>
                        updateSport(
                          sportIndex,
                          "sportCoachDirectoryLink",
                          e.target.value,
                        )
                      }
                      placeholder="Coach Directory URL"
                      className="bg-white"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 ml-4">
                    {/* Google Search Button */}
                    <Button
                      onClick={() => {
                        const searchQuery = `${currentCollege?.officialName || ""} ${sport.sport || ""} Roster`;
                        const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
                        window.open(googleUrl, "_blank");
                      }}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 533.5 544.3"
                        className="w-4 h-4"
                        fill="none"
                      >
                        <path
                          fill="#4285F4"
                          d="M533.5 278.4c0-17.4-1.6-34.1-4.6-50.4H272v95.3h146.9c-6.4 34.7-25.3 64.2-53.8 83.7v69.5h86.9c50.8-46.8 81.5-115.8 81.5-198.1z"
                        />
                        <path
                          fill="#34A853"
                          d="M272 544.3c72.6 0 133.6-24.1 178.1-65.2l-86.9-69.5c-24.1 16.1-55 25.5-91.2 25.5-70.1 0-129.5-47.3-150.7-110.6H32.9v69.9c44.4 88.1 135.9 150 239.1 150z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M121.3 324.5c-10.4-30.9-10.4-64.1 0-95l-88.4-69.9C4.4 211.1-7 244.6-7 281.8s11.4 70.7 31.3 122.1l88.3-69.4z"
                        />
                        <path
                          fill="#EA4335"
                          d="M272 108.1c39.5 0 75.1 13.6 103.2 40.3l77.4-77.4C405.6 25.5 344.6 0 272 0 168.8 0 77.3 61.9 32.9 150l88.4 69.9C142.5 155.4 201.9 108.1 272 108.1z"
                        />
                      </svg>
                      Google
                    </Button>

                    {/* DuckDuckGo Search Button */}
                    <Button
                      onClick={() => {
                        const searchQuery = `${currentCollege?.officialName || ""} ${sport.sport || ""} Roster`;
                        const duckduckgoUrl = `https://duckduckgo.com/?q=${encodeURIComponent(searchQuery)}`;
                        window.open(duckduckgoUrl, "_blank");
                      }}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 512 512"
                        className="w-4 h-4"
                        fill="none"
                      >
                        <circle cx="256" cy="256" r="256" fill="#DE5833" />
                        <path
                          fill="#FFF"
                          d="M256 100c-87 0-157 70-157 157s70 157 157 157 157-70 157-157-70-157-157-157zm0 289c-72.1 0-131-58.9-131-131s58.9-131 131-131 131 58.9 131 131-58.9 131-131 131z"
                        />
                        <path
                          fill="#FFF"
                          d="M256 145c-61.8 0-112 50.2-112 112s50.2 112 112 112 112-50.2 112-112-50.2-112-112-112zm0 192c-44.2 0-80-35.8-80-80s35.8-80 80-80 80 35.8 80 80-35.8 80-80 80z"
                        />
                      </svg>
                      DDG
                    </Button>
                    <Button
                      onClick={() => addStaff(sportIndex)}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Staff
                    </Button>
                    <Button
                      onClick={() => deleteSport(sportIndex)}
                      size="sm"
                      variant="destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse bg-white rounded-lg overflow-hidden">
                    <thead className="bg-gray-50">
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold">
                          Visibility
                        </th>
                        <th className="text-left p-3 font-semibold">Title</th>
                        <th className="text-left p-3 font-semibold">
                          First Name
                        </th>
                        <th className="text-left p-3 font-semibold">
                          Middle Name
                        </th>
                        <th className="text-left p-3 font-semibold">
                          Last Name
                        </th>
                        <th className="text-left p-3 font-semibold">Email</th>
                        <th className="text-left p-3 font-semibold">Phone</th>
                        <th className="text-left p-3 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sport.staff?.length === 0 ? (
                        <tr>
                          <td
                            colSpan="8"
                            className="p-8 text-center text-gray-500"
                          >
                            No staff members yet. Click "Add Staff" to get
                            started.
                          </td>
                        </tr>
                      ) : (
                        sport.staff?.map((staff, staffIndex) => {
                          const visibilityStatus =
                            getStaffVisibilityStatus(staff);
                          const dialogKey = `${sportIndex}-${staffIndex}`;

                          return (
                            <tr
                              key={staff.staffId}
                              className="border-b hover:bg-gray-50"
                            >
                              <td className="p-3">
                                <div className="flex items-center gap-3">
                                  {/* Visibility Status Indicator */}
                                  <div className="flex flex-col items-center gap-1">
                                    <div
                                      className={`w-3 h-3 rounded-full ${
                                        visibilityStatus === "visible"
                                          ? "bg-green-500"
                                          : visibilityStatus === "hidden"
                                            ? "bg-red-500"
                                            : "bg-yellow-500"
                                      }`}
                                      title={
                                        visibilityStatus === "visible"
                                          ? "Fully Visible"
                                          : visibilityStatus === "hidden"
                                            ? "Hidden"
                                            : "Custom"
                                      }
                                    ></div>
                                    <span className="text-xs font-medium">
                                      {visibilityStatus === "visible"
                                        ? "V"
                                        : visibilityStatus === "hidden"
                                          ? "H"
                                          : "C"}
                                    </span>
                                  </div>

                                  {/* Stacked Preset Buttons */}
                                  <div className="flex flex-col gap-1">
                                    <Button
                                      size="xs"
                                      variant={
                                        visibilityStatus === "visible"
                                          ? "success"
                                          : "outline"
                                      }
                                      onClick={() =>
                                        setStaffVisibility(
                                          sportIndex,
                                          staffIndex,
                                          "visible",
                                        )
                                      }
                                      className="h-6 px-2"
                                      title="Set Fully Visible"
                                    >
                                      {visibilityStatus === "visible" && (
                                        <Check className="h-3 w-3 mr-1" />
                                      )}
                                      <Eye className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="xs"
                                      variant={
                                        visibilityStatus === "hidden"
                                          ? "warning"
                                          : "outline"
                                      }
                                      onClick={() =>
                                        setStaffVisibility(
                                          sportIndex,
                                          staffIndex,
                                          "hidden",
                                        )
                                      }
                                      className="h-6 px-2"
                                      title="Set Hidden"
                                    >
                                      {visibilityStatus === "hidden" && (
                                        <Check className="h-3 w-3 mr-1" />
                                      )}
                                      <EyeOff className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="xs"
                                      variant={
                                        visibilityStatus === "custom"
                                          ? "secondary"
                                          : "outline"
                                      }
                                      onClick={() => toggleDialog(dialogKey)}
                                      className="h-6 px-2"
                                      title="Custom Settings"
                                    >
                                      {visibilityStatus === "custom" && (
                                        <Check className="h-3 w-3 mr-1" />
                                      )}
                                      <Settings className="h-3 w-3" />
                                    </Button>
                                  </div>

                                  {/* Custom Settings Dialog */}
                                  <Dialog
                                    isOpen={openDialogs[dialogKey]}
                                    onClose={() => toggleDialog(dialogKey)}
                                  >
                                    <div className="space-y-4">
                                      <div className="pr-8">
                                        <h4 className="font-semibold text-lg">
                                          Custom Visibility Settings
                                        </h4>
                                        <p className="text-sm text-gray-600 mt-1">
                                          Configure individual visibility
                                          options for{" "}
                                          {staff.staffFirstName ||
                                            "this staff member"}
                                        </p>
                                      </div>
                                      <div className="space-y-3">
                                        <label className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                                          <input
                                            type="checkbox"
                                            checked={staff.canShowStaffUser}
                                            onChange={(e) =>
                                              updateStaffVisibility(
                                                sportIndex,
                                                staffIndex,
                                                "canShowStaffUser",
                                                e.target.checked,
                                              )
                                            }
                                            className="rounded h-4 w-4"
                                          />
                                          <div>
                                            <span className="text-sm font-medium">
                                              Show Staff User
                                            </span>
                                            <p className="text-xs text-gray-500">
                                              Display this staff member in user
                                              listings
                                            </p>
                                          </div>
                                        </label>
                                        <label className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                                          <input
                                            type="checkbox"
                                            checked={staff.canShowTitle}
                                            onChange={(e) =>
                                              updateStaffVisibility(
                                                sportIndex,
                                                staffIndex,
                                                "canShowTitle",
                                                e.target.checked,
                                              )
                                            }
                                            className="rounded h-4 w-4"
                                          />
                                          <div>
                                            <span className="text-sm font-medium">
                                              Show Title
                                            </span>
                                            <p className="text-xs text-gray-500">
                                              Display the staff member's
                                              title/position
                                            </p>
                                          </div>
                                        </label>
                                        <label className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                                          <input
                                            type="checkbox"
                                            checked={staff.canShowName}
                                            onChange={(e) =>
                                              updateStaffVisibility(
                                                sportIndex,
                                                staffIndex,
                                                "canShowName",
                                                e.target.checked,
                                              )
                                            }
                                            className="rounded h-4 w-4"
                                          />
                                          <div>
                                            <span className="text-sm font-medium">
                                              Show Name
                                            </span>
                                            <p className="text-xs text-gray-500">
                                              Display the staff member's full
                                              name
                                            </p>
                                          </div>
                                        </label>
                                        <label className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                                          <input
                                            type="checkbox"
                                            checked={staff.canShowEmail}
                                            onChange={(e) =>
                                              updateStaffVisibility(
                                                sportIndex,
                                                staffIndex,
                                                "canShowEmail",
                                                e.target.checked,
                                              )
                                            }
                                            className="rounded h-4 w-4"
                                          />
                                          <div>
                                            <span className="text-sm font-medium">
                                              Show Email
                                            </span>
                                            <p className="text-xs text-gray-500">
                                              Display email contact information
                                            </p>
                                          </div>
                                        </label>
                                        <label className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                                          <input
                                            type="checkbox"
                                            checked={staff.canShowPhoneNumber}
                                            onChange={(e) =>
                                              updateStaffVisibility(
                                                sportIndex,
                                                staffIndex,
                                                "canShowPhoneNumber",
                                                e.target.checked,
                                              )
                                            }
                                            className="rounded h-4 w-4"
                                          />
                                          <div>
                                            <span className="text-sm font-medium">
                                              Show Phone Number
                                            </span>
                                            <p className="text-xs text-gray-500">
                                              Display phone contact information
                                            </p>
                                          </div>
                                        </label>
                                        <label className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                                          <input
                                            type="checkbox"
                                            checked={staff.staffActive}
                                            onChange={(e) =>
                                              updateStaffVisibility(
                                                sportIndex,
                                                staffIndex,
                                                "staffActive",
                                                e.target.checked,
                                              )
                                            }
                                            className="rounded h-4 w-4"
                                          />
                                          <div>
                                            <span className="text-sm font-medium">
                                              Staff Active
                                            </span>
                                            <p className="text-xs text-gray-500">
                                              Mark staff member as currently
                                              active
                                            </p>
                                          </div>
                                        </label>
                                      </div>
                                      <div className="flex justify-end pt-4 border-t">
                                        <Button
                                          onClick={() =>
                                            toggleDialog(dialogKey)
                                          }
                                          size="sm"
                                        >
                                          Done
                                        </Button>
                                      </div>
                                    </div>
                                  </Dialog>
                                </div>
                              </td>
                              <td className="p-3">
                                {isEditing === `${sportIndex}-${staffIndex}` ? (
                                  <Input
                                    value={editingStaff.staffTitle || ""}
                                    onChange={(e) =>
                                      updateEditingField(
                                        "staffTitle",
                                        e.target.value,
                                      )
                                    }
                                    className="min-w-24"
                                    placeholder="Title"
                                  />
                                ) : (
                                  staff.staffTitle || "-"
                                )}
                              </td>
                              <td className="p-3">
                                {isEditing === `${sportIndex}-${staffIndex}` ? (
                                  <Input
                                    value={editingStaff.staffFirstName || ""}
                                    onChange={(e) =>
                                      updateEditingField(
                                        "staffFirstName",
                                        e.target.value,
                                      )
                                    }
                                    className="min-w-24"
                                    placeholder="First"
                                  />
                                ) : (
                                  staff.staffFirstName || "-"
                                )}
                              </td>
                              <td className="p-3">
                                {isEditing === `${sportIndex}-${staffIndex}` ? (
                                  <Input
                                    value={editingStaff.staffMiddleName || ""}
                                    onChange={(e) =>
                                      updateEditingField(
                                        "staffMiddleName",
                                        e.target.value,
                                      )
                                    }
                                    className="min-w-24"
                                    placeholder="Middle"
                                  />
                                ) : (
                                  staff.staffMiddleName || "-"
                                )}
                              </td>
                              <td className="p-3">
                                {isEditing === `${sportIndex}-${staffIndex}` ? (
                                  <Input
                                    value={editingStaff.staffLastName || ""}
                                    onChange={(e) =>
                                      updateEditingField(
                                        "staffLastName",
                                        e.target.value,
                                      )
                                    }
                                    className="min-w-24"
                                    placeholder="Last"
                                  />
                                ) : (
                                  staff.staffLastName || "-"
                                )}
                              </td>
                              <td className="p-3">
                                {isEditing === `${sportIndex}-${staffIndex}` ? (
                                  <Input
                                    value={editingStaff.staffEmail || ""}
                                    onChange={(e) =>
                                      updateEditingField(
                                        "staffEmail",
                                        e.target.value,
                                      )
                                    }
                                    className="min-w-32"
                                    placeholder="john@college.edu"
                                    error={validationErrors.email}
                                  />
                                ) : (
                                  staff.staffEmail || "-"
                                )}
                              </td>
                              <td className="p-3">
                                {isEditing === `${sportIndex}-${staffIndex}` ? (
                                  <Input
                                    value={editingStaff.staffPhoneNumber || ""}
                                    onChange={(e) =>
                                      updateEditingField(
                                        "staffPhoneNumber",
                                        e.target.value,
                                      )
                                    }
                                    className="min-w-28"
                                    placeholder="123-123-4567"
                                    error={validationErrors.phone}
                                  />
                                ) : (
                                  staff.staffPhoneNumber || "-"
                                )}
                              </td>
                              <td className="p-3">
                                {isEditing === `${sportIndex}-${staffIndex}` ? (
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        saveStaffChanges(sportIndex, staffIndex)
                                      }
                                      className="h-8 w-8 p-0"
                                    >
                                      <Save className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={cancelStaffEdit}
                                      className="h-8 w-8 p-0"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        startEditStaff(sportIndex, staffIndex)
                                      }
                                      className="h-8 w-8 p-0"
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() =>
                                        deleteStaff(sportIndex, staffIndex)
                                      }
                                      className="h-8 w-8 p-0"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Enhanced Bulk Input Section with AI Processing */}
                {showBulkInput ===
                  `${sportIndex}-${isEditing?.split("-")[1] || sport.staff?.length - 1}` && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-blue-900">
                        Quick Staff Entry with AI Processing
                      </h4>
                      <Button
                        onClick={() =>
                          processWithAI(
                            sportIndex,
                            isEditing
                              ? parseInt(isEditing.split("-")[1])
                              : sport.staff?.length - 1,
                          )
                        }
                        disabled={!bulkInputText || isProcessingAI}
                        size="lg"
                      >
                        {isProcessingAI ? "Processing..." : "Process with AI"}
                      </Button>
                    </div>

                    {/* Two-column layout for input and output */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Paste Staff Information
                        </label>
                        <textarea
                          value={bulkInputText}
                          onChange={(e) => setBulkInputText(e.target.value)}
                          placeholder="Paste staff information here (e.g., 'John Smith, Head Coach, john.smith@college.edu, (555) 123-4567')..."
                          className="w-full h-72 p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          AI Response
                        </label>
                        <textarea
                          value={aiResponseText}
                          readOnly
                          placeholder="AI response will appear here..."
                          className="w-full h-72 p-3 border border-gray-300 rounded-md resize-none bg-gray-50 text-sm"
                        />
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 mt-2">
                      Paste any staff information and AI will automatically
                      extract and populate the form fields above. The AI can
                      parse names, titles, emails, and phone numbers from
                      various text formats.
                      <br />
                      <span className="font-medium">Tip:</span> Press{" "}
                      <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">
                        Ctrl+Q
                      </kbd>{" "}
                      to quickly process with AI.
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
