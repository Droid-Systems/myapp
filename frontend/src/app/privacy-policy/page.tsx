import { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/Common/Breadcrumb";

export const metadata: Metadata = {
  title: "Privacy Policy | Alvarado Associates",
  description: "Privacy Policy for Alvarado Associates. Learn how we collect, use, and protect your personal data.",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Breadcrumb pageName="Privacy Policy" description="" />

      <section className="relative z-10 overflow-hidden bg-gray-light pb-16 pt-16 dark:bg-bg-color-dark md:pb-20 md:pt-20 lg:pb-28 lg:pt-28">
        <div className="container">
          <div className="mx-auto max-w-[900px] rounded-lg bg-white px-8 py-12 shadow-lg dark:bg-gray-dark md:px-12 md:py-16 lg:px-16 lg:py-20">

            <div className="space-y-10 text-base leading-relaxed text-body-color dark:text-body-color-dark">

              {/* 1. INTRODUCTION */}
              <div>
                <h2 className="mb-4 text-lg font-bold uppercase tracking-wide text-black dark:text-white">
                  1. Introduction
                </h2>
                <p>
                  Alvarado Associates (website url address: alvaradoassociatepartners.com) appreciates your business with us. We are creating products to enhance your financial market trading experience. Please read this Privacy Policy, providing consent to both documents in order to have permission to use our services.
                </p>
              </div>

              {/* 2. DATA COLLECTED */}
              <div>
                <h2 className="mb-6 text-lg font-bold uppercase tracking-wide text-black dark:text-white">
                  2. Data Collected
                </h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="mb-2 font-semibold uppercase tracking-wide text-black dark:text-white">
                      Data Storage Location
                    </h3>
                    <p>
                      We are a global company and operate web servers hosted in North America, Europe and Asia. Our major hosting provider Hetzner Online GmbH adheres to the EU/US &ldquo;Privacy Shield&rdquo;, ensuring that your data is securely stored and GDPR compliant. For more information on Hetzner Online GmbH privacy policy, please see here:{" "}
                      <a href="https://www.hetzner.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:opacity-80">
                        Hetzner Data Privacy Policy
                      </a>.
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-2 font-semibold uppercase tracking-wide text-black dark:text-white">
                      Purchase Data
                    </h3>
                    <p>
                      To receive product support, you have to have one or more purchase codes on our website. These purchase codes will be stored together with support expiration dates and your user data. This is required for us to provide you with downloads, product support and other customer services.
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-2 font-semibold uppercase tracking-wide text-black dark:text-white">
                      Comments
                    </h3>
                    <p>
                      When you leave comments on the website we collect the data shown in the comments form, and also the IP address and browser user agent string to help spam detection.
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-2 font-semibold uppercase tracking-wide text-black dark:text-white">
                      Contact Form
                    </h3>
                    <p className="mb-2">
                      Information submitted through the contact form on our site is sent to our company email. These submissions are only kept for customer service purposes — they are never used for marketing purposes or shared with third parties.
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-2 font-semibold uppercase tracking-wide text-black dark:text-white">
                      Google Analytics
                    </h3>
                    <p>
                      We use Google Analytics on our site for anonymous reporting of site usage. No personalized data is stored. If you would like to opt-out of Google Analytics monitoring your behavior on our website please use this link:{" "}
                      <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:opacity-80">
                        Google Analytics Opt-out
                      </a>.
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-3 font-semibold uppercase tracking-wide text-black dark:text-white">
                      Cases for Using the Personal Data
                    </h3>
                    <p className="mb-3">We use your personal information in the following cases:</p>
                    <ul className="ml-6 list-disc space-y-2">
                      <li>Verification/identification of the user during website usage;</li>
                      <li>Providing Technical Assistance;</li>
                      <li>Sending updates to our users with important information to inform about news/changes;</li>
                      <li>Checking the accounts&apos; activity in order to prevent fraudulent transactions and ensure the security over our customers&apos; personal information;</li>
                      <li>Customize the website to make your experience more personal and engaging;</li>
                      <li>Guarantee overall performance and administrative functions run smoothly.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 3. EMBEDDED CONTENT */}
              <div>
                <h2 className="mb-4 text-lg font-bold uppercase tracking-wide text-black dark:text-white">
                  3. Embedded Content
                </h2>
                <p className="mb-3">
                  Pages on this site may include embedded content, like YouTube videos, for example. Embedded content from other websites behaves in the exact same way as if you visited the other website.
                </p>
                <p className="mb-6">
                  These websites may collect data about you, use cookies, embed additional third-party tracking, and monitor your interaction with that embedded content, including tracking your interaction with the embedded content if you have an account and are logged-in to that website. Below you can find a list of the services we use:
                </p>

                <div className="space-y-6">
                  <div>
                    <h3 className="mb-2 font-semibold uppercase tracking-wide text-black dark:text-white">Facebook</h3>
                    <p>
                      The Facebook page plugin is used to display our Facebook timeline on our site. Facebook has its own cookie and privacy policies over which we have no control. There is no installation of cookies from Facebook and your IP is not sent to a Facebook server until you consent to it.
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-2 font-semibold tracking-wide text-black dark:text-white">X (formerly Twitter)</h3>
                    <p>
                      We use the X API to display our tweets timeline on our site. X has its own cookie and privacy policies over which we have no control. Your IP is not sent to an X server until you consent to it.
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-2 font-semibold uppercase tracking-wide text-black dark:text-white">YouTube</h3>
                    <p>
                      We use YouTube videos embedded on our site. YouTube has its own cookie and privacy policies over which we have no control. There is no installation of cookies from YouTube and your IP is not sent to a YouTube server until you consent to it.
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-3 font-semibold uppercase tracking-wide text-black dark:text-white">Consent Choice</h3>
                    <p className="mb-2">
                      We provide you with the choice to accept this or not — we prompt consent boxes for all embedded content, and no data is transferred before you consented to it.
                    </p>
                    <p className="mb-3">
                      You can opt-out any time by un-checking the relevant option and clicking the update button. The services we embed include:
                    </p>
                    <ul className="ml-6 list-disc space-y-2">
                      <li>YouTube</li>
                      <li>Facebook</li>
                      <li>Twitter</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 4. COOKIES */}
              <div>
                <h2 className="mb-4 text-lg font-bold uppercase tracking-wide text-black dark:text-white">
                  4. Cookies
                </h2>
                <p className="mb-6">
                  This site uses cookies — small text files that are placed on your machine to help the site provide a better user experience. In general, cookies are used to retain user preferences, store information for things like shopping carts, and provide anonymized tracking data to third party applications like Google Analytics. Cookies generally exist to make your browsing experience better. However, you may prefer to disable cookies on this site and on others. The most effective way to do this is to disable cookies in your browser. We suggest consulting the help section of your browser.
                </p>

                <div className="space-y-6">
                  <div>
                    <h3 className="mb-3 font-semibold uppercase tracking-wide text-black dark:text-white">
                      Necessary Cookies (All Site Visitors)
                    </h3>
                    <ul className="ml-6 list-disc space-y-2">
                      <li>
                        <strong>cfduid:</strong> Is used for our CDN CloudFlare to identify individual clients behind a shared IP address and apply security settings on a per-client basis.
                      </li>
                      <li>
                        <strong>PHPSESSID:</strong> To identify your unique session on the website.
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="mb-3 font-semibold uppercase tracking-wide text-black dark:text-white">
                      Necessary Cookies (Additional for Logged In Customers)
                    </h3>
                    <ul className="ml-6 list-disc space-y-2">
                      <li>
                        <strong>wp-auth:</strong> Used to authenticate logged-in visitors, password authentication and user verification.
                      </li>
                      <li>
                        <strong>wordpress_logged_in_&#123;hash&#125;:</strong> Used to authenticate logged-in visitors, password authentication and user verification.
                      </li>
                      <li>
                        <strong>wordpress_test_cookie:</strong> Used to ensure cookies are working correctly.
                      </li>
                      <li>
                        <strong>wp-settings-[UID]:</strong> Sets a few wp-settings-[UID] cookies. The number on the end is your individual user ID from the users database table. This is used to customize your view of the admin interface, and possibly also the main site interface.
                      </li>
                      <li>
                        <strong>wp-settings-[time]-[UID]:</strong> Also sets a few wp-settings-[time]-[UID] cookies used to customize your view of the admin interface and possibly the main site interface.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 5. WHO HAS ACCESS TO YOUR DATA */}
              <div>
                <h2 className="mb-4 text-lg font-bold uppercase tracking-wide text-black dark:text-white">
                  5. Who Has Access to Your Data
                </h2>
                <p className="mb-3">
                  If you are not a registered client for our site, there is no personal information we can retain or view regarding yourself.
                </p>
                <p className="mb-3">
                  If you are a client with a registered account, your personal information can be accessed by:
                </p>
                <ul className="ml-6 list-disc space-y-2">
                  <li>
                    Our system administrators, when they (in order to provide support) need to get the information about the client accounts and access.
                  </li>
                </ul>
              </div>

              {/* 6. THIRD PARTY ACCESS */}
              <div>
                <h2 className="mb-4 text-lg font-bold uppercase tracking-wide text-black dark:text-white">
                  6. Third Party Access to Your Data
                </h2>
                <p className="mb-6">
                  We don&apos;t share your data with third-parties in a way as to reveal any of your personal information like email, name, etc. The only exceptions to that rule are for partners we have to share limited data with in order to provide the services you expect from us. Please see below:
                </p>

                <div className="space-y-4">
                  <div>
                    <h3 className="mb-2 font-semibold uppercase tracking-wide text-black dark:text-white">Envato Pty Ltd</h3>
                    <p>
                      For the purpose of validating and getting your purchase information regarding licenses, we send your provided tokens and purchase keys to Envato Pty Ltd and use the response from their API to register your validated support data.
                    </p>
                  </div>
                  <div>
                    <h3 className="mb-2 font-semibold uppercase tracking-wide text-black dark:text-white">Ticksy</h3>
                    <p>
                      Ticksy provides the support ticketing platform we use to handle support requests. The data they receive is limited to the data you explicitly provide and consent to being set when you create a support ticket. Ticksy adheres to the EU/US &ldquo;Privacy Shield&rdquo;.
                    </p>
                  </div>
                </div>
              </div>

              {/* 7. HOW LONG WE RETAIN YOUR DATA */}
              <div>
                <h2 className="mb-4 text-lg font-bold uppercase tracking-wide text-black dark:text-white">
                  7. How Long We Retain Your Data
                </h2>
                <p className="mb-3">
                  When you submit a support ticket or a comment, its metadata is retained until (if) you tell us to remove it. We use this data so that we can recognize you and approve your comments automatically instead of holding them for moderation.
                </p>
                <p>
                  If you register on our website, we also store the personal information you provide in your user profile. You can see, edit, or delete your personal information at any time (except changing your username). Website administrators can also see and edit that information.
                </p>
              </div>

              {/* 8. SECURITY MEASURES */}
              <div>
                <h2 className="mb-4 text-lg font-bold uppercase tracking-wide text-black dark:text-white">
                  8. Security Measures
                </h2>
                <p className="mb-3">
                  We use the SSL/HTTPS protocol throughout our site. This encrypts our user communications with the servers so that personally identifiable information is not captured/hijacked by third parties without authorization.
                </p>
                <p>
                  In case of a data breach, system administrators will immediately take all needed steps to ensure system integrity, will contact affected users and will attempt to reset passwords if needed.
                </p>
              </div>

              {/* 9. YOUR DATA RIGHTS */}
              <div>
                <h2 className="mb-6 text-lg font-bold uppercase tracking-wide text-black dark:text-white">
                  9. Your Data Rights
                </h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="mb-3 font-semibold uppercase tracking-wide text-black dark:text-white">General Rights</h3>
                    <p className="mb-3">
                      If you have a registered account on this website or have left comments, you can request an exported file of the personal data we retain, including any additional data you have provided to us.
                    </p>
                    <p className="mb-3">
                      You can also request that we erase any of the personal data we have stored. This does not include any data we are obliged to keep for administrative, legal, or security purposes. In short, we cannot erase data that is vital to you being an active customer (i.e. basic account information like an email address).
                    </p>
                    <p>
                      If you wish that all of your data is erased, we will no longer be able to offer you any support or other product-related services to you.
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-3 font-semibold uppercase tracking-wide text-black dark:text-white">GDPR Rights</h3>
                    <p>
                      Your privacy is critically important to us. Going forward with the GDPR we aim to support the GDPR standard. Alvarado Associates permits residents of the European Union to use its Service. Therefore, it is the intent of Alvarado Associates to comply with the European General Data Protection Regulation. For more details please see here:{" "}
                      <a href="https://info.eugdpr.org/" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:opacity-80">
                        EU GDPR Information Portal
                      </a>.
                    </p>
                  </div>
                </div>
              </div>

              {/* 10. THIRD PARTY WEBSITES */}
              <div>
                <h2 className="mb-4 text-lg font-bold uppercase tracking-wide text-black dark:text-white">
                  10. Third Party Websites
                </h2>
                <p className="mb-3">
                  Alvarado Associates may post links to third party websites on this website. These third party websites are not screened for privacy or security compliance by Alvarado Associates, and you release us from any liability for the conduct of these third party websites.
                </p>
                <p className="mb-3">
                  All social media sharing links, either displayed as text links or social media icons do not connect you to any of the associated third parties, unless you explicitly click on them.
                </p>
                <p>
                  Please be aware that this Privacy Policy, and any other policies in place, in addition to any amendments, does not create rights enforceable by third parties or require disclosure of any personal information relating to members of the Service or Site. Alvarado Associates bears no responsibility for the information collected or used by any advertiser or third party website. Please review the privacy policy and terms of service for each site you visit through third party links.
                </p>
              </div>

              {/* 11. RELEASE OF YOUR DATA FOR LEGAL PURPOSES */}
              <div>
                <h2 className="mb-4 text-lg font-bold uppercase tracking-wide text-black dark:text-white">
                  11. Release of Your Data for Legal Purposes
                </h2>
                <p className="mb-3">
                  At times it may become necessary or desirable to Alvarado Associates, for legal purposes, to release your information in response to a request from a government agency or a private litigant. You agree that we may disclose your information to a third party where we believe, in good faith, that it is desirable to do so for the purposes of a civil action, criminal investigation, or other legal matter. In the event that we receive a subpoena affecting your privacy, we may elect to notify you to give you an opportunity to file a motion to quash the subpoena, or we may attempt to quash it ourselves, but we are not obligated to do either. We may also proactively report you, and release your information to, third parties where we believe that it is prudent to do so for legal reasons, such as our belief that you have engaged in fraudulent activities. You release us from any damages that may arise from or relate to the release of your information to a request from law enforcement agencies or private litigants.
                </p>
                <p>
                  Any passing on of personal data for legal purposes will only be done in compliance with laws of the country you reside in.
                </p>
              </div>

              {/* 12. AMENDMENTS */}
              <div>
                <h2 className="mb-4 text-lg font-bold uppercase tracking-wide text-black dark:text-white">
                  12. Amendments
                </h2>
                <p>
                  We may amend this Privacy Policy from time to time. When we amend this Privacy Policy, we will update this page accordingly and require you to accept the amendments in order to be permitted to continue using our services.
                </p>
              </div>

            </div>
          </div>
        </div>
      </section>
    </>
  );
}
