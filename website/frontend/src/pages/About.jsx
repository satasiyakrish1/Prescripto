import React from 'react'
import { assets } from '../assets/assets'
import SEO from '../components/SEO'
import { Shield, Check, Heart, Calendar, Clock, Users } from 'lucide-react'

const About = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 dark:text-gray-100">
      <SEO
        title="About Prescripto - Your Trusted Healthcare Partner"
        description="Learn about Prescripto's mission to provide convenient healthcare solutions, connecting patients with trusted doctors and simplifying appointment scheduling with industry-leading security."
        keywords="about prescripto, healthcare platform, medical appointments, doctor scheduling, healthcare technology, secure health records"
        canonicalUrl="/about"
      />

      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white">About <span className="text-primary">Prescripto</span></h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Transforming healthcare access through technology since 2020
        </p>
      </div>

      {/* Mission & Vision */}
      <div className="flex flex-col lg:flex-row gap-12 mb-20">
        <div className="lg:w-1/2">
          <img
            className="w-full rounded-lg shadow-lg"
            src={assets.about_image}
            alt="Prescripto Healthcare Platform"
          />
        </div>
        <div className="lg:w-1/2 flex flex-col justify-center gap-6">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Our Mission</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome to Prescripto, your trusted partner in managing your healthcare needs conveniently and efficiently. At Prescripto, we understand the challenges individuals face when it comes to scheduling doctor appointments and managing their health records.
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            Our mission is to simplify healthcare access for everyone. By connecting patients with qualified healthcare providers through our intuitive platform, we're removing barriers to quality care and empowering individuals to take control of their health journey.
          </p>

          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mt-6">Our Vision</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Our vision at Prescripto is to create a seamless healthcare experience for every user. We aim to bridge the gap between patients and healthcare providers, making it easier for you to access the care you need, when you need it.
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            We envision a world where healthcare is accessible, affordable, and personalized for everyone, regardless of location or circumstance.
          </p>
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="mb-20">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white text-center mb-12">Why Choose Prescripto</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center mb-4">
              <Calendar className="text-primary mr-2" size={24} />
              <h3 className="font-bold text-xl text-gray-800 dark:text-white">Efficiency</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Streamlined appointment scheduling that fits into your busy lifestyle with smart reminders and calendar integration.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center mb-4">
              <Users className="text-primary mr-2" size={24} />
              <h3 className="font-bold text-xl text-gray-800 dark:text-white">Convenience</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Access to a network of over 5,000 trusted healthcare professionals across all specialties in your area.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center mb-4">
              <Heart className="text-primary mr-2" size={24} />
              <h3 className="font-bold text-xl text-gray-800 dark:text-white">Personalization</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Tailored recommendations and reminders to help you stay on top of your health with AI-powered insights.
            </p>
          </div>
        </div>
      </div>

      {/* Our Services */}
      <div className="mb-20">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white text-center mb-12">Our Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-50 dark:bg-gray-800/60 p-8 rounded-lg border border-gray-100 dark:border-gray-700">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">For Patients</h3>
            <ul className="space-y-3">
              {['Easy appointment booking with your preferred doctors', 'Secure storage and access to your medical records', 'Medication reminders and refill tracking', 'Telehealth consultations from the comfort of home'].map((item, i) => (
                <li key={i} className="flex items-start">
                  <Check className="text-primary mt-1 mr-2 flex-shrink-0" size={18} />
                  <span className="text-gray-600 dark:text-gray-400">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/60 p-8 rounded-lg border border-gray-100 dark:border-gray-700">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">For Healthcare Providers</h3>
            <ul className="space-y-3">
              {['Efficient patient scheduling and management', 'Secure communication channels with patients', 'Digital record-keeping and prescription management', 'Analytics to improve practice management'].map((item, i) => (
                <li key={i} className="flex items-start">
                  <Check className="text-primary mt-1 mr-2 flex-shrink-0" size={18} />
                  <span className="text-gray-600 dark:text-gray-400">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Security Information */}
      <div className="mb-20 bg-gradient-to-r from-blue-50 to-teal-50 dark:from-blue-900/20 dark:to-teal-900/20 p-8 rounded-lg border border-blue-100 dark:border-blue-800/30">
        <div className="flex items-center mb-6">
          <Shield className="text-primary mr-3" size={32} />
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Security &amp; Privacy</h2>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          At Prescripto, we take your privacy and data security seriously. Our platform is built with multiple layers of protection to ensure your medical information remains confidential and secure.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3">Data Protection</h3>
            <ul className="space-y-2">
              {['Clouflare storage and transmission', 'End-to-end encryption for all communications', 'Regular security audits and penetration testing'].map((item, i) => (
                <li key={i} className="flex items-start">
                  <Check className="text-primary mt-1 mr-2 flex-shrink-0" size={16} />
                  <span className="text-gray-600 dark:text-gray-400">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3">Privacy Controls</h3>
            <ul className="space-y-2">
              {['Granular access permissions for your data', 'Two-factor authentication for account security', 'Detailed audit logs of all data access'].map((item, i) => (
                <li key={i} className="flex items-start">
                  <Check className="text-primary mt-1 mr-2 flex-shrink-0" size={16} />
                  <span className="text-gray-600 dark:text-gray-400">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Version Information */}
      <div className="mb-20">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white text-center mb-8">Platform Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: 'Current Version', items: ['Prescripto Platform: v5.5ES', 'Mobile App: v1.1BETA', 'Provider Portal: v3.9.5'], note: 'Last Updated: April 16, 2025' },
            { title: 'Coverage', items: ['Available in 3 states', '150+ providers', '150+ healthcare facilities', 'Supporting 10,000+ patients'] },
            { title: 'Security', items: ['End-to-End Encryption', 'Role-Based Access Control', 'Regular Security Audits', 'Data Minimization & Anonymization'] }
          ].map((card, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-100 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3">{card.title}</h3>
              {card.items.map((item, j) => <p key={j} className="text-gray-600 dark:text-gray-400 mb-2">{item}</p>)}
              {card.note && <p className="text-gray-500 dark:text-gray-500 text-sm mt-4">{card.note}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Company Timeline */}
      <div className="mb-20">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white text-center mb-12">Our Journey</h2>
        <div className="space-y-8">
          {[
            { year: '2024', title: 'Expanded to 20 States', desc: 'Rapid growth allowed us to expand our network to serve patients across multiple regions.' },
            { year: '2025', title: 'AI-Powered Health Insights', desc: 'Launched our predictive health platform to provide personalized care recommendations and preventative guidance.' }
          ].map((m, i) => (
            <div key={i} className="flex flex-col md:flex-row">
              <div className="md:w-1/4">
                <div className="flex items-center md:justify-end mb-4 md:pr-8">
                  <Clock className="text-primary mr-2" size={20} />
                  <h3 className="font-bold text-xl text-gray-800 dark:text-white">{m.year}</h3>
                </div>
              </div>
              <div className="md:w-3/4 md:border-l-2 md:border-primary md:pl-8 pb-8">
                <h4 className="font-bold text-lg text-gray-800 dark:text-white mb-2">{m.title}</h4>
                <p className="text-gray-600 dark:text-gray-400">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact CTA */}
      <div className="bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 p-8 rounded-lg text-center">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Get in Touch</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
          Have questions about Prescripto? Our team is here to help you navigate your healthcare journey.
        </p>
        <div className="flex flex-col md:flex-row justify-center gap-4">
          <a href="/Contact">
            <button className="bg-primary text-white py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors duration-300">
              Contact Support
            </button>
          </a>
          <a href="mailto:krishsatasiya44@gmail.com">
            <button className="bg-white dark:bg-gray-700 text-primary dark:text-primary border border-primary py-3 px-6 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-300">
              Schedule a Demo
            </button>
          </a>
        </div>
      </div>
    </div>
  )
}

export default About