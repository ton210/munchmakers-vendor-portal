import React from 'react';
import { Link } from 'react-router-dom';

const TermsPage: React.FC = () => {
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
          <h1>Terms of Service</h1>
          <p className="text-gray-600">Last updated: September 14, 2025</p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using the MunchMakers Vendor Portal ("Service"), you accept and agree to be bound
            by the terms and provision of this agreement. If you do not agree to abide by the above, please do
            not use this service.
          </p>

          <h2>2. Beta Program Terms</h2>
          <p>
            The MunchMakers Vendor Portal is currently operating as a limited beta program. By participating,
            you acknowledge that:
          </p>
          <ul>
            <li>The service is in testing phase and may contain bugs or limitations</li>
            <li>Features may change without notice during the beta period</li>
            <li>Access is limited to invited participants only</li>
            <li>Beta access may be terminated at any time at our discretion</li>
            <li>You agree to provide feedback and report issues to help improve the service</li>
          </ul>

          <h2>3. Account Registration</h2>
          <p>
            To use our service, you must register for an account by providing accurate and complete information.
            You are responsible for:
          </p>
          <ul>
            <li>Maintaining the confidentiality of your account credentials</li>
            <li>All activities that occur under your account</li>
            <li>Notifying us immediately of any unauthorized use</li>
            <li>Ensuring all information provided is accurate and up-to-date</li>
          </ul>

          <h2>4. Vendor Obligations</h2>
          <p>As a vendor using our platform, you agree to:</p>
          <ul>
            <li>Provide accurate product information and descriptions</li>
            <li>Maintain adequate inventory levels</li>
            <li>Fulfill orders in a timely manner</li>
            <li>Comply with all applicable laws and regulations</li>
            <li>Maintain appropriate business licenses and permits</li>
            <li>Not sell prohibited or restricted items</li>
            <li>Respond to customer inquiries and support requests promptly</li>
          </ul>

          <h2>5. Product Listings</h2>
          <p>
            You retain ownership of your product data and content. However, by using our service, you grant us
            a license to:
          </p>
          <ul>
            <li>Display your products to potential buyers</li>
            <li>Use product information for marketing and promotional purposes</li>
            <li>Optimize and enhance product presentations</li>
            <li>Share product data with approved buyers and partners</li>
          </ul>

          <h2>6. Payment Terms</h2>
          <p>
            Payment processing and terms will be established through separate agreements. During the beta period:
          </p>
          <ul>
            <li>Commission rates and payment schedules will be communicated separately</li>
            <li>We reserve the right to adjust payment terms with notice</li>
            <li>All payments are subject to applicable taxes and fees</li>
            <li>Disputed transactions will be handled according to our dispute resolution process</li>
          </ul>

          <h2>7. Prohibited Uses</h2>
          <p>You may not use our service to:</p>
          <ul>
            <li>Violate any laws or regulations</li>
            <li>Sell counterfeit, illegal, or prohibited items</li>
            <li>Engage in fraudulent or deceptive practices</li>
            <li>Interfere with or disrupt the service</li>
            <li>Attempt to gain unauthorized access to any part of the service</li>
            <li>Use the service for any commercial purpose other than as intended</li>
          </ul>

          <h2>8. Intellectual Property</h2>
          <p>
            The MunchMakers platform and all related technology are owned by MunchMakers and protected by
            intellectual property laws. You may not:
          </p>
          <ul>
            <li>Copy, modify, or create derivative works of our platform</li>
            <li>Reverse engineer any aspect of the service</li>
            <li>Use our trademarks or branding without permission</li>
            <li>Remove or alter any proprietary notices</li>
          </ul>

          <h2>9. Privacy and Data Protection</h2>
          <p>
            Your privacy is important to us. Our collection and use of personal information is governed by our
            Privacy Policy, which is incorporated into these terms by reference.
          </p>

          <h2>10. Service Availability</h2>
          <p>
            We strive to maintain high availability but cannot guarantee uninterrupted service. We reserve the
            right to:
          </p>
          <ul>
            <li>Modify or discontinue the service with or without notice</li>
            <li>Perform maintenance and updates as needed</li>
            <li>Limit access during high-demand periods</li>
          </ul>

          <h2>11. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, MunchMakers shall not be liable for any indirect, incidental,
            special, consequential, or punitive damages, including without limitation, loss of profits, data, use,
            or other intangible losses.
          </p>

          <h2>12. Indemnification</h2>
          <p>
            You agree to defend, indemnify, and hold harmless MunchMakers from any claims, damages, obligations,
            losses, liabilities, costs, or debt resulting from your use of the service or violation of these terms.
          </p>

          <h2>13. Termination</h2>
          <p>
            We may terminate or suspend your access to our service immediately, without prior notice, for any
            reason whatsoever, including without limitation if you breach the Terms.
          </p>

          <h2>14. Governing Law</h2>
          <p>
            These Terms shall be interpreted and governed by the laws of [Jurisdiction], without regard to its
            conflict of law provisions.
          </p>

          <h2>15. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. We will provide notice of significant changes
            through the platform or via email. Continued use of the service constitutes acceptance of the revised terms.
          </p>

          <h2>16. Contact Information</h2>
          <p>
            If you have any questions about these Terms of Service, please contact us at:
          </p>
          <ul>
            <li>Email: legal@munchmakers.com</li>
            <li>Address: MunchMakers Legal Team, [Address]</li>
          </ul>

          <div className="mt-12 p-6 bg-indigo-50 rounded-lg">
            <h3 className="text-lg font-semibold text-indigo-900 mb-2">Beta Program Agreement</h3>
            <p className="text-indigo-800">
              By participating in our beta program, you acknowledge that the service is in development and
              agree to provide feedback to help us improve. Your participation is subject to additional
              terms that may be provided separately.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center space-x-6">
            <Link to="/privacy" className="text-sm text-gray-600 hover:text-gray-900">
              Privacy Policy
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

export default TermsPage;