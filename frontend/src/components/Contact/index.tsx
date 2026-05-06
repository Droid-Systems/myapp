"use client";

import { useState, FormEvent } from "react";
import NewsLatterBox from "./NewsLatterBox";
import { api } from "@/lib/api";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import "@/components/SignupForm/phoneInput.css";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(1, "Please fill in all fields"),
  email: z.string().min(1, "Please fill in all fields").refine(
    (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
    "Please enter a valid email address"
  ),
  phone: z.string().refine(
    (val) => val.replace(/[^\d]/g, "").length >= 10,
    "Please enter a valid phone number"
  ),
  message: z.string().min(1, "Please fill in all fields"),
});

const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const parsed = contactSchema.safeParse({ name, email, phone, message });
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0].message);
      return;
    }

    setLoading(true);

    try {
      const response = await api.submitContact({ name, email, phone, message });

      if (response.success) {
        setSuccessMessage(response.message || "Message sent successfully! We'll get back to you soon.");
        setName("");
        setEmail("");
        setPhone("");
        setMessage("");

        // Clear success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage("");
        }, 5000);
      } else {
        setErrorMessage(response.message || "Failed to send message. Please try again.");
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "An error occurred. Please try again later.";
      setErrorMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="overflow-hidden py-8 md:py-12 lg:py-16">
      <div className="container">
        <div className="-mx-4 flex flex-wrap">
          <div className="w-full px-4 lg:w-7/12 xl:w-8/12">
            <div
              className="mb-8 rounded-lg bg-white px-6 py-8 shadow-three dark:bg-gray-dark sm:px-8 sm:py-10 lg:mb-5 lg:px-8 xl:px-10 xl:py-12"
              data-wow-delay=".15s
              "
            >
              <h2 className="mb-3 text-xl font-bold text-black dark:text-white sm:text-2xl lg:text-xl xl:text-2xl">
                Get in Touch
              </h2>
              <p className="mb-8 text-sm font-medium text-body-color sm:text-base">
                Have a question or want to learn more? Send us a message and we'll respond as soon as possible.
              </p>

              {/* Success Message */}
              {successMessage && (
                <div className="mb-6 rounded-lg bg-green-100 p-4 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  <p className="text-sm font-medium">{successMessage}</p>
                </div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <div className="mb-6 rounded-lg bg-red-100 p-4 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                  <p className="text-sm font-medium">{errorMessage}</p>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="-mx-4 flex flex-wrap">
                  <div className="w-full px-4 md:w-1/2">
                    <div className="mb-5">
                      <label
                        htmlFor="name"
                        className="mb-2 block text-sm font-medium text-dark dark:text-white"
                      >
                        Your Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name"
                        disabled={loading}
                        className="border-stroke w-full rounded-lg border bg-[#f8f8f8] px-4 py-2.5 text-sm text-body-color outline-hidden focus:border-primary sm:px-5 sm:py-3 sm:text-base dark:border-transparent dark:bg-[#2C303B] dark:text-body-color-dark dark:shadow-two dark:focus:border-primary dark:focus:shadow-none disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div className="w-full px-4 md:w-1/2">
                    <div className="mb-5">
                      <label
                        htmlFor="email"
                        className="mb-2 block text-sm font-medium text-dark dark:text-white"
                      >
                        Your Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        disabled={loading}
                        className="border-stroke w-full rounded-lg border bg-[#f8f8f8] px-4 py-2.5 text-sm text-body-color outline-hidden focus:border-primary sm:px-5 sm:py-3 sm:text-base dark:border-transparent dark:bg-[#2C303B] dark:text-body-color-dark dark:shadow-two dark:focus:border-primary dark:focus:shadow-none disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div className="w-full px-4">
                    <div className="mb-5">
                      <label
                        htmlFor="phone"
                        className="mb-2 block text-sm font-medium text-dark dark:text-white"
                      >
                        Phone Number
                      </label>
                      <div className={loading ? "pointer-events-none opacity-50" : ""}>
                        <PhoneInput
                          defaultCountry="us"
                          value={phone}
                          onChange={(value) => setPhone(value)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="w-full px-4">
                    <div className="mb-5">
                      <label
                        htmlFor="message"
                        className="mb-2 block text-sm font-medium text-dark dark:text-white"
                      >
                        Your Message
                      </label>
                      <textarea
                        name="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={4}
                        placeholder="Enter your Message"
                        disabled={loading}
                        className="border-stroke w-full resize-none rounded-lg border bg-[#f8f8f8] px-4 py-2.5 text-sm text-body-color outline-hidden focus:border-primary sm:px-5 sm:py-3 sm:text-base dark:border-transparent dark:bg-[#2C303B] dark:text-body-color-dark dark:shadow-two dark:focus:border-primary dark:focus:shadow-none disabled:cursor-not-allowed disabled:opacity-50"
                      ></textarea>
                    </div>
                  </div>
                  <div className="w-full px-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white shadow-submit duration-300 hover:bg-primary/90 sm:px-8 sm:py-3.5 sm:text-base dark:shadow-submit-dark disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loading ? "Sending..." : "Send Message"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
          <div className="w-full px-4 lg:w-5/12 xl:w-4/12">
            <NewsLatterBox />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
