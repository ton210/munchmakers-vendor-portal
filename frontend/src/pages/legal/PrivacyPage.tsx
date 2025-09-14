import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPage: React.FC = () => {
  return (
    <div className="bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link to="/">
              <img
                className="h-8 w-auto"
                src="https://cdn11.bigcommerce.com/s-tqjrceegho/images/stencil/500w/munchmakers-logo_1_1752112946__55141.original.png"
                alt="MunchMakers"
              />
            </Link>
            <Link to="/" className="text-gray-900 hover:text-indigo-600">
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="prose prose-lg max-w-none">
          <h1>Privacy Policy</h1>
          <p className="text-gray-600">Last updated: September 14, 2025</p>

          <h2>1. Introduction</h2>
          <p>
            MunchMakers ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy
            explains how we collect, use, disclose, and safeguard your information when you use our vendor
            portal service. Please read this privacy policy carefully.
          </p>

          <h2>2. Information We Collect</h2>

          <h3>Personal Information</h3>
          <p>We may collect the following types of personal information:</p>
          <ul>
            <li>Name, email address, and contact information</li>
            <li>Business information including company name, address, and tax identification</li>
            <li>Product information and catalog data</li>
            <li>Financial information for payment processing</li>
            <li>Communication records and support interactions</li>
          </ul>

          <h3>Technical Information</h3>
          <p>We automatically collect certain technical information, including:</p>
          <ul>
            <li>IP address and browser information</li>
            <li>Device type and operating system</li>
            <li>Usage patterns and analytics data</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>

          <h2>3. How We Use Your Information</h2>
          <p>We use the collected information for the following purposes:</p>
          <ul>
            <li>Provide and maintain our vendor portal services</li>
            <li>Process transactions and manage your account</li>
            <li>Communicate with you about your account and services</li>
            <li>Improve our services and user experience</li>
            <li>Comply with legal obligations</li>
            <li>Prevent fraud and ensure security</li>
          </ul>

          <h2>4. Information Sharing and Disclosure</h2>
          <p>We may share your information in the following circumstances:</p>
          <ul>
            <li><strong>With buyers:</strong> Product information may be shared with potential buyers</li>
            <li><strong>Service providers:</strong> Third-party services that help us operate our platform</li>
            <li><strong>Legal compliance:</strong> When required by law or to protect our rights</li>
            <li><strong>Business transfers:</strong> In connection with mergers or acquisitions</li>
          </ul>
          <p>We do not sell, trade, or rent your personal information to third parties.</p>

          <h2>5. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal information
            against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission
            over the internet is 100% secure.
          </p>

          <h2>6. Data Retention</h2>
          <p>
            We retain your personal information for as long as necessary to fulfill the purposes outlined in this
            Privacy Policy, unless a longer retention period is required or permitted by law.
          </p>

          <h2>7. Your Rights</h2>
          <p>Depending on your location, you may have the following rights:</p>
          <ul>
            <li>Access to your personal information</li>
            <li>Correction of inaccurate data</li>
            <li>Deletion of your personal information</li>
            <li>Restriction of processing</li>
            <li>Data portability</li>
            <li>Objection to processing</li>
          </ul>

          <h2>8. Cookies and Tracking</h2>
          <p>
            We use cookies and similar tracking technologies to enhance your experience. You can manage your
            cookie preferences through your browser settings.
          </p>

          <h2>9. Third-Party Services</h2>
          <p>
            Our platform may integrate with third-party services (such as payment processors, cloud storage,
            and analytics providers). These services have their own privacy policies, and we encourage you to
            review them.
          </p>

          <h2>10. International Data Transfers</h2>
          <p>
            Your information may be transferred to and processed in countries other than your country of residence.
            We ensure appropriate safeguards are in place for such transfers.
          </p>

          <h2>11. Children's Privacy</h2>
          <p>
            Our service is not intended for individuals under 18 years of age. We do not knowingly collect
            personal information from children under 18.
          </p>

          <h2>12. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting
            the new Privacy Policy on this page and updating the "Last updated" date.
          </p>

          <h2>13. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <ul>
            <li>Email: privacy@munchmakers.com</li>
            <li>Address: MunchMakers Privacy Team, [Address]</li>
          </ul>

          <div className="mt-12 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Beta Program Notice</h3>
            <p className="text-gray-700">
              As part of our exclusive beta program, we may collect additional feedback and usage data to
              improve our services. All beta participants will be notified of any additional data collection
              practices specific to the beta program.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center space-x-6">
            <Link to="/terms" className="text-sm text-gray-600 hover:text-gray-900">
              Terms of Service
            </Link>
            <Link to="/vendor-agreement" className="text-sm text-gray-600 hover:text-gray-900">
              Vendor Agreement
            </Link>
            <Link to="/contact" className="text-sm text-gray-600 hover:text-gray-900">
              Contact Us
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPage;