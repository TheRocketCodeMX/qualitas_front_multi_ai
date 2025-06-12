{insurer.isError ? (
  <div className="flex flex-col items-center justify-center p-4 text-center">
    <div className="text-red-500 mb-2">
      <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <p className="text-sm text-gray-600">{insurer.errorMessage}</p>
  </div>
) : (
  // ... existing code ...
)} 