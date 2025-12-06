
import * as React from "react";
import { createContext, useCallback, useContext } from "react";
import { Platform } from "react-native";

// Lazy import to avoid crashes on Android or when not configured
let ExtensionStorage: any = null;
let storage: any = null;

// Only initialize on iOS and wrap in try-catch
if (Platform.OS === 'ios') {
  try {
    const AppleTargets = require("@bacons/apple-targets");
    ExtensionStorage = AppleTargets.ExtensionStorage;
    
    // Only initialize if we have a valid group ID
    // For now, we'll skip initialization to prevent crashes
    // Users can configure this later if they want widget support
    // storage = new ExtensionStorage("group.com.portiontracker.app");
  } catch (error) {
    console.log("ExtensionStorage not available:", error);
  }
}

type WidgetContextType = {
  refreshWidget: () => void;
};

const WidgetContext = createContext<WidgetContextType | null>(null);

export function WidgetProvider({ children }: { children: React.ReactNode }) {
  // Update widget state whenever what we want to show changes
  React.useEffect(() => {
    // Only attempt widget operations if ExtensionStorage is available
    if (ExtensionStorage && storage) {
      try {
        // set widget_state to null if we want to reset the widget
        // storage.set("widget_state", null);

        // Refresh widget
        ExtensionStorage.reloadWidget();
      } catch (error) {
        console.log("Widget refresh failed:", error);
      }
    }
  }, []);

  const refreshWidget = useCallback(() => {
    if (ExtensionStorage && storage) {
      try {
        ExtensionStorage.reloadWidget();
      } catch (error) {
        console.log("Widget refresh failed:", error);
      }
    }
  }, []);

  return (
    <WidgetContext.Provider value={{ refreshWidget }}>
      {children}
    </WidgetContext.Provider>
  );
}

export const useWidget = () => {
  const context = useContext(WidgetContext);
  if (!context) {
    throw new Error("useWidget must be used within a WidgetProvider");
  }
  return context;
};
