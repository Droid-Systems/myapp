"use client";

import { useState, useEffect } from "react";

interface NewsletterPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const NewsletterPopup = ({ isOpen, onClose }: NewsletterPopupProps) => {
  // Close modal on backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-dark sm:p-8 md:p-10">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-300 sm:top-4 sm:right-4"
          aria-label="Close"
        >
          <svg
            className="h-5 w-5 sm:h-6 sm:w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Content */}
        <div className="text-center">
          {/* Shield Icon */}
          <div className="mb-4 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
              <svg className="h-7 w-7 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h2 className="mb-3 text-xl font-bold leading-tight text-black dark:text-white sm:text-2xl">
            Security Notice
          </h2>

          {/* Description */}
          <p className="mb-4 text-sm leading-relaxed text-body-color dark:text-body-color-dark sm:text-base">
            Before proceeding, please verify you are on our official and secured website. Due to the rise in online account hijacking and phishing attacks, always confirm the URL in your browser matches our official domain exactly.
          </p>

          <p className="mb-6 rounded-lg bg-yellow-50 px-4 py-3 text-sm font-semibold text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
            We will never ask for your password via email, phone, or chat. If in doubt, do not proceed.
          </p>

          {/* Confirm Button */}
          <button
            onClick={onClose}
            className="inline-block w-full rounded-lg bg-black px-8 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90 sm:w-auto sm:px-10 sm:py-3.5 sm:text-base"
          >
            I Understand, Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewsletterPopup;
