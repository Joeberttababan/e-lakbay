import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../components/modern-ui/button';
import { toast } from 'sonner';

type TabType = 'terms' | 'privacy';

export const TermsAndPrivacyPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('terms');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  const handleAcceptTerms = () => {
    if (!acceptedTerms) {
      toast.error('Please check the box to accept the Terms and Conditions');
      return;
    }
    toast.success('Thank you for accepting the Terms and Conditions');
    setAcceptedTerms(false);
  };

  const handleAcceptPrivacy = () => {
    if (!acceptedPrivacy) {
      toast.error('Please check the box to accept the Privacy Policy');
      return;
    }
    toast.success('Thank you for accepting the Privacy Policy');
    setAcceptedPrivacy(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-black mb-3">
            Terms & Privacy
          </h1>
          <p className="text-lg text-black/60">
            Read and accept our terms and privacy policy
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b border-black/10">
          <button
            onClick={() => setActiveTab('terms')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'terms'
                ? 'text-black border-b-2 border-black'
                : 'text-black/60 hover:text-black'
            }`}
          >
            Terms & Conditions
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'privacy'
                ? 'text-black border-b-2 border-black'
                : 'text-black/60 hover:text-black'
            }`}
          >
            Privacy Policy
          </button>
        </div>

        {/* Content Container */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="glass-secondary rounded-2xl p-8 sm:p-10 mb-8"
        >
          {/* Terms & Conditions Tab */}
          {activeTab === 'terms' && (
            <div className="space-y-6 text-sm sm:text-base text-black/80">
              <section className="space-y-3">
                <h3 className="text-xl sm:text-2xl font-semibold text-black">Terms and Conditions</h3>
                <p>
                  Welcome to E-Lakbay ("Website", "Service", "we", "us", or "our"). These Terms and Conditions
                  govern your use of our website and services. By accessing or using E-Lakbay, you agree to be bound
                  by these Terms and Conditions. If you disagree with any part of these terms, then you may not use
                  our Service.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-semibold text-black">1. User Accounts</h3>
                <p>
                  When you create an account on E-Lakbay, you must provide accurate, complete, and current information.
                  You are responsible for maintaining the confidentiality of your account credentials and are fully
                  responsible for all activity that occurs under your account. You agree to notify us immediately of any
                  unauthorized use of your account.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-semibold text-black">2. User Responsibilities</h3>
                <p>You agree not to:</p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe upon intellectual property rights of others</li>
                  <li>Post content that is unlawful, threatening, abusive, defamatory, obscene, or otherwise objectionable</li>
                  <li>Engage in harassment, spam, or any form of abuse</li>
                  <li>Upload viruses or malicious code</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Collect or track personal information about others without consent</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-semibold text-black">3. Content License</h3>
                <p>
                  E-Lakbay grants you a limited, non-exclusive, non-transferable, revocable license to use and access
                  the Website and its content solely for your personal, non-commercial use. All text, graphics, logos,
                  images, and software on the Website are the property of E-Lakbay or its content suppliers and are
                  protected by international copyright laws.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-semibold text-black">4. User-Generated Content</h3>
                <p>
                  You retain all rights to any content you submit, post, or display on E-Lakbay. By posting content
                  on E-Lakbay, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify,
                  and distribute such content. You represent and warrant that you have the right to grant this license
                  and that the content does not violate any third-party rights.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-semibold text-black">5. Destinations, Events & Products Information</h3>
                <p>
                  E-Lakbay provides information about travel destinations, events, and products. While we strive to keep
                  this information accurate and up-to-date, we do not warrant the accuracy, completeness, or reliability
                  of any information provided. Users are responsible for verifying information before making travel or
                  purchasing decisions.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-semibold text-black">6. Ratings and Reviews</h3>
                <p>
                  Users may submit ratings and reviews of destinations, events, and products. By submitting a review, you
                  certify that your review is based on your genuine experience. You agree not to submit false, misleading,
                  or promotional reviews. E-Lakbay reserves the right to remove reviews that violate these terms.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-semibold text-black">7. Wildlife and Conservation</h3>
                <p>
                  Information about endangered wildlife is provided for educational purposes. Users agree to support
                  ethical wildlife viewing practices and to comply with all local, national, and international wildlife
                  protection laws. Poaching, trafficking, or harming endangered species is strictly prohibited.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-semibold text-black">8. Limitation of Liability</h3>
                <p>
                  TO THE FULLEST EXTENT PERMITTED BY LAW, E-LAKBAY SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
                  SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED
                  DIRECTLY OR INDIRECTLY.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-semibold text-black">9. Governing Law</h3>
                <p>
                  These Terms and Conditions are governed by and construed in accordance with the laws of the Philippines,
                  and you irrevocably submit to the exclusive jurisdiction of the courts located therein.
                </p>
              </section>
            </div>
          )}

          {/* Privacy Policy Tab */}
          {activeTab === 'privacy' && (
            <div className="space-y-6 text-sm sm:text-base text-black/80">
              <section className="space-y-3">
                <h3 className="text-xl sm:text-2xl font-semibold text-black">Privacy Policy</h3>
                <p>
                  E-Lakbay is committed to protecting your privacy and ensuring you have a positive experience on our
                  platform. This Privacy Policy explains how we collect, use, disclose, and safeguard your information.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-semibold text-black">1. Information We Collect</h3>
                <p>We may collect information about you in the following ways:</p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li><strong>Information You Provide:</strong> Full name, email address, phone number, nationality, gender, and profile information</li>
                  <li><strong>Account Information:</strong> Login credentials, account preferences, and settings</li>
                  <li><strong>Content You Create:</strong> Reviews, ratings, comments, photos, and other content</li>
                  <li><strong>Usage Information:</strong> Pages visited, time spent, search queries, and interactions</li>
                  <li><strong>Technical Information:</strong> IP address, browser type, device information, and cookies</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-semibold text-black">2. How We Use Your Information</h3>
                <p>We use the information we collect to:</p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>Create and manage your account</li>
                  <li>Provide personalized recommendations and content</li>
                  <li>Send you updates, newsletters, and promotional materials</li>
                  <li>Improve our website and services</li>
                  <li>Analyze usage patterns and trends</li>
                  <li>Ensure security and prevent fraud</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-semibold text-black">3. Data Sharing and Disclosure</h3>
                <p>
                  We do not sell or rent your personal information to third parties. We may share your information with:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>Service providers who assist in operating our website</li>
                  <li>Business partners with your consent</li>
                  <li>Legal authorities if required by law</li>
                  <li>Other users (only public information you share)</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-semibold text-black">4. Data Security</h3>
                <p>
                  We implement appropriate technical and organizational measures to protect your personal information
                  against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission
                  over the internet is 100% secure.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-semibold text-black">5. Cookies and Tracking Technologies</h3>
                <p>
                  E-Lakbay uses cookies and similar tracking technologies to enhance your experience. These technologies
                  help us remember your preferences and understand how you interact with our platform. You can control
                  cookie settings through your browser.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-semibold text-black">6. Your Rights and Choices</h3>
                <p>You have the right to:</p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate information</li>
                  <li>Request deletion of your information (subject to legal requirements)</li>
                  <li>Opt-out of marketing communications</li>
                  <li>Port your data to another service</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-semibold text-black">7. Children's Privacy</h3>
                <p>
                  E-Lakbay is not intended for children under 13 years of age. We do not knowingly collect personal
                  information from children under 13. If we become aware that we have collected such information, we will
                  take steps to delete it promptly.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-semibold text-black">8. Third-Party Links</h3>
                <p>
                  E-Lakbay may contain links to third-party websites. We are not responsible for the privacy practices of
                  these external sites. We encourage you to review their privacy policies before providing personal information.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-semibold text-black">9. Contact Us</h3>
                <p>
                  If you have questions about this Privacy Policy or our privacy practices, please contact us at
                  privacy@e-lakbay.com or through our website's contact form.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-semibold text-black">10. Changes to This Policy</h3>
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of any changes by updating the
                  "Last Updated" date below. Your continued use of E-Lakbay constitutes acceptance of the revised policy.
                </p>
              </section>
            </div>
          )}
        </motion.div>

        {/* Acceptance Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-secondary rounded-2xl p-8"
        >
          {activeTab === 'terms' && (
            <div className="space-y-6">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="h-5 w-5 rounded border-black/40 bg-black/5 cursor-pointer mt-0.5 group-hover:border-black/60 transition-colors"
                />
                <span className="text-sm sm:text-base text-black leading-relaxed">
                  I have read, understood, and agree to be bound by E-Lakbay's Terms and Conditions. I acknowledge
                  that I am responsible for maintaining the confidentiality of my account and for all activities
                  under my account.
                </span>
              </label>

              <Button
                onClick={handleAcceptTerms}
                disabled={!acceptedTerms}
                className="w-full rounded-full bg-hero-gradient text-white hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-base py-3"
                variant="default"
              >
                Accept Terms and Conditions
              </Button>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={acceptedPrivacy}
                  onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                  className="h-5 w-5 rounded border-black/40 bg-black/5 cursor-pointer mt-0.5 group-hover:border-black/60 transition-colors"
                />
                <span className="text-sm sm:text-base text-black leading-relaxed">
                  I have read and understood E-Lakbay's Privacy Policy. I consent to the collection, use, and
                  processing of my personal information as described in the policy.
                </span>
              </label>

              <Button
                onClick={handleAcceptPrivacy}
                disabled={!acceptedPrivacy}
                className="w-full rounded-full bg-hero-gradient text-white hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-base py-3"
                variant="default"
              >
                Accept Privacy Policy
              </Button>
            </div>
          )}
        </motion.div>

        {/* Last Updated */}
        <div className="text-center mt-8 text-sm text-black/60">
          <p>
            Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </motion.div>
    </div>
  );
};
