import React, { useState, useContext } from 'react'
import { assets } from '../assets/assets'
import SEO from '../components/SEO'
import { MapPin, Phone, Mail, Users, Clock, CheckCircle } from 'lucide-react'
import { AppContext } from '../context/AppContext'
import { toast } from 'react-toastify'
import axios from 'axios'

const Contact = () => {
  const { backendUrl, token, userData } = useContext(AppContext)
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: userData?.name || '',
    email: userData?.email || '',
    phone: userData?.phone || '',
    subject: '',
    message: ''
  })

  const handleChange = (e) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      const submitData = {
        name: formData.name, email: formData.email, phone: formData.phone,
        subject: formData.subject, message: formData.message,
        userType: userData ? (userData.role || 'patient') : 'guest',
        userId: userData?._id || null
      }
      const { data } = await axios.post(`${backendUrl}/api/contact/submit`, submitData)
      if (data.success) {
        setFormSubmitted(true)
        toast.success('Message sent successfully! We will get back to you soon.')
        setTimeout(() => {
          setFormSubmitted(false)
          setFormData({ name: userData?.name || '', email: userData?.email || '', phone: userData?.phone || '', subject: '', message: '' })
        }, 5000)
      } else {
        toast.error(data.message || 'Failed to send message')
      }
    } catch (error) {
      toast.error('Failed to send message. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputCls = "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-primary focus:border-primary outline-none transition"

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <SEO
        title="Contact Prescripto - Get in Touch With Our Team"
        description="Have questions or need assistance? Contact the Prescripto team for support with appointments, medicines, or any other healthcare needs."
        keywords="contact prescripto, healthcare support, customer service, help, contact us, healthcare assistance"
        canonicalUrl="/contact"
      />

      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white">Contact <span className="text-primary">Prescripto</span></h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">We're here to help with all your healthcare needs</p>
      </div>

      {/* Main Grid */}
      <div className="flex flex-col lg:flex-row gap-12 mb-20">
        {/* Left */}
        <div className="lg:w-1/2">
          <div className="rounded-lg overflow-hidden shadow-lg mb-10">
            <img className="w-full" src={assets.about} alt="Prescripto Contact Support" />
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Get In Touch</h2>
            <div className="space-y-6">
              {[
                { icon: MapPin, label: 'Our Headquarters', content: 'Ahmedabad, Gujarat 380015\nIndia' },
                { icon: Phone, label: 'Phone', content: 'Support: +91 6353112999\nCustomer Service: +91 6353112888' },
                { icon: Mail, label: 'Email', content: 'General Inquiries: info@prescripto.com\nSupport: support@prescripto.com\nCareers: careers@prescripto.com' },
                { icon: Clock, label: 'Hours of Operation', content: 'Customer Support: 24/7\nOffice Hours: Monday - Friday, 9:00 AM - 6:00 PM IST' }
              ].map(({ icon: Icon, label, content }, i) => (
                <div key={i} className="flex items-start">
                  <Icon className="text-primary mt-1 mr-3 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300">{label}</h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-1 whitespace-pre-line">{content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — Form */}
        <div className="lg:w-1/2">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-100 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Send Us a Message</h2>

            {formSubmitted ? (
              <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-100 dark:border-green-800 text-center">
                <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
                <h3 className="text-xl font-bold text-green-700 dark:text-green-400 mb-2">Message Sent Successfully!</h3>
                <p className="text-green-600 dark:text-green-500">Thank you for contacting Prescripto. Our team will get back to you shortly.</p>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                  <input type="text" id="name" value={formData.name} onChange={handleChange} className={inputCls} placeholder="Your name" required />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                  <input type="email" id="email" value={formData.email} onChange={handleChange} className={inputCls} placeholder="your.email@example.com" required />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                  <input type="tel" id="phone" value={formData.phone} onChange={handleChange} className={inputCls} placeholder="Your phone number" />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                  <select id="subject" value={formData.subject} onChange={handleChange} className={inputCls} required>
                    <option value="">Select a subject</option>
                    <option value="support">Technical Support</option>
                    <option value="appointment">Appointment Issues</option>
                    <option value="billing">Billing Inquiries</option>
                    <option value="feedback">Feedback</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
                  <textarea id="message" value={formData.message} onChange={handleChange} rows="6" className={inputCls} placeholder="How can we help you?" required />
                </div>
                <button type="submit" disabled={isSubmitting}
                  className="w-full bg-primary text-white py-3 px-6 rounded-md hover:bg-primary/90 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {isSubmitting ? (
                    <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending...</>
                  ) : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Careers */}
      <div className="mb-20">
        <div className="bg-gradient-to-r from-blue-50 to-teal-50 dark:from-blue-900/20 dark:to-teal-900/20 border border-blue-100 dark:border-blue-800/30 p-8 rounded-lg">
          <div className="flex items-center mb-6">
            <Users className="text-primary mr-3" size={32} />
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Careers at Prescripto</h2>
          </div>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="md:w-2/3">
              <p className="text-gray-600 dark:text-gray-400 mb-6">Join our team of innovators who are passionate about transforming healthcare through technology. At Prescripto, we're building solutions that make healthcare more accessible, efficient, and personalized for everyone.</p>
              <p className="text-gray-600 dark:text-gray-400 mb-6">We offer competitive benefits, a flexible work environment, and opportunities for professional growth.</p>
              <div className="mt-8">
                <button className="bg-white dark:bg-gray-700 text-primary dark:text-primary border border-primary font-medium py-3 px-8 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-300">
                  Explore Job Openings
                </button>
              </div>
            </div>
            <div className="md:w-1/3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 rounded-lg shadow-md">
              <h3 className="font-bold text-xl text-gray-800 dark:text-white mb-4">Current Openings</h3>
              <ul className="space-y-3">
                {['Senior Full Stack Developer', 'UX/UI Designer', 'Healthcare Data Analyst', 'Product Manager', 'Customer Success Specialist'].map((role, i) => (
                  <li key={i} className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-2" />
                    <span className="text-gray-600 dark:text-gray-400">{role}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="mb-20">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white text-center mb-12">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            { q: 'How quickly can I get a response?', a: 'We aim to respond to all inquiries within 24 hours. For urgent matters, please call our support line for immediate assistance.' },
            { q: "I'm having trouble with the app. Where can I get help?", a: "For technical support, please email support@prescripto.com or use the form above. Be sure to include details about your device and the issue you're experiencing." },
            { q: 'How do I change or cancel my appointment?', a: 'You can manage your appointments directly through the Prescripto app or website. If you need assistance, contact our support team.' },
            { q: 'Do you have partnership opportunities?', a: "Yes! We're always looking to collaborate with healthcare providers and organizations. Please email partnerships@prescripto.com to discuss potential opportunities." }
          ].map(({ q, a }, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-3">{q}</h3>
              <p className="text-gray-600 dark:text-gray-400">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Contact