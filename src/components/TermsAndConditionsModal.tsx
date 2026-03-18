import React from 'react';
import { useLockBodyScroll } from '../lib/useLockBodyScroll';

interface TermsAndConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsAndConditionsModal: React.FC<TermsAndConditionsModalProps> = ({ isOpen, onClose }) => {
  useLockBodyScroll(isOpen);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex justify-center items-center bg-black/50 px-4 py-6 overflow-y-auto"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="glass-secondary rounded-lg sm:rounded-2xl p-6 sm:p-8 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-modal-title"
      >
        <button
          className="absolute top-3 sm:top-4 right-3 sm:right-4 text-black hover:opacity-80 text-2xl font-bold"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        <div className="pr-8 sm:pr-10">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-black" id="terms-modal-title">
            Terms and Conditions
          </h2>

          <div className="space-y-6 text-sm sm:text-base text-black/80">
            <section className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-black">1. Introduction</h3>
              <p>
                Welcome to E-Lakbay ("Website", "Service", "we", "us", or "our"). These Terms and Conditions
                govern your use of our website and services. By accessing or using E-Lakbay, you agree to be bound
                by these Terms and Conditions. If you disagree with any part of these terms, then you may not use
                our Service.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-black">2. User Accounts</h3>
              <p>
                When you create an account on E-Lakbay, you must provide accurate, complete, and current information.
                You are responsible for maintaining the confidentiality of your account credentials and are fully
                responsible for all activity that occurs under your account. You agree to notify us immediately of any
                unauthorized use of your account.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-black">3. User Responsibilities</h3>
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
              <h3 className="text-lg sm:text-xl font-semibold text-black">4. Content License</h3>
              <p>
                E-Lakbay grants you a limited, non-exclusive, non-transferable, revocable license to use and access
                the Website and its content solely for your personal, non-commercial use. All text, graphics, logos,
                images, and software on the Website are the property of E-Lakbay or its content suppliers and are
                protected by international copyright laws.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-black">5. User-Generated Content</h3>
              <p>
                You retain all rights to any content you submit, post, or display on E-Lakbay. By posting content
                on E-Lakbay, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify,
                and distribute such content. You represent and warrant that you have the right to grant this license
                and that the content does not violate any third-party rights.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-black">6. Destinations, Events & Products Information</h3>
              <p>
                E-Lakbay provides information about travel destinations, events, and products. While we strive to keep
                this information accurate and up-to-date, we do not warrant the accuracy, completeness, or reliability
                of any information provided. Users are responsible for verifying information before making travel or
                purchasing decisions.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-black">7. Ratings and Reviews</h3>
              <p>
                Users may submit ratings and reviews of destinations, events, and products. By submitting a review, you
                certify that your review is based on your genuine experience. You agree not to submit false, misleading,
                or promotional reviews. E-Lakbay reserves the right to remove reviews that violate these terms.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-black">8. Wildlife and Conservation</h3>
              <p>
                Information about endangered wildlife is provided for educational purposes. Users agree to support
                ethical wildlife viewing practices and to comply with all local, national, and international wildlife
                protection laws. Poaching, trafficking, or harming endangered species is strictly prohibited.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-black">9. Third-Party Links</h3>
              <p>
                E-Lakbay may contain links to third-party websites. We are not responsible for the content, accuracy,
                or practices of third-party sites. Your use of third-party websites is governed by their terms and
                conditions. We encourage you to review the privacy and terms policies of any third-party website before
                providing personal information.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-black">10. Privacy Policy</h3>
              <p>
                Your use of E-Lakbay is also governed by our Privacy Policy. Please review our Privacy Policy to
                understand our practices regarding the collection and use of your personal information.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-black">11. Limitation of Liability</h3>
              <p>
                TO THE FULLEST EXTENT PERMITTED BY LAW, E-LAKBAY SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
                SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED
                DIRECTLY OR INDIRECTLY. THIS LIMITATION APPLIES REGARDLESS OF THE CAUSE OR THEORY OF LIABILITY.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-black">12. Disclaimer of Warranties</h3>
              <p>
                THE WEBSITE AND SERVICES ARE PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
                INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
                AND NON-INFRINGEMENT.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-black">13. Indemnification</h3>
              <p>
                You agree to indemnify, defend, and hold harmless E-Lakbay and its officers, directors, employees,
                and agents from any and all claims, damages, losses, and expenses arising from your use of the Website,
                your violation of these Terms and Conditions, or your infringement of any third-party rights.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-black">14. Termination</h3>
              <p>
                We may terminate or suspend your account and access to the Website immediately, without prior notice
                or liability, for any reason whatsoever, including if you breach these Terms and Conditions.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-black">15. Changes to Terms</h3>
              <p>
                E-Lakbay reserves the right to modify these Terms and Conditions at any time. Your continued use of the
                Website following the posting of changes constitutes your acceptance of such changes.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-black">16. Governing Law</h3>
              <p>
                These Terms and Conditions are governed by and construed in accordance with the laws of the Philippines,
                and you irrevocably submit to the exclusive jurisdiction of the courts located therein.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-black">17. Contact Us</h3>
              <p>
                If you have any questions about these Terms and Conditions, please contact us at support@e-lakbay.com
                or through our website's contact form.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-black">18. Severability</h3>
              <p>
                If any provision of these Terms and Conditions is found to be invalid or unenforceable, the remaining
                provisions shall continue in full force and effect.
              </p>
            </section>

            <p className="mt-8 pt-6 border-t border-black/10 text-xs sm:text-sm text-black/60">
              Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
