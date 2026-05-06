const LoadingSpinner = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="flex flex-col items-center">
        {/* Spinner */}
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>

        {/* Loading text */}
        <p className="mt-4 text-lg font-medium text-white">
          Signing you in...
        </p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
