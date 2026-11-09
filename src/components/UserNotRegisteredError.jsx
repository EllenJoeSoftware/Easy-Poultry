import React from 'react';
import { AlertTriangle } from 'lucide-react';

const UserNotRegisteredError = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-cream px-4">
      <div className="max-w-md w-full card-premium p-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-yolk-50 border border-yolk-200">
            <AlertTriangle className="w-8 h-8 text-yolk-600" strokeWidth={1.75} />
          </div>
          <p className="eyebrow mb-2">Account</p>
          <h1 className="font-display text-3xl text-ink mb-3">Access restricted</h1>
          <p className="text-ink/65 mb-8 leading-relaxed">
            You are not registered to use this application. Please contact the app administrator to request access.
          </p>
          <div className="p-4 bg-cream rounded-2xl border border-border text-sm text-ink/70 text-left">
            <p className="font-medium text-ink">If you believe this is an error, you can:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Verify you are logged in with the correct account</li>
              <li>Contact the app administrator for access</li>
              <li>Try logging out and back in again</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserNotRegisteredError;
