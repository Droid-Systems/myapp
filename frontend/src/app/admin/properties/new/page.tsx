"use client";

import Link from "next/link";
import PropertyForm from "../_components/PropertyForm";

export default function NewPropertyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/admin/properties"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New Property</h1>
            <p className="text-sm text-gray-500">Create a new investment property listing</p>
          </div>
        </div>

        <PropertyForm mode="create" />
      </div>
    </div>
  );
}
