import React from 'react'
import Header from '../components/Header'
import SpecialityMenu from '../components/SpecialityMenu'
import TopDoctors from '../components/TopDoctors'
import Banner from '../components/Banner'
import SEO from '../components/SEO'

const Home = () => {
  return (
    <div>
      <SEO 
        title="Prescripto - Book Appointments With Trusted Doctors"
        description="Book appointments with trusted doctors, browse medicines, and manage your health with Prescripto's easy-to-use healthcare platform."
        keywords="doctors, appointments, medicines, healthcare, prescriptions, medical, health, book appointment"
        canonicalUrl="/"
      />
      <Header />
      <SpecialityMenu />
      <TopDoctors />
      <Banner />
    </div>
  )
}

export default Home