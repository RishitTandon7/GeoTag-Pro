import React, { useState, useEffect } from 'react';
import { 
  Rocket, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Globe,
  Terminal,
  GitBranch,
  Package,
  Loader,
  ExternalLink
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Deployment {
  id: string;
  created_at: string;
  updated_at: string;
  status: 'pending' | 'building' | 'deployed' | 'failed';
  environment: 'production' | 'staging' | 'development';
  version: string;
  commit_hash: string;
  deploy_url: string | null;
  build_logs: string | null;
  error_logs: string | null;
}

const DeploymentPage = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    loadDeployments();
  }, []);

  const loadDeployments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('deployments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setDeployments(data || []);
    } catch (error: any) {
      toast.error('Failed to load deployments');
      console.error('Error loading deployments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeploy = async () => {
    if (!user) return;
    
    setIsDeploying(true);
    try {
      const version = new Date().toISOString().split('T')[0] + '-' + Math.random().toString(36).substring(7);
      
      const { data, error } = await supabase
        .from('deployments')
        .insert({
          status: 'pending',
          environment: 'production',
          version,
          deployed_by: user.id,
          commit_hash: Math.random().toString(36).substring(7)
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success('Deployment started');
      loadDeployments();
      
      // Simulate deployment process
      simulateDeployment(data.id);
    } catch (error: any) {
      toast.error('Failed to start deployment');
      console.error('Error starting deployment:', error);
    } finally {
      setIsDeploying(false);
    }
  };

  const simulateDeployment = async (deploymentId: string) => {
    // Update to building status
    await supabase
      .from('deployments')
      .update({ 
        status: 'building',
        build_logs: 'Starting build process...\nInstalling dependencies...'
      })
      .eq('id', deploymentId);
    
    // Wait 3 seconds
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Simulate successful deployment
    const success = Math.random() > 0.2; // 80% success rate
    
    if (success) {
      await supabase
        .from('deployments')
        .update({ 
          status: 'deployed',
          deploy_url: `https://admin-${deploymentId.substring(0, 8)}.example.com`,
          build_logs: 'Build successful!\nDeployment complete.'
        })
        .eq('id', deploymentId);
      
      toast.success('Deployment completed successfully');
    } else {
      await supabase
        .from('deployments')
        .update({ 
          status: 'failed',
          error_logs: 'Build failed: Error in dependency installation'
        })
        .eq('id', deploymentId);
      
      toast.error('Deployment failed');
    }
    
    loadDeployments();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'deployed':
        return isDarkMode ? 'text-green-400' : 'text-green-600';
      case 'failed':
        return isDarkMode ? 'text-red-400' : 'text-red-600';
      case 'building':
        return isDarkMode ? 'text-yellow-400' : 'text-yellow-600';
      default:
        return isDarkMode ? 'text-gray-400' : 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'deployed':
        return <CheckCircle className="h-5 w-5" />;
      case 'failed':
        return <XCircle className="h-5 w-5" />;
      case 'building':
        return <RefreshCw className="h-5 w-5 animate-spin" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Deployments
            </h1>
            <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Manage and monitor your application deployments
            </p>
          </div>
          
          <button
            onClick={handleDeploy}
            disabled={isDeploying}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-70 flex items-center"
          >
            {isDeploying ? (
              <>
                <Loader className="animate-spin h-5 w-5 mr-2" />
                Deploying...
              </>
            ) : (
              <>
                <Rocket className="h-5 w-5 mr-2" />
                Deploy
              </>
            )}
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Deployments List */}
            <div className="lg:col-span-2">
              <div className={`rounded-lg shadow-lg overflow-hidden ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Recent Deployments
                  </h2>
                </div>
                
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {deployments.map((deployment) => (
                    <div 
                      key={deployment.id}
                      onClick={() => setSelectedDeployment(deployment)}
                      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                        selectedDeployment?.id === deployment.id
                          ? isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className={`flex items-center ${getStatusColor(deployment.status)}`}>
                            {getStatusIcon(deployment.status)}
                          </span>
                          <div className="ml-3">
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {deployment.version}
                            </p>
                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {new Date(deployment.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {deployment.environment}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Deployment Details */}
            <div className="lg:col-span-1">
              {selectedDeployment ? (
                <div className={`rounded-lg shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Deployment Details
                    </h2>
                  </div>
                  
                  <div className="p-4 space-y-4">
                    <div>
                      <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Status
                      </div>
                      <div className={`mt-1 flex items-center ${getStatusColor(selectedDeployment.status)}`}>
                        {getStatusIcon(selectedDeployment.status)}
                        <span className="ml-2 capitalize">{selectedDeployment.status}</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Environment
                      </div>
                      <div className="mt-1 flex items-center">
                        <Globe className="h-5 w-5" />
                        <span className="ml-2 capitalize">{selectedDeployment.environment}</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Version
                      </div>
                      <div className="mt-1 flex items-center">
                        <Package className="h-5 w-5" />
                        <span className="ml-2">{selectedDeployment.version}</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Commit
                      </div>
                      <div className="mt-1 flex items-center">
                        <GitBranch className="h-5 w-5" />
                        <span className="ml-2 font-mono text-sm">{selectedDeployment.commit_hash}</span>
                      </div>
                    </div>
                    
                    {selectedDeployment.deploy_url && (
                      <div>
                        <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Deploy URL
                        </div>
                        <a
                          href={selectedDeployment.deploy_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 flex items-center text-purple-600 hover:text-purple-700"
                        >
                          <ExternalLink className="h-5 w-5" />
                          <span className="ml-2">{selectedDeployment.deploy_url}</span>
                        </a>
                      </div>
                    )}
                    
                    {(selectedDeployment.build_logs || selectedDeployment.error_logs) && (
                      <div>
                        <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Logs
                        </div>
                        <pre className={`mt-2 p-3 rounded-md text-xs font-mono whitespace-pre-wrap ${
                          isDarkMode 
                            ? 'bg-gray-900 text-gray-300' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {selectedDeployment.build_logs || selectedDeployment.error_logs}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className={`rounded-lg shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-8 text-center`}>
                  <Rocket className={`h-12 w-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Select a deployment to view details
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeploymentPage;