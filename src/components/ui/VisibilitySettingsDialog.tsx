import React from "react";
import { Button } from "./button";
import { Dialog } from "@radix-ui/react-dialog";

// Three-state radio button component with explicit options
const ThreeStateCheckbox = ({ value, onChange, label, description }) => {
  return (
    <div className="p-3 rounded hover:bg-gray-50 border border-gray-200">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">{label}</span>
            <span
              className={`text-xs px-1.5 py-0.5 rounded text-white font-mono ${
                value === true
                  ? "bg-green-600"
                  : value === false
                    ? "bg-red-600"
                    : "bg-gray-600"
              }`}
            >
              {value === true ? "True" : value === false ? "False" : "Null"}
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-3">{description}</p>

          {/* Three radio buttons */}
          <div className="flex gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name={`${label}-state`}
                checked={value === true}
                onChange={() => onChange(true)}
                className="w-3 h-3"
              />
              <span className="text-xs font-medium text-green-700">True</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name={`${label}-state`}
                checked={value === false}
                onChange={() => onChange(false)}
                className="w-3 h-3"
              />
              <span className="text-xs font-medium text-red-700">False</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name={`${label}-state`}
                checked={value === null}
                onChange={() => onChange(null)}
                className="w-3 h-3"
              />
              <span className="text-xs font-medium text-gray-700">Null</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

// Complete Visibility Settings Dialog Component
const VisibilitySettingsDialog: React.FC<VisibilitySettingsDialogProps> = ({
  isOpen,
  onClose,
  staff,
  sportIndex,
  staffIndex,
  updateStaffVisibility,
}) => {
  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4">
        <div className="pr-8">
          <h4 className="font-semibold text-lg">Custom Visibility Settings</h4>
          <p className="text-sm text-gray-600 mt-1">
            Configure individual visibility options for{" "}
            {staff.staffFirstName || "this staff member"}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Click checkboxes to cycle: True → False → Null → True
          </p>
        </div>
        <div className="space-y-3">
          <ThreeStateCheckbox
            value={staff.canShowStaffUser}
            onChange={(newValue) =>
              updateStaffVisibility(
                sportIndex,
                staffIndex,
                "canShowStaffUser",
                newValue,
              )
            }
            label="Show Staff User"
            description="Display this staff member in user listings"
          />
          <ThreeStateCheckbox
            value={staff.canShowTitle}
            onChange={(newValue) =>
              updateStaffVisibility(
                sportIndex,
                staffIndex,
                "canShowTitle",
                newValue,
              )
            }
            label="Show Title"
            description="Display the staff member's title/position"
          />
          <ThreeStateCheckbox
            value={staff.canShowName}
            onChange={(newValue) =>
              updateStaffVisibility(
                sportIndex,
                staffIndex,
                "canShowName",
                newValue,
              )
            }
            label="Show Name"
            description="Display the staff member's full name"
          />
          <ThreeStateCheckbox
            value={staff.canShowEmail}
            onChange={(newValue) =>
              updateStaffVisibility(
                sportIndex,
                staffIndex,
                "canShowEmail",
                newValue,
              )
            }
            label="Show Email"
            description="Display email contact information"
          />
          <ThreeStateCheckbox
            value={staff.canShowPhoneNumber}
            onChange={(newValue) =>
              updateStaffVisibility(
                sportIndex,
                staffIndex,
                "canShowPhoneNumber",
                newValue,
              )
            }
            label="Show Phone Number"
            description="Display phone contact information"
          />
          <ThreeStateCheckbox
            value={staff.staffActive}
            onChange={(newValue) =>
              updateStaffVisibility(
                sportIndex,
                staffIndex,
                "staffActive",
                newValue,
              )
            }
            label="Staff Active"
            description="Mark staff member as currently active"
          />
        </div>
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} size="sm">
            Done
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

// Export both components - one as default, one as named
export default VisibilitySettingsDialog;
export { ThreeStateCheckbox };
