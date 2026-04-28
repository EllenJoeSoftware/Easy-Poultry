import React from 'react';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-[#7A9D7A] to-[#6A8D6A] text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to={createPageUrl('Home')} className="inline-flex items-center text-white/90 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="text-white/90 mt-2">Last updated: December 22, 2025</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="p-8 border-0 shadow-lg">
          <div className="prose prose-gray max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Introduction</h2>
            <p className="text-gray-600 mb-6">
              Welcome to Easy Poultry. We respect your privacy and are committed to protecting your personal data. 
              This privacy policy will inform you about how we look after your personal data when you visit our 
              marketplace and tell you about your privacy rights.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Information We Collect</h2>
            <p className="text-gray-600 mb-4">We collect and process the following types of information:</p>
            <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-2">
              <li><strong>Account Information:</strong> Name, email address, phone number, profile photo, and location</li>
              <li><strong>Listing Information:</strong> Product details, descriptions, images, and pricing you post</li>
              <li><strong>Transaction Data:</strong> Payment information, inquiry details, and communication between buyers and sellers</li>
              <li><strong>Usage Data:</strong> How you interact with our platform, including page views and clicks</li>
              <li><strong>Device Information:</strong> IP address, browser type, and device identifiers</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">How We Use Your Information</h2>
            <p className="text-gray-600 mb-4">We use your information to:</p>
            <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-2">
              <li>Provide and maintain our marketplace services</li>
              <li>Process transactions and send notifications about your account</li>
              <li>Improve and personalize your experience</li>
              <li>Communicate with you about products, services, and promotions</li>
              <li>Detect and prevent fraud and abuse</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Information Sharing</h2>
            <p className="text-gray-600 mb-4">We share your information in the following circumstances:</p>
            <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-2">
              <li><strong>With Other Users:</strong> Your public profile and listings are visible to all users</li>
              <li><strong>With Sellers:</strong> When you make an inquiry, your contact information is shared with the seller</li>
              <li><strong>Service Providers:</strong> We use trusted third-party services for hosting, analytics, and payment processing</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Your Rights</h2>
            <p className="text-gray-600 mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Export your data</li>
              <li>Withdraw consent at any time</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Data Security</h2>
            <p className="text-gray-600 mb-6">
              We implement appropriate technical and organizational measures to protect your personal data against 
              unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over 
              the internet is 100% secure.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Cookies</h2>
            <p className="text-gray-600 mb-6">
              We use cookies and similar technologies to enhance your experience, analyze usage, and assist in our 
              marketing efforts. You can control cookies through your browser settings.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Children's Privacy</h2>
            <p className="text-gray-600 mb-6">
              Our services are not directed to individuals under the age of 18. We do not knowingly collect personal 
              information from children.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Changes to This Policy</h2>
            <p className="text-gray-600 mb-6">
              We may update this privacy policy from time to time. We will notify you of any changes by posting the 
              new privacy policy on this page and updating the "Last updated" date.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Contact Us</h2>
            <p className="text-gray-600 mb-4">
              If you have any questions about this privacy policy or our privacy practices, please contact us through 
              the platform's support channels.
            </p>

            <div className="mt-8 p-6 bg-[#7A9D7A]/10 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Note:</strong> This is a template privacy policy. Platform operators should customize this 
                document to reflect their actual data practices and comply with applicable privacy laws.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}