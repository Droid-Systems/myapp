"use client";

import { useState, useEffect, useRef } from "react";

interface Language {
  code: string;
  name: string;
  countryCode: string;
}

const languages: Language[] = [
  { code: "en", name: "English", countryCode: "us" },
  { code: "es", name: "Spanish", countryCode: "es" },
  { code: "fr", name: "French", countryCode: "fr" },
  { code: "de", name: "German", countryCode: "de" },
  { code: "it", name: "Italian", countryCode: "it" },
  { code: "pt", name: "Portuguese", countryCode: "pt" },
  { code: "ru", name: "Russian", countryCode: "ru" },
  { code: "zh-CN", name: "Chinese", countryCode: "cn" },
  { code: "ja", name: "Japanese", countryCode: "jp" },
  { code: "ko", name: "Korean", countryCode: "kr" },
  { code: "ar", name: "Arabic", countryCode: "sa" },
  { code: "hi", name: "Hindi", countryCode: "in" },
  { code: "tr", name: "Turkish", countryCode: "tr" },
  { code: "nl", name: "Dutch", countryCode: "nl" },
  { code: "pl", name: "Polish", countryCode: "pl" },
  { code: "sv", name: "Swedish", countryCode: "se" },
  { code: "no", name: "Norwegian", countryCode: "no" },
  { code: "da", name: "Danish", countryCode: "dk" },
  { code: "fi", name: "Finnish", countryCode: "fi" },
  { code: "el", name: "Greek", countryCode: "gr" },
];

declare global {
  interface Window {
    google: any;
    googleTranslateElementInit: () => void;
  }
}

interface LanguageSelectorProps {
  onMenuClose?: () => void;
}

const LanguageSelector = ({ onMenuClose }: LanguageSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>({
    code: "en",
    name: "English",
    countryCode: "us"
  });
  const [isTranslateReady, setIsTranslateReady] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Check for saved language on mount
  useEffect(() => {
    // Read Google Translate cookie to determine current language
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    // Try to get language from localStorage first (more reliable across domains)
    const savedLangCode = localStorage.getItem('selectedLanguage');
    if (savedLangCode) {
      const language = languages.find(lang => lang.code === savedLangCode);
      if (language) {
        setSelectedLanguage(language);
        return;
      }
    }

    // Fallback to cookie
    const googTransCookie = getCookie('googtrans');
    if (googTransCookie) {
      // Cookie format is /en/LANGCODE
      const langCode = googTransCookie.split('/')[2];
      const language = languages.find(lang => lang.code === langCode);
      if (language) {
        setSelectedLanguage(language);
        localStorage.setItem('selectedLanguage', language.code);
      }
    }
  }, []);

  // Load Google Translate script
  useEffect(() => {
    // Check if script already exists
    if (document.querySelector('script[src*="translate.google.com"]')) {
      // Check if already initialized
      if (window.google?.translate?.TranslateElement) {
        setIsTranslateReady(true);
      }
      return;
    }

    // Initialize Google Translate
    window.googleTranslateElementInit = () => {
      if (window.google?.translate?.TranslateElement) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: languages.map((lang) => lang.code).join(","),
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          },
          "google_translate_element"
        );

        // Mark as ready after a short delay to ensure widget is fully initialized
        setTimeout(() => {
          setIsTranslateReady(true);
        }, 1000);
      }
    };

    // Add Google Translate script
    const script = document.createElement("script");
    script.src =
      "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    script.onerror = () => {
      console.error("Failed to load Google Translate script");
    };
    document.body.appendChild(script);
  }, []);

  const handleLanguageChange = (language: Language) => {
    setSelectedLanguage(language);
    setIsOpen(false);

    // Save to localStorage for persistence across domains
    localStorage.setItem('selectedLanguage', language.code);

    // If selecting English, clear the translation and reload
    if (language.code === "en") {
      // Clear Google Translate cookies for all domains
      const domain = window.location.hostname;
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain};`;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${domain};`;

      // Clear localStorage
      localStorage.removeItem('selectedLanguage');

      // Reload to show original content
      window.location.reload();
      return;
    }

    // Set Google Translate cookie directly - this is the most reliable method
    const translateValue = `/en/${language.code}`;
    const domain = window.location.hostname;

    // Set cookie for current domain and all subdomains
    document.cookie = `googtrans=${translateValue}; path=/;`;
    document.cookie = `googtrans=${translateValue}; path=/; domain=${domain};`;
    document.cookie = `googtrans=${translateValue}; path=/; domain=.${domain};`;

    // Reload page to apply translation
    window.location.reload();
  };

  return (
    <div className="relative notranslate" ref={dropdownRef}>
      {/* Hidden Google Translate element */}
      <div id="google_translate_element" className="hidden"></div>

      {/* Custom Language Selector Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          // Close mobile menu if callback is provided
          if (onMenuClose) {
            onMenuClose();
          }
        }}
        className="notranslate flex items-center gap-1 rounded-lg px-2 py-2 transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label="Select Language"
      >
        <img
          src={`https://flagcdn.com/w40/${selectedLanguage.countryCode}.png`}
          alt={selectedLanguage.name}
          className="notranslate h-5 w-7 rounded object-cover"
        />
        <svg
          className={`h-3 w-3 transition-transform text-dark dark:text-white ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="notranslate absolute left-0 xlg:right-0 xlg:left-auto top-full z-50 mt-2 w-48 max-h-96 overflow-y-auto rounded-lg border border-stroke bg-white shadow-lg dark:border-transparent dark:bg-gray-dark dark:shadow-two">
          <div className="p-2">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language)}
                className={`notranslate flex w-full items-center gap-3 rounded-md px-3 py-2 transition-all duration-200 ${
                  selectedLanguage.code === language.code
                    ? "bg-primary"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <img
                  src={`https://flagcdn.com/w40/${language.countryCode}.png`}
                  alt={language.name}
                  className="notranslate h-4 w-6 rounded object-cover"
                />
                <span className="notranslate text-sm text-body-color dark:text-body-color-dark">{language.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
