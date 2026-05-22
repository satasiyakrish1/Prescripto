import React from 'react'
import Header from '../components/Header'
import SpecialityMenu from '../components/SpecialityMenu'
import TopDoctors from '../components/TopDoctors'
import Banner from '../components/Banner'
import StatisticsSection from '../components/StatisticsSection'

const Home = () => {
    return (
        <div>
            <Header />
            <SpecialityMenu />
            <TopDoctors />
            <StatisticsSection />
            <Banner />
        </div>
    )
}

export default Home
