import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { LocationData } from "./locationTypes";

export type AuthMode = "login" | "signup";

export interface AuthFormState {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  remember: boolean;
  nationality?: string;
  contactNumber?: string;
  gender?: string;
  acceptedTerms?: boolean;
}

const EMAIL_REGEX = /\S+@\S+\.\S+/;

export const validatePasswordStrength = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Include lowercase letters (a-z)");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Include uppercase letters (A-Z)");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Include numbers (0-9)");
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Include special characters (!@#$%^&*...)");
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

export const validateAuthForm = (mode: AuthMode, form: AuthFormState): string | null => {
  if (!form.email.trim()) return "Email is required.";
  if (!EMAIL_REGEX.test(form.email.trim())) return "Please enter a valid email address.";
  if (!form.password.trim()) return "Password is required.";
  
  if (mode === "signup") {
    if (!form.fullName.trim()) return "Full name is required.";
    if (!form.nationality?.trim()) return "Nationality is required.";
    if (!form.contactNumber?.trim()) return "Contact number is required.";
    if (!form.gender?.trim()) return "Gender is required.";
    if (!form.acceptedTerms) return "You must accept the Terms and Conditions to continue.";
    
    const passwordValidation = validatePasswordStrength(form.password);
    if (!passwordValidation.valid) {
      return `Password must contain: ${passwordValidation.errors[0]}`;
    }
    
    if (form.confirmPassword !== form.password) return "Passwords do not match.";
  }
  
  return null;
};

export const getGoogleMapsLink = (location: LocationData, destinationName?: string): string => {
  const hasCoords = typeof location.lat === 'number' && typeof location.lng === 'number';

  if (destinationName) {
    // If destination name is provided, use it for search with coordinates if available
    if (hasCoords) {
      return `https://www.google.com/maps/search/${encodeURIComponent(destinationName)}/@${location.lat},${location.lng},15z`;
    }
    return `https://www.google.com/maps/search/${encodeURIComponent(destinationName)}`;
  }

  if (!hasCoords) {
    if (location.municipality) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([location.barangay, location.municipality, 'Ilocos Sur'].filter(Boolean).join(', '))}`;
    }
    return 'https://www.google.com/maps';
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`;
};

export const getDirectionsLink = (originLat: number, originLng: number, destinationLat: number, destinationLng: number, destinationName?: string): string => {
  const origin = `${originLat},${originLng}`;
  const destination = `${destinationLat},${destinationLng}`;
  
  if (destinationName) {
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&dir_action=navigate`;
  }
  
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
};

export const getDirectionsLinkFromPlace = (originPlace: string, destinationLat: number, destinationLng: number, destinationName?: string): string => {
  const destination = `${destinationLat},${destinationLng}`;
  const encodedOrigin = encodeURIComponent(originPlace);
  
  const url = `https://www.google.com/maps/dir/?api=1&origin=${encodedOrigin}&destination=${destination}`;
  
  // Log for debugging (can be removed in production)
  console.log('Generated directions URL:', url);
  
  return url;
};

export const getUserLocation = (): Promise<{ lat: number; lng: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  });
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
