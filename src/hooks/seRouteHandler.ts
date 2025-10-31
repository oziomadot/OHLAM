// File: hooks/useRouteHandler.ts
import { useRouter } from "expo-router";
import { Alert } from "react-native";

interface RouteHandlerOptions {
  successRoute?: string | ((response: any) => string);  // Default route on success (e.g., "/(tabs)/home")
  errorRoute?: string | ((response: any) => string);  // Route on error (e.g., "/login" or "/error")
  condition?: (response: any) => boolean;  // Custom condition to check (e.g., UserAuth)
  conditionalRoute?: string;  // Route if condition is true
  successMessage?: string; //Success message to display
  errorMessage?: string;  // Custom error message
  onSuccess?: (response: any) => void;  // Optional callback for additional actions
  onError?: (error: any) => void;  // Optional callback for errors
}

export const useRouteHandler = () => {
  const router = useRouter();

  const handleResponse = (response: any, options: RouteHandlerOptions) => {
    try {
      if (response?.data?.status === 200) {
        const { successRoute, condition, conditionalRoute, onSuccess, successMessage } = options;

        // Check custom condition (e.g., UserAuth)
        if (condition && condition(response.data)) {
          if (conditionalRoute) {
            router.replace(conditionalRoute);
          }
        } else {
          // Default success route
          if (successRoute) {
            // Handle both string and function cases
            const route = typeof successRoute === 'function' ? successRoute(response) : successRoute;

            const successMsg = options.successMessage;
            Alert.alert("Success", successMsg);
            router.replace(route);
          }
        }

        // Run success callback if provided
        if (onSuccess) {
          onSuccess(response);
        }
      } else {
        // Handle non-success responses
        const { errorRoute, errorMessage, onError } = options;

        // Route to error page if specified
        if (errorRoute) {
          const route = typeof errorRoute === 'function' ? errorRoute(response) : errorRoute;
          router.replace(route);
        }

        // Show error message
        const errorMsg = errorMessage || "An error occurred.";
        Alert.alert("Error", errorMsg);

        // Run error callback if provided
        if (onError) {
          onError(response);
        }
      }
    } catch (error) {
      console.error("Route handling error:", error);
      Alert.alert("Error", "Failed to process response.");
    }
  };

  return { handleResponse };
};