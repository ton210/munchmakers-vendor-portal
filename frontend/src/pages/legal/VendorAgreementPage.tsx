import React from 'react';
import { Link } from 'react-router-dom';

const VendorAgreementPage: React.FC = () => {
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
            <Link to="/" className="text-gray-900 hover:text-primary-600">
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="prose prose-lg max-w-none">
          <h1>Vendor Partnership Agreement</h1>
          <p className="text-gray-600">Last updated: September 14, 2025</p>

          <div className="bg-primary-50 p-6 rounded-lg mb-8">
            <h3 className="text-lg font-semibold text-primary-900 mb-2">Beta Program Agreement</h3>
            <p className="text-primary-800">
              This agreement governs participation in the exclusive MunchMakers Vendor Beta Program.
              Limited access is by invitation only.
            </p>
          </div>

          <h2>1. Partnership Overview</h2>
          <p>
            This Vendor Partnership Agreement ("Agreement") establishes the terms under which you ("Vendor")
            will participate in the MunchMakers vendor network ("Program"). As a beta participant, you will
            receive comprehensive support including setup, marketing, and sales assistance.
          </p>

          <h2>2. Program Services</h2>

          <h3>What We Provide:</h3>
          <ul>
            <li><strong>Technical Setup:</strong> Complete product catalog setup and platform configuration</li>
            <li><strong>Design Services:</strong> Professional product page design and optimization</li>
            <li><strong>Marketing Support:</strong> Product promotion across our buyer network</li>
            <li><strong>Sales Management:</strong> Lead qualification, negotiation, and deal closing</li>
            <li><strong>Buyer Network Access:</strong> Direct connection to US and European buyers</li>
            <li><strong>Order Processing:</strong> End-to-end order management and fulfillment support</li>
            <li><strong>Analytics & Reporting:</strong> Detailed performance metrics and insights</li>
          </ul>

          <h3>What You Provide:</h3>
          <ul>
            <li>High-quality product information and imagery</li>
            <li>Accurate inventory levels and pricing</li>
            <li>Timely order fulfillment and shipping</li>
            <li>Responsive customer service and support</li>
            <li>Compliance with all applicable regulations</li>
          </ul>

          <h2>3. Beta Program Terms</h2>
          <p>As a beta participant, you acknowledge:</p>
          <ul>
            <li>Access is limited to invited vendors only</li>
            <li>The program is in testing phase with evolving features</li>
            <li>You will receive personalized onboarding and support</li>
            <li>Feedback and suggestions are encouraged and valued</li>
            <li>Beta terms may transition to standard commercial terms</li>
          </ul>

          <h2>4. Product Requirements</h2>
          <p>All products must meet the following criteria:</p>
          <ul>
            <li>Legal for sale in target markets (US and Europe)</li>
            <li>High quality with accurate descriptions</li>
            <li>Properly packaged and labeled</li>
            <li>Meet all safety and regulatory requirements</li>
            <li>Competitive pricing for the target market</li>
          </ul>

          <h3>Prohibited Products:</h3>
          <ul>
            <li>Illegal or restricted items</li>
            <li>Counterfeit or infringing products</li>
            <li>Hazardous materials without proper certification</li>
            <li>Products that violate platform policies</li>
          </ul>

          <h2>5. Financial Terms</h2>

          <h3>Commission Structure:</h3>
          <p>During the beta period, commission rates will be:</p>
          <ul>
            <li>Negotiated individually based on product category and volume</li>
            <li>Communicated clearly before any sales are processed</li>
            <li>Subject to adjustment with 30 days notice</li>
            <li>Competitive with industry standards</li>
          </ul>

          <h3>Payment Terms:</h3>
          <ul>
            <li>Net 30 payment terms for completed transactions</li>
            <li>Direct deposit or wire transfer payment methods</li>
            <li>Monthly statements with detailed transaction reports</li>
            <li>Transparent fee structure with no hidden costs</li>
          </ul>

          <h2>6. Exclusive Benefits</h2>
          <p>As a beta vendor, you receive:</p>
          <ul>
            <li>Priority access to high-value buyer opportunities</li>
            <li>Dedicated account management and support</li>
            <li>Custom marketing campaigns for your products</li>
            <li>Early access to new features and capabilities</li>
            <li>Direct feedback channel to our development team</li>
            <li>Participation in vendor advisory board</li>
          </ul>

          <h2>7. Performance Standards</h2>
          <p>Vendors are expected to maintain:</p>
          <ul>
            <li>Order fulfillment within 2 business days</li>
            <li>Response time of less than 24 hours for inquiries</li>
            <li>Accurate inventory levels updated daily</li>
            <li>Customer satisfaction rating above 4.5/5</li>
            <li>On-time delivery rate above 95%</li>
          </ul>

          <h2>8. Marketing and Promotion</h2>
          <p>We will actively market your products through:</p>
          <ul>
            <li>Direct outreach to qualified buyers</li>
            <li>Digital marketing campaigns</li>
            <li>Trade show and event representation</li>
            <li>Email marketing to our buyer database</li>
            <li>Social media and content marketing</li>
          </ul>

          <h2>9. Data and Analytics</h2>
          <p>You will receive detailed reporting on:</p>
          <ul>
            <li>Product view and engagement metrics</li>
            <li>Buyer inquiry and conversion rates</li>
            <li>Sales performance and trends</li>
            <li>Market feedback and insights</li>
            <li>Competitive analysis and positioning</li>
          </ul>

          <h2>10. Intellectual Property</h2>
          <p>
            You retain all rights to your products, branding, and intellectual property. You grant us
            a limited license to use your product information, images, and branding solely for the
            purpose of marketing and selling your products through our platform.
          </p>

          <h2>11. Confidentiality</h2>
          <p>
            Both parties agree to maintain confidentiality regarding:
          </p>
          <ul>
            <li>Proprietary business information</li>
            <li>Buyer contact information and preferences</li>
            <li>Pricing strategies and negotiations</li>
            <li>Platform features and development roadmap</li>
          </ul>

          <h2>12. Territory and Markets</h2>
          <p>
            This agreement covers sales to buyers in the United States and European Union. We may
            expand to additional markets with your consent and appropriate legal compliance.
          </p>

          <h2>13. Term and Termination</h2>
          <p>
            This agreement remains in effect during the beta program period. Either party may terminate
            with 30 days written notice. Upon termination:
          </p>
          <ul>
            <li>Existing orders will be fulfilled</li>
            <li>Final payment will be processed</li>
            <li>Confidential information will be returned</li>
            <li>Account access will be deactivated</li>
          </ul>

          <h2>14. Support and Communication</h2>
          <p>
            You will have access to:
          </p>
          <ul>
            <li>Dedicated account manager</li>
            <li>24/7 technical support</li>
            <li>Regular performance reviews</li>
            <li>Direct communication channels</li>
            <li>Training and educational resources</li>
          </ul>

          <h2>15. Dispute Resolution</h2>
          <p>
            Any disputes will be resolved through good faith negotiation first, followed by binding
            arbitration if necessary. The prevailing party may be entitled to attorney fees.
          </p>

          <h2>16. Contact Information</h2>
          <p>
            For questions regarding this agreement:
          </p>
          <ul>
            <li>Email: partnerships@munchmakers.com</li>
            <li>Phone: [Phone Number]</li>
            <li>Address: MunchMakers Partnership Team, [Address]</li>
          </ul>

          <div className="mt-12 p-6 bg-green-50 rounded-lg">
            <h3 className="text-lg font-semibold text-green-900 mb-2">Ready to Join Our Beta Program?</h3>
            <p className="text-green-800 mb-4">
              Experience the benefits of our comprehensive vendor support program. Apply today for exclusive
              beta access and start connecting with premium buyers.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              Apply for Beta Access
            </Link>
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
            <Link to="/terms" className="text-sm text-gray-600 hover:text-gray-900">
              Terms of Service
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

export default VendorAgreementPage;