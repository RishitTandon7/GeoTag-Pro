import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader, AlertTriangle, CheckCircle } from 'lucide-react';

const SupabaseDiagnostic: React.FC = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
  } | null>(null);

  const checkConnection = async () => {
    setIsChecking(true);
    setResult(null);
    
    try {
      // First, log the environment variables
      console.log('Checking Supabase connection...');
      
      // Check if we can get the Supabase service version
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      
      if (error) {
        throw error;
      }
      
      setResult({
        success: true,
        message: 'Successfully connected to Supabase',
        details: `Received data: ${JSON.stringify(data)}`
      });
    } catch (error: any) {
      console.error('Supabase connection error:', error);
      
      setResult({
        success: false,
        message: 'Failed to connect to Supabase',
        details: error.message || 'Unknown error'
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-sm">
      <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Supabase Connection Diagnostic</h3>
      
      <button
        onClick={checkConnection}
        disabled={isChecking}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-70 flex items-center"
      >
        {isChecking ? (
          <>
            <Loader className="animate-spin h-4 w-4 mr-2" />
            Checking...
          </>
        ) : (
          'Test Connection'
        )}
      </button>
      
      {result && (
        <div className={`p-4 rounded-md ${result.success ? 'bg-green-50 dark:bg-green-900/30' : 'bg-red-50 dark:bg-red-900/30'}`}>
          <div className="flex items-start">
            {result.success ? (
              <CheckCircle className="h-5 w-5 mt-0.5 text-green-600 dark:text-green-400" />
            ) : (
              <AlertTriangle className="h-5 w-5 mt-0.5 text-red-600 dark:text-red-400" />
            )}
            <div className="ml-3">
              <p className={`text-sm font-medium ${
                result.success ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'
              }`}>
                {result.message}
              </p>
              {result.details && (
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  {result.details}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      
      <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        This component helps diagnose issues with your Supabase connection.
        Check the browser console for more detailed logs.
      </p>
    </div>
  );
};

export default SupabaseDiagnostic;