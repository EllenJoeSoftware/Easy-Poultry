import React from 'react';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-[#7A9D7A] to-[#6A8D6A] text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to={createPageUrl('Home')} className="inline-flex items-center text-white/90 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold">Terms of Service</h1>
          <p className="text-white/90 mt-2">Last updated: December 22, 2025</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="p-8 border-0 shadow-lg">
          <div className="prose prose-gray max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceptance of Terms</h2>
            <p className="text-gray-600 mb-6">
              By accessing and using Easy Poultry marketplace, you accept and agree to be bound by the terms and 
              provisions of this agreement. If you do not agree to these terms, please do not use our services.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Use of the Platform</h2>
            <p className="text-gray-600 mb-4">You agree to:</p>
            <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-2">
              <li>Provide accurate, current, and complete information when creating an account</li>
              <li>Maintain the security of your account credentials</li>
              <li>Use the platform only for lawful purposes</li>
              <li>Not engage in fraudulent, misleading, or deceptive practices</li>
              <li>Respect the intellectual property rights of others</li>
              <li>Not transmit viruses, malware, or any harmful code</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Seller Responsibilities</h2>
            <p className="text-gray-600 mb-4">As a seller, you agree to:</p>
            <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-2">
              <li>Provide accurate descriptions and images of products</li>
              <li>Fulfill orders and inquiries in a timely manner</li>
              <li>Comply with all applicable laws and regulations</li>
              <li>Maintain proper documentation for livestock and poultry sales</li>
              <li>Handle transactions professionally and ethically</li>
              <li>Respond to buyer inquiries within a reasonable timeframe</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Buyer Responsibilities</h2>
            <p className="text-gray-600 mb-4">As a buyer, you agree to:</p>
            <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-2">
              <li>Communicate clearly and respectfully with sellers</li>
              <li>Conduct due diligence before making purchases</li>
              <li>Complete transactions in good faith</li>
              <li>Report any issues or disputes through appropriate channels</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Prohibited Activities</h2>
            <p className="text-gray-600 mb-4">The following activities are strictly prohibited:</p>
            <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-2">
              <li>Listing illegal, stolen, or counterfeit items</li>
              <li>Engaging in price manipulation or anti-competitive behavior</li>
              <li>Harassing, threatening, or abusing other users</li>
              <li>Creating multiple accounts to circumvent restrictions</li>
              <li>Scraping or automated data collection</li>
              <li>Impersonating other users or entities</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Transactions and Payments</h2>
            <p className="text-gray-600 mb-6">
              Easy Poultry facilitates connections between buyers and sellers but is not directly involved in 
              transactions. Payment terms and arrangements are agreed upon between buyers and sellers. We recommend 
              using secure payment methods and meeting in safe, public locations when possible.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Fees and Subscriptions</h2>
            <p className="text-gray-600 mb-6">
              Certain features and services may require payment of fees. Subscription fees are non-refundable except 
              as required by law. We reserve the right to modify pricing with reasonable notice to existing subscribers.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Intellectual Property</h2>
            <p className="text-gray-600 mb-6">
              All content on the Easy Poultry platform, including text, graphics, logos, and software, is the property 
              of Easy Poultry or its licensors. Users retain ownership of content they post but grant us a license to 
              use, display, and distribute such content on the platform.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Disclaimers</h2>
            <p className="text-gray-600 mb-6">
              The platform is provided "as is" without warranties of any kind. We do not guarantee the accuracy, 
              completeness, or reliability of listings. Users are responsible for verifying information and conducting 
              their own due diligence before transactions.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Limitation of Liability</h2>
            <p className="text-gray-600 mb-6">
              Easy Poultry shall not be liable for any indirect, incidental, special, consequential, or punitive 
              damages resulting from your use of the platform. Our total liability shall not exceed the amount you 
              paid us in the past 12 months.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Termination</h2>
            <p className="text-gray-600 mb-6">
              We reserve the right to suspend or terminate your account at any time for violation of these terms or 
              for any other reason at our discretion. You may terminate your account at any time by contacting support.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Dispute Resolution</h2>
            <p className="text-gray-600 mb-6">
              Any disputes arising from these terms or use of the platform shall be resolved through binding arbitration 
              in accordance with applicable laws. Users waive the right to participate in class action lawsuits.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Changes to Terms</h2>
            <p className="text-gray-600 mb-6">
              We may update these terms from time to time. Continued use of the platform after changes constitutes 
              acceptance of the revised terms. We will notify users of significant changes.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Governing Law</h2>
            <p className="text-gray-600 mb-6">
              These terms are governed by and construed in accordance with the laws of South Africa, without regard 
              to conflict of law provisions.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Contact Information</h2>
            <p className="text-gray-600 mb-4">
              For questions about these terms, please contact us through the platform's support channels.
            </p>

            <div className="mt-8 p-6 bg-[#7A9D7A]/10 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Note:</strong> This is a template terms of service. Platform operators should consult with 
                legal counsel to ensure these terms comply with all applicable laws and regulations.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}