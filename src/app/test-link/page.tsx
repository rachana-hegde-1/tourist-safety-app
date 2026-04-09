import Link from "next/link";

export default function TestLinkPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Link Test Page</h1>
        
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Testing sign-up link:</p>
            <Link 
              href="/sign-up" 
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Go to Sign-up
            </Link>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Testing dashboard link:</p>
            <Link 
              href="/dashboard" 
              className="text-green-600 hover:text-green-800 underline"
            >
              Go to Dashboard
            </Link>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Testing homepage link:</p>
            <Link 
              href="/" 
              className="text-purple-600 hover:text-purple-800 underline"
            >
              Go to Homepage
            </Link>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500">
            If the links above work, then the issue is with the homepage button styling or JavaScript.
          </p>
        </div>
      </div>
    </div>
  );
}
