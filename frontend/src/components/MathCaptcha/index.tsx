"use client";

import { useState, useEffect } from "react";

interface MathCaptchaProps {
  onVerify: (isValid: boolean) => void;
  reset?: boolean;
}

const MathCaptcha = ({ onVerify, reset }: MathCaptchaProps) => {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  // Generate new math problem
  const generateProblem = () => {
    const n1 = Math.floor(Math.random() * 10) + 1;
    const n2 = Math.floor(Math.random() * 10) + 1;
    setNum1(n1);
    setNum2(n2);
    setUserAnswer("");
    setIsVerified(false);
    onVerify(false);
  };

  useEffect(() => {
    generateProblem();
  }, []);

  // Reset when needed (e.g., after failed login)
  useEffect(() => {
    if (reset) {
      generateProblem();
    }
  }, [reset]);

  const handleAnswerChange = (value: string) => {
    setUserAnswer(value);
    const correctAnswer = num1 + num2;
    const isCorrect = parseInt(value) === correctAnswer;
    setIsVerified(isCorrect);
    onVerify(isCorrect);
  };

  return (
    <div className="mb-6">
      <label className="text-dark mb-3 block text-sm dark:text-white">
        Security Verification
      </label>
      <div className="flex items-center gap-3">
        {/* Math Problem */}
        <div className="flex items-center gap-2 rounded-lg border border-stroke bg-gray-2 px-4 py-3 dark:border-strokedark dark:bg-gray-dark">
          <span className="text-lg font-bold text-black dark:text-white">
            {num1} + {num2} =
          </span>
        </div>

        {/* Answer Input */}
        <input
          type="number"
          value={userAnswer}
          onChange={(e) => handleAnswerChange(e.target.value)}
          placeholder="?"
          className="border-stroke dark:text-body-color-dark dark:shadow-two text-body-color focus:border-primary dark:focus:border-primary w-20 rounded-xs border bg-[#f8f8f8] px-4 py-3 text-center text-base outline-hidden transition-all duration-300 dark:border-transparent dark:bg-[#2C303B] dark:focus:shadow-none"
        />

        {/* Verification Status */}
        {userAnswer && (
          <div className="flex items-center">
            {isVerified ? (
              <svg
                className="h-6 w-6 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                className="h-6 w-6 text-red-500"
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
            )}
          </div>
        )}

        {/* Refresh Button */}
        <button
          type="button"
          onClick={generateProblem}
          className="text-body-color hover:text-primary transition-colors duration-300"
          title="Generate new problem"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default MathCaptcha;
