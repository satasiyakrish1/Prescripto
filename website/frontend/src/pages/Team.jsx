import React from 'react'
import { assets } from '../assets/assets'
import about_image from '../assets/about_image.png'
import SEO from '../components/SEO'

const Team = () => {
  const founders = [
    { name: 'Krish Satasiya', role: 'Founder & CTO', bio: 'Visionary healthcare technologist with a passion for making healthcare accessible to all. Founded Prescripto to bridge the gap between patients and healthcare providers.', image: about_image },
    { name: 'Dhruv Panchal', role: 'Co-Founder & CMO', bio: "Passionate about transforming healthcare accessibility, driving innovative marketing strategies that amplify Priscripto's impact and reach within the medical ecosystem.", image: assets.dhruv },
    { name: 'Yuvraj Pithwa', role: 'Co-Founder & COO', bio: 'A results-driven operations leader who ensures seamless coordination across teams. Focused on efficiency, growth, and building a strong operational foundation for the company\'s success.', image: assets.yuvrajPithwa },
    { name: 'Yug Raja', role: 'Co-Founder & CCO', bio: 'A creative visionary responsible for shaping the brand\'s identity and storytelling. Dedicated to delivering innovation, design excellence, and meaningful user experiences.', image: assets.yugraja },
    { name: 'Aryan Chaturvedi', role: 'Co-Founder & CFO', bio: 'A strategic financial expert managing budgets, investments, and long-term growth. Ensures financial stability while supporting innovation and sustainable business development.', image: assets.aryanChaturvedi }
  ]

  const teamMembers = [
    { name: 'Neha Satasiya', role: 'Chief Technology Officer', bio: "Tech innovator with expertise in healthcare software development. Oversees the technical architecture and implementation of Prescripto's platform.", image: assets.doc3 },
    { name: 'Drx. Vaibhav Satasiya', role: 'Head of Product', bio: "Product strategist focused on creating intuitive healthcare solutions. Leads the product roadmap and user experience design at Prescripto.", image: assets.doc4 },
    { name: 'Dr. Vikram Singh', role: 'Medical Advisor', bio: 'Specialist in digital health integration. Provides clinical guidance to ensure Prescripto meets the highest standards of medical care.', image: assets.doc5 },
    { name: 'Divya Prajapati', role: 'Head of Operations', bio: 'Operations expert with a background in healthcare management. Ensures smooth day-to-day functioning of all Prescripto services.', image: assets.doc6 }
  ]

  const journeyMilestones = [
    { year: '2024', title: 'API & Service Marketplace', description: 'Launched the API Marketplace to enable third-party developers to build on the Prescripto platform, fostering innovation in healthcare technology solutions.' },
    { year: '2025', title: 'Looking Forward', description: 'Prescripto continues to evolve with a focus on AI-driven healthcare solutions, telemedicine advancements, and expanding access to underserved communities across India.' }
  ]

  const partners = [
    { img: assets.hospital1, alt: 'City Hospital', name: 'ExploitXplorers' },
    { img: assets.hospital2, alt: 'BOX Crafts Pvt. Ltd.', name: 'BOXCrafts Pvt. Ltd.' },
    { img: assets.hospital3, alt: 'Shiv Medic', name: 'Shiv Medico' },
    { img: assets.hospital4, alt: 'Satyam Medical', name: "Satyam Medical's" },
    { img: assets.hospital5, alt: 'Sundaram Clinic', name: 'Sundaram Clinic' },
    { img: assets.hospital6, alt: 'Shivam Laboratoires', name: 'Shivam MediLabs' }
  ]

  return (
    <div className="px-4 sm:px-6">
      <SEO
        title="Our Team & Journey - Prescripto"
        description="Meet Prescripto founders Krish Satasiya, Dhruv Panchal, Yuvraj Pithwa, Yug Raja, and Aryan Chaturvedi, and learn about our journey to revolutionize healthcare access in India."
        keywords="Prescripto team, Prescripto founders, Krish Satasiya, Dhruv Panchal, Yuvraj Pithwa, Yug Raja, Aryan Chaturvedi, healthcare founders, medical technology team, healthcare journey, health tech startup"
        canonicalUrl="/team"
      >
        <script type="application/ld+json">
          {JSON.stringify([
            { "@context": "https://schema.org", "@type": "Person", "name": "Krish Satasiya", "jobTitle": "Founder & CEO", "worksFor": { "@type": "Organization", "name": "Prescripto" } },
            { "@context": "https://schema.org", "@type": "Person", "name": "Dhruv Panchal", "jobTitle": "Co-Founder & CMO", "worksFor": { "@type": "Organization", "name": "Prescripto" } },
            { "@context": "https://schema.org", "@type": "Person", "name": "Yuvraj Pithwa", "jobTitle": "Co-Founder & COO", "worksFor": { "@type": "Organization", "name": "Prescripto" } },
            { "@context": "https://schema.org", "@type": "Person", "name": "Yug Raja", "jobTitle": "Co-Founder & CCO", "worksFor": { "@type": "Organization", "name": "Prescripto" } },
            { "@context": "https://schema.org", "@type": "Person", "name": "Aryan Chaturvedi", "jobTitle": "Co-Founder & CFO", "worksFor": { "@type": "Organization", "name": "Prescripto" } }
          ])}
        </script>
      </SEO>

      {/* Header */}
      <div className="py-12 text-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Our Team &amp; Journey</h1>
        <div className="w-20 h-1 bg-primary mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Meet the dedicated professionals behind Prescripto and learn about our mission to transform healthcare accessibility in India.
        </p>
      </div>

      {/* Founders */}
      <div className="mb-16 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 py-10 rounded-lg shadow-sm">
        <div className="text-center text-2xl mb-8 text-[#707070] dark:text-gray-400">
          <p>OUR <span className="text-gray-700 dark:text-gray-200 font-semibold">FOUNDERS</span></p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto px-4">
          {founders.map((founder, index) => (
            <div key={index} className="flex flex-col items-center bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
              <img src={founder.image} alt={founder.name} className="w-40 h-40 rounded-full object-cover mb-6 border-4 border-gray-50 dark:border-gray-700 shadow-md" />
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{founder.name}</h3>
              <p className="text-primary font-medium mb-3">{founder.role}</p>
              <p className="text-gray-600 dark:text-gray-400 text-center">{founder.bio}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Team */}
      <div className="mb-16">
        <div className="text-center text-2xl mb-8 text-[#707070] dark:text-gray-400">
          <p>OUR <span className="text-gray-700 dark:text-gray-200 font-semibold">TEAM</span></p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {teamMembers.map((member, index) => (
            <div key={index} className="flex flex-col items-center bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{member.name}</h3>
              <p className="text-primary font-medium mb-2 text-sm">{member.role}</p>
              <p className="text-gray-600 dark:text-gray-400 text-center text-sm">{member.bio}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Journey */}
      <div className="mb-16 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 py-10 rounded-lg shadow-sm">
        <div className="text-center text-2xl mb-8 text-[#707070] dark:text-gray-400">
          <p>OUR <span className="text-gray-700 dark:text-gray-200 font-semibold">JOURNEY</span></p>
        </div>
        <div className="relative max-w-6xl mx-auto px-4">
          <div className="absolute left-0 md:left-1/2 transform md:-translate-x-1/2 h-full w-1 bg-primary" />
          {journeyMilestones.map((milestone, index) => (
            <div key={index} className={`relative flex flex-col md:flex-row md:items-center mb-16 ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
              <div className="absolute left-0 md:left-1/2 transform -translate-x-1/2 w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center z-10 shadow-md">
                <span className="font-bold">{milestone.year.slice(-2)}</span>
              </div>
              <div className={`ml-20 md:ml-0 md:w-5/12 ${index % 2 === 0 ? 'md:pr-16' : 'md:pl-16'}`}>
                <div className="bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{milestone.year} - {milestone.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{milestone.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Vision */}
      <div className="mb-16 bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 border border-primary/10 dark:border-primary/20 p-8 rounded-lg max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold text-center text-gray-800 dark:text-white mb-6">Our Vision for the Future</h2>
        <p className="text-gray-600 dark:text-gray-400 text-center max-w-3xl mx-auto">
          At Prescripto, we envision a future where quality healthcare is accessible to everyone, regardless of location or socioeconomic status. We are committed to leveraging technology to create innovative solutions that address the unique challenges of healthcare delivery in India and beyond.
        </p>
      </div>

      {/* Partners */}
      <div className="mb-16 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 py-10 rounded-lg shadow-sm">
        <div className="text-center text-2xl mb-8 text-[#707070] dark:text-gray-400">
          <p>OUR <span className="text-gray-700 dark:text-gray-200 font-semibold">PARTNERS &amp; CLIENTS</span></p>
        </div>
        <div className="mb-8">
          <p className="text-gray-600 dark:text-gray-400 text-center max-w-3xl mx-auto mb-10">
            We're proud to collaborate with leading hospitals and healthcare institutions that share our vision of improving healthcare accessibility and quality.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-6xl mx-auto px-4">
            {partners.map((p, i) => (
              <div key={i} className="flex flex-col items-center bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 p-5 rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
                <img src={p.img} alt={p.alt} className="w-32 h-32 object-contain mb-3 dark:brightness-90" />
                <p className="text-primary font-medium text-sm text-center">{p.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Team