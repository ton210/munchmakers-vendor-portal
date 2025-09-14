import React, { useState } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PlayIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';

interface TestResult {
  success: boolean;
  service: string;
  message: string;
  details?: any;
  error?: string;
}

interface APITest {
  id: string;
  name: string;
  description: string;
  endpoint: string;
}

const APITestPage: React.FC = () => {
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [runningAll, setRunningAll] = useState(false);

  const apiTests: APITest[] = [
    {
      id: 'database',
      name: 'Database',
      description: 'Test PostgreSQL database connection and table access',
      endpoint: '/test/database'
    },
    {
      id: 'sendgrid',
      name: 'SendGrid',
      description: 'Test email service integration for notifications',
      endpoint: '/test/sendgrid'
    },
    {
      id: 'r2',
      name: 'Cloudflare R2',
      description: 'Test file storage and CDN integration',
      endpoint: '/test/r2'
    },
    {
      id: 'openai',
      name: 'OpenAI',
      description: 'Test AI integration for intelligent features',
      endpoint: '/test/openai'
    },
    {
      id: 'bigcommerce',
      name: 'BigCommerce',
      description: 'Test e-commerce platform API integration',
      endpoint: '/test/bigcommerce'
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Test team notifications and webhook integration',
      endpoint: '/test/slack'
    }
  ];

  const runTest = async (test: APITest) => {
    setLoading(prev => ({ ...prev, [test.id]: true }));

    try {
      const response = await api.post(test.endpoint);
      setTestResults(prev => ({
        ...prev,
        [test.id]: response.data
      }));
    } catch (error: any) {
      setTestResults(prev => ({
        ...prev,
        [test.id]: {
          success: false,
          service: test.name,
          message: 'Test failed',
          error: error.response?.data?.message || error.message
        }
      }));
    } finally {
      setLoading(prev => ({ ...prev, [test.id]: false }));
    }
  };

  const runAllTests = async () => {
    setRunningAll(true);
    setTestResults({});

    for (const test of apiTests) {
      await runTest(test);
      // Small delay between tests to avoid overwhelming the backend
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setRunningAll(false);
  };

  const getStatusIcon = (testId: string) => {
    if (loading[testId]) {
      return <ClockIcon className="h-5 w-5 text-yellow-500 animate-spin" />;
    }

    const result = testResults[testId];
    if (!result) {
      return <InformationCircleIcon className="h-5 w-5 text-gray-400" />;
    }

    return result.success
      ? <CheckCircleIcon className="h-5 w-5 text-green-500" />
      : <XCircleIcon className="h-5 w-5 text-red-500" />;
  };

  const getStatusColor = (testId: string) => {
    if (loading[testId]) return 'border-yellow-200 bg-yellow-50';

    const result = testResults[testId];
    if (!result) return 'border-gray-200 bg-white';

    return result.success
      ? 'border-green-200 bg-green-50'
      : 'border-red-200 bg-red-50';
  };

  const formatDetails = (details: any) => {
    if (!details) return null;

    return (
      <div className="mt-3 text-sm">
        <h4 className="font-medium text-gray-700 mb-2">Details:</h4>
        <div className="bg-gray-100 rounded p-2 text-xs font-mono">
          {typeof details === 'string'
            ? details
            : JSON.stringify(details, null, 2)
          }
        </div>
      </div>
    );
  };

  const getOverallStatus = () => {
    const results = Object.values(testResults);
    if (results.length === 0) return { color: 'text-gray-600', text: 'Not tested' };

    const passed = results.filter(r => r.success).length;
    const total = results.length;

    if (passed === total) {
      return { color: 'text-green-600', text: `All tests passed (${passed}/${total})` };
    } else if (passed === 0) {
      return { color: 'text-red-600', text: `All tests failed (${passed}/${total})` };
    } else {
      return { color: 'text-yellow-600', text: `Partial success (${passed}/${total})` };
    }
  };

  const overallStatus = getOverallStatus();

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">API Integration Testing</h1>
        <p className="text-gray-600 mb-6">
          Test all third-party API integrations to ensure proper functionality and configuration.
        </p>

        {/* Overall Status */}
        <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className={`text-lg font-semibold ${overallStatus.color}`}>
              Overall Status: {overallStatus.text}
            </div>
          </div>

          <button
            onClick={runAllTests}
            disabled={runningAll}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {runningAll ? (
              <>
                <ClockIcon className="h-4 w-4 animate-spin" />
                <span>Running Tests...</span>
              </>
            ) : (
              <>
                <PlayIcon className="h-4 w-4" />
                <span>Run All Tests</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Test Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {apiTests.map((test) => (
          <div
            key={test.id}
            className={`border rounded-lg p-6 transition-all duration-200 ${getStatusColor(test.id)}`}
          >
            {/* Test Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getStatusIcon(test.id)}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{test.name}</h3>
                  <p className="text-sm text-gray-600">{test.description}</p>
                </div>
              </div>

              <button
                onClick={() => runTest(test)}
                disabled={loading[test.id] || runningAll}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading[test.id] ? 'Testing...' : 'Test'}
              </button>
            </div>

            {/* Test Results */}
            {testResults[test.id] && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className={`text-sm font-medium ${
                  testResults[test.id].success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {testResults[test.id].message}
                </div>

                {testResults[test.id].error && (
                  <div className="mt-2 text-sm text-red-600 bg-red-100 rounded p-2">
                    <strong>Error:</strong> {testResults[test.id].error}
                  </div>
                )}

                {formatDetails(testResults[test.id].details)}
              </div>
            )}

            {/* Loading State */}
            {loading[test.id] && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <ClockIcon className="h-4 w-4 animate-spin" />
                  <span>Testing {test.name} API integration...</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Help Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <InformationCircleIcon className="h-6 w-6 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">About API Testing</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p>
                This page tests the connection and functionality of all third-party APIs integrated
                with the vendor portal. Each test verifies:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>API credentials and authentication</li>
                <li>Network connectivity and response times</li>
                <li>Basic functionality of each service</li>
                <li>Configuration validation</li>
              </ul>
              <p className="mt-3">
                <strong>Note:</strong> Some tests (like SendGrid and Slack) will send actual
                notifications. Failed tests may indicate missing environment variables,
                network issues, or service outages.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default APITestPage;