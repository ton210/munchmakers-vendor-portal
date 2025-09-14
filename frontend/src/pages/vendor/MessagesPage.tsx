import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import {
  ChatBubbleLeftIcon,
  PaperAirplaneIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

interface Message {
  id: number;
  sender_type: 'vendor' | 'admin';
  subject?: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  thread_id?: number;
  created_at: string;
  admin_first_name?: string;
  admin_last_name?: string;
}

interface NewMessage {
  subject: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

const MessagesPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [newMessage, setNewMessage] = useState<NewMessage>({
    subject: '',
    message: '',
    priority: 'normal'
  });
  const [sending, setSending] = useState(false);

  const vendorId = 1; // This would come from auth context

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/messages/vendor/${vendorId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load messages');
      }

      const data = await response.json();
      setMessages(data.data.messages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      setError(error instanceof Error ? error.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.message.trim()) {
      alert('Please enter a message');
      return;
    }

    try {
      setSending(true);

      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(newMessage)
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Reset form and reload messages
      setNewMessage({ subject: '', message: '', priority: 'normal' });
      setShowNewMessage(false);
      await loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      alert(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-primary-600 bg-primary-50 border-primary-200';
      case 'normal': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <ClockIcon className="h-4 w-4 text-yellow-600" />;
      case 'in_progress': return <ClockIcon className="h-4 w-4 text-blue-600" />;
      case 'resolved': return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
      case 'closed': return <XCircleIcon className="h-4 w-4 text-gray-600" />;
      default: return <ClockIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600">Communicate with our support team</p>
        </div>
        <button
          onClick={() => setShowNewMessage(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Message
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
          <button
            onClick={loadMessages}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* New Message Form */}
      {showNewMessage && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>New Message</CardTitle>
            <CardDescription>Send a message to our support team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                value={newMessage.subject}
                onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief description of your inquiry"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={newMessage.priority}
                onChange={(e) => setNewMessage({ ...newMessage, priority: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                value={newMessage.message}
                onChange={(e) => setNewMessage({ ...newMessage, message: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Please describe your question or issue in detail..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={sendMessage}
                disabled={sending}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                {sending ? 'Sending...' : 'Send Message'}
              </button>
              <button
                onClick={() => setShowNewMessage(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Messages List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChatBubbleLeftIcon className="h-5 w-5" />
            Message History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ChatBubbleLeftIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No messages yet</p>
              <p className="text-sm">Start a conversation with our support team</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 rounded-lg border ${
                    message.sender_type === 'vendor'
                      ? 'bg-blue-50 border-blue-200 ml-8'
                      : 'bg-gray-50 border-gray-200 mr-8'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {message.sender_type === 'vendor'
                          ? 'You'
                          : `${message.admin_first_name} ${message.admin_last_name}` || 'Support Team'
                        }
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full border ${getPriorityColor(message.priority)}`}>
                        {message.priority}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(message.status)}
                      <span className="text-sm text-gray-500">
                        {new Date(message.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {message.subject && (
                    <h4 className="font-medium text-gray-900 mb-2">
                      {message.subject}
                    </h4>
                  )}

                  <p className="text-gray-700 whitespace-pre-wrap">
                    {message.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MessagesPage;